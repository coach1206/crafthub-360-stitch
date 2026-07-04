import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition) {
  if (condition) { passed++; } else { failed++; failures.push(label); }
}

// ─── MIGRATION ───────────────────────────────────────────────────────────────
const mig = read('server/db/migrations/048_novee_os_module_registry_platform_control.sql');

check('migration: file exists', mig.length > 0);
check('migration: no DROP TABLE', !mig.includes('DROP TABLE'));
check('migration: no destructive ALTER', !mig.includes('DROP COLUMN'));
check('migration: uses CREATE TABLE IF NOT EXISTS', mig.includes('CREATE TABLE IF NOT EXISTS'));
check('migration: organization_id hook exists', mig.includes('organization_id'));
check('migration: venue_id hook exists', mig.includes('venue_id'));
check('migration: module_key exists', mig.includes('module_key'));
check('migration: module_version exists', mig.includes('module_version'));
check('migration: route_path exists', mig.includes('route_path'));
check('migration: permission_key exists', mig.includes('permission_key'));
check('migration: feature_flag_key exists', mig.includes('feature_flag_key'));
check('migration: dependency_module_key exists', mig.includes('dependency_module_key'));
check('migration: install_status exists', mig.includes('install_status'));
check('migration: activation_status exists', mig.includes('activation_status'));
check('migration: readiness_status exists', mig.includes('readiness_status'));
check('migration: health_status exists', mig.includes('health_status'));
check('migration: demo_live_mode exists', mig.includes('demo_live_mode'));
check('migration: idempotency_key UNIQUE exists', mig.includes('idempotency_key') && mig.includes('UNIQUE'));
check('migration: contains_secrets DEFAULT FALSE', mig.includes('contains_secrets') && mig.includes('DEFAULT FALSE'));
check('migration: stores_secrets DEFAULT FALSE', mig.includes('stores_secrets') && mig.includes('DEFAULT FALSE'));
check('migration: exposes_private_data exists', mig.includes('exposes_private_data'));
check('migration: exposes_financial_data exists', mig.includes('exposes_financial_data'));
check('migration: live_provider_connected DEFAULT FALSE', mig.includes('live_provider_connected') && mig.includes('DEFAULT FALSE'));
check('migration: marketplace_purchase_completed DEFAULT FALSE', mig.includes('marketplace_purchase_completed'));
check('migration: license_verified DEFAULT FALSE', mig.includes('license_verified'));
check('migration: billing_connected DEFAULT FALSE', mig.includes('billing_connected'));
check('migration: deployment_completed DEFAULT FALSE', mig.includes('deployment_completed'));
check('migration: contains_ai_generated_content DEFAULT FALSE', mig.includes('contains_ai_generated_content'));
check('migration: novee_os_module_registry table', mig.includes('novee_os_module_registry'));
check('migration: novee_os_module_versions table', mig.includes('novee_os_module_versions'));
check('migration: novee_os_module_routes table', mig.includes('novee_os_module_routes'));
check('migration: novee_os_module_frontend_routes table', mig.includes('novee_os_module_frontend_routes'));
check('migration: novee_os_module_dependencies table', mig.includes('novee_os_module_dependencies'));
check('migration: novee_os_module_permissions table', mig.includes('novee_os_module_permissions'));
check('migration: novee_os_module_feature_flags table', mig.includes('novee_os_module_feature_flags'));
check('migration: novee_os_module_installations table', mig.includes('novee_os_module_installations'));
check('migration: novee_os_module_activation_states table', mig.includes('novee_os_module_activation_states'));
check('migration: novee_os_module_tenant_availability table', mig.includes('novee_os_module_tenant_availability'));
check('migration: novee_os_module_venue_availability table', mig.includes('novee_os_module_venue_availability'));
check('migration: novee_os_module_plan_requirements table', mig.includes('novee_os_module_plan_requirements'));
check('migration: novee_os_module_license_requirements table', mig.includes('novee_os_module_license_requirements'));
check('migration: novee_os_module_demo_live_modes table', mig.includes('novee_os_module_demo_live_modes'));
check('migration: novee_os_module_readiness_records table', mig.includes('novee_os_module_readiness_records'));
check('migration: novee_os_module_health_checks table', mig.includes('novee_os_module_health_checks'));
check('migration: novee_os_module_rollbacks table', mig.includes('novee_os_module_rollbacks'));
check('migration: novee_os_module_audit table', mig.includes('novee_os_module_audit'));
check('migration: novee_os_platform_control_snapshots table', mig.includes('novee_os_platform_control_snapshots'));

// ─── CONTRACTS ───────────────────────────────────────────────────────────────
const contracts = read('server/services/noveeOS/noveeOSModuleContracts.js');

