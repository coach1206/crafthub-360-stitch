// pos360SettingsFeatureFlags.js — Phase B.14 Prompt AA
// POS360 System Settings, Venue Configuration & Admin Console feature flags.

export const DEFAULT_POS360_SETTINGS_FLAGS = {
  systemSettingsEnabled: true,
  venueProfilesEnabled: true,
  regionalSettingsEnabled: true,
  operatingRulesEnabled: true,
  financialPoliciesEnabled: true,
  complianceSettingsEnabled: true,
  privacyNoticesEnabled: true,
  whiteLabelProfilesEnabled: true,
  whiteLabelThemeTokensEnabled: true,
  whiteLabelDeploymentPlaceholderEnabled: false,
  moduleRegistryEnabled: true,
  moduleGovernanceEnabled: true,
  featureFlagOverridesEnabled: true,
  integrationStatusRegistryEnabled: true,
  providerReadinessChecksEnabled: true,
  adminConsoleProfilesEnabled: true,
  adminSettingsViewsEnabled: true,
  settingsChangeRequestsEnabled: true,
  settingsApprovalRequestsEnabled: true,
  settingsVersionHistoryEnabled: true,
  settingsRollbackEnabled: true,
  settingsExportRequestsEnabled: true,
  offlineSettingsQueueEnabled: true,
  multilingualSettingsEnabled: true,
  privateDataSettingsProtectionEnabled: true,
  financialDataSettingsProtectionEnabled: true,
  tenantVenueScopeProtectionEnabled: true,
  managerApprovalForFinancialSettingsEnabled: true,
  managerApprovalForModuleTogglesEnabled: true,
  managerApprovalForWhiteLabelEnabled: true,
  managerApprovalForProviderStatusEnabled: true,
  managerApprovalForComplianceSettingsEnabled: true,
  noFakeWhiteLabelDeploymentEnforced: true,
  noFakeProviderConnectionEnforced: true,
  noFakeComplianceCertificationEnforced: true,
  noFakeTaxCalculationEnforced: true,
  noFakeAccountingExportEnforced: true,
  noSecretsStorageEnforced: true,
  canAccessPOS3ProtectionRequired: true,
}

export function getSettingsFlags(venueOverrides = {}) {
  return { ...DEFAULT_POS360_SETTINGS_FLAGS, ...venueOverrides }
}
