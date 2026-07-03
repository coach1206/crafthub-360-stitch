import { buildSyncConsumerReadinessReport, getQueuedSyncEvents, processNextSyncEventPreview, processSyncEventBatchPreview } from '../services/sync/operationalSyncEventConsumer.js'

export function handleSyncConsumerReadiness(req, res) {
  const venueId = req.query.venueId ?? 'preview'
  res.json(buildSyncConsumerReadinessReport(venueId))
}

export function handleGetQueuedEvents(req, res) {
  const venueId = req.query.venueId ?? 'preview'
  res.json(getQueuedSyncEvents(venueId))
}

export function handleProcessEventPreview(req, res) {
  const { venueId = 'preview' } = req.body
  res.json(processNextSyncEventPreview(venueId))
}

export function handleProcessBatchPreview(req, res) {
  const { venueId = 'preview', batchSize = 10 } = req.body
  res.json(processSyncEventBatchPreview(venueId, batchSize))
}