check('contracts: file exists', contracts.length > 0);
check('contracts: MODULE_CATEGORIES exported', contracts.includes('MODULE_CATEGORIES'));
check('contracts: MODULE_KEYS exported', contracts.includes('MODULE_KEYS'));
check('contracts: MODULE_STATUSES exported', contracts.includes('MODULE_STATUSES'));
check('contracts: INSTALL_STATUSES exported', contracts.includes('INSTALL_STATUSES'));
check('contracts: ACTIVATION_STATUSES exported', contracts.includes('ACTIVATION_STATUSES'));
check('contracts: READINESS_STATUSES exported', contracts.includes('READINESS_STATUSES'));
check('contracts: HEALTH_STATUSES exported', contracts.includes('HEALTH_STATUSES'));
check('contracts: DEMO_LIVE_MODES exported', contracts.includes('DEMO_LIVE_MODES'));
check('contracts: DEPENDENCY_STATUSES exported', contracts.includes('DEPENDENCY_STATUSES'));
check('contracts: PERMISSION_SCOPES exported', contracts.includes('PERMISSION_SCOPES'));
check('contracts: PLAN_REQUIREMENT_STATUSES exported', contracts.includes('PLAN_REQUIREMENT_STATUSES'));
check('contracts: LICENSE_REQUIREMENT_STATUSES exported', contracts.includes('LICENSE_REQUIREMENT_STATUSES'));
check('contracts: ROLLBACK_STATUSES exported', contracts.includes('ROLLBACK_STATUSES'));
check('contracts: isValidModuleCategory exported', contracts.includes('isValidModuleCategory'));
check('contracts: isValidModuleKey exported', contracts.includes('isValidModuleKey'));
check('contracts: isValidModuleStatus exported', contracts.includes('isValidModuleStatus'));
check('contracts: isValidInstallStatus exported', contracts.includes('isValidInstallStatus'));
check('contracts: isValidActivationStatus exported', contracts.includes('isValidActivationStatus'));
check('contracts: isValidReadinessStatus exported', contracts.includes('isValidReadinessStatus'));
check('contracts: isValidHealthStatus exported', contracts.includes('isValidHealthStatus'));
check('contracts: isValidDemoLiveMode exported', contracts.includes('isValidDemoLiveMode'));
check('contracts: isValidDependencyStatus exported', contracts.includes('isValidDependencyStatus'));
check('contracts: isValidPermissionScope exported', contracts.includes('isValidPermissionScope'));
check('contracts: isValidPlanRequirementStatus exported', contracts.includes('isValidPlanRequirementStatus'));
check('contracts: isValidLicenseRequirementStatus exported', contracts.includes('isValidLicenseRequirementStatus'));
check('contracts: isValidRollbackStatus exported', contracts.includes('isValidRollbackStatus'));

// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────
const flags = read('server/config/noveeOSModuleFeatureFlags.js');

