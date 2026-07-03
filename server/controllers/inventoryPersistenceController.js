import { getInventoryPersistenceReadiness } from '../services/inventory/inventoryPersistenceService.js'
import {
  persistInventoryAdjustment, reserveInventoryForOrder, releaseReservedInventory,
  commitCheckoutInventory, getInventoryAdjustmentHistory, getInventoryAdjustmentsByVenue,
} from '../services/inventory/inventoryAdjustmentPersistenceService.js'
import { getAuditEventsByVenue } from '../services/inventory/inventoryAuditPersistenceService.js'
import { getSyncEventsByVenue } from '../services/sync/operationalSyncEventService.js'

export async function handlePersistenceStatus(req, res) {
  const dbAvailable = !!process.env.DATABASE_URL
  res.json({
    ok: true,
    persistenceStatus:  dbAvailable ? 'database_required' : 'in_memory_only',
    databaseAvailable:  dbAvailable,
    degradedMode:       !dbAvailable,
    externalSyncNotLive: true,
    vendorSyncNotLive:  true,
    note: 'OIPSL persistence layer active. External POS and vendor sync not live.',
  })
}

export async function handleAdjustmentHistory(req, res) {
  const { venueId, productId } = req.params
  const result = await getInventoryAdjustmentHistory(venueId, productId)
  res.json(result)
}

export async function handleVenueAdjustmentHistory(req, res) {
  const { venueId } = req.params
  const result = await getInventoryAdjustmentsByVenue(venueId)
  res.json(result)
}

export async function handleReserveInventory(req, res) {
  const { venueId, productId } = req.params
  const { quantity, ...context } = req.body
  if (!quantity || quantity <= 0) return res.status(400).json({ ok: false, error: 'quantity must be > 0' })
  const result = await reserveInventoryForOrder(venueId, productId, quantity, context)
  res.status(result.ok ? 200 : 400).json(result)
}

export async function handleReleaseInventory(req, res) {
  const { venueId, productId } = req.params
  const { quantity, ...context } = req.body
  if (!quantity || quantity <= 0) return res.status(400).json({ ok: false, error: 'quantity must be > 0' })
  const result = await releaseReservedInventory(venueId, productId, quantity, context)
  res.status(result.ok ? 200 : 400).json(result)
}

export async function handleCommitCheckout(req, res) {
  const { venueId, productId } = req.params
  const { quantity, ...context } = req.body
  if (!quantity || quantity <= 0) return res.status(400).json({ ok: false, error: 'quantity must be > 0' })
  const result = await commitCheckoutInventory(venueId, productId, quantity, context)
  res.status(result.ok ? 200 : 400).json(result)
}

export async function handleGetAuditEvents(req, res) {
  const { venueId } = req.params
  const result = await getAuditEventsByVenue(venueId, req.query)
  res.json(result)
}

export async function handleGetSyncEvents(req, res) {
  const { venueId } = req.params
  const result = await getSyncEventsByVenue(venueId, req.query)
  res.json(result)
}
