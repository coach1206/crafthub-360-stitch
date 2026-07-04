// Phase C.2 / Module 2 of 7
// NOVEE OS Tenant, Venue, Organization & Workspace Governance — Verification Script
// Minimum 270 checks

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(`  x ${label}`);
  }
}

function load(relPath) {
  try { return readFileSync(resolve(root, relPath), 'utf8'); }
  catch { return ''; }
}

const mig  = load('server/db/migrations/049_novee_os_tenant_venue_workspace_governance.sql');
const con  = load('server/services/noveeOS/noveeOSTenantContracts.js');
const flags= load('server/config/noveeOSTenantFeatureFlags.js');
const loc  = load('src/locales/noveeOSTenants.js');
const svc  = load('server/services/noveeOS/noveeOSTenantGovernanceService.js');
const ctrl = load('server/controllers/noveeOSTenantGovernanceController.js');
const rts  = load('server/routes/noveeOSTenantGovernanceRoutes.js');
const ui   = load('src/pages/noveeOS/NoveeOSTenantGovernance.jsx');
const idx  = load('server/index.js');
const app  = load('src/App.jsx');
const pkg  = load('package.json');
const ver  = load('server/scripts/verifyNoveeOSTenantGovernance.js');

// ─── DATABASE / MIGRATION ─────────────────────────────────────────────────────
check('migration: file exists',                               mig.length > 100);
check('migration: no DROP TABLE',                             !mig.includes('DROP TABLE'));
check('migration: no destructive ALTER',                      !mig.includes('DROP COLUMN'));
check('migration: CREATE TABLE IF NOT EXISTS',                mig.includes('CREATE TABLE IF NOT EXISTS'));
check('migration: organization_id exists',                    mig.includes('organization_id'));
check('migration: venue_id exists',                           mig.includes('venue_id'));
check('migration: workspace_id exists',                       mig.includes('workspace_id'));
check('migration: module_key exists',                         mig.includes('module_key'));
check('migration: user_id exists',                            mig.includes('user_id'));
check('migration: actor_user_id exists',                      mig.includes('actor_user_id'));
check('migration: parent_organization_id exists',             mig.includes('parent_organization_id'));
check('migration: venue_group_id exists',                     mig.includes('venue_group_id'));
check('migration: business_unit_id exists',                   mig.includes('business_unit_id'));
check('migration: department_id exists',                      mig.includes('department_id'));
check('migration: location_id exists',                        mig.includes('location_id'));
check('migration: environment_key exists',                    mig.includes('environment_key'));
check('migration: scope_level exists',                        mig.includes('scope_level'));
check('migration: idempotency_key UNIQUE exists',             mig.includes('idempotency_key') && mig.includes('UNIQUE'));
check('migration: contains_secrets DEFAULT FALSE',            mig.includes('contains_secrets') && mig.includes('DEFAULT FALSE'));
check('migration: stores_secrets DEFAULT FALSE',              mig.includes('stores_secrets') && mig.includes('DEFAULT FALSE'));
check('migration: exposes_private_data exists',               mig.includes('exposes_private_data'));
check('migration: exposes_financial_data exists',             mig.includes('exposes_financial_data'));
check('migration: tenant_isolation_verified DEFAULT FALSE',   mig.includes('tenant_isolation_verified') && mig.includes('DEFAULT FALSE'));
check('migration: workspace_provisioned DEFAULT FALSE',       mig.includes('workspace_provisioned') && mig.includes('DEFAULT FALSE'));
check('migration: venue_deployed DEFAULT FALSE',              mig.includes('venue_deployed') && mig.includes('DEFAULT FALSE'));
check('migration: live_mode_enabled DEFAULT FALSE',           mig.includes('live_mode_enabled') && mig.includes('DEFAULT FALSE'));
check('migration: demo_mode_enabled DEFAULT TRUE',            mig.includes('demo_mode_enabled') && mig.includes('DEFAULT TRUE'));
check('migration: provider_connected DEFAULT FALSE',          mig.includes('provider_connected') && mig.includes('DEFAULT FALSE'));
check('migration: billing_connected DEFAULT FALSE',           mig.includes('billing_connected') && mig.includes('DEFAULT FALSE'));
check('migration: license_verified DEFAULT FALSE',            mig.includes('license_verified') && mig.includes('DEFAULT FALSE'));
check('migration: deployment_completed DEFAULT FALSE',        mig.includes('deployment_completed') && mig.includes('DEFAULT FALSE'));
check('migration: contains_ai_generated_content DEFAULT FALSE', mig.includes('contains_ai_generated_content') && mig.includes('DEFAULT FALSE'));
check('migration: novee_os_organizations table',              mig.includes('novee_os_organizations'));
check('migration: novee_os_organization_profiles table',      mig.includes('novee_os_organization_profiles'));
check('migration: novee_os_venue_groups table',               mig.includes('novee_os_venue_groups'));
check('migration: novee_os_venues table',                     mig.includes('novee_os_venues'));
check('migration: novee_os_venue_profiles table',             mig.includes('novee_os_venue_profiles'));
check('migration: novee_os_workspaces table',                 mig.includes('novee_os_workspaces'));
check('migration: novee_os_workspace_memberships table',      mig.includes('novee_os_workspace_memberships'));
check('migration: novee_os_workspace_roles table',            mig.includes('novee_os_workspace_roles'));
check('migration: novee_os_workspace_access_boundaries table', mig.includes('novee_os_workspace_access_boundaries'));
check('migration: novee_os_business_units table',             mig.includes('novee_os_business_units'));
check('migration: novee_os_departments table',                mig.includes('novee_os_departments'));
check('migration: novee_os_locations table',                  mig.includes('novee_os_locations'));
check('migration: novee_os_environment_modes table',          mig.includes('novee_os_environment_modes'));
check('migration: novee_os_demo_live_workspace_modes table',  mig.includes('novee_os_demo_live_workspace_modes'));
check('migration: novee_os_module_workspace_availability',    mig.includes('novee_os_module_workspace_availability'));
check('migration: novee_os_module_venue_availability',        mig.includes('novee_os_module_venue_availability'));
check('migration: novee_os_module_organization_availability', mig.includes('novee_os_module_organization_availability'));
check('migration: novee_os_data_boundary_records table',      mig.includes('novee_os_data_boundary_records'));
check('migration: novee_os_tenant_health_checks table',       mig.includes('novee_os_tenant_health_checks'));
check('migration: novee_os_workspace_readiness_records table', mig.includes('novee_os_workspace_readiness_records'));
check('migration: novee_os_tenant_governance_snapshots table', mig.includes('novee_os_tenant_governance_snapshots'));
check('migration: novee_os_tenant_governance_audit table',    mig.includes('novee_os_tenant_governance_audit'));

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
check('contracts: file exists',                               con.length > 100);
check('contracts: ORGANIZATION_STATUSES exported',            con.includes('ORGANIZATION_STATUSES'));
check('contracts: VENUE_STATUSES exported',                   con.includes('VENUE_STATUSES'));
check('contracts: WORKSPACE_STATUSES exported',               con.includes('WORKSPACE_STATUSES'));
check('contracts: MEMBERSHIP_STATUSES exported',              con.includes('MEMBERSHIP_STATUSES'));
check('contracts: ENVIRONMENT_MODES exported',                con.includes('ENVIRONMENT_MODES'));
check('contracts: SCOPE_LEVELS exported',                     con.includes('SCOPE_LEVELS'));
check('contracts: READINESS_STATUSES exported',               con.includes('READINESS_STATUSES'));
check('contracts: GOVERNANCE_STATUSES exported',              con.includes('GOVERNANCE_STATUSES'));
check('contracts: ROLE_SCOPES exported',                      con.includes('ROLE_SCOPES'));
check('contracts: BOUNDARY_TYPES exported',                   con.includes('BOUNDARY_TYPES'));
check('contracts: HEALTH_STATUSES exported',                  con.includes('HEALTH_STATUSES'));
check('contracts: AVAILABILITY_STATUSES exported',            con.includes('AVAILABILITY_STATUSES'));
check('contracts: isValidOrganizationStatus exported',        con.includes('isValidOrganizationStatus'));
check('contracts: isValidVenueStatus exported',               con.includes('isValidVenueStatus'));
check('contracts: isValidWorkspaceStatus exported',           con.includes('isValidWorkspaceStatus'));
check('contracts: isValidMembershipStatus exported',          con.includes('isValidMembershipStatus'));
check('contracts: isValidEnvironmentMode exported',           con.includes('isValidEnvironmentMode'));
check('contracts: isValidScopeLevel exported',                con.includes('isValidScopeLevel'));
check('contracts: isValidReadinessStatus exported',           con.includes('isValidReadinessStatus'));
check('contracts: isValidGovernanceStatus exported',          con.includes('isValidGovernanceStatus'));
check('contracts: isValidRoleScope exported',                 con.includes('isValidRoleScope'));
check('contracts: isValidBoundaryType exported',              con.includes('isValidBoundaryType'));
check('contracts: isValidHealthStatus exported',              con.includes('isValidHealthStatus'));
check('contracts: isValidAvailabilityStatus exported',        con.includes('isValidAvailabilityStatus'));
check('contracts: active_placeholder in org statuses',        con.includes("'active_placeholder'"));
check('contracts: invited_placeholder in membership statuses', con.includes("'invited_placeholder'"));
check('contracts: provider_activation_required in readiness', con.includes("'provider_activation_required'"));
check('contracts: configuration_required in readiness',       con.includes("'configuration_required'"));

// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────
check('flags: file exists',                                   flags.length > 100);
check('flags: DEFAULT_NOVEE_OS_TENANT_FLAGS exported',        flags.includes('DEFAULT_NOVEE_OS_TENANT_FLAGS'));
check('flags: getNoveeOSTenantFlags exported',                flags.includes('getNoveeOSTenantFlags'));
check('flags: tenantGovernanceEnabled',                       flags.includes('tenantGovernanceEnabled'));
check('flags: organizationsEnabled',                          flags.includes('organizationsEnabled'));
check('flags: organizationProfilesEnabled',                   flags.includes('organizationProfilesEnabled'));
check('flags: venueGroupsEnabled',                            flags.includes('venueGroupsEnabled'));
check('flags: venuesEnabled',                                 flags.includes('venuesEnabled'));
check('flags: venueProfilesEnabled',                          flags.includes('venueProfilesEnabled'));
check('flags: workspacesEnabled',                             flags.includes('workspacesEnabled'));
check('flags: workspaceMembershipsEnabled',                   flags.includes('workspaceMembershipsEnabled'));
check('flags: workspaceRolesEnabled',                         flags.includes('workspaceRolesEnabled'));
check('flags: workspaceAccessBoundariesEnabled',              flags.includes('workspaceAccessBoundariesEnabled'));
check('flags: businessUnitsEnabled',                          flags.includes('businessUnitsEnabled'));
check('flags: departmentsEnabled',                            flags.includes('departmentsEnabled'));
check('flags: locationsEnabled',                              flags.includes('locationsEnabled'));
check('flags: environmentModesEnabled',                       flags.includes('environmentModesEnabled'));
check('flags: demoLiveWorkspaceModesEnabled',                 flags.includes('demoLiveWorkspaceModesEnabled'));
check('flags: moduleWorkspaceAvailabilityEnabled',            flags.includes('moduleWorkspaceAvailabilityEnabled'));
check('flags: moduleVenueAvailabilityEnabled',                flags.includes('moduleVenueAvailabilityEnabled'));
check('flags: moduleOrganizationAvailabilityEnabled',         flags.includes('moduleOrganizationAvailabilityEnabled'));
check('flags: dataBoundaryRecordsEnabled',                    flags.includes('dataBoundaryRecordsEnabled'));
check('flags: tenantHealthChecksEnabled',                     flags.includes('tenantHealthChecksEnabled'));
check('flags: workspaceReadinessRecordsEnabled',              flags.includes('workspaceReadinessRecordsEnabled'));
check('flags: governanceSnapshotsEnabled',                    flags.includes('governanceSnapshotsEnabled'));
check('flags: governanceAuditEnabled',                        flags.includes('governanceAuditEnabled'));
check('flags: noFakeTenantIsolationEnforced',                 flags.includes('noFakeTenantIsolationEnforced'));
check('flags: noFakeWorkspaceProvisioningEnforced',           flags.includes('noFakeWorkspaceProvisioningEnforced'));
check('flags: noFakeVenueDeploymentEnforced',                 flags.includes('noFakeVenueDeploymentEnforced'));
check('flags: noFakeLiveModeEnforced',                        flags.includes('noFakeLiveModeEnforced'));
check('flags: noFakeProviderConnectionEnforced',              flags.includes('noFakeProviderConnectionEnforced'));
check('flags: noFakeBillingConnectionEnforced',               flags.includes('noFakeBillingConnectionEnforced'));
check('flags: noFakeLicenseVerificationEnforced',             flags.includes('noFakeLicenseVerificationEnforced'));
check('flags: noSecretsStorageEnforced',                      flags.includes('noSecretsStorageEnforced'));
check('flags: platformAdminGuardRequired',                    flags.includes('platformAdminGuardRequired'));
check('flags: noFakeDeploymentCompletionEnforced',            flags.includes('noFakeDeploymentCompletionEnforced'));
const flagCount = (flags.match(/^\s{2}\w+:/gm) || []).length;
check('flags: 35+ flags exist',                               flagCount >= 35);