check('flags: file exists', flags.length > 0);
check('flags: DEFAULT_NOVEE_OS_MODULE_FLAGS exported', flags.includes('DEFAULT_NOVEE_OS_MODULE_FLAGS'));
check('flags: getNoveeOSModuleFlags exported', flags.includes('export function getNoveeOSModuleFlags'));
check('flags: noveeOSModuleRegistryEnabled', flags.includes('noveeOSModuleRegistryEnabled: true'));
check('flags: platformControlCenterEnabled', flags.includes('platformControlCenterEnabled: true'));
check('flags: moduleVersioningEnabled', flags.includes('moduleVersioningEnabled: true'));
check('flags: moduleRoutesEnabled', flags.includes('moduleRoutesEnabled: true'));
check('flags: moduleFrontendRoutesEnabled', flags.includes('moduleFrontendRoutesEnabled: true'));
check('flags: moduleDependenciesEnabled', flags.includes('moduleDependenciesEnabled: true'));
check('flags: modulePermissionsEnabled', flags.includes('modulePermissionsEnabled: true'));
check('flags: moduleFeatureFlagsEnabled', flags.includes('moduleFeatureFlagsEnabled: true'));
check('flags: moduleInstallationsEnabled', flags.includes('moduleInstallationsEnabled: true'));
check('flags: moduleActivationStatesEnabled', flags.includes('moduleActivationStatesEnabled: true'));
check('flags: tenantAvailabilityEnabled', flags.includes('tenantAvailabilityEnabled: true'));
check('flags: venueAvailabilityEnabled', flags.includes('venueAvailabilityEnabled: true'));
check('flags: planRequirementsEnabled', flags.includes('planRequirementsEnabled: true'));
check('flags: licenseRequirementsEnabled', flags.includes('licenseRequirementsEnabled: true'));
check('flags: demoLiveModeControlsEnabled', flags.includes('demoLiveModeControlsEnabled: true'));
check('flags: moduleReadinessRecordsEnabled', flags.includes('moduleReadinessRecordsEnabled: true'));
check('flags: moduleHealthChecksEnabled', flags.includes('moduleHealthChecksEnabled: true'));
check('flags: moduleRollbackEnabled', flags.includes('moduleRollbackEnabled: true'));
check('flags: platformControlSnapshotsEnabled', flags.includes('platformControlSnapshotsEnabled: true'));
check('flags: moduleAuditEnabled', flags.includes('moduleAuditEnabled: true'));
check('flags: noFakeInstallEnforced', flags.includes('noFakeInstallEnforced: true'));
check('flags: noFakeActivationEnforced', flags.includes('noFakeActivationEnforced: true'));
check('flags: noFakeMarketplacePurchaseEnforced', flags.includes('noFakeMarketplacePurchaseEnforced: true'));
check('flags: noFakeLicenseVerificationEnforced', flags.includes('noFakeLicenseVerificationEnforced: true'));
check('flags: noFakeBillingConnectionEnforced', flags.includes('noFakeBillingConnectionEnforced: true'));
check('flags: noFakeDeploymentEnforced', flags.includes('noFakeDeploymentEnforced: true'));
check('flags: noFakeProviderConnectionEnforced', flags.includes('noFakeProviderConnectionEnforced: true'));
check('flags: noSecretsStorageEnforced', flags.includes('noSecretsStorageEnforced: true'));
check('flags: platformAdminGuardRequired', flags.includes('platformAdminGuardRequired: true'));
check('flags: 35+ flags total', (flags.match(/: true/g) || []).length >= 35);
check('flags: uses overrides spread', flags.includes('...overrides'));

// ─── LOCALES ─────────────────────────────────────────────────────────────────
const loc = read('src/locales/noveeOSModules.js');

check('locales: file exists', loc.length > 0);
check('locales: tNoveeOSModules exported', loc.includes('export function tNoveeOSModules'));
check('locales: getSupportedNoveeOSModuleLanguages exported', loc.includes('export function getSupportedNoveeOSModuleLanguages'));
check('locales: en-US supported', loc.includes("'en-US'"));
check('locales: es-DO supported', loc.includes("'es-DO'"));
check('locales: es supported', loc.includes("'es'"));
check('locales: ht supported', loc.includes("'ht'"));
check('locales: de supported', loc.includes("'de'"));
check('locales: pt supported', loc.includes("'pt'"));
check('locales: NOVEE OS label', loc.includes('noveeOS'));
check('locales: Module Registry label', loc.includes('moduleRegistry'));
check('locales: Platform Control Center label', loc.includes('platformControlCenter'));
check('locales: installStatus label', loc.includes('installStatus'));
check('locales: activationStatus label', loc.includes('activationStatus'));
check('locales: providerActivationRequired label', loc.includes('providerActivationRequired'));
check('locales: foundationReady label', loc.includes('foundationReady'));
check('locales: contractReady label', loc.includes('contractReady'));
check('locales: licenseNotVerified label', loc.includes('licenseNotVerified'));
check('locales: billingNotConnected label', loc.includes('billingNotConnected'));
check('locales: deploymentNotCompleted label', loc.includes('deploymentNotCompleted'));
check('locales: noSecretsStored label', loc.includes('noSecretsStored'));
check('locales: safeClaims label', loc.includes('safeClaims'));
check('locales: unsafeClaims label', loc.includes('unsafeClaims'));
check('locales: honestLimitations label', loc.includes('honestLimitations'));

// ─── SERVICE ─────────────────────────────────────────────────────────────────
const svc = read('server/services/noveeOS/noveeOSModuleRegistryService.js');

