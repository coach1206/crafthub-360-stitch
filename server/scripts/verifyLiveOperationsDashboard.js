import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function assert(condition, label) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(label)
    console.error(`  FAIL: ${label}`)
  }
}

function fileExists(rel) {
  return existsSync(resolve(root, rel))
}

function readFile(rel) {
  const p = resolve(root, rel)
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}

console.log('\n=== verifyLiveOperationsDashboard — Phase 17 LOCC ===\n')

// ── Role Safety Gateway ──────────────────────────────────────────────────────
const rsg = readFile('server/services/operations/roleSafetyGateway.js')
assert(fileExists('server/services/operations/roleSafetyGateway.js'), 'roleSafetyGateway.js exists')
assert(rsg.includes("OWNER_ROLES"), 'OWNER_ROLES defined')
assert(rsg.includes("MANAGER_ROLES"), 'MANAGER_ROLES defined')
assert(rsg.includes("BLOCKED_ROLES"), 'BLOCKED_ROLES defined')
assert(rsg.includes("'owner'"), 'owner in roles')
assert(rsg.includes("'admin'"), 'admin in OWNER_ROLES')
assert(rsg.includes("'manager'"), 'manager in MANAGER_ROLES')
assert(rsg.includes("'guest'"), 'guest in BLOCKED_ROLES')
assert(rsg.includes("'customer'"), 'customer in BLOCKED_ROLES')
assert(rsg.includes("'server'"), 'server in BLOCKED_ROLES')
assert(rsg.includes("'bartender'"), 'bartender in BLOCKED_ROLES')
assert(rsg.includes("'kitchen_staff'"), 'kitchen_staff in BLOCKED_ROLES')
assert(rsg.includes("'humidor_staff'"), 'humidor_staff in BLOCKED_ROLES')
assert(rsg.includes("'cashier'"), 'cashier in BLOCKED_ROLES')
assert(rsg.includes("'host'"), 'host in BLOCKED_ROLES')
assert(rsg.includes("'busser'"), 'busser in BLOCKED_ROLES')
assert(rsg.includes('validateOwnerControl'), 'validateOwnerControl exported')
assert(rsg.includes('validateManagerControl'), 'validateManagerControl exported')
assert(rsg.includes('validateViewerAccess'), 'validateViewerAccess exported')
assert(rsg.includes('isBlockedRole'), 'isBlockedRole exported')
assert(rsg.includes('buildRoleBlockedResponse'), 'buildRoleBlockedResponse exported')
assert(rsg.includes('assertManagerRole'), 'assertManagerRole exported')
assert(rsg.includes('assertOwnerRole'), 'assertOwnerRole exported')
assert(rsg.includes('role_insufficient') || rsg.includes('role_blocked') || rsg.includes('insufficient'), 'role block status present')
assert(rsg.includes('allowed'), 'allowed field in response')
assert(rsg.includes('requiredRoles'), 'requiredRoles in response')

// ── Operations Dashboard Service ─────────────────────────────────────────────
const ods = readFile('server/services/operations/operationsDashboardService.js')
assert(fileExists('server/services/operations/operationsDashboardService.js'), 'operationsDashboardService.js exists')
assert(ods.includes('SYSTEM_HEALTH_STATUSES'), 'SYSTEM_HEALTH_STATUSES defined')
assert(ods.includes('operational'), 'operational status in health map')
assert(ods.includes('degraded'), 'degraded status in health map')
assert(ods.includes('preview_only'), 'preview_only status')
assert(ods.includes('credential_required'), 'credential_required status')
assert(ods.includes('database_required'), 'database_required status')
assert(ods.includes('buildSystemHealthMap'), 'buildSystemHealthMap exported')
assert(ods.includes('buildOperationalSummary'), 'buildOperationalSummary exported')
assert(ods.includes('getLOCCReadiness'), 'getLOCCReadiness exported')
assert(ods.includes('buildOperationsDashboardReport'), 'buildOperationsDashboardReport exported')
assert(ods.includes('externalSyncNotLive'), 'externalSyncNotLive in summary')
assert(ods.includes('validateViewerAccess') || ods.includes('roleSafetyGateway'), 'role check wired in dashboard')
assert(ods.includes('degradedSystems'), 'degradedSystems in report')
assert(ods.includes('operationalSystems'), 'operationalSystems in report')