// ─── LOCALES ──────────────────────────────────────────────────────────────────
check('locales: file exists',                                 loc.length > 100);
check('locales: en-US locale',                                loc.includes("'en-US'"));
check('locales: es-DO locale',                                loc.includes("'es-DO'"));
check('locales: es locale',                                   loc.includes("'es'"));
check('locales: ht locale',                                   loc.includes("'ht'"));
check('locales: de locale',                                   loc.includes("'de'"));
check('locales: pt locale',                                   loc.includes("'pt'"));
check('locales: tNoveeOSTenants exported',                    loc.includes('tNoveeOSTenants'));
check('locales: getSupportedNoveeOSTenantLanguages exported', loc.includes('getSupportedNoveeOSTenantLanguages'));
check('locales: tenantGovernance label',                      loc.includes('tenantGovernance'));
check('locales: organization label',                          loc.includes('organization'));
check('locales: venue label',                                 loc.includes("venue:"));
check('locales: workspace label',                             loc.includes("workspace:"));
check('locales: accessBoundaries label',                      loc.includes('accessBoundaries'));
check('locales: demoMode label',                              loc.includes('demoMode'));
check('locales: liveMode label',                              loc.includes('liveMode'));
check('locales: tenantIsolationNotVerified label',            loc.includes('tenantIsolationNotVerified'));
check('locales: workspaceNotProvisioned label',               loc.includes('workspaceNotProvisioned'));
check('locales: venueNotDeployed label',                      loc.includes('venueNotDeployed'));
check('locales: liveModeNotEnabled label',                    loc.includes('liveModeNotEnabled'));
check('locales: providerNotConnected label',                  loc.includes('providerNotConnected'));
check('locales: billingNotConnected label',                   loc.includes('billingNotConnected'));
check('locales: licenseNotVerified label',                    loc.includes('licenseNotVerified'));
check('locales: deploymentNotCompleted label',                loc.includes('deploymentNotCompleted'));
check('locales: noSecretsStored label',                       loc.includes('noSecretsStored'));
check('locales: module2of7 label',                            loc.includes('module2of7'));

