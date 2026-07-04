/**
 * POS360 Offline Sync — Controller (Phase B.6)
 */

import * as svc from '../services/pos360/pos360OfflineSyncService.js'

function ok500(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res)
      if (!res.headersSent) res.json(result)
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ ok: false, error: err.message })
    }
  }
}
function vid(req) { return req.tenantVenueId ?? req.params.venueId ?? req.body?.venueId ?? req.query?.venueId }
function actor(req) { return { actorId: req.user?.id, actorRole: req.user?.role } }
function tid(req) { return req.tenantId ?? req.body?.tenantId ?? req.query?.tenantId }

// ── Queue ──────────────────────────────────────────────────────────────────────
export const queueOfflineAction = ok500(async (req) => {
  return svc.queueOfflineAction({ tenantId: tid(req), venueId: vid(req), ...req.body, ...actor(req) })
})
export const listOfflineActions = ok500(async (req) => {
  return svc.listOfflineActions({ tenantId: tid(req), venueId: vid(req), deviceId: req.query.deviceId, status: req.query.status, priority: req.query.priority })
})
export const getOfflineAction = ok500(async (req) => {
  return svc.getOfflineAction({ tenantId: tid(req), venueId: vid(req), actionId: req.params.actionId })
})
export const cancelOfflineAction = ok500(async (req) => {
  return svc.cancelOfflineAction({ tenantId: tid(req), venueId: vid(req), actionId: req.params.actionId, ...actor(req) })
})
export const getQueueSummary = ok500(async (req) => {
  return svc.getQueueSummary({ tenantId: tid(req), venueId: vid(req), deviceId: req.query.deviceId })
})

// ── Batches ────────────────────────────────────────────────────────────────────
export const createSyncBatch = ok500(async (req) => {
  return svc.createSyncBatch({ tenantId: tid(req), venueId: vid(req), ...req.body, ...actor(req) })
})
export const getSyncBatch = ok500(async (req) => {
  return svc.getSyncBatch({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId })
})
export const listSyncBatches = ok500(async (req) => {
  return svc.listSyncBatches({ tenantId: tid(req), venueId: vid(req), deviceId: req.query.deviceId, status: req.query.status })
})
export const startSyncBatch = ok500(async (req) => {
  return svc.startSyncBatch({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId, ...actor(req) })
})
export const completeSyncBatch = ok500(async (req) => {
  return svc.completeSyncBatch({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId, ...req.body, ...actor(req) })
})
export const failSyncBatch = ok500(async (req) => {
  return svc.failSyncBatch({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId, ...req.body, ...actor(req) })
})
export const pauseSyncBatch = ok500(async (req) => {
  return svc.pauseSyncBatch({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId, ...actor(req) })
})
export const retrySyncBatch = ok500(async (req) => {
  return svc.retrySyncBatch({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId, ...actor(req) })
})

// ── Replay ─────────────────────────────────────────────────────────────────────
export const replayAction = ok500(async (req) => {
  return svc.replayAction({ tenantId: tid(req), venueId: vid(req), actionId: req.params.actionId, ...actor(req) })
})
export const replayBatch = ok500(async (req) => {
  return svc.replayBatch({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId, ...actor(req) })
})
export const getReplayLogs = ok500(async (req) => {
  return svc.getReplayLogs({ tenantId: tid(req), venueId: vid(req), actionId: req.query.actionId, batchId: req.query.batchId })
})
export const rollbackReplayHook = ok500(async (req) => {
  return svc.rollbackReplayHook({ tenantId: tid(req), venueId: vid(req), batchId: req.params.batchId, ...actor(req) })
})

// ── Conflicts ──────────────────────────────────────────────────────────────────
export const detectConflict = ok500(async (req) => {
  return svc.detectConflict({ tenantId: tid(req), venueId: vid(req), ...req.body, ...actor(req) })
})
export const listConflicts = ok500(async (req) => {
  return svc.listConflicts({ tenantId: tid(req), venueId: vid(req), status: req.query.status, entityType: req.query.entityType })
})
export const getConflict = ok500(async (req) => {
  return svc.getConflict({ tenantId: tid(req), venueId: vid(req), conflictId: req.params.conflictId })
})
export const resolveConflict = ok500(async (req) => {
  return svc.resolveConflict({ tenantId: tid(req), venueId: vid(req), conflictId: req.params.conflictId, ...req.body, ...actor(req) })
})
export const assignConflictToManagerReview = ok500(async (req) => {
  return svc.assignConflictToManagerReview({ tenantId: tid(req), venueId: vid(req), conflictId: req.params.conflictId, ...req.body, ...actor(req) })
})
export const applyConflictResolutionPolicy = ok500(async (req) => {
  return svc.applyConflictResolutionPolicy({ tenantId: tid(req), venueId: vid(req), conflictId: req.params.conflictId, policy: req.body.policy, ...actor(req) })
})
export const getConflictSummary = ok500(async (req) => {
  return svc.getConflictSummary({ tenantId: tid(req), venueId: vid(req) })
})

