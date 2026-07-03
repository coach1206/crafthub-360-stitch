import { Router } from 'express'
import {
  handleGetDashboard, handleGetSystemHealth, handleGetLOCCReadiness, handleGetOperationalSummary,
  handleGetSyncReadiness, handleGetSyncQueue, handleGetFailedSync,
  handleRetrySyncEvent, handleBlockSyncEvent, handleExportSyncEvents,
  handleGetSyncCommandHistory, handleGetSyncNotLive,
  handleGetApprovalQueueSummary, handleGetApprovalQueue, handleGetPOApprovals,
  handleApprovePO, handleRejectPO, handleEscalateApproval,
  handleGetReorderReadiness, handleGetReorderQueue, handleGetPODraftQueue,
  handleMarkPONotSubmitted, handlePreviewPOSubmission, handleGetVendorStatus,
  handleGetOwnerReadiness, handleGetOwnerSystemHealth, handleGetCredentialRequirements,
  handleGetProductionBlockers, handleSignOffDeployment, handleGetOwnerActionLog,
  handleGetRetryReadiness, handleEvaluateRetry, handleRetryEvent, handleGetRetryHistory,
  handleGetAuditEvents, handleExportAudit, handleGetAuditSummary,
} from '../controllers/operationsController.js'

const router = Router()

// Dashboard
router.get('/readiness',                           handleGetLOCCReadiness)
router.get('/venue/:venueId/dashboard',            handleGetDashboard)
router.get('/venue/:venueId/health',               handleGetSystemHealth)
router.get('/venue/:venueId/summary',              handleGetOperationalSummary)

// Sync Command Center
router.get('/venue/:venueId/sync/readiness',       handleGetSyncReadiness)
router.get('/venue/:venueId/sync/queue',           handleGetSyncQueue)
router.get('/venue/:venueId/sync/failed',          handleGetFailedSync)
router.get('/venue/:venueId/sync/not-live',        handleGetSyncNotLive)
router.get('/venue/:venueId/sync/commands',        handleGetSyncCommandHistory)
router.post('/sync/:syncEventId/retry',            handleRetrySyncEvent)
router.post('/sync/:syncEventId/block',            handleBlockSyncEvent)
router.get('/venue/:venueId/sync/export',          handleExportSyncEvents)

// Approvals
router.get('/venue/:venueId/approvals/summary',    handleGetApprovalQueueSummary)
router.get('/venue/:venueId/approvals/queue',      handleGetApprovalQueue)
router.get('/venue/:venueId/approvals/purchase-orders', handleGetPOApprovals)
router.post('/approvals/purchase-orders/:purchaseOrderId/approve', handleApprovePO)
router.post('/approvals/purchase-orders/:purchaseOrderId/reject',  handleRejectPO)
router.post('/approvals/:approvalId/escalate',     handleEscalateApproval)

// Reorder Operations
router.get('/venue/:venueId/reorder/readiness',    handleGetReorderReadiness)
router.get('/venue/:venueId/reorder/queue',        handleGetReorderQueue)
router.get('/venue/:venueId/reorder/purchase-orders', handleGetPODraftQueue)
router.post('/reorder/purchase-orders/:purchaseOrderId/not-submitted', handleMarkPONotSubmitted)
router.get('/reorder/purchase-orders/:purchaseOrderId/preview',        handlePreviewPOSubmission)
router.get('/venue/:venueId/vendors/status',       handleGetVendorStatus)

// Owner Controls
router.get('/venue/:venueId/owner/readiness',      handleGetOwnerReadiness)
router.get('/venue/:venueId/owner/health',         handleGetOwnerSystemHealth)
router.get('/venue/:venueId/owner/credentials',    handleGetCredentialRequirements)
router.get('/venue/:venueId/owner/blockers',       handleGetProductionBlockers)
router.post('/venue/:venueId/owner/sign-off',      handleSignOffDeployment)
router.get('/venue/:venueId/owner/action-log',     handleGetOwnerActionLog)

// Retry
router.get('/venue/:venueId/retry/readiness',      handleGetRetryReadiness)
router.get('/venue/:venueId/retry/history',        handleGetRetryHistory)
router.post('/retry/:syncEventId/evaluate',        handleEvaluateRetry)
router.post('/retry/:syncEventId/execute',         handleRetryEvent)

// Audit
router.get('/venue/:venueId/audit',                handleGetAuditEvents)
router.get('/venue/:venueId/audit/export',         handleExportAudit)
router.get('/venue/:venueId/audit/summary',        handleGetAuditSummary)

export default router