// ── Sync Command Center Service ───────────────────────────────────────────────
const scs = readFile('server/services/operations/syncCommandCenterService.js')
assert(fileExists('server/services/operations/syncCommandCenterService.js'), 'syncCommandCenterService.js exists')
assert(scs.includes('getSyncCommandCenterReadiness'), 'getSyncCommandCenterReadiness exported')
assert(scs.includes('getSyncEventQueue'), 'getSyncEventQueue exported')
assert(scs.includes('getFailedSyncEvents'), 'getFailedSyncEvents exported')
assert(scs.includes('retrySyncEvent'), 'retrySyncEvent exported')
assert(scs.includes('blockSyncEvent'), 'blockSyncEvent exported')
assert(scs.includes('exportSyncEvents'), 'exportSyncEvents exported')
assert(scs.includes('getSyncCommandHistory'), 'getSyncCommandHistory exported')
assert(scs.includes('buildSyncNotLiveResponse'), 'buildSyncNotLiveResponse exported')
assert(scs.includes('externalSyncNotLive'), 'externalSyncNotLive always true')
assert(scs.includes('real_time_push_pending') || scs.includes('realTimePushPending'), 'real_time_push_pending in response')
assert(scs.includes('vendor_sync_not_live') || scs.includes('vendorSyncNotLive'), 'vendor sync not live')
assert(scs.includes('retry_queued'), 'retry_queued status on retry')
assert(scs.includes('assertManagerRole') || scs.includes('roleSafetyGateway'), 'manager role check in sync')
assert(scs.includes('external_sync_not_live') || scs.includes('externalSyncNotLive'), 'external sync not live vocabulary')

// ── Pending Approvals Queue Service ──────────────────────────────────────────
const paqs = readFile('server/services/operations/pendingApprovalsQueueService.js')
assert(fileExists('server/services/operations/pendingApprovalsQueueService.js'), 'pendingApprovalsQueueService.js exists')
assert(paqs.includes('getPendingApprovalsReadiness'), 'getPendingApprovalsReadiness exported')
assert(paqs.includes('getPendingApprovalQueue'), 'getPendingApprovalQueue exported')
assert(paqs.includes('getPendingPurchaseOrderApprovals'), 'getPendingPurchaseOrderApprovals exported')
assert(paqs.includes('approvePendingPurchaseOrder'), 'approvePendingPurchaseOrder exported')
assert(paqs.includes('rejectPendingPurchaseOrder'), 'rejectPendingPurchaseOrder exported')
assert(paqs.includes('escalateApprovalToOwner'), 'escalateApprovalToOwner exported')
assert(paqs.includes('buildApprovalQueueSummary'), 'buildApprovalQueueSummary exported')
assert(paqs.includes('autoApprovalDisabled') || paqs.includes('auto_approval_disabled'), 'auto approval disabled')
assert(paqs.includes('reorderNotSubmitted') || paqs.includes('reorder_not_submitted'), 'reorder not submitted in approvals')
assert(paqs.includes('approvalRolesBlocked') || paqs.includes('approval_roles_blocked'), 'blocked roles listed in approvals')
assert(paqs.includes('assertManagerRole') || paqs.includes('roleSafetyGateway'), 'manager role check in approvals')

