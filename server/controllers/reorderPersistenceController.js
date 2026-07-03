import { persistPurchaseOrderDraft, getPurchaseOrdersByVenue, markPurchaseOrderApproved, markPurchaseOrderRejected, getPurchaseOrderPersistenceReadiness } from '../services/reorder/purchaseOrderPersistenceService.js'
import { getApprovalHistory } from '../services/reorder/reorderApprovalPersistenceService.js'
import { confirmReceivingRecord, getReceivingPersistenceReadiness } from '../services/reorder/receivingPersistenceService.js'
import { getReorderRecommendationsByVenue, aggregateDemandSignalsForEAT, getReorderPersistenceReadiness } from '../services/reorder/reorderPersistenceService.js'
import { getAuditEventsByVenue } from '../services/inventory/inventoryAuditPersistenceService.js'
import { getSyncEventsByVenue } from '../services/sync/operationalSyncEventService.js'

export async function handlePersistPO(req, res) {
  const result = await persistPurchaseOrderDraft(req.body.venue_id, req.body)
  res.status(result.ok ? 201 : 400).json(result)
}

export async function handlePersistApprove(req, res) {
  const result = await markPurchaseOrderApproved(req.params.purchaseOrderId, req.body)
  res.status(result.ok ? 200 : 403).json(result)
}

export async function handlePersistReject(req, res) {
  const result = await markPurchaseOrderRejected(req.params.purchaseOrderId, req.body)
  res.status(result.ok ? 200 : 403).json(result)
}

export async function handleConfirmReceiving(req, res) {
  const { purchaseOrderId } = req.params
  const { items, ...actorContext } = req.body
  const result = await confirmReceivingRecord(purchaseOrderId, items ?? [], actorContext)
  res.status(result.ok ? 200 : 404).json(result)
}

export async function handleGetPOHistory(req, res) {
  const result = await getApprovalHistory(req.params.purchaseOrderId)
  res.json(result)
}

export async function handleGetPersistedRecommendations(req, res) {
  const result = await getReorderRecommendationsByVenue(req.params.venueId, req.query)
  res.json(result)
}

export async function handleGetReorderAudit(req, res) {
  const result = await getAuditEventsByVenue(req.params.venueId, { system: 'dmrc' })
  res.json(result)
}

export async function handleGetReorderSyncEvents(req, res) {
  const result = await getSyncEventsByVenue(req.params.venueId, req.query)
  res.json(result)
}

export async function handleGetReorderPersistenceStatus(req, res) {
  const dbAvailable = !!process.env.DATABASE_URL
  res.json({
    ok: true,
    persistenceStatus:         dbAvailable ? 'database_required' : 'in_memory_only',
    databaseAvailable:         dbAvailable,
    submissionStatus:          'reorder_not_submitted',
    purchaseOrderNotSubmitted: true,
    vendorApiRequired:         true,
    externalSyncNotLive:       true,
    vendorSyncNotLive:         true,
    note: 'OIPSL reorder persistence layer active. No purchase order has been submitted to a vendor.',
  })
}

export async function handleGetDemandSignalsPersisted(req, res) {
  const result = await aggregateDemandSignalsForEAT(req.params.venueId)
  res.json(result)
}