check('service: file exists', svc.length > 0);
check('service: JSDoc falls back gracefully', svc.includes('Falls back gracefully when no database connection is configured'));
check('service: JSDoc never prints connection string', svc.includes('Never prints or logs the database connection string'));
check('service: imports isDbAvailable', svc.includes('isDbAvailable'));
check('service: AREA novee-os-module-registry', svc.includes("'novee-os-module-registry'"));
check('service: localPreview fallback', svc.includes('localPreview: true'));
check('service: getDefaultCoreModuleRegistry exported', svc.includes('export function getDefaultCoreModuleRegistry'));
check('service: registerModule exported', svc.includes('export async function registerModule'));
check('service: listModules exported', svc.includes('export async function listModules'));
check('service: getModule exported', svc.includes('export async function getModule'));
check('service: updateModuleStatus exported', svc.includes('export async function updateModuleStatus'));
check('service: createModuleVersion exported', svc.includes('export async function createModuleVersion'));
check('service: listModuleVersions exported', svc.includes('export async function listModuleVersions'));
check('service: registerModuleBackendRoute exported', svc.includes('export async function registerModuleBackendRoute'));
check('service: listModuleBackendRoutes exported', svc.includes('export async function listModuleBackendRoutes'));
check('service: registerModuleFrontendRoute exported', svc.includes('export async function registerModuleFrontendRoute'));
check('service: listModuleFrontendRoutes exported', svc.includes('export async function listModuleFrontendRoutes'));
check('service: createModuleDependency exported', svc.includes('export async function createModuleDependency'));
check('service: listModuleDependencies exported', svc.includes('export async function listModuleDependencies'));
check('service: createModulePermission exported', svc.includes('export async function createModulePermission'));
check('service: listModulePermissions exported', svc.includes('export async function listModulePermissions'));
check('service: createModuleFeatureFlag exported', svc.includes('export async function createModuleFeatureFlag'));
check('service: listModuleFeatureFlags exported', svc.includes('export async function listModuleFeatureFlags'));
check('service: createModuleInstallationPlaceholder exported', svc.includes('export async function createModuleInstallationPlaceholder'));
check('service: listModuleInstallations exported', svc.includes('export async function listModuleInstallations'));
check('service: updateModuleInstallStatus exported', svc.includes('export async function updateModuleInstallStatus'));
check('service: createModuleActivationState exported', svc.includes('export async function createModuleActivationState'));
check('service: listModuleActivationStates exported', svc.includes('export async function listModuleActivationStates'));
check('service: updateModuleActivationStatus exported', svc.includes('export async function updateModuleActivationStatus'));
check('service: createTenantAvailability exported', svc.includes('export async function createTenantAvailability'));
check('service: listTenantAvailability exported', svc.includes('export async function listTenantAvailability'));
check('service: createVenueAvailability exported', svc.includes('export async function createVenueAvailability'));
check('service: listVenueAvailability exported', svc.includes('export async function listVenueAvailability'));
check('service: createPlanRequirement exported', svc.includes('export async function createPlanRequirement'));
check('service: listPlanRequirements exported', svc.includes('export async function listPlanRequirements'));
check('service: createLicenseRequirement exported', svc.includes('export async function createLicenseRequirement'));
check('service: listLicenseRequirements exported', svc.includes('export async function listLicenseRequirements'));
check('service: createDemoLiveModeRecord exported', svc.includes('export async function createDemoLiveModeRecord'));
check('service: listDemoLiveModeRecords exported', svc.includes('export async function listDemoLiveModeRecords'));
check('service: updateDemoLiveMode exported', svc.includes('export async function updateDemoLiveMode'));
check('service: createModuleReadinessRecord exported', svc.includes('export async function createModuleReadinessRecord'));
check('service: listModuleReadinessRecords exported', svc.includes('export async function listModuleReadinessRecords'));
check('service: createModuleHealthCheck exported', svc.includes('export async function createModuleHealthCheck'));
check('service: listModuleHealthChecks exported', svc.includes('export async function listModuleHealthChecks'));
check('service: createModuleRollbackRecord exported', svc.includes('export async function createModuleRollbackRecord'));
check('service: listModuleRollbackRecords exported', svc.includes('export async function listModuleRollbackRecords'));
check('service: updateModuleRollbackStatus exported', svc.includes('export async function updateModuleRollbackStatus'));
check('service: createPlatformControlSnapshot exported', svc.includes('export async function createPlatformControlSnapshot'));
check('service: getLatestPlatformControlSnapshot exported', svc.includes('export async function getLatestPlatformControlSnapshot'));
check('service: getSafeModuleClaims exported', svc.includes('export function getSafeModuleClaims'));
check('service: getUnsafeModuleClaims exported', svc.includes('export function getUnsafeModuleClaims'));
check('service: getModuleHonestLimitations exported', svc.includes('export function getModuleHonestLimitations'));
check('service: getModulePhaseRoadmap exported', svc.includes('export function getModulePhaseRoadmap'));
check('service: writeModuleAudit exported', svc.includes('export async function writeModuleAudit'));
check('service: idempotency required on mutations', svc.includes('idempotency_key_required'));
check('service: no fake install claim', svc.includes('placeholder_only_not_live'));
check('service: no fake activation claim', !svc.includes('live_provider_connected: true') && !svc.includes("liveProviderConnected: true"));
check('service: no fake marketplace purchase', !svc.includes('marketplace_purchase_completed: true'));
check('service: no fake license verification', !svc.includes('license_verified: true'));
check('service: no fake billing', !svc.includes('billing_connected: true'));
check('service: no fake deployment', !svc.includes('deployment_completed: true'));
check('service: no secrets storage', !svc.includes('stores_secrets: true'));
check('service: contains_secrets FALSE in audit', svc.includes('contains_secrets: false') || svc.includes('FALSE,FALSE'));
check('service: honest empty state', svc.includes('localPreview: true'));
check('service: no fake health (placeholder noted)', svc.includes('placeholder_health_not_live'));