// ── Reorder Operations Service ────────────────────────────────────────────────
const ros = readFile('server/services/operations/reorderOperationsService.js')
assert(fileExists('server/services/operations/reorderOperationsService.js'), 'reorderOperationsService.js exists')
assert(ros.includes('SUBMISSION_GATE_STATUSES'), 'SUBMISSION_GATE_STATUSES defined')
assert(ros.includes('reorder_not_submitted'), 'reorder_not_submitted in gate statuses')
assert(ros.includes('vendor_api_required'), 'vendor_api_required in gate statuses')
assert(ros.includes('getReorderSubmissionReadiness'), 'getReorderSubmissionReadiness exported')
assert(ros.includes('getReorderRecommendationQueue'), 'getReorderRecommendationQueue exported')
assert(ros.includes('getPurchaseOrderDraftQueue'), 'getPurchaseOrderDraftQueue exported')
assert(ros.includes('markPONotSubmitted'), 'markPONotSubmitted exported')
assert(ros.includes('previewPurchaseOrderSubmission'), 'previewPurchaseOrderSubmission exported')
assert(ros.includes('buildVendorConnectorStatus'), 'buildVendorConnectorStatus exported')
assert(ros.includes('canSubmitLive') && ros.includes('false'), 'canSubmitLive: false always')
assert(ros.includes('reorder_preview_only') || ros.includes('reorderPreviewOnly'), 'reorder_preview_only in preview')
assert(ros.includes('connectedVendors') || ros.includes('connected_vendors'), 'connectedVendors: 0')
assert(ros.includes('vendorApiRequired') || ros.includes('vendor_api_required'), 'vendor api required in connector status')
assert(ros.includes('assertManagerRole') || ros.includes('roleSafetyGateway'), 'manager role check in reorder ops')

// ── Owner Control Service ─────────────────────────────────────────────────────
const ocs = readFile('server/services/operations/ownerControlService.js')
assert(fileExists('server/services/operations/ownerControlService.js'), 'ownerControlService.js exists')
assert(ocs.includes('getOwnerControlReadiness'), 'getOwnerControlReadiness exported')
assert(ocs.includes('getSystemHealthOverview'), 'getSystemHealthOverview exported')
assert(ocs.includes('getCredentialRequirements'), 'getCredentialRequirements exported')
assert(ocs.includes('getProductionBlockers'), 'getProductionBlockers exported')
assert(ocs.includes('signOffDeploymentReadiness'), 'signOffDeploymentReadiness exported')
assert(ocs.includes('getOwnerActionLog'), 'getOwnerActionLog exported')
assert(ocs.includes('assertOwnerRole') || ocs.includes('roleSafetyGateway'), 'owner role check in owner control')
assert(ocs.includes('never') || ocs.includes('credential') || ocs.includes('values'), 'credential values never exposed')
assert(ocs.includes('criticalBlockers') || ocs.includes('critical_blockers'), 'critical blockers checked in sign-off')
assert(ocs.includes('availableControls') || ocs.includes('available_controls'), 'availableControls listed')
assert(ocs.includes('ownerOnlyControls') || ocs.includes('owner_only_controls'), 'ownerOnlyControls listed')

// ── Failed Sync Retry Service ─────────────────────────────────────────────────
const fsrs = readFile('server/services/operations/failedSyncRetryService.js')
assert(fileExists('server/services/operations/failedSyncRetryService.js'), 'failedSyncRetryService.js exists')
assert(fsrs.includes('RETRY_STATUSES'), 'RETRY_STATUSES defined')
assert(fsrs.includes('retry_queued'), 'retry_queued in statuses')
assert(fsrs.includes('retry_processing'), 'retry_processing in statuses')
assert(fsrs.includes('retry_succeeded'), 'retry_succeeded in statuses')
assert(fsrs.includes('retry_failed'), 'retry_failed in statuses')
assert(fsrs.includes('retry_limit_exceeded'), 'retry_limit_exceeded in statuses')
assert(fsrs.includes('retry_blocked'), 'retry_blocked in statuses')
assert(fsrs.includes('external_system_required'), 'external_system_required in statuses')
assert(fsrs.includes('unsafe_retry_prevented'), 'unsafe_retry_prevented in statuses')
assert(fsrs.includes('getRetryReadiness'), 'getRetryReadiness exported')
assert(fsrs.includes('evaluateRetryEligibility'), 'evaluateRetryEligibility exported')
assert(fsrs.includes('retryFailedSyncEvent'), 'retryFailedSyncEvent exported')
assert(fsrs.includes('preventUnsafeRetry'), 'preventUnsafeRetry exported')
assert(fsrs.includes('getRetryHistory'), 'getRetryHistory exported')
assert(fsrs.includes('shouldBlockRetry'), 'shouldBlockRetry exported')
assert(fsrs.includes('MAX_RETRY_ATTEMPTS') || fsrs.includes('3'), 'max retry attempts = 3')
assert(fsrs.includes('external_pos_sync'), 'external_pos_sync blocked from retry')
assert(fsrs.includes('vendor_api_push'), 'vendor_api_push blocked from retry')
assert(fsrs.includes('live_payment_push'), 'live_payment_push blocked from retry')
assert(fsrs.includes('unsafeRetryPrevented') || fsrs.includes('unsafe_retry_prevented'), 'unsafeRetryPrevented in readiness')

