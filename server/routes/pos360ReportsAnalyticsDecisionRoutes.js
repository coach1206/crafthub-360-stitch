/**
 * pos360ReportsAnalyticsDecisionRoutes.js
 * Mounted at /api/pos360/reports
 */
import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360ReportsAnalyticsDecisionController.js'

const router = Router()

// Report definitions
router.get('/definitions', ctrl.listReportDefinitions)
router.post('/definitions', canAccessPOS3, ctrl.createReportDefinition)

// KPIs
router.get('/kpis', ctrl.listKpiDefinitions)
router.post('/kpis', canAccessPOS3, ctrl.createKpiDefinition)
router.get('/kpi-thresholds', ctrl.listKpiThresholds)
router.post('/kpi-thresholds', canAccessPOS3, ctrl.createKpiThreshold)
router.patch('/kpi-thresholds/:thresholdId', canAccessPOS3, ctrl.updateKpiThreshold)

// Report snapshots
router.get('/snapshots', ctrl.listReportSnapshots)
router.post('/snapshots', canAccessPOS3, ctrl.createReportSnapshotPlaceholder)
router.get('/snapshots/:reportSnapshotId', ctrl.getReportSnapshot)
router.post('/snapshots/:reportSnapshotId/lock', canAccessPOS3, ctrl.lockReportSnapshot)
router.post('/snapshots/:reportSnapshotId/sections', canAccessPOS3, ctrl.createReportSnapshotSection)

// Dashboards
router.get('/dashboards', ctrl.listDashboardProfiles)
router.post('/dashboards', canAccessPOS3, ctrl.createDashboardProfile)
router.get('/dashboards/:dashboardProfileId/widgets', ctrl.listDashboardWidgets)
router.post('/dashboards/:dashboardProfileId/widgets', canAccessPOS3, ctrl.createDashboardWidget)
router.post('/dashboard-view-events', canAccessPOS3, ctrl.recordDashboardViewEvent)
router.get('/executive-summary', ctrl.getExecutiveDashboardSummary)

// Daily operations
router.get('/daily-operations', ctrl.listDailyOperationsReports)
router.post('/daily-operations', canAccessPOS3, ctrl.createDailyOperationsReportPlaceholder)
router.get('/daily-operations/:reportDate', ctrl.getDailyOperationsReport)
router.get('/daily-closeout-links', ctrl.listDailyCloseoutReportLinks)
router.post('/daily-closeout-links', canAccessPOS3, ctrl.createDailyCloseoutReportLink)

// Cross-module links
router.get('/links', ctrl.listCrossModuleReportLinks)
router.post('/links/staff-performance', canAccessPOS3, ctrl.createStaffPerformanceReportLink)
router.post('/links/guest-intelligence', canAccessPOS3, ctrl.createGuestIntelligenceReportLink)
router.post('/links/inventory-health', canAccessPOS3, ctrl.createInventoryHealthReportLink)
router.post('/links/event-packages', canAccessPOS3, ctrl.createEventPackageReportLink)
router.post('/links/payment-analytics', canAccessPOS3, ctrl.createPaymentAnalyticsReportLink)

// Alerts
router.get('/alerts/rules', ctrl.listAlertRules)
router.post('/alerts/rules', canAccessPOS3, ctrl.createAlertRule)
router.patch('/alerts/rules/:alertRuleId', canAccessPOS3, ctrl.updateAlertRule)
router.get('/alerts/events', ctrl.listAlertEvents)
router.post('/alerts/events', canAccessPOS3, ctrl.createAlertEvent)
router.post('/alerts/events/:alertEventId/acknowledge', canAccessPOS3, ctrl.acknowledgeAlertEvent)
router.post('/alerts/events/:alertEventId/resolve', canAccessPOS3, ctrl.resolveAlertEvent)

// E.A.T. decision layer
router.get('/eat/decision-insights', ctrl.listEatDecisionInsights)
router.post('/eat/decision-insights', canAccessPOS3, ctrl.createEatDecisionInsightPlaceholder)
router.post('/eat/decision-insights/:insightId/review', canAccessPOS3, ctrl.reviewEatDecisionInsight)
router.get('/eat/decision-summary', ctrl.getEatDecisionSummary)

// Exports
router.get('/exports', ctrl.listReportExportRequests)
router.post('/exports', canAccessPOS3, ctrl.createReportExportRequest)
router.post('/exports/:exportRequestId/ready-placeholder', canAccessPOS3, ctrl.markReportExportReadyPlaceholder)

// Scheduled reports
router.get('/scheduled-reports', ctrl.listScheduledReportContracts)
router.post('/scheduled-reports', canAccessPOS3, ctrl.createScheduledReportContract)
router.patch('/scheduled-reports/:scheduledReportId/status', canAccessPOS3, ctrl.updateScheduledReportStatus)

// BI providers
router.get('/bi-providers', ctrl.listBiProviderProfiles)
router.post('/bi-providers', canAccessPOS3, ctrl.createBiProviderProfile)
router.patch('/bi-providers/:providerProfileId/status', canAccessPOS3, ctrl.updateBiProviderStatus)

// Offline queue
router.get('/offline-queue', ctrl.listOfflineReportQueue)
router.post('/offline-queue', canAccessPOS3, ctrl.queueOfflineReportAction)
router.post('/offline-queue/:offlineActionId/synced', canAccessPOS3, ctrl.markOfflineReportActionSynced)

export default router
