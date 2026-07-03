/**
 * SmokeCraft Staff Operations Service
 * Manages staff queue, order acceptance, and order status updates.
 * POS send attempts remain not_connected unless POS360 confirms connected.
 */

import { isDbAvailable } from '../../db/connection.js'
import {
  createStaffQueueRecord,
  createStaffPerformanceSummary,
  STAFF_ORDER_STATUSES,
} from '../../../src/modules/smokecraft/data/smokecraftStaffOperationsContract.js'
import { assertPermission } from './smokecraftVenuePermissionService.js'
import { createOperationalAuditEntry, AUDIT_EVENTS } from './smokecraftOperationalAuditService.js'

const staffQueueStore = new Map()
const assignedOrders = new Map() // staffId -> [orderId]

export function getStaffOperationsStatus(venueId) {
  const allRecords = [...staffQueueStore.values()].filter(r => r.venueId === venueId)
  return {
    venueId,
    totalQueuedOrders:    allRecords.length,
    pendingOrders:        allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.PENDING).length,
    acceptedOrders:       allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.ACCEPTED).length,
    completedOrders:      allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.COMPLETED).length,
    cancelledOrders:      allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.CANCELLED).length,
    posSendStatus:        'not_connected',
    eatSyncStatus:        'not_connected',
    persistenceMode:      isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady:      isDbAvailable(),
  }
}

export function getStaffQueueSummary(venueId, actorId = null, actorRole = null) {
  const allRecords = [...staffQueueStore.values()].filter(r => r.venueId === venueId)

  if (actorId) {
    createOperationalAuditEntry({
      venueId, actorId, actorRole,
      eventType: AUDIT_EVENTS.STAFF_QUEUE_VIEWED,
      targetType: 'staff_queue',
      allowed: true,
    })
  }

  return {
    venueId,
    records:        allRecords,
    pendingCount:   allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.PENDING).length,
    acceptedCount:  allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.ACCEPTED).length,
    completedCount: allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.COMPLETED).length,
    cancelledCount: allRecords.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.CANCELLED).length,
    posNotConnected:true,
    eatSyncStatus:  'not_connected',
    handoffStatus:  'pending',
  }
}

export function getStaffAssignedOrders(staffId) {
  const orderIds = assignedOrders.get(staffId) ?? []
  return orderIds.map(id => staffQueueStore.get(id)).filter(Boolean)
}

export function acceptStaffOrder(orderId, actor = {}) {
  const perm = assertPermission(actor.role, 'accept_order')
  if (!perm.allowed) return { success: false, ...perm }

  let record = staffQueueStore.get(orderId)
  if (!record) {
    record = createStaffQueueRecord({ queueRecordId: orderId, orderStatus: STAFF_ORDER_STATUSES.PENDING })
    staffQueueStore.set(orderId, record)
  }

  const updated = {
    ...record,
    orderStatus: STAFF_ORDER_STATUSES.ACCEPTED,
    staffId:     actor.staffId ?? null,
    acceptedAt:  new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  }
  staffQueueStore.set(orderId, updated)

  if (actor.staffId) {
    const existing = assignedOrders.get(actor.staffId) ?? []
    if (!existing.includes(orderId)) existing.push(orderId)
    assignedOrders.set(actor.staffId, existing)
  }

  createOperationalAuditEntry({
    venueId:    record.venueId,
    actorId:    actor.staffId,
    actorRole:  actor.role,
    eventType:  AUDIT_EVENTS.STAFF_ORDER_ACCEPTED,
    targetType: 'order',
    targetId:   orderId,
    previousStatus: record.orderStatus,
    nextStatus: STAFF_ORDER_STATUSES.ACCEPTED,
    allowed:    true,
  })

  return { success: true, record: updated, posSendStatus: 'not_connected' }
}

export function updateStaffOrderStatus(orderId, status, actor = {}) {
  const perm = assertPermission(actor.role, 'update_order_status')
  if (!perm.allowed) return { success: false, ...perm }

  const record = staffQueueStore.get(orderId)
  if (!record) return { success: false, error: 'order_not_found' }

  const updated = {
    ...record,
    orderStatus: status,
    updatedAt:   new Date().toISOString(),
    ...(status === STAFF_ORDER_STATUSES.COMPLETED ? { completedAt: new Date().toISOString() } : {}),
    ...(status === STAFF_ORDER_STATUSES.CANCELLED ? { cancelledAt: new Date().toISOString() } : {}),
  }
  staffQueueStore.set(orderId, updated)

  createOperationalAuditEntry({
    venueId:    record.venueId,
    actorId:    actor.staffId ?? actor.actorId,
    actorRole:  actor.role,
    eventType:  AUDIT_EVENTS.STAFF_ORDER_UPDATED,
    targetType: 'order',
    targetId:   orderId,
    previousStatus: record.orderStatus,
    nextStatus: status,
    allowed:    true,
  })

  return { success: true, record: updated }
}

export function getStaffPerformanceSummary(venueId) {
  const allRecords = [...staffQueueStore.values()].filter(r => r.venueId === venueId)
  const staffGroups = {}
  for (const r of allRecords) {
    if (!r.staffId) continue
    if (!staffGroups[r.staffId]) staffGroups[r.staffId] = []
    staffGroups[r.staffId].push(r)
  }

  return Object.entries(staffGroups).map(([staffId, records]) =>
    createStaffPerformanceSummary({
      staffId,
      venueId,
      totalAssignedOrders:  records.length,
      acceptedOrders:       records.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.ACCEPTED).length,
      completedOrders:      records.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.COMPLETED).length,
      cancelledOrders:      records.filter(r => r.orderStatus === STAFF_ORDER_STATUSES.CANCELLED).length,
      posSendAttempts:      records.filter(r => r.posSendAttempted).length,
      posNotConnectedCount: records.filter(r => r.posSendStatus === 'not_connected').length,
    })
  )
}

export function getStaffOperationalWarnings(venueId) {
  const warnings = []
  warnings.push({ code: 'pos_not_connected', message: 'POS360 is not connected. Order sends will not reach POS.', severity: 'warning' })
  warnings.push({ code: 'eat_not_connected', message: 'E.A.T. sync is not connected. Management sync is preview_only.', severity: 'info' })
  if (!isDbAvailable()) {
    warnings.push({ code: 'memory_fallback', message: 'Database unavailable. Staff queue is in memory_fallback mode.', severity: 'warning' })
  }
  return { venueId, warnings }
}

export function enqueueOrderForStaff(venueId, orderId, orderMode) {
  const record = createStaffQueueRecord({ venueId, queueRecordId: orderId, orderMode })
  staffQueueStore.set(orderId, record)
  return record
}