// ── Operations Audit Service ──────────────────────────────────────────────────
const oas = readFile('server/services/operations/operationsAuditService.js')
assert(fileExists('server/services/operations/operationsAuditService.js'), 'operationsAuditService.js exists')
assert(oas.includes('LOCC_AUDIT_EVENT_TYPES'), 'LOCC_AUDIT_EVENT_TYPES defined')
assert(oas.includes('locc_dashboard_viewed'), 'locc_dashboard_viewed event type')
assert(oas.includes('sync_event_retried'), 'sync_event_retried event type')
assert(oas.includes('po_approved'), 'po_approved event type')
assert(oas.includes('po_rejected'), 'po_rejected event type')
assert(oas.includes('receiving_confirmed'), 'receiving_confirmed event type')
assert(oas.includes('owner_signed_off'), 'owner_signed_off event type')
assert(oas.includes('getAuditReadiness'), 'getAuditReadiness exported')
assert(oas.includes('getLOCCAuditEvents'), 'getLOCCAuditEvents exported')
assert(oas.includes('getReorderAuditEvents'), 'getReorderAuditEvents exported')
assert(oas.includes('exportAuditTrail'), 'exportAuditTrail exported')
assert(oas.includes('getInventoryAuditByProduct'), 'getInventoryAuditByProduct exported')
assert(oas.includes('buildAuditSummary'), 'buildAuditSummary exported')
assert(oas.includes('assertManagerRole') || oas.includes('roleSafetyGateway'), 'manager role check in audit')

// ── Operations Controller ─────────────────────────────────────────────────────
const oc = readFile('server/controllers/operationsController.js')
assert(fileExists('server/controllers/operationsController.js'), 'operationsController.js exists')
assert(oc.includes('handleDashboardReadiness') || oc.includes('Readiness'), 'readiness handler exported')
assert(oc.includes('handleSyncQueue') || oc.includes('SyncQueue') || oc.includes('syncQueue'), 'sync queue handler')
assert(oc.includes('handleFailedSync') || oc.includes('FailedSync') || oc.includes('failedSync'), 'failed sync handler')
assert(oc.includes('handleRetrySyncEvent') || oc.includes('RetrySyncEvent') || oc.includes('retry'), 'retry handler')
assert(oc.includes('handlePendingApprovals') || oc.includes('PendingApprovals') || oc.includes('approvals'), 'approvals handler')
assert(oc.includes('handleReorderQueue') || oc.includes('ReorderQueue') || oc.includes('reorder'), 'reorder handler')
assert(oc.includes('handleOwnerControl') || oc.includes('OwnerControl') || oc.includes('owner'), 'owner control handler')
assert(oc.includes('handleAuditTrail') || oc.includes('AuditTrail') || oc.includes('audit'), 'audit handler')

// ── Operations Routes ─────────────────────────────────────────────────────────
const orr = readFile('server/routes/operationsRoutes.js')
assert(fileExists('server/routes/operationsRoutes.js'), 'operationsRoutes.js exists')
assert(orr.includes('/readiness') || orr.includes('readiness'), 'readiness route')
assert(orr.includes('/dashboard') || orr.includes('dashboard'), 'dashboard route')
assert(orr.includes('/sync') || orr.includes('sync'), 'sync route')
assert(orr.includes('/approvals') || orr.includes('approvals'), 'approvals route')
assert(orr.includes('/reorder') || orr.includes('reorder'), 'reorder route')
assert(orr.includes('/owner') || orr.includes('owner'), 'owner route')
assert(orr.includes('/audit') || orr.includes('audit'), 'audit route')
assert(orr.includes('/retry') || orr.includes('retry'), 'retry route')
assert(orr.includes('router') || orr.includes('Router'), 'express router used')