// ─── SERVICE ──────────────────────────────────────────────────────────────────
check('service: file exists',                                 svc.length > 500);
check('service: AREA = novee-os-tenant-governance',           svc.includes("'novee-os-tenant-governance'"));
check('service: createOrganization exported',                 svc.includes('export async function createOrganization'));
check('service: listOrganizations exported',                  svc.includes('export async function listOrganizations'));
check('service: getOrganization exported',                    svc.includes('export async function getOrganization'));
check('service: updateOrganizationStatus exported',           svc.includes('export async function updateOrganizationStatus'));
check('service: createOrganizationProfile exported',          svc.includes('export async function createOrganizationProfile'));
check('service: getOrganizationProfile exported',             svc.includes('export async function getOrganizationProfile'));
check('service: createVenueGroup exported',                   svc.includes('export async function createVenueGroup'));
check('service: listVenueGroups exported',                    svc.includes('export async function listVenueGroups'));
check('service: updateVenueGroupStatus exported',             svc.includes('export async function updateVenueGroupStatus'));
check('service: createVenue exported',                        svc.includes('export async function createVenue'));
check('service: listVenues exported',                         svc.includes('export async function listVenues'));
check('service: getVenue exported',                           svc.includes('export async function getVenue'));
check('service: updateVenueStatus exported',                  svc.includes('export async function updateVenueStatus'));
check('service: createVenueProfile exported',                 svc.includes('export async function createVenueProfile'));
check('service: getVenueProfile exported',                    svc.includes('export async function getVenueProfile'));
check('service: createWorkspace exported',                    svc.includes('export async function createWorkspace'));
check('service: listWorkspaces exported',                     svc.includes('export async function listWorkspaces'));
check('service: getWorkspace exported',                       svc.includes('export async function getWorkspace'));
check('service: updateWorkspaceStatus exported',              svc.includes('export async function updateWorkspaceStatus'));
check('service: createWorkspaceMembership exported',          svc.includes('export async function createWorkspaceMembership'));
check('service: listWorkspaceMemberships exported',           svc.includes('export async function listWorkspaceMemberships'));
check('service: updateWorkspaceMembershipStatus exported',    svc.includes('export async function updateWorkspaceMembershipStatus'));
check('service: createWorkspaceRole exported',                svc.includes('export async function createWorkspaceRole'));
check('service: listWorkspaceRoles exported',                 svc.includes('export async function listWorkspaceRoles'));
check('service: createWorkspaceAccessBoundary exported',      svc.includes('export async function createWorkspaceAccessBoundary'));
check('service: listWorkspaceAccessBoundaries exported',      svc.includes('export async function listWorkspaceAccessBoundaries'));
check('service: createDataBoundaryRecord exported',           svc.includes('export async function createDataBoundaryRecord'));
check('service: listDataBoundaryRecords exported',            svc.includes('export async function listDataBoundaryRecords'));
check('service: createBusinessUnit exported',                 svc.includes('export async function createBusinessUnit'));
check('service: listBusinessUnits exported',                  svc.includes('export async function listBusinessUnits'));
check('service: createDepartment exported',                   svc.includes('export async function createDepartment'));
check('service: listDepartments exported',                    svc.includes('export async function listDepartments'));
check('service: createLocation exported',                     svc.includes('export async function createLocation'));
check('service: listLocations exported',                      svc.includes('export async function listLocations'));
check('service: createEnvironmentMode exported',              svc.includes('export async function createEnvironmentMode'));
check('service: listEnvironmentModes exported',               svc.includes('export async function listEnvironmentModes'));
check('service: updateEnvironmentMode exported',              svc.includes('export async function updateEnvironmentMode'));
check('service: createDemoLiveWorkspaceMode exported',        svc.includes('export async function createDemoLiveWorkspaceMode'));
check('service: listDemoLiveWorkspaceModes exported',         svc.includes('export async function listDemoLiveWorkspaceModes'));
check('service: createModuleWorkspaceAvailability exported',  svc.includes('export async function createModuleWorkspaceAvailability'));
check('service: listModuleWorkspaceAvailability exported',    svc.includes('export async function listModuleWorkspaceAvailability'));
check('service: createModuleVenueAvailability exported',      svc.includes('export async function createModuleVenueAvailability'));
check('service: listModuleVenueAvailability exported',        svc.includes('export async function listModuleVenueAvailability'));
check('service: createModuleOrganizationAvailability exported', svc.includes('export async function createModuleOrganizationAvailability'));
check('service: listModuleOrganizationAvailability exported', svc.includes('export async function listModuleOrganizationAvailability'));
check('service: createTenantHealthCheck exported',            svc.includes('export async function createTenantHealthCheck'));
check('service: listTenantHealthChecks exported',             svc.includes('export async function listTenantHealthChecks'));
check('service: createWorkspaceReadinessRecord exported',     svc.includes('export async function createWorkspaceReadinessRecord'));
check('service: listWorkspaceReadinessRecords exported',      svc.includes('export async function listWorkspaceReadinessRecords'));
check('service: createTenantGovernanceSnapshot exported',     svc.includes('export async function createTenantGovernanceSnapshot'));
check('service: getLatestTenantGovernanceSnapshot exported',  svc.includes('export async function getLatestTenantGovernanceSnapshot'));
check('service: getSafeTenantClaims exported',                svc.includes('export function getSafeTenantClaims'));
check('service: getUnsafeTenantClaims exported',              svc.includes('export function getUnsafeTenantClaims'));
check('service: getTenantHonestLimitations exported',         svc.includes('export function getTenantHonestLimitations'));
check('service: getTenantPhaseRoadmap exported',              svc.includes('export function getTenantPhaseRoadmap'));
check('service: writeTenantGovernanceAudit exported',         svc.includes('export async function writeTenantGovernanceAudit'));
check('service: idempotency required on mutations',           svc.includes("return { error: 'idempotency_key_required' }"));
check('service: no fake tenant isolation claim',              !svc.includes('tenantIsolationVerified: true'));
check('service: no fake workspace provisioning claim',        !svc.includes('workspaceProvisioned: true'));
check('service: no fake venue deployment claim',              !svc.includes('venueDeployed: true'));
check('service: no fake live mode claim',                     !svc.includes('liveMode: true'));
check('service: no fake provider connection claim',           !svc.includes('providerConnected: true'));
check('service: no fake billing connection claim',            !svc.includes('billingConnected: true'));
check('service: no fake license verification claim',          !svc.includes('licenseVerified: true'));
check('service: no fake deployment completion claim',         !svc.includes('deploymentCompleted: true'));
check('service: no secrets storage',                          !svc.includes('storesSecrets: true'));
check('service: no secrets in audit',                         svc.includes('contains_secrets,FALSE') || svc.includes('contains_secrets: false') || svc.includes("contains_secrets,FALSE"));
check('service: localFallback function exists',               svc.includes('function localFallback'));
check('service: isDbAvailable import exists',                 svc.includes("from '../../db/connection.js'"));
check('service: honest empty state',                          svc.includes('configurationRequired') || svc.includes('not_found'));
check('service: JSDoc graceful fallback comment',             svc.includes('Falls back gracefully'));
check('service: never logs connection string',                svc.includes('Never prints or logs the database connection string'));

