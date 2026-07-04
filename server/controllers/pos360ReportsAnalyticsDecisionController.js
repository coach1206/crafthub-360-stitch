import * as svc from '../services/pos360/pos360ReportsAnalyticsDecisionService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const vid = req => req.headers['x-venue-id'] || req.body?.venueId || req.query?.venueId
const actor = req => req.headers['x-actor-id'] || req.body?.actorId || req.query?.actorId
const tid = req => req.headers['x-tenant-id'] || req.body?.tenantId || req.query?.tenantId

export const createReportDefinition = (req, res) => ok500(res, async () => res.json(await svc.createReportDefinition({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listReportDefinitions = (req, res) => ok500(res, async () => res.json(await svc.listReportDefinitions({ venueId: vid(req), filters: req.query })))
export const createKpiDefinition = (req, res) => ok500(res, async () => res.json(await svc.createKpiDefinition({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listKpiDefinitions = (req, res) => ok500(res, async () => res.json(await svc.listKpiDefinitions({ venueId: vid(req), filters: req.query })))
export const createKpiThreshold = (req, res) => ok500(res, async () => res.json(await svc.createKpiThreshold({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listKpiThresholds = (req, res) => ok500(res, async () => res.json(await svc.listKpiThresholds({ venueId: vid(req), filters: req.query })))
export const updateKpiThreshold = (req, res) => ok500(res, async () => res.json(await svc.updateKpiThreshold({ venueId: vid(req), thresholdId: req.params.thresholdId, payload: req.body, actorUserId: actor(req) })))

export const createReportSnapshotPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createReportSnapshotPlaceholder({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const getReportSnapshot = (req, res) => ok500(res, async () => res.json(await svc.getReportSnapshot({ venueId: vid(req), reportSnapshotId: req.params.reportSnapshotId })))
export const listReportSnapshots = (req, res) => ok500(res, async () => res.json(await svc.listReportSnapshots({ venueId: vid(req), filters: req.query })))
export const lockReportSnapshot = (req, res) => ok500(res, async () => res.json(await svc.lockReportSnapshot({ venueId: vid(req), reportSnapshotId: req.params.reportSnapshotId, actorUserId: actor(req), reason: req.body?.reason, idempotencyKey: req.body?.idempotencyKey })))
export const createReportSnapshotSection = (req, res) => ok500(res, async () => res.json(await svc.createReportSnapshotSection({ venueId: vid(req), reportSnapshotId: req.params.reportSnapshotId, payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))

export const createDashboardProfile = (req, res) => ok500(res, async () => res.json(await svc.createDashboardProfile({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listDashboardProfiles = (req, res) => ok500(res, async () => res.json(await svc.listDashboardProfiles({ venueId: vid(req), filters: req.query })))
export const createDashboardWidget = (req, res) => ok500(res, async () => res.json(await svc.createDashboardWidget({ venueId: vid(req), dashboardProfileId: req.params.dashboardProfileId, payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listDashboardWidgets = (req, res) => ok500(res, async () => res.json(await svc.listDashboardWidgets({ venueId: vid(req), dashboardProfileId: req.params.dashboardProfileId })))
export const recordDashboardViewEvent = (req, res) => ok500(res, async () => res.json(await svc.recordDashboardViewEvent({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const getExecutiveDashboardSummary = (req, res) => ok500(res, async () => res.json(await svc.getExecutiveDashboardSummary({ venueId: vid(req), filters: req.query })))

export const createDailyOperationsReportPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createDailyOperationsReportPlaceholder({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const getDailyOperationsReport = (req, res) => ok500(res, async () => res.json(await svc.getDailyOperationsReport({ venueId: vid(req), reportDate: req.params.reportDate })))
export const listDailyOperationsReports = (req, res) => ok500(res, async () => res.json(await svc.listDailyOperationsReports({ venueId: vid(req), filters: req.query })))
export const createDailyCloseoutReportLink = (req, res) => ok500(res, async () => res.json(await svc.createDailyCloseoutReportLink({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listDailyCloseoutReportLinks = (req, res) => ok500(res, async () => res.json(await svc.listDailyCloseoutReportLinks({ venueId: vid(req), filters: req.query })))

export const createStaffPerformanceReportLink = (req, res) => ok500(res, async () => res.json(await svc.createStaffPerformanceReportLink({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const createGuestIntelligenceReportLink = (req, res) => ok500(res, async () => res.json(await svc.createGuestIntelligenceReportLink({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const createInventoryHealthReportLink = (req, res) => ok500(res, async () => res.json(await svc.createInventoryHealthReportLink({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const createEventPackageReportLink = (req, res) => ok500(res, async () => res.json(await svc.createEventPackageReportLink({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const createPaymentAnalyticsReportLink = (req, res) => ok500(res, async () => res.json(await svc.createPaymentAnalyticsReportLink({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listCrossModuleReportLinks = (req, res) => ok500(res, async () => res.json(await svc.listCrossModuleReportLinks({ venueId: vid(req), filters: req.query })))

export const createAlertRule = (req, res) => ok500(res, async () => res.json(await svc.createAlertRule({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listAlertRules = (req, res) => ok500(res, async () => res.json(await svc.listAlertRules({ venueId: vid(req), filters: req.query })))
export const updateAlertRule = (req, res) => ok500(res, async () => res.json(await svc.updateAlertRule({ venueId: vid(req), alertRuleId: req.params.alertRuleId, payload: req.body, actorUserId: actor(req) })))
export const createAlertEvent = (req, res) => ok500(res, async () => res.json(await svc.createAlertEvent({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listAlertEvents = (req, res) => ok500(res, async () => res.json(await svc.listAlertEvents({ venueId: vid(req), filters: req.query })))
export const acknowledgeAlertEvent = (req, res) => ok500(res, async () => res.json(await svc.acknowledgeAlertEvent({ venueId: vid(req), alertEventId: req.params.alertEventId, actorUserId: actor(req), reason: req.body?.reason, idempotencyKey: req.body?.idempotencyKey })))
export const resolveAlertEvent = (req, res) => ok500(res, async () => res.json(await svc.resolveAlertEvent({ venueId: vid(req), alertEventId: req.params.alertEventId, actorUserId: actor(req), reason: req.body?.reason, idempotencyKey: req.body?.idempotencyKey })))

export const createEatDecisionInsightPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createEatDecisionInsightPlaceholder({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listEatDecisionInsights = (req, res) => ok500(res, async () => res.json(await svc.listEatDecisionInsights({ venueId: vid(req), filters: req.query })))
export const reviewEatDecisionInsight = (req, res) => ok500(res, async () => res.json(await svc.reviewEatDecisionInsight({ venueId: vid(req), insightId: req.params.insightId, actorUserId: actor(req), decision: req.body?.decision, reason: req.body?.reason, idempotencyKey: req.body?.idempotencyKey })))
export const getEatDecisionSummary = (req, res) => ok500(res, async () => res.json(await svc.getEatDecisionSummary({ venueId: vid(req), filters: req.query })))

export const createReportExportRequest = (req, res) => ok500(res, async () => res.json(await svc.createReportExportRequest({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listReportExportRequests = (req, res) => ok500(res, async () => res.json(await svc.listReportExportRequests({ venueId: vid(req), filters: req.query })))
export const markReportExportReadyPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.markReportExportReadyPlaceholder({ venueId: vid(req), exportRequestId: req.params.exportRequestId, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const createScheduledReportContract = (req, res) => ok500(res, async () => res.json(await svc.createScheduledReportContract({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listScheduledReportContracts = (req, res) => ok500(res, async () => res.json(await svc.listScheduledReportContracts({ venueId: vid(req), filters: req.query })))
export const updateScheduledReportStatus = (req, res) => ok500(res, async () => res.json(await svc.updateScheduledReportStatus({ venueId: vid(req), scheduledReportId: req.params.scheduledReportId, status: req.body?.status, actorUserId: actor(req), reason: req.body?.reason, idempotencyKey: req.body?.idempotencyKey })))

export const createBiProviderProfile = (req, res) => ok500(res, async () => res.json(await svc.createBiProviderProfile({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listBiProviderProfiles = (req, res) => ok500(res, async () => res.json(await svc.listBiProviderProfiles({ venueId: vid(req), filters: req.query })))
export const updateBiProviderStatus = (req, res) => ok500(res, async () => res.json(await svc.updateBiProviderStatus({ venueId: vid(req), providerProfileId: req.params.providerProfileId, status: req.body?.status, actorUserId: actor(req), reason: req.body?.reason, idempotencyKey: req.body?.idempotencyKey })))

export const queueOfflineReportAction = (req, res) => ok500(res, async () => res.json(await svc.queueOfflineReportAction({ venueId: vid(req), payload: req.body, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
export const listOfflineReportQueue = (req, res) => ok500(res, async () => res.json(await svc.listOfflineReportQueue({ venueId: vid(req), filters: req.query })))
export const markOfflineReportActionSynced = (req, res) => ok500(res, async () => res.json(await svc.markOfflineReportActionSynced({ venueId: vid(req), offlineActionId: req.params.offlineActionId, actorUserId: actor(req), idempotencyKey: req.body?.idempotencyKey })))
