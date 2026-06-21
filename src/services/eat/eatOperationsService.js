/**
 * E.A.T. Operations Service — derives kitchen/bar queue load, humidor
 * health, inventory low/out lists, and operational alerts from the shared
 * ops event feed + POS3 queue/inventory localStorage keys. Read-only
 * aggregation layer for EATOperations.jsx panels.
 */

import { getOpsEvents } from '../shared/opsEventBus.js'
import { getQueue as getKitchenQueue } from '../pos3/kitchenQueueService.js'
import { getQueue as getBarQueue } from '../pos3/barQueueService.js'
import { getRequests as getHumidorRequests } from '../pos3/humidorQueueService.js'
import { getInventoryLevels, checkAvailability } from '../pos3/inventoryAvailabilityService.js'
import { getHumidorInventory } from '../../data/pos3/humidorInventory.js'
import { getKitchenPrepRules } from '../../data/pos3/kitchenPrepRules.js'
import { getBarPrepRules } from '../../data/pos3/barPrepRules.js'

const ALERTS_KEY = 'eat:operationsAlerts'

export function getStationLoad() {
  const kitchenRules = getKitchenPrepRules()
  const barRules = getBarPrepRules()
  const kitchenActive = getKitchenQueue().filter((e) => e.status !== 'completed')
  const barActive = getBarQueue().filter((e) => e.status !== 'completed')

  return {
    kitchen: {
      queueLength: kitchenActive.length,
      capacity: kitchenRules.queueCapacity,
      busy: kitchenActive.length >= kitchenRules.busyThreshold,
      critical: kitchenActive.length >= kitchenRules.criticalThreshold,
    },
    bar: {
      queueLength: barActive.length,
      capacity: barRules.queueCapacity,
      busy: barActive.length >= barRules.busyThreshold,
      critical: barActive.length >= barRules.criticalThreshold,
    },
  }
}

export function getHumidorHealth() {
  const inventory = getHumidorInventory()
  const requests = getHumidorRequests().filter((r) => r.status !== 'delivered')
  const alerts = inventory.filter((i) => i.humidityStatus !== 'ok' || i.tempStatus !== 'ok')
  return { inventory, activeRequests: requests, alerts }
}

export function getInventoryHealth() {
  const levels = getInventoryLevels()
  const low = levels.filter((l) => checkAvailability(l.sku, 1).status === 'low')
  const out = levels.filter((l) => checkAvailability(l.sku, 1).status === 'out')
  return { low, out, total: levels.length }
}

/** Derive operational alerts from recent ops events (low stock, out of stock, station backups, humidor issues). */
export function getOperationalAlerts() {
  const events = getOpsEvents()
  const relevant = events.filter((e) => [
    'INVENTORY_LOW_STOCK_WARNING', 'INVENTORY_OUT_OF_STOCK_BLOCK',
    'ORDER_SEND_BLOCKED', 'HUMIDOR_ITEM_UNAVAILABLE', 'EAT_OPERATIONS_ALERT_CREATED',
  ].includes(e.eventType))
  return relevant.sort((a, b) => b.createdAt - a.createdAt).slice(0, 30)
}

export function getOperationsSnapshot() {
  return {
    stationLoad: getStationLoad(),
    humidorHealth: getHumidorHealth(),
    inventoryHealth: getInventoryHealth(),
    alerts: getOperationalAlerts(),
  }
}