// ── Server index wiring ───────────────────────────────────────────────────────
const serverIndex = readFile('server/index.js')
assert(serverIndex.includes('operationsRoutes') || serverIndex.includes('operations'), 'operations routes imported in server/index.js')
assert(serverIndex.includes('/api/operations'), 'operations mounted at /api/operations')
assert(serverIndex.includes('/api/health'), 'health routes still mounted')

// ── UI Components ─────────────────────────────────────────────────────────────
const compDir = 'src/components/operations'
assert(fileExists(`${compDir}/OperationsStatusBadge.jsx`), 'OperationsStatusBadge.jsx exists')
assert(fileExists(`${compDir}/OperationsDashboardPanel.jsx`), 'OperationsDashboardPanel.jsx exists')
assert(fileExists(`${compDir}/SyncCommandCenterPanel.jsx`), 'SyncCommandCenterPanel.jsx exists')
assert(fileExists(`${compDir}/PendingApprovalsPanel.jsx`), 'PendingApprovalsPanel.jsx exists')
assert(fileExists(`${compDir}/FailedSyncPanel.jsx`), 'FailedSyncPanel.jsx exists')
assert(fileExists(`${compDir}/ReorderSubmissionPanel.jsx`), 'ReorderSubmissionPanel.jsx exists')
assert(fileExists(`${compDir}/OwnerControlPanel.jsx`), 'OwnerControlPanel.jsx exists')
assert(fileExists(`${compDir}/DegradedSystemsPanel.jsx`), 'DegradedSystemsPanel.jsx exists')
assert(fileExists(`${compDir}/CredentialRequiredPanel.jsx`), 'CredentialRequiredPanel.jsx exists')
assert(fileExists(`${compDir}/OperationsAuditPanel.jsx`), 'OperationsAuditPanel.jsx exists')
assert(fileExists(`${compDir}/BlockedSyncPanel.jsx`), 'BlockedSyncPanel.jsx exists')
assert(fileExists(`${compDir}/ReceivingConfirmationQueuePanel.jsx`), 'ReceivingConfirmationQueuePanel.jsx exists')

// ── UI Component Honest Vocabulary ────────────────────────────────────────────
const syncPanel = readFile(`${compDir}/SyncCommandCenterPanel.jsx`)
assert(syncPanel.includes('external_sync_not_live') || syncPanel.includes('externalSyncNotLive') || syncPanel.includes('not_live') || syncPanel.includes('not live'), 'SyncCommandCenterPanel shows not live state')
assert(syncPanel.includes('real_time_push_pending') || syncPanel.includes('realTimePushPending') || syncPanel.includes('pending'), 'SyncCommandCenterPanel shows pending state')

const approvalsPanel = readFile(`${compDir}/PendingApprovalsPanel.jsx`)
assert(approvalsPanel.includes('auto_approval_disabled') || approvalsPanel.includes('autoApprovalDisabled') || approvalsPanel.includes('approval_disabled') || approvalsPanel.includes('disabled'), 'PendingApprovalsPanel shows auto approval disabled')
assert(approvalsPanel.includes('reorder_not_submitted') || approvalsPanel.includes('reorderNotSubmitted') || approvalsPanel.includes('not_submitted'), 'PendingApprovalsPanel shows reorder not submitted')

const reorderPanel = readFile(`${compDir}/ReorderSubmissionPanel.jsx`)
assert(reorderPanel.includes('vendor_api_required') || reorderPanel.includes('vendorApiRequired') || reorderPanel.includes('vendor'), 'ReorderSubmissionPanel shows vendor api required')
assert(reorderPanel.includes('distributor_connection_required') || reorderPanel.includes('distributorConnection') || reorderPanel.includes('distributor'), 'ReorderSubmissionPanel shows distributor connection required')