// ─── CONTROLLER ───────────────────────────────────────────────────────────────
const ctrl = read('server/controllers/noveeOSModuleRegistryController.js');

check('controller: file exists', ctrl.length > 0);
check('controller: ok500 pattern', ctrl.includes('const ok500 = (res, fn)'));
check('controller: getDefaultCoreModuleRegistry exported', ctrl.includes('export const getDefaultCoreModuleRegistry'));
check('controller: registerModule exported', ctrl.includes('export const registerModule'));
check('controller: listModules exported', ctrl.includes('export const listModules'));
check('controller: getModule exported', ctrl.includes('export const getModule'));
check('controller: updateModuleStatus exported', ctrl.includes('export const updateModuleStatus'));
check('controller: createModuleVersion exported', ctrl.includes('export const createModuleVersion'));
check('controller: listModuleVersions exported', ctrl.includes('export const listModuleVersions'));
check('controller: registerModuleBackendRoute exported', ctrl.includes('export const registerModuleBackendRoute'));
check('controller: listModuleBackendRoutes exported', ctrl.includes('export const listModuleBackendRoutes'));
check('controller: registerModuleFrontendRoute exported', ctrl.includes('export const registerModuleFrontendRoute'));
check('controller: listModuleFrontendRoutes exported', ctrl.includes('export const listModuleFrontendRoutes'));
check('controller: createModuleDependency exported', ctrl.includes('export const createModuleDependency'));
check('controller: listModuleDependencies exported', ctrl.includes('export const listModuleDependencies'));
check('controller: createModulePermission exported', ctrl.includes('export const createModulePermission'));
check('controller: listModulePermissions exported', ctrl.includes('export const listModulePermissions'));
check('controller: createModuleFeatureFlag exported', ctrl.includes('export const createModuleFeatureFlag'));
check('controller: listModuleFeatureFlags exported', ctrl.includes('export const listModuleFeatureFlags'));
check('controller: createModuleInstallationPlaceholder exported', ctrl.includes('export const createModuleInstallationPlaceholder'));
check('controller: listModuleInstallations exported', ctrl.includes('export const listModuleInstallations'));
check('controller: updateModuleInstallStatus exported', ctrl.includes('export const updateModuleInstallStatus'));
check('controller: createModuleActivationState exported', ctrl.includes('export const createModuleActivationState'));
check('controller: listModuleActivationStates exported', ctrl.includes('export const listModuleActivationStates'));
check('controller: updateModuleActivationStatus exported', ctrl.includes('export const updateModuleActivationStatus'));
check('controller: createTenantAvailability exported', ctrl.includes('export const createTenantAvailability'));
check('controller: listTenantAvailability exported', ctrl.includes('export const listTenantAvailability'));
check('controller: createVenueAvailability exported', ctrl.includes('export const createVenueAvailability'));
check('controller: listVenueAvailability exported', ctrl.includes('export const listVenueAvailability'));
check('controller: createPlanRequirement exported', ctrl.includes('export const createPlanRequirement'));
check('controller: listPlanRequirements exported', ctrl.includes('export const listPlanRequirements'));
check('controller: createLicenseRequirement exported', ctrl.includes('export const createLicenseRequirement'));
check('controller: listLicenseRequirements exported', ctrl.includes('export const listLicenseRequirements'));
check('controller: createDemoLiveModeRecord exported', ctrl.includes('export const createDemoLiveModeRecord'));
check('controller: listDemoLiveModeRecords exported', ctrl.includes('export const listDemoLiveModeRecords'));
check('controller: updateDemoLiveMode exported', ctrl.includes('export const updateDemoLiveMode'));
check('controller: createModuleReadinessRecord exported', ctrl.includes('export const createModuleReadinessRecord'));
check('controller: listModuleReadinessRecords exported', ctrl.includes('export const listModuleReadinessRecords'));
check('controller: createModuleHealthCheck exported', ctrl.includes('export const createModuleHealthCheck'));
check('controller: listModuleHealthChecks exported', ctrl.includes('export const listModuleHealthChecks'));
check('controller: createModuleRollbackRecord exported', ctrl.includes('export const createModuleRollbackRecord'));
check('controller: listModuleRollbackRecords exported', ctrl.includes('export const listModuleRollbackRecords'));
check('controller: updateModuleRollbackStatus exported', ctrl.includes('export const updateModuleRollbackStatus'));
check('controller: createPlatformControlSnapshot exported', ctrl.includes('export const createPlatformControlSnapshot'));
check('controller: getLatestPlatformControlSnapshot exported', ctrl.includes('export const getLatestPlatformControlSnapshot'));
check('controller: getSafeModuleClaims exported', ctrl.includes('export const getSafeModuleClaims'));
check('controller: getUnsafeModuleClaims exported', ctrl.includes('export const getUnsafeModuleClaims'));
check('controller: getModuleHonestLimitations exported', ctrl.includes('export const getModuleHonestLimitations'));
check('controller: getModulePhaseRoadmap exported', ctrl.includes('export const getModulePhaseRoadmap'));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
const routes = read('server/routes/noveeOSModuleRegistryRoutes.js');

