// Phase C.2 / Module 2 of 7
// NOVEE OS Tenant, Venue, Organization & Workspace Governance — Feature Flags

export const DEFAULT_NOVEE_OS_TENANT_FLAGS = {
  tenantGovernanceEnabled:                  true,
  organizationsEnabled:                     true,
  organizationProfilesEnabled:              true,
  venueGroupsEnabled:                       true,
  venuesEnabled:                            true,
  venueProfilesEnabled:                     true,
  workspacesEnabled:                        true,
  workspaceMembershipsEnabled:              true,
  workspaceRolesEnabled:                    true,
  workspaceAccessBoundariesEnabled:         true,
  businessUnitsEnabled:                     true,
  departmentsEnabled:                       true,
  locationsEnabled:                         true,
  environmentModesEnabled:                  true,
  demoLiveWorkspaceModesEnabled:            true,
  moduleWorkspaceAvailabilityEnabled:       true,
  moduleVenueAvailabilityEnabled:           true,
  moduleOrganizationAvailabilityEnabled:    true,
  dataBoundaryRecordsEnabled:               true,
  tenantHealthChecksEnabled:                true,
  workspaceReadinessRecordsEnabled:         true,
  governanceSnapshotsEnabled:               true,
  governanceAuditEnabled:                   true,
  organizationSearchEnabled:                true,
  venueSearchEnabled:                       true,
  workspaceSearchEnabled:                   true,
  scopeFilteringEnabled:                    true,
  workspaceStatusBadgesEnabled:             true,
  demoModeControlsEnabled:                  true,
  liveModePlaceholderEnabled:               true,
  noFakeTenantIsolationEnforced:            true,
  noFakeWorkspaceProvisioningEnforced:      true,
  noFakeVenueDeploymentEnforced:            true,
  noFakeLiveModeEnforced:                   true,
  noFakeProviderConnectionEnforced:         true,
  noFakeBillingConnectionEnforced:          true,
  noFakeLicenseVerificationEnforced:        true,
  noFakeDeploymentCompletionEnforced:       true,
  noSecretsStorageEnforced:                 true,
  platformAdminGuardRequired:               true,
};

export function getNoveeOSTenantFlags(overrides = {}) {
  return { ...DEFAULT_NOVEE_OS_TENANT_FLAGS, ...overrides };
}