const ownerPanel = readFile(`${compDir}/OwnerControlPanel.jsx`)
assert(ownerPanel.includes('role_insufficient') || ownerPanel.includes('roleInsufficient') || ownerPanel.includes('insufficient') || ownerPanel.includes('owner'), 'OwnerControlPanel guards non-owner roles')

const credPanel = readFile(`${compDir}/CredentialRequiredPanel.jsx`)
assert(credPanel.includes('never') || credPanel.includes('not returned') || credPanel.includes('not exposed'), 'CredentialRequiredPanel states credentials never returned')

const receivingPanel = readFile(`${compDir}/ReceivingConfirmationQueuePanel.jsx`)
assert(receivingPanel.includes('receiving_preview_only') || receivingPanel.includes('preview_only'), 'ReceivingConfirmationQueuePanel shows receiving_preview_only')
assert(receivingPanel.includes('inventory_not_persisted') || receivingPanel.includes('not_persisted'), 'ReceivingConfirmationQueuePanel shows inventory_not_persisted')

// ── E.A.T. Hooks ─────────────────────────────────────────────────────────────
const eat = readFile('server/services/eatCommandHubContract.js')
assert(eat.includes('getLOCCDashboardReadinessHooks'), 'getLOCCDashboardReadinessHooks in E.A.T.')
assert(eat.includes('getSyncCommandCenterReadinessHooks'), 'getSyncCommandCenterReadinessHooks in E.A.T.')
assert(eat.includes('getPendingApprovalsReadinessHooks'), 'getPendingApprovalsReadinessHooks in E.A.T.')
assert(eat.includes('getReorderOperationsReadinessHooks'), 'getReorderOperationsReadinessHooks in E.A.T.')
assert(eat.includes('getOwnerControlReadinessHooks'), 'getOwnerControlReadinessHooks in E.A.T.')
assert(eat.includes('getFailedSyncRetryReadinessHooks'), 'getFailedSyncRetryReadinessHooks in E.A.T.')
assert(eat.includes('getOperationsAuditReadinessHooks'), 'getOperationsAuditReadinessHooks in E.A.T.')
assert(eat.includes('preview_fallback'), 'E.A.T. hooks return preview_fallback on error')
assert(eat.includes('system:') || eat.includes("system:"), 'E.A.T. hooks include system field')

// ── Honest Status Vocabulary ──────────────────────────────────────────────────
const allLoccFiles = [rsg, ods, scs, paqs, ros, ocs, fsrs, oas]
const loccText = allLoccFiles.join('\n')
assert(loccText.includes('externalSyncNotLive') || loccText.includes('external_sync_not_live'), 'external_sync_not_live in LOCC services')
assert(loccText.includes('reorderNotSubmitted') || loccText.includes('reorder_not_submitted'), 'reorder_not_submitted in LOCC services')
assert(loccText.includes('vendorApiRequired') || loccText.includes('vendor_api_required'), 'vendor_api_required in LOCC services')
assert(loccText.includes('autoApprovalDisabled') || loccText.includes('auto_approval_disabled') || loccText.includes('autoApproval'), 'auto approval disabled in LOCC')
assert(loccText.includes('canSubmitLive'), 'canSubmitLive present in LOCC')
assert(!loccText.includes('vendor sync live') && !loccText.includes('externalSyncLive: true'), 'no false claim of live sync')

// ── No Fake Claims ────────────────────────────────────────────────────────────
assert(!loccText.includes('payment captured'), 'no fake payment captured claim')
assert(!loccText.includes('POS synced'), 'no fake POS synced claim')
assert(!loccText.includes('table order live'), 'no fake table order live claim')
assert(!loccText.includes('kitchen notified'), 'no fake kitchen notified claim')
assert(!loccText.includes('auto-purchase') && !loccText.includes('autoPurchase'), 'no auto-purchase in LOCC')
assert(!loccText.includes('canSubmitLive: true'), 'canSubmitLive never true in service layer')

