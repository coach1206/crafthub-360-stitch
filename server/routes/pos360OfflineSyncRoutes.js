/**
 * POS360 Offline Sync — Routes (Phase B.6)
 * Mounted at /api/pos360/sync
 */

import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360OfflineSyncController.js'

const router = Router()

// All routes require venue tenant guard
router.use(venueTenantGuard)

// ── Queue ──────────────────────────────────────────────────────────────────────
router.post('/actions',                            canAccessPOS3, ctrl.queueOfflineAction)
router.get('/actions',                             ctrl.listOfflineActions)
router.get('/actions/summary',                     ctrl.getQueueSummary)
router.get('/actions/:actionId',                   ctrl.getOfflineAction)
router.post('/actions/:actionId/cancel',           canAccessPOS3, ctrl.cancelOfflineAction)

// ── Batches ────────────────────────────────────────────────────────────────────
router.post('/batches',                            canAccessPOS3, ctrl.createSyncBatch)
router.get('/batches',                             ctrl.listSyncBatches)
router.get('/batches/:batchId',                    ctrl.getSyncBatch)
router.post('/batches/:batchId/start',             canAccessPOS3, ctrl.startSyncBatch)
router.post('/batches/:batchId/complete',          canAccessPOS3, ctrl.completeSyncBatch)
router.post('/batches/:batchId/fail',              canAccessPOS3, ctrl.failSyncBatch)
router.post('/batches/:batchId/pause',             canAccessPOS3, ctrl.pauseSyncBatch)
router.post('/batches/:batchId/retry',             canAccessPOS3, ctrl.retrySyncBatch)
router.post('/batches/:batchId/rollback',          canAccessPOS3, ctrl.rollbackReplayHook)

// ── Replay ─────────────────────────────────────────────────────────────────────
router.post('/actions/:actionId/replay',           canAccessPOS3, ctrl.replayAction)
router.post('/batches/:batchId/replay',            canAccessPOS3, ctrl.replayBatch)
router.get('/replay-logs',                         ctrl.getReplayLogs)

// ── Conflicts ──────────────────────────────────────────────────────────────────
router.post('/conflicts/detect',                   canAccessPOS3, ctrl.detectConflict)
router.get('/conflicts',                           ctrl.listConflicts)
router.get('/conflicts/summary',                   ctrl.getConflictSummary)
router.get('/conflicts/:conflictId',               ctrl.getConflict)
router.post('/conflicts/:conflictId/resolve',      canAccessPOS3, ctrl.resolveConflict)
router.post('/conflicts/:conflictId/manager-review', canAccessPOS3, ctrl.assignConflictToManagerReview)
router.post('/conflicts/:conflictId/apply-policy', canAccessPOS3, ctrl.applyConflictResolutionPolicy)

// ── Dead Letter ────────────────────────────────────────────────────────────────
router.get('/dead-letters',                        ctrl.listDeadLetters)
router.get('/dead-letters/:deadLetterId',          ctrl.getDeadLetter)
router.post('/dead-letters/:deadLetterId/retry',   canAccessPOS3, ctrl.retryDeadLetter)
router.post('/dead-letters/:deadLetterId/archive', canAccessPOS3, ctrl.archiveDeadLetter)
router.post('/dead-letters/:deadLetterId/escalate',canAccessPOS3, ctrl.escalateDeadLetter)

// ── Device Health ──────────────────────────────────────────────────────────────
router.post('/device-health',                      ctrl.saveDeviceSyncHealth)
router.get('/device-health/:deviceId',             ctrl.getDeviceSyncHealth)
router.get('/venue-health',                        ctrl.getVenueSyncHealth)
router.get('/multi-location-health',               ctrl.getMultiLocationSyncHealthHook)

// ── Network Events ─────────────────────────────────────────────────────────────
router.post('/events/offline',                     ctrl.recordOfflineDetected)
router.post('/events/online',                      ctrl.recordOnlineRestored)
router.post('/events/clock-drift',                 ctrl.recordClockDrift)

// ── E.A.T. Alerts ──────────────────────────────────────────────────────────────
router.post('/eat-alerts',                         canAccessPOS3, ctrl.createEATAlert)
router.get('/eat-alerts',                          ctrl.listEATAlerts)
router.get('/eat-alerts/risk-summary',             ctrl.getEATSyncRiskSummary)
router.post('/eat-alerts/:alertId/acknowledge',    canAccessPOS3, ctrl.acknowledgeEATAlert)

// ── Manager Review ─────────────────────────────────────────────────────────────
router.get('/manager-review',                      ctrl.listManagerReviewItems)
router.post('/manager-review/:reviewId/approve',   canAccessPOS3, ctrl.approveReplay)
router.post('/manager-review/:reviewId/deny',      canAccessPOS3, ctrl.denyReplay)
router.post('/manager-review/:reviewId/force-server', canAccessPOS3, ctrl.forceServerWins)
router.post('/manager-review/:reviewId/force-device', canAccessPOS3, ctrl.forceDeviceWins)
router.post('/manager-review/:reviewId/dead-letter',  canAccessPOS3, ctrl.moveReviewToDeadLetter)

// ── Language ───────────────────────────────────────────────────────────────────
router.get('/languages',                           ctrl.getSupportedSyncLanguages)
router.post('/language-preference',                ctrl.setSyncLanguagePreference)

export default router
