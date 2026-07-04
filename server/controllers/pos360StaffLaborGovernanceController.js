import * as svc from '../services/pos360/pos360StaffLaborGovernanceService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const vid = req => req.headers['x-venue-id'] || req.body?.venueId || req.query?.venueId
const actor = req => req.headers['x-actor-id'] || req.body?.actorId || req.query?.actorId
const tid = req => req.headers['x-tenant-id'] || req.body?.tenantId || req.query?.tenantId

export const createStaffProfile = (req, res) => ok500(res, async () => res.json(await svc.createStaffProfile({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const getStaffProfile = (req, res) => ok500(res, async () => res.json(await svc.getStaffProfile({ venueId: vid(req), staffProfileId: req.params.staffProfileId })))
export const listStaffProfiles = (req, res) => ok500(res, async () => res.json(await svc.listStaffProfiles({ venueId: vid(req), ...req.query })))
export const updateStaffProfile = (req, res) => ok500(res, async () => res.json(await svc.updateStaffProfile({ venueId: vid(req), actorId: actor(req), staffProfileId: req.params.staffProfileId, ...req.body })))
export const deactivateStaffProfile = (req, res) => ok500(res, async () => res.json(await svc.deactivateStaffProfile({ venueId: vid(req), actorId: actor(req), staffProfileId: req.params.staffProfileId, ...req.body })))

export const createStaffRole = (req, res) => ok500(res, async () => res.json(await svc.createStaffRole({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listStaffRoles = (req, res) => ok500(res, async () => res.json(await svc.listStaffRoles({ venueId: vid(req), ...req.query })))
export const updateStaffRole = (req, res) => ok500(res, async () => res.json(await svc.updateStaffRole({ venueId: vid(req), actorId: actor(req), roleId: req.params.roleId, ...req.body })))
export const listRoleTemplates = (req, res) => ok500(res, async () => res.json(await svc.listRoleTemplates({ venueId: vid(req), ...req.query })))
export const seedVenueRoleTemplatesPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.seedVenueRoleTemplatesPlaceholder({ venueId: vid(req), actorId: actor(req), ...req.body })))

export const listStaffPermissions = (req, res) => ok500(res, async () => res.json(await svc.listStaffPermissions({ venueId: vid(req), ...req.query })))
export const grantRolePermission = (req, res) => ok500(res, async () => res.json(await svc.grantRolePermission({ venueId: vid(req), actorId: actor(req), ...req.body })))
export const revokeRolePermission = (req, res) => ok500(res, async () => res.json(await svc.revokeRolePermission({ venueId: vid(req), actorId: actor(req), ...req.body })))
export const createPermissionOverride = (req, res) => ok500(res, async () => res.json(await svc.createPermissionOverride({ venueId: vid(req), actorId: actor(req), ...req.body })))
export const decidePermissionOverride = (req, res) => ok500(res, async () => res.json(await svc.decidePermissionOverride({ venueId: vid(req), actorId: actor(req), overrideId: req.params.overrideId, ...req.body })))
export const evaluateStaffPermission = (req, res) => ok500(res, async () => res.json(await svc.evaluateStaffPermission({ venueId: vid(req), ...req.query })))

export const createStaffAssignment = (req, res) => ok500(res, async () => res.json(await svc.createStaffAssignment({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listStaffAssignments = (req, res) => ok500(res, async () => res.json(await svc.listStaffAssignments({ venueId: vid(req), ...req.query })))
export const updateStaffAssignmentStatus = (req, res) => ok500(res, async () => res.json(await svc.updateStaffAssignmentStatus({ venueId: vid(req), actorId: actor(req), assignmentId: req.params.assignmentId, ...req.body })))
export const transferStaffAssignment = (req, res) => ok500(res, async () => res.json(await svc.transferStaffAssignment({ venueId: vid(req), actorId: actor(req), assignmentId: req.params.assignmentId, ...req.body })))

export const createScheduleTemplate = (req, res) => ok500(res, async () => res.json(await svc.createScheduleTemplate({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listScheduleTemplates = (req, res) => ok500(res, async () => res.json(await svc.listScheduleTemplates({ venueId: vid(req), ...req.query })))
export const createScheduledShift = (req, res) => ok500(res, async () => res.json(await svc.createScheduledShift({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listScheduledShifts = (req, res) => ok500(res, async () => res.json(await svc.listScheduledShifts({ venueId: vid(req), ...req.query })))
export const updateShiftStatus = (req, res) => ok500(res, async () => res.json(await svc.updateShiftStatus({ venueId: vid(req), actorId: actor(req), shiftId: req.params.shiftId, ...req.body })))
export const publishSchedulePlaceholder = (req, res) => ok500(res, async () => res.json(await svc.publishSchedulePlaceholder({ venueId: vid(req), actorId: actor(req), ...req.body })))

export const createStaffAvailability = (req, res) => ok500(res, async () => res.json(await svc.createStaffAvailability({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listStaffAvailability = (req, res) => ok500(res, async () => res.json(await svc.listStaffAvailability({ venueId: vid(req), ...req.query })))

export const createTimeOffRequest = (req, res) => ok500(res, async () => res.json(await svc.createTimeOffRequest({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listTimeOffRequests = (req, res) => ok500(res, async () => res.json(await svc.listTimeOffRequests({ venueId: vid(req), ...req.query })))
export const decideTimeOffRequest = (req, res) => ok500(res, async () => res.json(await svc.decideTimeOffRequest({ venueId: vid(req), actorId: actor(req), requestId: req.params.requestId, ...req.body })))

export const createTimeClockPunch = (req, res) => ok500(res, async () => res.json(await svc.createTimeClockPunch({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listTimeClockPunches = (req, res) => ok500(res, async () => res.json(await svc.listTimeClockPunches({ venueId: vid(req), ...req.query })))
export const createTimeClockCorrection = (req, res) => ok500(res, async () => res.json(await svc.createTimeClockCorrection({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const decideTimeClockCorrection = (req, res) => ok500(res, async () => res.json(await svc.decideTimeClockCorrection({ venueId: vid(req), actorId: actor(req), correctionId: req.params.correctionId, ...req.body })))

export const createBreakRecord = (req, res) => ok500(res, async () => res.json(await svc.createBreakRecord({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listBreakRecords = (req, res) => ok500(res, async () => res.json(await svc.listBreakRecords({ venueId: vid(req), ...req.query })))

export const createLaborSummaryPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createLaborSummaryPlaceholder({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listLaborSummaries = (req, res) => ok500(res, async () => res.json(await svc.listLaborSummaries({ venueId: vid(req), ...req.query })))
export const lockLaborSummary = (req, res) => ok500(res, async () => res.json(await svc.lockLaborSummary({ venueId: vid(req), actorId: actor(req), summaryId: req.params.summaryId, ...req.body })))

export const createManagerGovernanceRule = (req, res) => ok500(res, async () => res.json(await svc.createManagerGovernanceRule({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listManagerGovernanceRules = (req, res) => ok500(res, async () => res.json(await svc.listManagerGovernanceRules({ venueId: vid(req), ...req.query })))
export const createManagerApprovalRequest = (req, res) => ok500(res, async () => res.json(await svc.createManagerApprovalRequest({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listManagerApprovalRequests = (req, res) => ok500(res, async () => res.json(await svc.listManagerApprovalRequests({ venueId: vid(req), ...req.query })))
export const decideManagerApprovalRequest = (req, res) => ok500(res, async () => res.json(await svc.decideManagerApprovalRequest({ venueId: vid(req), actorId: actor(req), approvalRequestId: req.params.approvalRequestId, ...req.body })))

export const createStaffRiskFlag = (req, res) => ok500(res, async () => res.json(await svc.createStaffRiskFlag({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listStaffRiskFlags = (req, res) => ok500(res, async () => res.json(await svc.listStaffRiskFlags({ venueId: vid(req), ...req.query })))
export const reviewStaffRiskFlag = (req, res) => ok500(res, async () => res.json(await svc.reviewStaffRiskFlag({ venueId: vid(req), actorId: actor(req), flagId: req.params.flagId, ...req.body })))

export const createLaborInsightPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createLaborInsightPlaceholder({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listLaborInsights = (req, res) => ok500(res, async () => res.json(await svc.listLaborInsights({ venueId: vid(req), ...req.query })))
export const getLaborIntelligenceSummary = (req, res) => ok500(res, async () => res.json(await svc.getLaborIntelligenceSummary({ venueId: vid(req), ...req.query })))

export const createPayrollProviderProfile = (req, res) => ok500(res, async () => res.json(await svc.createPayrollProviderProfile({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listPayrollProviderProfiles = (req, res) => ok500(res, async () => res.json(await svc.listPayrollProviderProfiles({ venueId: vid(req), ...req.query })))
export const updatePayrollProviderStatus = (req, res) => ok500(res, async () => res.json(await svc.updatePayrollProviderStatus({ venueId: vid(req), actorId: actor(req), profileId: req.params.profileId, ...req.body })))

export const queueOfflineStaffAction = (req, res) => ok500(res, async () => res.json(await svc.queueOfflineStaffAction({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })))
export const listOfflineStaffQueue = (req, res) => ok500(res, async () => res.json(await svc.listOfflineStaffQueue({ venueId: vid(req), ...req.query })))
export const markOfflineStaffActionSynced = (req, res) => ok500(res, async () => res.json(await svc.markOfflineStaffActionSynced({ venueId: vid(req), actorId: actor(req), queueId: req.params.queueId, ...req.body })))
