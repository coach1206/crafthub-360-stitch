/**
 * LOCC — Operations Controller
 * Handles all Live Operations Command Center API requests.
 */

import {
  buildOperationsDashboardReport, getLOCCReadiness, buildSystemHealthMap, buildOperationalSummary,
} from '../services/operations/operationsDashboardService.js'
import {
  getSyncCommandCenterReadiness, getSyncEventQueue, getFailedSyncEvents,
  retrySyncEvent, blockSyncEvent, exportSyncEvents, getSyncCommandHistory,
  buildSyncNotLiveResponse,
} from '../services/operations/syncCommandCenterService.js'
import {
  getPendingApprovalsReadiness, getPendingApprovalQueue, getPendingPurchaseOrderApprovals,
  approvePendingPurchaseOrder, rejectPendingPurchaseOrder, escalateApprovalToOwner,
  buildApprovalQueueSummary,
} from '../services/operations/pendingApprovalsQueueService.js'
import {
  getReorderSubmissionReadiness, getReorderRecommendationQueue, getPurchaseOrderDraftQueue,
  markPONotSubmitted, previewPurchaseOrderSubmission, buildVendorConnectorStatus,
} from '../services/operations/reorderOperationsService.js'
import {
  getOwnerControlReadiness, getSystemHealthOverview, getCredentialRequirements,
  getProductionBlockers, signOffDeploymentReadiness, getOwnerActionLog,
} from '../services/operations/ownerControlService.js'
import {
  getRetryReadiness, evaluateRetryEligibility, retryFailedSyncEvent,
  preventUnsafeRetry, getRetryHistory,
} from '../services/operations/failedSyncRetryService.js'
import {
  getAuditReadiness, getLOCCAuditEvents, exportAuditTrail, buildAuditSummary,
} from '../services/operations/operationsAuditService.js'

function actor(req) {
  return { actorId: req.user?.id ?? 'unknown', role: req.user?.role ?? req.body?.actorRole ?? 'guest' }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function handleGetDashboard(req, res) {
  res.json(buildOperationsDashboardReport(req.params.venueId ?? req.query.venueId ?? 'default', actor(req)))
}
export function handleGetSystemHealth(req, res) {
  res.json({ ok: true, venueId: req.params.venueId, health: buildSystemHealthMap(), timestamp: new Date().toISOString() })
}
export function handleGetLOCCReadiness(req, res) {
  res.json(getLOCCReadiness(req.params.venueId ?? 'default'))
}
export function handleGetOperationalSummary(req, res) {
  res.json(buildOperationalSummary(req.params.venueId))
}

// ─── Sync Command Center ──────────────────────────────────────────────────────
export function handleGetSyncReadiness(req, res) {
  res.json(getSyncCommandCenterReadiness(req.params.venueId))
}
export async function handleGetSyncQueue(req, res) {
  res.json(await getSyncEventQueue(req.params.venueId, req.query, actor(req)))
}
export async function handleGetFailedSync(req, res) {
  res.json(await getFailedSyncEvents(req.params.venueId, actor(req)))
}
export async function handleRetrySyncEvent(req, res) {
  res.json(await retrySyncEvent(req.params.syncEventId, actor(req)))
}
export async function handleBlockSyncEvent(req, res) {
  res.json(await blockSyncEvent(req.params.syncEventId, req.body?.reason, actor(req)))
}
export async function handleExportSyncEvents(req, res) {
  res.json(await exportSyncEvents(req.params.venueId, req.query.format ?? 'json', actor(req)))
}
export function handleGetSyncCommandHistory(req, res) {
  res.json(getSyncCommandHistory(req.params.venueId))
}
export function handleGetSyncNotLive(req, res) {
  res.json(buildSyncNotLiveResponse(req.params.venueId))
}

// ─── Approvals ────────────────────────────────────────────────────────────────
export function handleGetApprovalQueueSummary(req, res) {
  res.json(buildApprovalQueueSummary(req.params.venueId))
}
export async function handleGetApprovalQueue(req, res) {
  res.json(await getPendingApprovalQueue(req.params.venueId, actor(req)))
}
export async function handleGetPOApprovals(req, res) {
  res.json(await getPendingPurchaseOrderApprovals(req.params.venueId, actor(req)))
}
export async function handleApprovePO(req, res) {
  res.json(await approvePendingPurchaseOrder(req.params.purchaseOrderId, actor(req)))
}
export async function handleRejectPO(req, res) {
  res.json(await rejectPendingPurchaseOrder(req.params.purchaseOrderId, req.body?.reason, actor(req)))
}
export async function handleEscalateApproval(req, res) {
  res.json(await escalateApprovalToOwner(req.params.approvalId, actor(req)))
}

// ─── Reorder Operations ───────────────────────────────────────────────────────
export function handleGetReorderReadiness(req, res) {
  res.json(getReorderSubmissionReadiness(req.params.venueId))
}
export async function handleGetReorderQueue(req, res) {
  res.json(await getReorderRecommendationQueue(req.params.venueId, actor(req)))
}
export async function handleGetPODraftQueue(req, res) {
  res.json(await getPurchaseOrderDraftQueue(req.params.venueId, actor(req)))
}
export async function handleMarkPONotSubmitted(req, res) {
  res.json(await markPONotSubmitted(req.params.purchaseOrderId, req.body?.reason, actor(req)))
}
export async function handlePreviewPOSubmission(req, res) {
  res.json(await previewPurchaseOrderSubmission(req.params.purchaseOrderId, actor(req)))
}
export function handleGetVendorStatus(req, res) {
  res.json(buildVendorConnectorStatus(req.params.venueId))
}

// ─── Owner Controls ───────────────────────────────────────────────────────────
export function handleGetOwnerReadiness(req, res) {
  res.json(getOwnerControlReadiness(req.params.venueId))
}
export function handleGetOwnerSystemHealth(req, res) {
  res.json(getSystemHealthOverview(req.params.venueId, actor(req)))
}
export function handleGetCredentialRequirements(req, res) {
  res.json(getCredentialRequirements(req.params.venueId, actor(req)))
}
export function handleGetProductionBlockers(req, res) {
  res.json(getProductionBlockers(req.params.venueId, actor(req)))
}
export async function handleSignOffDeployment(req, res) {
  res.json(await signOffDeploymentReadiness(req.params.venueId, actor(req)))
}
export function handleGetOwnerActionLog(req, res) {
  res.json(getOwnerActionLog(req.params.venueId, actor(req)))
}

// ─── Retry ────────────────────────────────────────────────────────────────────
export function handleGetRetryReadiness(req, res) {
  res.json(getRetryReadiness(req.params.venueId))
}
export async function handleEvaluateRetry(req, res) {
  res.json(await evaluateRetryEligibility(req.params.syncEventId, actor(req)))
}
export async function handleRetryEvent(req, res) {
  const safety = preventUnsafeRetry(req.body?.eventType, actor(req))
  if (safety) return res.json(safety)
  res.json(await retryFailedSyncEvent(req.params.syncEventId, actor(req)))
}
export function handleGetRetryHistory(req, res) {
  res.json(getRetryHistory(req.params.venueId))
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export async function handleGetAuditEvents(req, res) {
  res.json(await getLOCCAuditEvents(req.params.venueId, actor(req)))
}
export async function handleExportAudit(req, res) {
  res.json(await exportAuditTrail(req.params.venueId, req.query.format ?? 'json', actor(req)))
}
export function handleGetAuditSummary(req, res) {
  res.json(buildAuditSummary(req.params.venueId))
}