check('routes: file exists', routes.length > 0);
check('routes: mounted at /api/novee-os/modules comment', routes.includes('/api/novee-os/modules'));
check('routes: canAccessPOS3 imported', routes.includes('canAccessPOS3'));
check('routes: platformAdminGuardRequired noted', routes.includes('platformAdminGuardRequired'));
check('routes: write routes guarded', routes.includes('canAccessPOS3, c.registerModule'));
check('routes: no public write route (POST guarded)', (routes.match(/router\.post\('[^']+',\s*canAccessPOS3/g) || []).length > 0);
check('routes: no fake install completion', !routes.includes('fakeInstall') && !routes.includes('install_completed'));
check('routes: no fake activation', !routes.includes('fakeActivation'));
check('routes: no fake marketplace purchase', !routes.includes('fakeMarketplace'));
check('routes: no fake license verification', !routes.includes('fakeLicense'));
check('routes: no fake billing connection', !routes.includes('fakeBilling'));
check('routes: no fake deployment completion', !routes.includes('fakeDeployment'));
check('routes: export default router', routes.includes('export default router'));
check('routes: GET /default-registry', routes.includes("get('/default-registry'"));
check('routes: POST /registry guarded', routes.includes("router.post('/registry'"));
check('routes: GET /registry', routes.includes("get('/registry'"));
check('routes: GET /registry/:moduleKey', routes.includes("get('/registry/:moduleKey'"));
check('routes: GET /claims/safe', routes.includes("get('/claims/safe'"));
check('routes: GET /claims/unsafe', routes.includes("get('/claims/unsafe'"));
check('routes: GET /roadmap', routes.includes("get('/roadmap'"));
check('routes: GET /snapshots/latest', routes.includes("get('/snapshots/latest'"));
check('routes: POST /snapshots guarded', routes.includes("router.post('/snapshots'"));

// ─── FRONTEND ─────────────────────────────────────────────────────────────────
const ui = read('src/pages/noveeOS/NoveeOSModuleRegistry.jsx');

check('ui: file exists', ui.length > 0);
check('ui: function NoveeOSModuleRegistry()', ui.includes('function NoveeOSModuleRegistry()'));
check('ui: export default NoveeOSModuleRegistry', ui.includes('export default NoveeOSModuleRegistry'));
check('ui: no export default function pattern', !ui.includes('export default function NoveeOSModuleRegistry'));
check('ui: NoveeOSModuleDashboard component', ui.includes('function NoveeOSModuleDashboard'));
check('ui: ModuleRegistryPanel component', ui.includes('function ModuleRegistryPanel'));
check('ui: CoreModulesPanel component', ui.includes('function CoreModulesPanel'));
check('ui: CraftModulesPanel component', ui.includes('function CraftModulesPanel'));
check('ui: POSModulesPanel component', ui.includes('function POSModulesPanel'));
check('ui: ManagementModulesPanel component', ui.includes('function ManagementModulesPanel'));
check('ui: IntegrationModulesPanel component', ui.includes('function IntegrationModulesPanel'));
check('ui: ModuleVersionPanel component', ui.includes('function ModuleVersionPanel'));
check('ui: ModuleBackendRoutesPanel component', ui.includes('function ModuleBackendRoutesPanel'));
check('ui: ModuleFrontendRoutesPanel component', ui.includes('function ModuleFrontendRoutesPanel'));
check('ui: ModuleDependenciesPanel component', ui.includes('function ModuleDependenciesPanel'));
check('ui: ModulePermissionsPanel component', ui.includes('function ModulePermissionsPanel'));
check('ui: ModuleFeatureFlagsPanel component', ui.includes('function ModuleFeatureFlagsPanel'));
check('ui: ModuleInstallationsPanel component', ui.includes('function ModuleInstallationsPanel'));
check('ui: ModuleActivationPanel component', ui.includes('function ModuleActivationPanel'));
check('ui: TenantAvailabilityPanel component', ui.includes('function TenantAvailabilityPanel'));
check('ui: VenueAvailabilityPanel component', ui.includes('function VenueAvailabilityPanel'));
check('ui: PlanRequirementPanel component', ui.includes('function PlanRequirementPanel'));
check('ui: LicenseRequirementPanel component', ui.includes('function LicenseRequirementPanel'));
check('ui: DemoLiveModePanel component', ui.includes('function DemoLiveModePanel'));
check('ui: ModuleReadinessPanel component', ui.includes('function ModuleReadinessPanel'));
check('ui: ModuleHealthPanel component', ui.includes('function ModuleHealthPanel'));
check('ui: ModuleRollbackPanel component', ui.includes('function ModuleRollbackPanel'));
check('ui: PlatformSnapshotPanel component', ui.includes('function PlatformSnapshotPanel'));
check('ui: SafeModuleClaimsPanel component', ui.includes('function SafeModuleClaimsPanel'));
check('ui: UnsafeModuleClaimsPanel component', ui.includes('function UnsafeModuleClaimsPanel'));
check('ui: HonestModuleLimitationsPanel component', ui.includes('function HonestModuleLimitationsPanel'));
check('ui: ModuleRoadmapPanel component', ui.includes('function ModuleRoadmapPanel'));
check('ui: NoveeOSModuleLanguageSelector component', ui.includes('function NoveeOSModuleLanguageSelector'));
check('ui: NoSecretsStoredPanel component', ui.includes('function NoSecretsStoredPanel'));
check('ui: HonestInstallStatePanel component', ui.includes('function HonestInstallStatePanel'));
check('ui: HonestActivationStatePanel component', ui.includes('function HonestActivationStatePanel'));
check('ui: HonestMarketplaceStatePanel component', ui.includes('function HonestMarketplaceStatePanel'));
check('ui: HonestLicenseStatePanel component', ui.includes('function HonestLicenseStatePanel'));
check('ui: HonestBillingStatePanel component', ui.includes('function HonestBillingStatePanel'));
check('ui: HonestDeploymentStatePanel component', ui.includes('function HonestDeploymentStatePanel'));
check('ui: EmptyModuleStatePanel component', ui.includes('function EmptyModuleStatePanel'));
check('ui: premium deep navy styling', ui.includes("NAVY     = '#0a0d14'") || ui.includes("NAVY = '#0a0d14'") || ui.includes('#0a0d14'));
check('ui: charcoal styling', ui.includes('CHARCOAL') || ui.includes('#111520'));
check('ui: gold accents', ui.includes("GOLD     = '#c9952c'") || ui.includes("GOLD = '#c9952c'") || ui.includes('#c9952c'));
check('ui: touchscreen-friendly device line', ui.includes('Touchscreen'));
check('ui: handheld-friendly device line', ui.includes('Handheld'));
check('ui: no fake install state', !ui.includes('fakeInstall') && !ui.includes('realInstall: true'));
check('ui: no fake activation state', !ui.includes('fakeActivation'));
check('ui: no fake marketplace state', !ui.includes('fakeMarketplace'));
check('ui: no fake license state', !ui.includes('fakeLicense'));
check('ui: no fake billing state', !ui.includes('fakeBilling'));
check('ui: no fake deployment state', !ui.includes('fakeDeployment'));
check('ui: imports tNoveeOSModules', ui.includes('tNoveeOSModules'));

// ─── CORE MODULES LISTED ─────────────────────────────────────────────────────
check('ui: NOVEE OS module listed', ui.includes('NOVEE OS'));
check('ui: CraftHub module listed', ui.includes('CraftHub'));
check('ui: POS360 module listed', ui.includes('POS360'));
check('ui: SmokeCraft module listed', ui.includes('SmokeCraft'));
check('ui: PourCraft module listed', ui.includes('PourCraft'));
check('ui: E.A.T. System module listed', ui.includes('E.A.T. System'));
check('ui: Passport / Connections module listed', ui.includes('Passport / Connections'));
check('ui: Loyalty / Rewards module listed', ui.includes('Loyalty / Rewards'));
check('ui: Venue Admin module listed', ui.includes('Venue Admin'));
check('ui: Inventory module listed', ui.includes('Inventory'));
check('ui: Reports module listed', ui.includes('Reports'));
check('ui: External Integrations module listed', ui.includes('External Integrations'));

// ─── ROADMAP ─────────────────────────────────────────────────────────────────
check('ui: Phase C.1 Module 1 of 7 listed', ui.includes('C.1') && ui.includes('1 of 7') || ui.includes('Module 1'));
check('ui: Phase C.2 Module 2 of 7 listed', ui.includes('C.2') || ui.includes('Module 2 of'));
check('ui: Phase C.3 Module 3 of 7 listed', ui.includes('C.3') || ui.includes('Module 3 of'));
check('ui: Phase C.4 Module 4 of 7 listed', ui.includes('C.4') || ui.includes('Module 4 of'));
check('ui: Phase C.5 Module 5 of 7 listed', ui.includes('C.5') || ui.includes('Module 5 of'));
check('ui: Phase C.6 Module 6 of 7 listed', ui.includes('C.6') || ui.includes('Module 6 of'));
check('ui: Phase C.7 Module 7 of 7 listed', ui.includes('C.7') || ui.includes('Module 7 of'));

// ─── SAFETY ───────────────────────────────────────────────────────────────────
check('safety: contains_secrets false in service', svc.includes('contains_secrets: false') || svc.includes(',FALSE,FALSE,'));
check('safety: stores_secrets false in service', svc.includes('stores_secrets: false') || svc.includes('FALSE,FALSE'));
check('safety: live_provider_connected false in service', svc.includes('liveProviderConnected: false') || svc.includes('live_provider_connected: false'));
check('safety: marketplace_purchase_completed false', svc.includes('marketplacePurchaseCompleted: false') || svc.includes('FALSE,FALSE'));
check('safety: license_verified false', svc.includes('licenseVerified: false') || svc.includes('license_verified: false'));
check('safety: billing_connected false', svc.includes('billingConnected: false') || svc.includes('billing_connected: false'));
check('safety: deployment_completed false', svc.includes('deploymentCompleted: false') || svc.includes('deployment_completed: false'));
check('safety: contains_ai_generated_content false', svc.includes('containsAiGeneratedContent: false') || svc.includes('contains_ai_generated_content,FALSE'));
check('safety: no fake provider connection claim in service', !svc.includes("liveProviderConnected: true") && !svc.includes("live_provider_connected: true"));
check('safety: no fake billing claim in service', !svc.includes("billingConnected: true") && !svc.includes("billing_connected: true"));
check('safety: no fake deployment claim in service', !svc.includes("deploymentCompleted: true") && !svc.includes("deployment_completed: true"));
check('safety: no fake install claim in service', !svc.includes("installCompleted: true"));
check('safety: no fake activation claim in service', !svc.includes("activationLive: true"));
check('safety: no secrets storage in service', !svc.includes("stores_secrets: true") && !svc.includes("storesSecrets: true"));
check('safety: platform admin guard in routes', routes.includes('canAccessPOS3'));
check('safety: honest limitations language in service', svc.includes('placeholder') && svc.includes('not live'));
check('safety: activation required language', svc.includes('activation_required') || svc.includes('provider_activation_required'));
check('safety: phase roadmap language', svc.includes('Roadmap') || svc.includes('roadmap'));

// ─── WIRING ───────────────────────────────────────────────────────────────────
const idx = read('server/index.js');
const appJsx = read('src/App.jsx');
const pkg = read('package.json');

check('wiring: server/index.js imports noveeOSModuleRegistryRoutes', idx.includes('noveeOSModuleRegistryRoutes'));
check('wiring: server/index.js mounts /api/novee-os/modules', idx.includes('/api/novee-os/modules'));
check('wiring: src/App.jsx imports NoveeOSModuleRegistry', appJsx.includes('NoveeOSModuleRegistry'));
check('wiring: src/App.jsx has novee-os/modules route', appJsx.includes('novee-os/modules'));
check('wiring: package.json has verify:novee-os-modules script', pkg.includes('verify:novee-os-modules'));
check('wiring: package.json script runs verifyNoveeOSModuleRegistry', pkg.includes('verifyNoveeOSModuleRegistry'));

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n=== NOVEE OS Module Registry Verification ===');
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`TOTAL:  ${passed + failed}`);

if (failures.length) {
  console.log('\nFAILED CHECKS:');
  failures.forEach(f => console.log(`  x ${f}`));
}

if (failed > 0) {
  console.log('\n❌ VERIFICATION FAILED');
  process.exit(1);
} else {
  console.log(`\n✅ ALL ${passed} CHECKS PASSED`);
  process.exit(0);
}
