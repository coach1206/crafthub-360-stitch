/**
 * pos360StaffFeatureFlags.js — Phase B.12 Prompt Y
 * Feature flags for POS360 staff roles, labor, governance.
 */

export const DEFAULT_POS360_STAFF_FLAGS = {
  staffManagementEnabled: true,
  staffProfilesEnabled: true,
  roleTemplatesEnabled: true,
  venueConfigurableRolesEnabled: true,
  granularPermissionsEnabled: true,
  permissionOverridesEnabled: true,
  managerGovernanceEnabled: true,
  managerApprovalRequestsEnabled: true,
  schedulingEnabled: true,
  scheduleTemplatesEnabled: true,
  schedulePublishPlaceholderEnabled: true,
  staffAvailabilityEnabled: true,
  timeOffRequestsEnabled: true,
  shiftAssignmentsEnabled: true,
  tableSectionAssignmentsEnabled: true,
  privateEventStaffingEnabled: true,
  barStaffingEnabled: true,
  kitchenStaffingEnabled: true,
  humidorStaffingEnabled: true,
  patioStaffingEnabled: true,
  timeClockEnabled: true,
  breakTrackingEnabled: true,
  missedPunchCorrectionsEnabled: true,
  managerApprovalForTimeCorrectionsEnabled: true,
  laborSummaryEnabled: true,
  laborCostPlaceholderEnabled: true,
  payrollProviderContractsEnabled: true,
  payrollExportPlaceholderEnabled: false,
  staffRiskFlagsEnabled: true,
  eatLaborInsightsEnabled: false,
  offlineStaffQueueEnabled: true,
  multilingualStaffEnabled: true,
  staffPIIProtectionEnabled: true,
  financialPermissionProtectionEnabled: true,
  canAccessPOS3ProtectionRequired: true,
  noFakePayrollEnforced: true,
  noFakeNotificationsEnforced: true,
  noSecretsStorageEnforced: true,
}

export function getStaffFlags(venueOverrides = {}) {
  return { ...DEFAULT_POS360_STAFF_FLAGS, ...venueOverrides }
}
