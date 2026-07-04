/**
 * pos360ReportsFeatureFlags.js — Phase B.13 Prompt Z
 */

export const DEFAULT_POS360_REPORTS_FLAGS = {
  reportsEnabled: true,
  executiveDashboardsEnabled: true,
  dailyOperationsReportsEnabled: true,
  closeoutReportsEnabled: true,
  paymentAnalyticsEnabled: true,
  staffAnalyticsEnabled: true,
  guestAnalyticsEnabled: true,
  loyaltyAnalyticsEnabled: true,
  reservationAnalyticsEnabled: true,
  eventPackageAnalyticsEnabled: true,
  inventoryHealthReportsEnabled: true,
  smokeCraftEngagementReportsEnabled: true,
  eatDecisionLayerEnabled: false,
  eatDecisionInsightsEnabled: false,
  reportSnapshotsEnabled: true,
  reportSnapshotLockingEnabled: true,
  kpiDefinitionsEnabled: true,
  kpiThresholdsEnabled: true,
  alertRulesEnabled: true,
  alertEventsEnabled: true,
  exportRequestsEnabled: true,
  pdfExportPlaceholderEnabled: false,
  csvExportPlaceholderEnabled: false,
  printReadyExportEnabled: false,
  emailReadyExportEnabled: false,
  scheduledReportsEnabled: true,
  scheduledDeliveryPlaceholderEnabled: false,
  biProviderContractsEnabled: true,
  offlineReportQueueEnabled: true,
  multilingualReportsEnabled: true,
  privateDataReportProtectionEnabled: true,
  financialDataReportProtectionEnabled: true,
  noFakeRevenueEnforced: true,
  noFakeProfitEnforced: true,
  noFakeExportsEnforced: true,
  noFakeScheduledDeliveryEnforced: true,
  noFakeEatAiEnforced: true,
  canAccessPOS3ProtectionRequired: true,
}

export function getReportsFlags(venueOverrides = {}) {
  return { ...DEFAULT_POS360_REPORTS_FLAGS, ...venueOverrides }
}