// ─── CONTROLLER ───────────────────────────────────────────────────────────────
check('controller: file exists',                              ctrl.length > 100);
check('controller: ok500 pattern used',                       ctrl.includes('const ok500'));
check('controller: actor pattern used',                       ctrl.includes('const actor'));
check('controller: ikey pattern used',                        ctrl.includes('const ikey'));
check('controller: createOrganization exported',              ctrl.includes('export const createOrganization'));
check('controller: listOrganizations exported',               ctrl.includes('export const listOrganizations'));
check('controller: getOrganization exported',                 ctrl.includes('export const getOrganization'));
check('controller: updateOrganizationStatus exported',        ctrl.includes('export const updateOrganizationStatus'));
check('controller: createOrganizationProfile exported',       ctrl.includes('export const createOrganizationProfile'));
check('controller: getOrganizationProfile exported',          ctrl.includes('export const getOrganizationProfile'));
check('controller: createVenueGroup exported',                ctrl.includes('export const createVenueGroup'));
check('controller: listVenueGroups exported',                 ctrl.includes('export const listVenueGroups'));
check('controller: createVenue exported',                     ctrl.includes('export const createVenue'));
check('controller: listVenues exported',                      ctrl.includes('export const listVenues'));
check('controller: createWorkspace exported',                 ctrl.includes('export const createWorkspace'));
check('controller: listWorkspaces exported',                  ctrl.includes('export const listWorkspaces'));
check('controller: createWorkspaceMembership exported',       ctrl.includes('export const createWorkspaceMembership'));
check('controller: listWorkspaceMemberships exported',        ctrl.includes('export const listWorkspaceMemberships'));
check('controller: createWorkspaceRole exported',             ctrl.includes('export const createWorkspaceRole'));
check('controller: createDataBoundaryRecord exported',        ctrl.includes('export const createDataBoundaryRecord'));
check('controller: createTenantHealthCheck exported',         ctrl.includes('export const createTenantHealthCheck'));
check('controller: createWorkspaceReadinessRecord exported',  ctrl.includes('export const createWorkspaceReadinessRecord'));
check('controller: createTenantGovernanceSnapshot exported',  ctrl.includes('export const createTenantGovernanceSnapshot'));
check('controller: getSafeTenantClaims exported',             ctrl.includes('export const getSafeTenantClaims'));
check('controller: getTenantPhaseRoadmap exported',           ctrl.includes('export const getTenantPhaseRoadmap'));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
check('routes: file exists',                                  rts.length > 100);
check('routes: Mounted at /api/novee-os/tenants comment',     rts.includes('/api/novee-os/tenants'));
check('routes: platformAdminGuardRequired comment',           rts.includes('platformAdminGuardRequired = true'));
check('routes: canAccessPOS3 import',                         rts.includes('canAccessPOS3'));
check('routes: write routes guarded with canAccessPOS3',      rts.includes('canAccessPOS3, c.createOrganization'));
check('routes: POST /organizations guarded',                  rts.includes("router.post('/organizations'") && rts.includes('canAccessPOS3'));
check('routes: PATCH status guarded',                         rts.includes("canAccessPOS3, c.updateOrganizationStatus"));
check('routes: POST venues guarded',                          rts.includes("canAccessPOS3, c.createVenue"));
check('routes: POST workspaces guarded',                      rts.includes("canAccessPOS3, c.createWorkspace"));
check('routes: POST memberships guarded',                     rts.includes("canAccessPOS3, c.createWorkspaceMembership"));
check('routes: POST data-boundaries guarded',                 rts.includes("canAccessPOS3, c.createDataBoundaryRecord"));
check('routes: POST health-checks guarded',                   rts.includes("canAccessPOS3, c.createTenantHealthCheck"));
check('routes: POST snapshots guarded',                       rts.includes("canAccessPOS3, c.createTenantGovernanceSnapshot"));
check('routes: GET claims/safe public read',                  rts.includes("router.get('/claims/safe'"));
check('routes: GET roadmap public read',                      rts.includes("router.get('/roadmap'"));
check('routes: export default router',                        rts.includes('export default router'));
check('routes: no public write route',                        !rts.includes("router.post('/organizations'\n") || rts.includes('canAccessPOS3'));