// ── Dead Letter ────────────────────────────────────────────────────────────────
export const listDeadLetters = ok500(async (req) => {
  return svc.listDeadLetters({ tenantId: tid(req), venueId: vid(req), deviceId: req.query.deviceId })
})
export const getDeadLetter = ok500(async (req) => {
  return svc.getDeadLetter({ tenantId: tid(req), venueId: vid(req), deadLetterId: req.params.deadLetterId })
})
export const retryDeadLetter = ok500(async (req) => {
  return svc.retryDeadLetter({ tenantId: tid(req), venueId: vid(req), deadLetterId: req.params.deadLetterId, ...actor(req) })
})
export const archiveDeadLetter = ok500(async (req) => {
  return svc.archiveDeadLetter({ tenantId: tid(req), venueId: vid(req), deadLetterId: req.params.deadLetterId, ...actor(req) })
})
export const escalateDeadLetter = ok500(async (req) => {
  return svc.escalateDeadLetter({ tenantId: tid(req), venueId: vid(req), deadLetterId: req.params.deadLetterId, ...actor(req) })
})

// ── Device Health ──────────────────────────────────────────────────────────────
export const saveDeviceSyncHealth = ok500(async (req) => {
  return svc.saveDeviceSyncHealth({ tenantId: tid(req), venueId: vid(req), ...req.body })
})
export const getDeviceSyncHealth = ok500(async (req) => {
  return svc.getDeviceSyncHealth({ tenantId: tid(req), venueId: vid(req), deviceId: req.params.deviceId })
})
export const getVenueSyncHealth = ok500(async (req) => {
  return svc.getVenueSyncHealth({ tenantId: tid(req), venueId: vid(req) })
})
export const getMultiLocationSyncHealthHook = ok500(async (req) => {
  return svc.getMultiLocationSyncHealthHook({ tenantId: tid(req), venueId: vid(req) })
})

// ── Network Events ─────────────────────────────────────────────────────────────
export const recordOfflineDetected = ok500(async (req) => {
  return svc.recordOfflineDetected({ tenantId: tid(req), venueId: vid(req), ...req.body })
})
export const recordOnlineRestored = ok500(async (req) => {
  return svc.recordOnlineRestored({ tenantId: tid(req), venueId: vid(req), ...req.body })
})
export const recordClockDrift = ok500(async (req) => {
  return svc.recordClockDrift({ tenantId: tid(req), venueId: vid(req), ...req.body })
})

// ── E.A.T. Alerts ──────────────────────────────────────────────────────────────
export const createEATAlert = ok500(async (req) => {
  return svc.createEATAlert({ tenantId: tid(req), venueId: vid(req), ...req.body, ...actor(req) })
})
export const listEATAlerts = ok500(async (req) => {
  return svc.listEATAlerts({ tenantId: tid(req), venueId: vid(req), acknowledged: req.query.acknowledged, alertType: req.query.alertType })
})
export const acknowledgeEATAlert = ok500(async (req) => {
  return svc.acknowledgeEATAlert({ tenantId: tid(req), venueId: vid(req), alertId: req.params.alertId, ...actor(req) })
})
export const getEATSyncRiskSummary = ok500(async (req) => {
  return svc.getEATSyncRiskSummary({ tenantId: tid(req), venueId: vid(req) })
})

// ── Manager Review ─────────────────────────────────────────────────────────────
export const listManagerReviewItems = ok500(async (req) => {
  return svc.listManagerReviewItems({ tenantId: tid(req), venueId: vid(req), status: req.query.status })
})
export const approveReplay = ok500(async (req) => {
  return svc.approveReplay({ tenantId: tid(req), venueId: vid(req), reviewId: req.params.reviewId, ...req.body, ...actor(req) })
})
export const denyReplay = ok500(async (req) => {
  return svc.denyReplay({ tenantId: tid(req), venueId: vid(req), reviewId: req.params.reviewId, ...req.body, ...actor(req) })
})
export const forceServerWins = ok500(async (req) => {
  return svc.forceServerWins({ tenantId: tid(req), venueId: vid(req), reviewId: req.params.reviewId, ...actor(req) })
})
export const forceDeviceWins = ok500(async (req) => {
  return svc.forceDeviceWins({ tenantId: tid(req), venueId: vid(req), reviewId: req.params.reviewId, ...actor(req) })
})
export const moveReviewToDeadLetter = ok500(async (req) => {
  return svc.moveReviewToDeadLetter({ tenantId: tid(req), venueId: vid(req), reviewId: req.params.reviewId, ...actor(req) })
})

// ── Language ───────────────────────────────────────────────────────────────────
export const getSupportedSyncLanguages = ok500(async () => {
  return svc.getSupportedSyncLanguages()
})
export const setSyncLanguagePreference = ok500(async (req) => {
  return svc.setSyncLanguagePreference({ tenantId: tid(req), venueId: vid(req), deviceId: req.body.deviceId, lang: req.body.lang, ...actor(req) })
})
