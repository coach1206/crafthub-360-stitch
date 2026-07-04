/**
 * pos360StaffLaborGovernanceRoutes.js
 * Mounted at /api/pos360/staff
 */
import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360StaffLaborGovernanceController.js'

const router = Router()

router.get('/profiles', ctrl.listStaffProfiles)
router.get('/profiles/:staffProfileId', ctrl.getStaffProfile)
router.post('/profiles', canAccessPOS3, ctrl.createStaffProfile)
router.patch('/profiles/:staffProfileId', canAccessPOS3, ctrl.updateStaffProfile)
router.post('/profiles/:staffProfileId/deactivate', canAccessPOS3, ctrl.deactivateStaffProfile)

router.get('/roles', ctrl.listStaffRoles)
router.post('/roles', canAccessPOS3, ctrl.createStaffRole)
router.patch('/roles/:roleId', canAccessPOS3, ctrl.updateStaffRole)
router.get('/role-templates', ctrl.listRoleTemplates)
router.post('/role-templates/seed', canAccessPOS3, ctrl.seedVenueRoleTemplatesPlaceholder)

router.get('/permissions', ctrl.listStaffPermissions)
router.post('/permissions/grant', canAccessPOS3, ctrl.grantRolePermission)
router.post('/permissions/revoke', canAccessPOS3, ctrl.revokeRolePermission)
router.post('/permissions/overrides', canAccessPOS3, ctrl.createPermissionOverride)
router.post('/permissions/overrides/:overrideId/decide', canAccessPOS3, ctrl.decidePermissionOverride)
router.get('/permissions/evaluate', ctrl.evaluateStaffPermission)

router.get('/assignments', ctrl.listStaffAssignments)
router.post('/assignments', canAccessPOS3, ctrl.createStaffAssignment)
router.patch('/assignments/:assignmentId/status', canAccessPOS3, ctrl.updateStaffAssignmentStatus)
router.post('/assignments/:assignmentId/transfer', canAccessPOS3, ctrl.transferStaffAssignment)

router.get('/schedule-templates', ctrl.listScheduleTemplates)
router.post('/schedule-templates', canAccessPOS3, ctrl.createScheduleTemplate)
router.get('/shifts', ctrl.listScheduledShifts)
router.post('/shifts', canAccessPOS3, ctrl.createScheduledShift)
router.patch('/shifts/:shiftId/status', canAccessPOS3, ctrl.updateShiftStatus)
router.post('/shifts/publish', canAccessPOS3, ctrl.publishSchedulePlaceholder)

router.get('/availability', ctrl.listStaffAvailability)
router.post('/availability', canAccessPOS3, ctrl.createStaffAvailability)

router.get('/time-off', ctrl.listTimeOffRequests)
router.post('/time-off', canAccessPOS3, ctrl.createTimeOffRequest)
router.post('/time-off/:requestId/decide', canAccessPOS3, ctrl.decideTimeOffRequest)

router.get('/time-clock', ctrl.listTimeClockPunches)
router.post('/time-clock', canAccessPOS3, ctrl.createTimeClockPunch)
router.get('/time-clock/corrections', ctrl.listTimeClockPunches)
router.post('/time-clock/corrections', canAccessPOS3, ctrl.createTimeClockCorrection)
router.post('/time-clock/corrections/:correctionId/decide', canAccessPOS3, ctrl.decideTimeClockCorrection)

router.get('/breaks', ctrl.listBreakRecords)
router.post('/breaks', canAccessPOS3, ctrl.createBreakRecord)

router.get('/labor-summaries', ctrl.listLaborSummaries)
router.post('/labor-summaries', canAccessPOS3, ctrl.createLaborSummaryPlaceholder)
router.post('/labor-summaries/:summaryId/lock', canAccessPOS3, ctrl.lockLaborSummary)

router.get('/governance-rules', ctrl.listManagerGovernanceRules)
router.post('/governance-rules', canAccessPOS3, ctrl.createManagerGovernanceRule)
router.get('/approval-requests', ctrl.listManagerApprovalRequests)
router.post('/approval-requests', canAccessPOS3, ctrl.createManagerApprovalRequest)
router.post('/approval-requests/:approvalRequestId/decide', canAccessPOS3, ctrl.decideManagerApprovalRequest)

router.get('/risk-flags', ctrl.listStaffRiskFlags)
router.post('/risk-flags', canAccessPOS3, ctrl.createStaffRiskFlag)
router.post('/risk-flags/:flagId/review', canAccessPOS3, ctrl.reviewStaffRiskFlag)

router.get('/labor-insights', ctrl.listLaborInsights)
router.post('/labor-insights', canAccessPOS3, ctrl.createLaborInsightPlaceholder)
router.get('/labor-intelligence', ctrl.getLaborIntelligenceSummary)

router.get('/payroll-providers', ctrl.listPayrollProviderProfiles)
router.post('/payroll-providers', canAccessPOS3, ctrl.createPayrollProviderProfile)
router.patch('/payroll-providers/:profileId/status', canAccessPOS3, ctrl.updatePayrollProviderStatus)

router.get('/offline-queue', ctrl.listOfflineStaffQueue)
router.post('/offline-queue', canAccessPOS3, ctrl.queueOfflineStaffAction)
router.post('/offline-queue/:queueId/synced', canAccessPOS3, ctrl.markOfflineStaffActionSynced)

export default router