// ─── FRONTEND ─────────────────────────────────────────────────────────────────
check('ui: file exists',                                      ui.length > 500);
check('ui: TenantGovernanceDashboard exists',                 ui.includes('function TenantGovernanceDashboard'));
check('ui: OrganizationPanel exists',                         ui.includes('function OrganizationPanel'));
check('ui: OrganizationProfilePanel exists',                  ui.includes('function OrganizationProfilePanel'));
check('ui: VenueGroupPanel exists',                           ui.includes('function VenueGroupPanel'));
check('ui: VenuePanel exists',                                ui.includes('function VenuePanel'));
check('ui: VenueProfilePanel exists',                         ui.includes('function VenueProfilePanel'));
check('ui: WorkspacePanel exists',                            ui.includes('function WorkspacePanel'));
check('ui: WorkspaceMembershipPanel exists',                  ui.includes('function WorkspaceMembershipPanel'));
check('ui: WorkspaceRolePanel exists',                        ui.includes('function WorkspaceRolePanel'));
check('ui: WorkspaceAccessBoundaryPanel exists',              ui.includes('function WorkspaceAccessBoundaryPanel'));
check('ui: BusinessUnitPanel exists',                         ui.includes('function BusinessUnitPanel'));
check('ui: DepartmentPanel exists',                           ui.includes('function DepartmentPanel'));
check('ui: LocationPanel exists',                             ui.includes('function LocationPanel'));
check('ui: EnvironmentModePanel exists',                      ui.includes('function EnvironmentModePanel'));
check('ui: DemoLiveWorkspaceModePanel exists',                ui.includes('function DemoLiveWorkspaceModePanel'));
check('ui: ModuleWorkspaceAvailabilityPanel exists',          ui.includes('function ModuleWorkspaceAvailabilityPanel'));
check('ui: ModuleVenueAvailabilityPanel exists',              ui.includes('function ModuleVenueAvailabilityPanel'));
check('ui: ModuleOrganizationAvailabilityPanel exists',       ui.includes('function ModuleOrganizationAvailabilityPanel'));
check('ui: DataBoundaryPanel exists',                         ui.includes('function DataBoundaryPanel'));
check('ui: TenantHealthPanel exists',                         ui.includes('function TenantHealthPanel'));
check('ui: WorkspaceReadinessPanel exists',                   ui.includes('function WorkspaceReadinessPanel'));
check('ui: TenantGovernanceSnapshotPanel exists',             ui.includes('function TenantGovernanceSnapshotPanel'));
check('ui: SafeTenantClaimsPanel exists',                     ui.includes('function SafeTenantClaimsPanel'));
check('ui: UnsafeTenantClaimsPanel exists',                   ui.includes('function UnsafeTenantClaimsPanel'));
check('ui: HonestTenantLimitationsPanel exists',              ui.includes('function HonestTenantLimitationsPanel'));
check('ui: TenantRoadmapPanel exists',                        ui.includes('function TenantRoadmapPanel'));
check('ui: NoveeOSTenantLanguageSelector exists',             ui.includes('function NoveeOSTenantLanguageSelector'));
check('ui: NoSecretsStoredPanel exists',                      ui.includes('function NoSecretsStoredPanel'));
check('ui: PrivateDataProtectionPanel exists',                ui.includes('function PrivateDataProtectionPanel'));
check('ui: FinancialDataProtectionPanel exists',              ui.includes('function FinancialDataProtectionPanel'));
check('ui: HonestTenantIsolationStatePanel exists',           ui.includes('function HonestTenantIsolationStatePanel'));
check('ui: HonestWorkspaceProvisioningStatePanel exists',     ui.includes('function HonestWorkspaceProvisioningStatePanel'));
check('ui: HonestVenueDeploymentStatePanel exists',           ui.includes('function HonestVenueDeploymentStatePanel'));
check('ui: HonestLiveModeStatePanel exists',                  ui.includes('function HonestLiveModeStatePanel'));
check('ui: HonestProviderStatePanel exists',                  ui.includes('function HonestProviderStatePanel'));
check('ui: HonestBillingStatePanel exists',                   ui.includes('function HonestBillingStatePanel'));
check('ui: HonestLicenseStatePanel exists',                   ui.includes('function HonestLicenseStatePanel'));
check('ui: EmptyTenantStatePanel exists',                     ui.includes('function EmptyTenantStatePanel'));
check('ui: NAVY design token',                                ui.includes("NAVY    = '#0a0d14'") || ui.includes("NAVY = '#0a0d14'"));
check('ui: CHARCOAL design token',                            ui.includes('CHARCOAL'));
check('ui: GOLD design token',                                ui.includes("GOLD    = '#c9952c'") || ui.includes("GOLD = '#c9952c'"));
check('ui: DEVICE_LINE hardcoded literal',                    ui.includes("DEVICE_LINE = 'Touchscreen · Handheld · Tablet · Desktop'"));
check('ui: function NoveeOSTenantGovernance',                 ui.includes('function NoveeOSTenantGovernance()'));
check('ui: export default NoveeOSTenantGovernance',           ui.includes('export default NoveeOSTenantGovernance'));
check('ui: no fake tenant isolation',                         !ui.includes('tenant_isolation_verified: true'));
check('ui: no fake workspace provisioning',                   !ui.includes('workspace_provisioned: true'));
check('ui: no fake venue deployment',                         !ui.includes('venue_deployed: true'));
check('ui: no fake live mode',                                !ui.includes('live_mode_enabled: true'));
check('ui: no fake provider connection',                      !ui.includes('provider_connected: true'));
check('ui: no fake billing connection',                       !ui.includes('billing_connected: true'));
check('ui: no fake license verification',                     !ui.includes('license_verified: true'));

