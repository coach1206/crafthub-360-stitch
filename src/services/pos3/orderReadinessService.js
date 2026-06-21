/**
 * POS 3 Order Readiness Service — aggregates per-item inventory
 * availability, kitchen/bar queue load, humidor stock, and age-restriction
 * flags into a single readiness verdict before a ticket is sent.
 *
 * checkReadiness(ticket) -> {
 *   overallStatus: 'ready' | 'warning' | 'blocked' | 'manager_review',
 *   perItemChecks: [{ itemId, name, destination, status, reason }],
 *   warnings: [string],
 * }
 *
 * Emits ORDER_READINESS_CHECKED always, and ORDER_SEND_BLOCKED when the
 * overall verdict is 'blocked'.
 */

import { checkAvailability } from './inventoryAvailabilityService.js'
import { getActiveQueueLength as getKitchenQueueLength } from './kitchenQueueService.js'
import { getActiveQueueLength as getBarQueueLength } from './barQueueService.js'
import { getKitchenPrepRules } from '../../data/pos3/kitchenPrepRules.js'
import { getBarPrepRules } from '../../data/pos3/barPrepRules.js'
import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'

export function checkReadiness(ticket, { managerOverride = false } = {}) {
  const items = (ticket?.items || []).filter((i) => !i.voided)
  const perItemChecks = []
  const warnings = []
  let hasBlocked = false
  let hasManagerReview = false
  let hasWarning = false

  const kitchenRules = getKitchenPrepRules()
  const barRules = getBarPrepRules()
  const kitchenQueueLen = getKitchenQueueLength()
  const barQueueLen = getBarQueueLength()

  items.forEach((item) => {
    const dest = item.destination || item.station || 'kitchen'
    let status = 'ready'
    let reason = ''

    // Inventory availability check
    if (item.inventorySku) {
      const avail = checkAvailability(item.inventorySku, item.qty || 1)
      if (!avail.available) {
        if (dest === 'humidor' && !managerOverride) {
          status = 'blocked'
          reason = 'Out of stock — cigar requires manager override'
          hasBlocked = true
        } else if (!managerOverride) {
          status = 'manager_review'
          reason = 'Out of stock — needs manager review'
          hasManagerReview = true
        } else {
          status = 'warning'
          reason = 'Out of stock — manager override applied'
          hasWarning = true
        }
      } else if (avail.status === 'low') {
        status = 'warning'
        reason = `Low stock (${avail.quantityOnHand} on hand)`
        hasWarning = true
        warnings.push(`${item.name}: low stock (${avail.quantityOnHand} on hand)`)
      }
    }

    // Age restriction check — requires staff confirmation, doesn't block
    if (item.ageRestricted && status === 'ready') {
      status = 'warning'
      reason = 'Age-restricted item — staff confirmation required'
      hasWarning = true
      warnings.push(`${item.name}: age-restricted — confirm ID before serving`)
    }

    // Station queue-load check
    if (status === 'ready') {
      if (dest === 'kitchen' && kitchenQueueLen >= kitchenRules.busyThreshold) {
        status = 'warning'
        reason = kitchenQueueLen >= kitchenRules.criticalThreshold ? 'Kitchen near capacity' : 'Kitchen busy'
        hasWarning = true
        warnings.push(`${item.name}: kitchen is busy (queue ${kitchenQueueLen})`)
      } else if (dest === 'bar' && barQueueLen >= barRules.busyThreshold) {
        status = 'warning'
        reason = barQueueLen >= barRules.criticalThreshold ? 'Bar near capacity' : 'Bar busy'
        hasWarning = true
        warnings.push(`${item.name}: bar is busy (queue ${barQueueLen})`)
      }
    }

    perItemChecks.push({ itemId: item.id, name: item.name, destination: dest, status, reason })
  })

  let overallStatus = 'ready'
  if (hasBlocked) overallStatus = 'blocked'
  else if (hasManagerReview) overallStatus = 'manager_review'
  else if (hasWarning) overallStatus = 'warning'

  const readiness = { overallStatus, perItemChecks, warnings }

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'ORDER_READINESS_CHECKED',
    commandType: 'ORDER_READINESS_CHECKED',
    ticketId: ticket?.id,
    tableId: ticket?.tableId,
    staffId: ticket?.staffId,
    status: STATUS.COMPLETED,
    payload: { readiness, timestamp: Date.now() },
  })

  if (overallStatus === 'blocked') {
    emit({
      sourceSystem: SYSTEMS.POS3,
      targetSystem: SYSTEMS.EAT,
      eventType: 'ORDER_SEND_BLOCKED',
      commandType: 'ORDER_SEND_BLOCKED',
      ticketId: ticket?.id,
      tableId: ticket?.tableId,
      staffId: ticket?.staffId,
      status: STATUS.COMPLETED,
      payload: { readiness, timestamp: Date.now() },
    })
  }

  return readiness
}