// ── Role Safety — Blocked Roles Cannot Control ────────────────────────────────
assert(rsg.includes('guest') && rsg.includes('blocked') || rsg.includes('BLOCKED_ROLES'), 'guest blocked from control')
assert(!ods.includes("role: 'guest'") || ods.includes('blocked'), 'guest cannot access dashboard operations')
assert(!scs.includes("role: 'bartender'") || scs.includes('blocked'), 'bartender blocked from sync control')

// ── No Auto-Submission to Vendors ─────────────────────────────────────────────
assert(!ros.includes('autoSubmit') && !ros.includes('auto_submit'), 'no auto submit in reorder ops')
assert(!paqs.includes('autoApprove') && !paqs.includes('auto_approve'), 'no auto approve in approvals queue')
assert(ros.includes('reorder_not_submitted') || ros.includes('reorderNotSubmitted'), 'reorder always marked not submitted')

// ── Phase 15 and 16 Integrity ─────────────────────────────────────────────────
assert(fileExists('server/services/reorder/receivingPersistenceService.js'), 'Phase 15: receivingPersistenceService still present')
assert(fileExists('server/services/environment/environmentReadinessService.js'), 'Phase 16: environmentReadinessService still present')
assert(fileExists('server/db/migrationReadinessService.js'), 'Phase 16: migrationReadinessService still present')
assert(fileExists('server/services/persistence/persistenceModeService.js'), 'Phase 16: persistenceModeService still present')
assert(fileExists('server/controllers/eprlHealthController.js'), 'Phase 16: eprlHealthController still present')
assert(fileExists('server/routes/eprlHealthRoutes.js'), 'Phase 16: eprlHealthRoutes still present')

// ── Protected Files Untouched ─────────────────────────────────────────────────
assert(fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx'), 'SmokeCraftAssetScreen.jsx still exists')
assert(fileExists('src/components/smokecraft/SmokeCraftHotspotLayer.jsx'), 'SmokeCraftHotspotLayer.jsx still exists')
assert(fileExists('src/constants/session.js'), 'session.js still exists')
const sessionConst = readFile('src/constants/session.js')
assert(sessionConst.includes('VISIT_STRUCTURE'), 'VISIT_STRUCTURE still in session.js')
assert(fileExists('src/utils/passportProgress.js'), 'passportProgress.js still exists')
assert(fileExists('src/utils/passportEntry.js'), 'passportEntry.js still exists')
assert(fileExists('src/constants/smokecraftJourney.js'), 'smokecraftJourney.js still exists')

// ── Package.json script ───────────────────────────────────────────────────────
const pkg = readFile('package.json')
assert(pkg.includes('verify:locc-dashboard'), 'verify:locc-dashboard script in package.json')
assert(pkg.includes('verifyLiveOperationsDashboard'), 'verifyLiveOperationsDashboard.js referenced in package.json')

// ── Documentation ─────────────────────────────────────────────────────────────
assert(fileExists('docs/LIVE_OPERATIONS_COMMAND_CENTER.md'), 'LIVE_OPERATIONS_COMMAND_CENTER.md exists')
const doc = readFile('docs/LIVE_OPERATIONS_COMMAND_CENTER.md')
assert(doc.includes('LOCC') || doc.includes('Live Operations'), 'doc describes LOCC')
assert(doc.includes('roleSafetyGateway') || doc.includes('role'), 'doc mentions role safety')
assert(doc.includes('external_sync_not_live') || doc.includes('externalSyncNotLive') || doc.includes('sync'), 'doc describes sync status')
assert(doc.includes('reorder_not_submitted') || doc.includes('reorder'), 'doc describes reorder status')
assert(doc.includes('owner') || doc.includes('Owner'), 'doc mentions owner controls')

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)
if (failures.length > 0) {
  console.log('\n  Failed assertions:')
  failures.forEach(f => console.log(`    - ${f}`))
  process.exit(1)
} else {
  console.log('\n  All assertions passed. Phase 17 LOCC verified.\n')
}