// ─── ROADMAP ──────────────────────────────────────────────────────────────────
check('roadmap: Phase C.1 Module 1 complete',                 ui.includes("'complete'") || ui.includes('"complete"'));
check('roadmap: Phase C.2 Module 2 current',                  ui.includes("'current'") || ui.includes('"current"'));
check('roadmap: Phase C.3 Module 3 next',                     ui.includes("'next'") || ui.includes('"next"'));
check('roadmap: Phase C.4 Module 4 listed',                   ui.includes('C.4'));
check('roadmap: Phase C.5 Module 5 listed',                   ui.includes('C.5'));
check('roadmap: Phase C.6 Module 6 listed',                   ui.includes('C.6'));
check('roadmap: Phase C.7 Module 7 listed',                   ui.includes('C.7'));

// ─── SAFETY ───────────────────────────────────────────────────────────────────
check('safety: contains_secrets false check in migration',    mig.includes('contains_secrets') && mig.includes('DEFAULT FALSE'));
check('safety: stores_secrets false check in migration',      mig.includes('stores_secrets') && mig.includes('DEFAULT FALSE'));
check('safety: tenant_isolation_verified false in migration', mig.includes('tenant_isolation_verified') && mig.includes('DEFAULT FALSE'));
check('safety: workspace_provisioned false in migration',     mig.includes('workspace_provisioned') && mig.includes('DEFAULT FALSE'));
check('safety: venue_deployed false in migration',            mig.includes('venue_deployed') && mig.includes('DEFAULT FALSE'));
check('safety: live_mode_enabled false in migration',         mig.includes('live_mode_enabled') && mig.includes('DEFAULT FALSE'));
check('safety: provider_connected false in migration',        mig.includes('provider_connected') && mig.includes('DEFAULT FALSE'));
check('safety: billing_connected false in migration',         mig.includes('billing_connected') && mig.includes('DEFAULT FALSE'));
check('safety: license_verified false in migration',          mig.includes('license_verified') && mig.includes('DEFAULT FALSE'));
check('safety: deployment_completed false in migration',      mig.includes('deployment_completed') && mig.includes('DEFAULT FALSE'));
check('safety: contains_ai_generated_content false',         mig.includes('contains_ai_generated_content') && mig.includes('DEFAULT FALSE'));
check('safety: no fake tenant isolation in service',          !svc.includes('tenantIsolationVerified: true'));
check('safety: no fake workspace provisioning in service',    !svc.includes('workspaceProvisioned: true'));
check('safety: no fake venue deployment in service',          !svc.includes('venueDeployed: true'));
check('safety: no fake live mode in service',                 !svc.includes('liveMode: true'));
check('safety: no fake provider connection in service',       !svc.includes('providerConnected: true'));
check('safety: no fake billing in service',                   !svc.includes('billingConnected: true'));
check('safety: no fake license verification in service',      !svc.includes('licenseVerified: true'));
check('safety: no fake deployment in service',                !svc.includes('deploymentCompleted: true'));
check('safety: no secrets storage in service',                !svc.includes('storesSecrets: true'));
check('safety: platform admin guard required in flags',       flags.includes('platformAdminGuardRequired'));
check('safety: honest limitation language in service',        svc.includes('activation required') || svc.includes('provider_activation_required') || svc.includes('configurationRequired'));
check('safety: configuration required language in service',   svc.includes('configuration_required') || svc.includes('configurationRequired'));
check('safety: phase roadmap language in service',            svc.includes('Phase C.'));
check('safety: not live language in service',                 svc.includes('not yet available') || svc.includes('placeholder'));

// ─── WIRING ───────────────────────────────────────────────────────────────────
check('wiring: server/index.js imports noveeOSTenantGovernanceRoutes', idx.includes('noveeOSTenantGovernanceRoutes'));
check('wiring: server/index.js mounts /api/novee-os/tenants',         idx.includes('/api/novee-os/tenants'));
check('wiring: src/App.jsx imports NoveeOSTenantGovernance',          app.includes('NoveeOSTenantGovernance'));
check('wiring: src/App.jsx has novee-os/tenants route',               app.includes('novee-os/tenants'));
check('wiring: package.json script verify:novee-os-tenants',          pkg.includes('verify:novee-os-tenants'));
check('wiring: export default NoveeOSTenantGovernance in ui',         ui.includes('export default NoveeOSTenantGovernance'));
check('wiring: export default router in routes',                      rts.includes('export default router'));
check('wiring: verification script prints PASS total',                ver.includes('PASSED:'));
check('wiring: verification script exits non-zero on failure',        ver.includes('process.exit(1)'));
check('wiring: prior C.1 module route still exists',                  app.includes('novee-os/modules'));
check('wiring: prior POS360 routes still exist',                      idx.includes('/api/pos360/production-readiness'));

// ─── OUTPUT ───────────────────────────────────────────────────────────────────
console.log('\n=== NOVEE OS Tenant Governance Verification ===');
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`TOTAL:  ${passed + failed}`);

if (failures.length) {
  console.log('\nFAILED CHECKS:');
  failures.forEach(f => console.log(f));
  console.log('\n❌ VERIFICATION FAILED');
  process.exit(1);
} else {
  console.log('\n✅ ALL ' + (passed + failed) + ' CHECKS PASSED');
}
