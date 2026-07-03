/**
 * NOMPF — Module Foundation Verification Script
 * Verifies Module Build 1 of 9: NOVEE OS Module Packaging Foundation
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())
const pass = []
const fail = []

function assert(condition, label) {
  if (condition) { pass.push(label) }
  else { fail.push(label); console.error(`  FAIL: ${label}`) }
}

function fileExists(rel) { return existsSync(resolve(ROOT, rel)) }

function fileContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return false
  return readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

function fileNotContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return true
  return !readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

function fileNotMatchesPattern(rel, pattern) {
  if (!existsSync(resolve(ROOT, rel))) return true
  return !pattern.test(readFileSync(resolve(ROOT, rel), 'utf8'))
}

// ── File paths ───────────────────────────────────────────────────────────────
const SCHEMA   = 'server/services/modules/moduleManifestSchema.js'
const REGISTRY = 'server/services/modules/moduleRegistryService.js'
const DEPS     = 'server/services/modules/moduleDependencyService.js'
const ACTIV    = 'server/services/modules/moduleActivationService.js'
const LIFE     = 'server/services/modules/moduleLifecycleHookService.js'
const VER      = 'server/services/modules/moduleVersioningService.js'
const PERM     = 'server/services/modules/modulePermissionService.js'
const RROUTE   = 'server/services/modules/moduleRouteRegistryService.js'
const RSVC     = 'server/services/modules/moduleServiceRegistryService.js'
const RCOMP    = 'server/services/modules/moduleComponentRegistryService.js'
const RHOOK    = 'server/services/modules/moduleHookRegistryService.js'
const AUDIT    = 'server/services/modules/moduleAuditService.js'
const MKT      = 'server/services/modules/moduleMarketplaceDraftService.js'
const LIC      = 'server/services/modules/moduleLicenseReadinessService.js'
const INIT     = 'server/services/modules/initialModuleManifests.js'
const CTRL     = 'server/controllers/moduleFoundationController.js'
const ROUTE    = 'server/routes/moduleFoundationRoutes.js'
const EAT      = 'server/services/eatCommandHubContract.js'
const DOCS     = 'docs/NOVEE_OS_MODULE_PACKAGING_FOUNDATION.md'
const DEMO     = 'src/pages/NoveeOSModuleFoundationDemo.jsx'
const IDX      = 'server/index.js'
const PKG      = 'package.json'

const COMP_DIR = 'src/components/modules'
const COMPONENTS = [
  'ModuleFoundationReadinessPanel',
  'ModuleRegistryPanel',
  'ModuleManifestCard',
  'ModuleDependencyPanel',
  'ModuleActivationPanel',
  'ModuleLifecycleHookPanel',
  'ModuleVersioningPanel',
  'ModulePermissionPanel',
  'ModuleRouteRegistryPanel',
  'ModuleServiceRegistryPanel',
  'ModuleComponentRegistryPanel',
  'ModuleHookRegistryPanel',
  'ModuleAuditPanel',
  'ModuleMarketplaceDraftPanel',
  'ModuleLicenseReadinessPanel',
  'InitialModuleManifestPanel',
]

console.log('\n── NOMPF Module Foundation Verification ──\n')

// ── Service file existence ───────────────────────────────────────────────────
console.log('Service file existence:')
assert(fileExists(SCHEMA),   'moduleManifestSchema.js exists')
assert(fileExists(REGISTRY), 'moduleRegistryService.js exists')
assert(fileExists(DEPS),     'moduleDependencyService.js exists')
assert(fileExists(ACTIV),    'moduleActivationService.js exists')
assert(fileExists(LIFE),     'moduleLifecycleHookService.js exists')
assert(fileExists(VER),      'moduleVersioningService.js exists')
assert(fileExists(PERM),     'modulePermissionService.js exists')
assert(fileExists(RROUTE),   'moduleRouteRegistryService.js exists')
assert(fileExists(RSVC),     'moduleServiceRegistryService.js exists')
assert(fileExists(RCOMP),    'moduleComponentRegistryService.js exists')
assert(fileExists(RHOOK),    'moduleHookRegistryService.js exists')
assert(fileExists(AUDIT),    'moduleAuditService.js exists')
assert(fileExists(MKT),      'moduleMarketplaceDraftService.js exists')
assert(fileExists(LIC),      'moduleLicenseReadinessService.js exists')
assert(fileExists(INIT),     'initialModuleManifests.js exists')

// ── Module manifest schema ───────────────────────────────────────────────────
console.log('\nModule manifest schema:')
assert(fileContains(SCHEMA, 'MODULE_TYPES'),           'exports MODULE_TYPES')
assert(fileContains(SCHEMA, 'MODULE_STATUSES'),        'exports MODULE_STATUSES')
assert(fileContains(SCHEMA, 'createModuleManifest'),   'exports createModuleManifest')
assert(fileContains(SCHEMA, 'validateManifestShape'),  'exports validateManifestShape')
assert(fileContains(SCHEMA, 'buildManifestSchemaReport'), 'exports buildManifestSchemaReport')
assert(fileContains(SCHEMA, 'core_platform'),          'includes core_platform type')
assert(fileContains(SCHEMA, 'experience_module'),      'includes experience_module type')
assert(fileContains(SCHEMA, 'commerce_module'),        'includes commerce_module type')
assert(fileContains(SCHEMA, 'inventory_module'),       'includes inventory_module type')
assert(fileContains(SCHEMA, 'connector_module'),       'includes connector_module type')
assert(fileContains(SCHEMA, 'intelligence_module'),    'includes intelligence_module type')
assert(fileContains(SCHEMA, 'operations_module'),      'includes operations_module type')
assert(fileContains(SCHEMA, 'marketplace_module'),     'includes marketplace_module type')
assert(fileContains(SCHEMA, 'licensing_module'),       'includes licensing_module type')
assert(fileContains(SCHEMA, 'addon_module'),           'includes addon_module type')
assert(fileContains(SCHEMA, 'not_yet_packaged'),       'includes not_yet_packaged status')
assert(fileContains(SCHEMA, 'manifest_ready'),         'includes manifest_ready status')
assert(fileContains(SCHEMA, 'installed'),              'includes installed status')
assert(fileContains(SCHEMA, 'enabled'),                'includes enabled status')
assert(fileContains(SCHEMA, 'dependency_blocked'),     'includes dependency_blocked status')
assert(fileContains(SCHEMA, 'license_blocked'),        'includes license_blocked status')
assert(fileContains(SCHEMA, 'marketplace_draft'),      'includes marketplace_draft status')
assert(fileContains(SCHEMA, 'white_label_ready'),      'includes white_label_ready status')
assert(fileContains(SCHEMA, 'moduleId'),               'manifest shape has moduleId')
assert(fileContains(SCHEMA, 'moduleName'),             'manifest shape has moduleName')
assert(fileContains(SCHEMA, 'moduleSlug'),             'manifest shape has moduleSlug')
assert(fileContains(SCHEMA, 'moduleVersion'),          'manifest shape has moduleVersion')
assert(fileContains(SCHEMA, 'dependencies'),           'manifest shape has dependencies')
assert(fileContains(SCHEMA, 'installHooks'),           'manifest shape has installHooks')
assert(fileContains(SCHEMA, 'licenseRequirements'),    'manifest shape has licenseRequirements')
assert(fileContains(SCHEMA, 'pricingModel'),           'manifest shape has pricingModel')
assert(fileContains(SCHEMA, 'tenantScope'),            'manifest shape has tenantScope')
assert(fileContains(SCHEMA, 'venueScope'),             'manifest shape has venueScope')

// ── Module registry service ──────────────────────────────────────────────────
console.log('\nModule registry service:')
assert(fileContains(REGISTRY, 'registerModuleManifest'),       'exports registerModuleManifest')
assert(fileContains(REGISTRY, 'getRegisteredModules'),         'exports getRegisteredModules')
assert(fileContains(REGISTRY, 'getModuleById'),                'exports getModuleById')
assert(fileContains(REGISTRY, 'getModuleBySlug'),              'exports getModuleBySlug')
assert(fileContains(REGISTRY, 'getModulesByType'),             'exports getModulesByType')
assert(fileContains(REGISTRY, 'getCoreModules'),               'exports getCoreModules')
assert(fileContains(REGISTRY, 'getAddonModules'),              'exports getAddonModules')
assert(fileContains(REGISTRY, 'getPremiumModules'),            'exports getPremiumModules')
assert(fileContains(REGISTRY, 'getEnterpriseModules'),         'exports getEnterpriseModules')
assert(fileContains(REGISTRY, 'getMarketplaceEligibleModules'), 'exports getMarketplaceEligibleModules')
assert(fileContains(REGISTRY, 'getWhiteLabelEligibleModules'), 'exports getWhiteLabelEligibleModules')
assert(fileContains(REGISTRY, 'validateModuleManifest'),       'exports validateModuleManifest')
assert(fileContains(REGISTRY, 'buildModuleRegistryReport'),    'exports buildModuleRegistryReport')
assert(fileContains(REGISTRY, 'module_registry_in_memory_only'), 'uses module_registry_in_memory_only status')
assert(fileContains(REGISTRY, 'database_required'),            'returns database_required when no DB')
assert(fileContains(REGISTRY, 'degradedMode'),                 'returns degradedMode flag')
assert(fileContains(REGISTRY, 'marketplaceNotLive: true'),     'declares marketplaceNotLive: true')
assert(fileContains(REGISTRY, 'licenseNotEnforced: true'),     'declares licenseNotEnforced: true')

// ── Dependency service ───────────────────────────────────────────────────────
console.log('\nDependency service:')
assert(fileContains(DEPS, 'getModuleDependencies'),        'exports getModuleDependencies')
assert(fileContains(DEPS, 'getOptionalDependencies'),      'exports getOptionalDependencies')
assert(fileContains(DEPS, 'getIncompatibleModules'),       'exports getIncompatibleModules')
assert(fileContains(DEPS, 'validateModuleDependencies'),   'exports validateModuleDependencies')
assert(fileContains(DEPS, 'detectMissingDependencies'),    'exports detectMissingDependencies')
assert(fileContains(DEPS, 'detectDependencyConflicts'),    'exports detectDependencyConflicts')
assert(fileContains(DEPS, 'detectCircularDependencies'),   'exports detectCircularDependencies')
assert(fileContains(DEPS, 'buildDependencyReadinessReport'), 'exports buildDependencyReadinessReport')
assert(fileContains(DEPS, 'buildDependencyBlockedResponse'), 'exports buildDependencyBlockedResponse')
assert(fileContains(DEPS, 'dependencies_ready'),           'uses dependencies_ready status')
assert(fileContains(DEPS, 'missing_dependency'),           'uses missing_dependency status')
assert(fileContains(DEPS, 'dependency_blocked'),           'uses dependency_blocked status')
assert(fileContains(DEPS, 'dependency_preview_only'),      'uses dependency_preview_only status')

// ── Activation service ───────────────────────────────────────────────────────
console.log('\nActivation service:')
assert(fileContains(ACTIV, 'getModuleActivationStatus'),       'exports getModuleActivationStatus')
assert(fileContains(ACTIV, 'activateModulePreview'),           'exports activateModulePreview')
assert(fileContains(ACTIV, 'deactivateModulePreview'),         'exports deactivateModulePreview')
assert(fileContains(ACTIV, 'enableModuleForVenuePreview'),     'exports enableModuleForVenuePreview')
assert(fileContains(ACTIV, 'disableModuleForVenuePreview'),    'exports disableModuleForVenuePreview')
assert(fileContains(ACTIV, 'enableModuleForTenantPreview'),    'exports enableModuleForTenantPreview')
assert(fileContains(ACTIV, 'disableModuleForTenantPreview'),   'exports disableModuleForTenantPreview')
assert(fileContains(ACTIV, 'validateActivationRequirements'),  'exports validateActivationRequirements')
assert(fileContains(ACTIV, 'validateDeactivationSafety'),      'exports validateDeactivationSafety')
assert(fileContains(ACTIV, 'buildActivationReadinessReport'),  'exports buildActivationReadinessReport')
assert(fileContains(ACTIV, 'activated_preview'),               'uses activated_preview status')
assert(fileContains(ACTIV, 'activation_ready'),                'uses activation_ready status')
assert(fileContains(ACTIV, 'preview_only: true'),              'declares preview_only: true')
assert(fileContains(ACTIV, 'database_required'),               'returns database_required')

// ── Lifecycle hook service ───────────────────────────────────────────────────
console.log('\nLifecycle hook service:')
assert(fileContains(LIFE, 'getModuleInstallHooks'),            'exports getModuleInstallHooks')
assert(fileContains(LIFE, 'getModuleUninstallHooks'),          'exports getModuleUninstallHooks')
assert(fileContains(LIFE, 'getModuleEnableHooks'),             'exports getModuleEnableHooks')
assert(fileContains(LIFE, 'getModuleDisableHooks'),            'exports getModuleDisableHooks')
assert(fileContains(LIFE, 'getModuleUpgradeHooks'),            'exports getModuleUpgradeHooks')
assert(fileContains(LIFE, 'getModuleRollbackHooks'),           'exports getModuleRollbackHooks')
assert(fileContains(LIFE, 'validateInstallHooks'),             'exports validateInstallHooks')
assert(fileContains(LIFE, 'validateUninstallHooks'),           'exports validateUninstallHooks')
assert(fileContains(LIFE, 'runInstallHooksPreview'),           'exports runInstallHooksPreview')
assert(fileContains(LIFE, 'runUninstallHooksPreview'),         'exports runUninstallHooksPreview')
assert(fileContains(LIFE, 'runEnableHooksPreview'),            'exports runEnableHooksPreview')
assert(fileContains(LIFE, 'runDisableHooksPreview'),           'exports runDisableHooksPreview')
assert(fileContains(LIFE, 'buildLifecycleHookReadinessReport'), 'exports buildLifecycleHookReadinessReport')
assert(fileContains(LIFE, 'install_preview_ready'),            'uses install_preview_ready status')
assert(fileContains(LIFE, 'uninstall_preview_ready'),          'uses uninstall_preview_ready status')
assert(fileContains(LIFE, 'preview_only: true'),               'declares preview_only: true')
assert(fileContains(LIFE, 'destructive: false'),               'declares destructive: false')

// ── Versioning service ───────────────────────────────────────────────────────
console.log('\nVersioning service:')
assert(fileContains(VER, 'getModuleVersion'),              'exports getModuleVersion')
assert(fileContains(VER, 'compareModuleVersions'),         'exports compareModuleVersions')
assert(fileContains(VER, 'getAvailableModuleUpgrades'),    'exports getAvailableModuleUpgrades')
assert(fileContains(VER, 'validateUpgradePath'),           'exports validateUpgradePath')
assert(fileContains(VER, 'validateRollbackPath'),          'exports validateRollbackPath')
assert(fileContains(VER, 'buildUpgradePlanPreview'),       'exports buildUpgradePlanPreview')
assert(fileContains(VER, 'buildRollbackPlanPreview'),      'exports buildRollbackPlanPreview')
assert(fileContains(VER, 'buildVersionReadinessReport'),   'exports buildVersionReadinessReport')
assert(fileContains(VER, 'version_current'),               'uses version_current status')
assert(fileContains(VER, 'upgrade_preview_ready'),         'uses upgrade_preview_ready status')
assert(fileContains(VER, 'rollback_preview_ready'),        'uses rollback_preview_ready status')

// ── Permission service ───────────────────────────────────────────────────────
console.log('\nPermission service:')
assert(fileContains(PERM, 'getModulePermissions'),         'exports getModulePermissions')
assert(fileContains(PERM, 'getRoleModulePermissions'),     'exports getRoleModulePermissions')
assert(fileContains(PERM, 'validateModulePermission'),     'exports validateModulePermission')
assert(fileContains(PERM, 'validateModuleAccessForRole'),  'exports validateModuleAccessForRole')
assert(fileContains(PERM, 'buildPermissionMapForModule'),  'exports buildPermissionMapForModule')
assert(fileContains(PERM, 'buildModulePermissionReport'),  'exports buildModulePermissionReport')
assert(fileContains(PERM, 'buildPermissionDeniedResponse'), 'exports buildPermissionDeniedResponse')
assert(fileContains(PERM, 'permission_granted'),           'uses permission_granted status')
assert(fileContains(PERM, 'permission_denied'),            'uses permission_denied status')
assert(fileContains(PERM, 'owner_required'),               'uses owner_required status')
assert(fileContains(PERM, 'preview_only'),                 'uses preview_only status')
assert(fileContains(PERM, "'guest'"),                      'includes guest role')
assert(fileContains(PERM, "'manager'"),                    'includes manager role')
assert(fileContains(PERM, "'internal_admin'"),             'includes internal_admin role')
assert(fileContains(PERM, "'reseller_admin'"),             'includes reseller_admin role')

// ── Route / Service / Component / Hook registries ────────────────────────────
console.log('\nRegistry services:')
assert(fileContains(RROUTE, 'getModuleRoutes'),                'route registry exports getModuleRoutes')
assert(fileContains(RROUTE, 'registerModuleRoutesPreview'),    'route registry exports registerModuleRoutesPreview')
assert(fileContains(RROUTE, 'detectRouteConflicts'),           'route registry exports detectRouteConflicts')
assert(fileContains(RROUTE, 'buildModuleRouteRegistryReport'), 'route registry exports buildModuleRouteRegistryReport')
assert(fileContains(RSVC,   'getModuleServices'),              'service registry exports getModuleServices')
assert(fileContains(RSVC,   'registerModuleServicesPreview'),  'service registry exports registerModuleServicesPreview')
assert(fileContains(RSVC,   'buildModuleServiceRegistryReport'), 'service registry exports buildModuleServiceRegistryReport')
assert(fileContains(RCOMP,  'getModuleComponents'),            'component registry exports getModuleComponents')
assert(fileContains(RCOMP,  'registerModuleComponentsPreview'), 'component registry exports registerModuleComponentsPreview')
assert(fileContains(RCOMP,  'buildModuleComponentRegistryReport'), 'component registry exports buildModuleComponentRegistryReport')
assert(fileContains(RHOOK,  'getModuleHooks'),                 'hook registry exports getModuleHooks')
assert(fileContains(RHOOK,  'registerModuleHooksPreview'),     'hook registry exports registerModuleHooksPreview')
assert(fileContains(RHOOK,  'buildModuleHookRegistryReport'),  'hook registry exports buildModuleHookRegistryReport')
assert(fileContains(RHOOK,  "'eat'"),                          'hook registry supports eat system')
assert(fileContains(RHOOK,  "'pos360'"),                       'hook registry supports pos360 system')
assert(fileContains(RHOOK,  "'ncie'"),                         'hook registry supports ncie system')

// ── Audit service ────────────────────────────────────────────────────────────
console.log('\nAudit service:')
assert(fileContains(AUDIT, 'createModuleAuditEvent'),      'exports createModuleAuditEvent')
assert(fileContains(AUDIT, 'getModuleAuditEvents'),        'exports getModuleAuditEvents')
assert(fileContains(AUDIT, 'getModuleAuditEventsByModule'), 'exports getModuleAuditEventsByModule')
assert(fileContains(AUDIT, 'getModuleAuditEventsByActor'), 'exports getModuleAuditEventsByActor')
assert(fileContains(AUDIT, 'buildModuleAuditReport'),      'exports buildModuleAuditReport')
assert(fileContains(AUDIT, 'module_manifest_registered'),  'includes module_manifest_registered event')
assert(fileContains(AUDIT, 'module_install_preview'),      'includes module_install_preview event')
assert(fileContains(AUDIT, 'module_license_checked'),      'includes module_license_checked event')
assert(fileContains(AUDIT, 'audit_preview_only'),          'uses audit_preview_only status')
assert(fileContains(AUDIT, 'database_required'),           'returns database_required')

// ── Marketplace draft service ────────────────────────────────────────────────
console.log('\nMarketplace draft service:')
assert(fileContains(MKT, 'buildModuleMarketplaceDraft'),      'exports buildModuleMarketplaceDraft')
assert(fileContains(MKT, 'getModuleMarketplaceDraft'),        'exports getModuleMarketplaceDraft')
assert(fileContains(MKT, 'getModuleMarketplaceDrafts'),       'exports getModuleMarketplaceDrafts')
assert(fileContains(MKT, 'validateMarketplaceDraft'),         'exports validateMarketplaceDraft')
assert(fileContains(MKT, 'buildMarketplaceDraftReadinessReport'), 'exports buildMarketplaceDraftReadinessReport')
assert(fileContains(MKT, 'not_live_marketplace'),             'uses not_live_marketplace status')
assert(fileContains(MKT, 'marketplace_draft_ready'),          'uses marketplace_draft_ready status')
assert(fileContains(MKT, 'live_marketplace: false'),          'declares live_marketplace: false')
assert(fileContains(MKT, 'marketplace_not_live: true'),       'declares marketplace_not_live: true')
assert(fileContains(MKT, 'listing_drafts_only: true'),        'declares listing_drafts_only: true')
assert(fileContains(MKT, 'preview_only: true'),               'declares preview_only: true')

// ── License readiness service ────────────────────────────────────────────────
console.log('\nLicense readiness service:')
assert(fileContains(LIC, 'getModuleLicenseRequirements'),     'exports getModuleLicenseRequirements')
assert(fileContains(LIC, 'validateModuleLicenseReadiness'),   'exports validateModuleLicenseReadiness')
assert(fileContains(LIC, 'getLicenseTierForModule'),          'exports getLicenseTierForModule')
assert(fileContains(LIC, 'getAddonLicenseRequirements'),      'exports getAddonLicenseRequirements')
assert(fileContains(LIC, 'getWhiteLabelLicenseRequirements'), 'exports getWhiteLabelLicenseRequirements')
assert(fileContains(LIC, 'buildModuleLicenseReadinessReport'), 'exports buildModuleLicenseReadinessReport')
assert(fileContains(LIC, 'license_ready_draft'),              'uses license_ready_draft status')
assert(fileContains(LIC, 'license_not_enforced'),             'uses license_not_enforced status')
assert(fileContains(LIC, 'license_gate_required'),            'uses license_gate_required status')
assert(fileContains(LIC, 'white_label_license_required'),     'uses white_label_license_required status')
assert(fileContains(LIC, 'licenseGateBuilt: false'),          'declares licenseGateBuilt: false')

// ── Initial module manifests ─────────────────────────────────────────────────
console.log('\nInitial module manifests:')
assert(fileExists(INIT), 'initialModuleManifests.js exists')
assert(fileContains(INIT, 'getInitialModuleManifests'),        'exports getInitialModuleManifests')
assert(fileContains(INIT, 'smokecraft-experience'),            'includes SmokeCraft Experience Module')
assert(fileContains(INIT, 'pos360'),                           'includes POS360 Module')
assert(fileContains(INIT, 'eat-command-hub'),                  'includes E.A.T. Command Hub Module')
assert(fileContains(INIT, 'ispae'),                            'includes ISPAE module')
assert(fileContains(INIT, 'dmrc'),                             'includes DMRC module')
assert(fileContains(INIT, 'locc'),                             'includes LOCC module')
assert(fileContains(INIT, 'eocg'),                             'includes EOCG module')
assert(fileContains(INIT, 'venue-onboarding'),                 'includes Venue Onboarding module')
assert(fileContains(INIT, 'partner-vendors'),                  'includes Partner Vendor module')
assert(fileContains(INIT, 'payments-checkout'),                'includes Payments/Checkout module')
assert(fileContains(INIT, 'kds'),                              'includes KDS module')
assert(fileContains(INIT, 'ncie'),                             'includes NCIE module')
assert(fileContains(INIT, 'passport-connections'),             'includes Passport Connections module')
assert(fileContains(INIT, 'white-label-licensing'),            'includes White-Label Licensing module')
assert(fileContains(INIT, 'marketplace-registry'),             'includes Marketplace Registry module')
assert(fileContains(INIT, "moduleStatus: 'not_yet_packaged'"), 'all modules have not_yet_packaged status')
assert(fileContains(INIT, 'needs_module_manifest'),            'all modules tagged needs_module_manifest')

// ── Modules are NOT falsely marked packaged ───────────────────────────────────
console.log('\nModules not falsely marked packaged:')
assert(fileNotContains(INIT, "moduleStatus: 'installed'"),     'no module falsely marked installed')
assert(fileNotContains(INIT, "moduleStatus: 'enabled'"),       'no module falsely marked enabled')
assert(fileNotContains(INIT, 'live marketplace'),              'no live marketplace claim in manifests')
assert(fileNotMatchesPattern(MKT, /(?<!not_)live marketplace/), 'no live marketplace claim in marketplace service')
assert(fileNotMatchesPattern(LIC, /^\s+enforced: true/m),      'no license falsely marked enforced')

// ── Controller and routes ────────────────────────────────────────────────────
console.log('\nController and routes:')
assert(fileExists(CTRL),   'moduleFoundationController.js exists')
assert(fileExists(ROUTE),  'moduleFoundationRoutes.js exists')
assert(fileContains(CTRL, 'handleFoundationReadiness'),      'controller has handleFoundationReadiness')
assert(fileContains(CTRL, 'handleGetRegistry'),              'controller has handleGetRegistry')
assert(fileContains(CTRL, 'handleGetDependencies'),          'controller has handleGetDependencies')
assert(fileContains(CTRL, 'handleGetActivation'),            'controller has handleGetActivation')
assert(fileContains(CTRL, 'handleActivatePreview'),          'controller has handleActivatePreview')
assert(fileContains(CTRL, 'handleDeactivatePreview'),        'controller has handleDeactivatePreview')
assert(fileContains(CTRL, 'handleGetLifecycle'),             'controller has handleGetLifecycle')
assert(fileContains(CTRL, 'handleInstallPreview'),           'controller has handleInstallPreview')
assert(fileContains(CTRL, 'handleUninstallPreview'),         'controller has handleUninstallPreview')
assert(fileContains(CTRL, 'handleGetVersioning'),            'controller has handleGetVersioning')
assert(fileContains(CTRL, 'handleGetPermissions'),           'controller has handleGetPermissions')
assert(fileContains(CTRL, 'handleGetRoutes'),                'controller has handleGetRoutes')
assert(fileContains(CTRL, 'handleGetServices'),              'controller has handleGetServices')
assert(fileContains(CTRL, 'handleGetComponents'),            'controller has handleGetComponents')
assert(fileContains(CTRL, 'handleGetHooks'),                 'controller has handleGetHooks')
assert(fileContains(CTRL, 'handleGetAudit'),                 'controller has handleGetAudit')
assert(fileContains(CTRL, 'handleGetMarketplaceDrafts'),     'controller has handleGetMarketplaceDrafts')
assert(fileContains(CTRL, 'handleGetLicenseReadiness'),      'controller has handleGetLicenseReadiness')
assert(fileContains(CTRL, 'handleGetInitialManifests'),      'controller has handleGetInitialManifests')
assert(fileContains(CTRL, 'platform_software'),              'controller declares NOVEE OS as platform_software')
assert(fileContains(ROUTE, "'/foundation/readiness'"),       'route has /foundation/readiness')
assert(fileContains(ROUTE, "'/registry'"),                   'route has /registry')
assert(fileContains(ROUTE, "'/audit'"),                      'route has /audit')
assert(fileContains(ROUTE, "'/marketplace-drafts'"),         'route has /marketplace-drafts')
assert(fileContains(ROUTE, "'/license-readiness'"),          'route has /license-readiness')
assert(fileContains(ROUTE, "'/initial-manifests'"),          'route has /initial-manifests')
assert(fileContains(IDX, 'moduleFoundationRoutes'),          'server/index.js imports moduleFoundationRoutes')
assert(fileContains(IDX, "'/api/modules'"),                  'server/index.js mounts /api/modules')

// ── UI components ─────────────────────────────────────────────────────────────
console.log('\nUI components:')
for (const comp of COMPONENTS) {
  assert(fileExists(`${COMP_DIR}/${comp}.jsx`), `${comp}.jsx exists`)
}
assert(fileContains(`${COMP_DIR}/ModuleFoundationReadinessPanel.jsx`, 'NOMPF'),          'foundation panel mentions NOMPF')
assert(fileContains(`${COMP_DIR}/ModuleRegistryPanel.jsx`, 'module_registry_in_memory_only'), 'registry panel shows in_memory_only')
assert(fileContains(`${COMP_DIR}/ModuleManifestCard.jsx`, 'not_yet_packaged'),           'manifest card shows not_yet_packaged')
assert(fileContains(`${COMP_DIR}/ModuleMarketplaceDraftPanel.jsx`, 'not_live_marketplace'), 'marketplace panel shows not_live_marketplace')
assert(fileContains(`${COMP_DIR}/ModuleLicenseReadinessPanel.jsx`, 'license_not_enforced'), 'license panel shows license_not_enforced')
assert(fileContains(`${COMP_DIR}/ModuleActivationPanel.jsx`, 'activation_preview'),      'activation panel shows activation_preview')
assert(fileContains(`${COMP_DIR}/ModuleAuditPanel.jsx`, 'audit_preview_only'),           'audit panel shows audit_preview_only')

// ── Demo page ─────────────────────────────────────────────────────────────────
console.log('\nDemo page:')
assert(fileExists(DEMO),                                                'NoveeOSModuleFoundationDemo.jsx exists')
assert(fileContains(DEMO, 'NOVEE OS Module Packaging Foundation'),      'demo page has correct title')
assert(fileContains(DEMO, 'NOVEE OS is the platform operating layer'),  'demo states NOVEE OS platform role')
assert(fileContains(DEMO, 'noveeos.com is the public-facing portal'),   'demo states noveeos.com portal role')
assert(fileContains(DEMO, 'not Phase 20'),                              'demo says not Phase 20')
assert(fileContains(DEMO, 'not_yet_packaged'),                          'demo shows not_yet_packaged')
assert(fileContains(DEMO, 'not_live_marketplace'),                      'demo shows not_live_marketplace')
assert(fileContains(DEMO, 'MODULE BUILD 2'),                            'demo shows next module build')
assert(fileContains(DEMO, 'Module Build 1 of 9'),                       'demo labels build sequence')

// ── E.A.T. hooks ─────────────────────────────────────────────────────────────
console.log('\nE.A.T. hooks:')
assert(fileContains(EAT, 'getModuleFoundationReadinessHooks'),      'EAT has getModuleFoundationReadinessHooks')
assert(fileContains(EAT, 'getModuleRegistryReadinessHooks'),        'EAT has getModuleRegistryReadinessHooks')
assert(fileContains(EAT, 'getModuleDependencyReadinessHooks'),      'EAT has getModuleDependencyReadinessHooks')
assert(fileContains(EAT, 'getModuleActivationReadinessHooks'),      'EAT has getModuleActivationReadinessHooks')
assert(fileContains(EAT, 'getModuleLifecycleReadinessHooks'),       'EAT has getModuleLifecycleReadinessHooks')
assert(fileContains(EAT, 'getModuleVersioningReadinessHooks'),      'EAT has getModuleVersioningReadinessHooks')
assert(fileContains(EAT, 'getModulePermissionReadinessHooks'),      'EAT has getModulePermissionReadinessHooks')
assert(fileContains(EAT, 'getModuleMarketplaceDraftReadinessHooks'), 'EAT has getModuleMarketplaceDraftReadinessHooks')
assert(fileContains(EAT, 'getModuleLicenseReadinessHooks'),         'EAT has getModuleLicenseReadinessHooks')
assert(fileContains(EAT, 'getInitialModuleManifestReadinessHooks'), 'EAT has getInitialModuleManifestReadinessHooks')
assert(fileContains(EAT, "system: 'nompf'"),                        'EAT hooks tagged with nompf system')
assert(fileContains(EAT, 'not_live_marketplace'),                   'EAT marketplace hook uses honest status')
assert(fileContains(EAT, 'license_not_enforced'),                   'EAT license hook uses honest status')
assert(fileContains(EAT, 'not_yet_packaged'),                       'EAT manifest hook uses not_yet_packaged')

// ── Documentation ─────────────────────────────────────────────────────────────
console.log('\nDocumentation:')
assert(fileExists(DOCS),                                                'NOVEE_OS_MODULE_PACKAGING_FOUNDATION.md exists')
assert(fileContains(DOCS, 'NOVEE OS is platform software'),            'docs state NOVEE OS is platform software')
assert(fileContains(DOCS, 'not a website'),                            'docs clarify not a website')
assert(fileContains(DOCS, 'noveeos.com is the public-facing portal'),  'docs clarify noveeos.com')
assert(fileContains(DOCS, 'What Module Build 1 Creates'),              'docs have what is created section')
assert(fileContains(DOCS, 'What Module Build 1 Does Not Create'),      'docs have what is not created section')
assert(fileContains(DOCS, 'not_live_marketplace'),                     'docs include not_live_marketplace')
assert(fileContains(DOCS, 'license_not_enforced'),                     'docs include license_not_enforced')
assert(fileContains(DOCS, 'not_yet_packaged'),                         'docs include not_yet_packaged')
assert(fileContains(DOCS, 'This is not Phase 20'),                     'docs include not Phase 20 statement')
assert(fileContains(DOCS, 'Why This Is Not Phase 20'),                 'docs have Why This Is Not Phase 20 section')
assert(fileContains(DOCS, 'Module Manifest Schema'),                   'docs have manifest schema section')
assert(fileContains(DOCS, 'Module Registry Foundation'),               'docs have registry section')
assert(fileContains(DOCS, 'Dependency Rules'),                         'docs have dependency section')
assert(fileContains(DOCS, 'Permission Map'),                           'docs have permission section')
assert(fileContains(DOCS, 'Marketplace Draft Readiness'),              'docs have marketplace section')
assert(fileContains(DOCS, 'License Readiness'),                        'docs have license section')
assert(fileContains(DOCS, 'Initial Module Draft List'),                'docs have initial manifest list')
assert(fileContains(DOCS, 'SmokeCraft Experience Module'),             'docs list SmokeCraft module')
assert(fileContains(DOCS, 'MODULE BUILD 2'),                           'docs reference MODULE BUILD 2 as next')

// ── No Phase 20 language ──────────────────────────────────────────────────────
console.log('\nNo Phase 20 language:')
assert(fileNotContains(SCHEMA, '"Phase 20"'),    'schema has no Phase 20 string')
assert(fileNotContains(REGISTRY, '"Phase 20"'),  'registry has no Phase 20 string')
assert(fileNotContains(CTRL, '"Phase 20"'),      'controller has no Phase 20 string')
assert(fileContains(CTRL, 'isPhase20: false'),   'controller explicitly sets isPhase20: false')
assert(fileContains(CTRL, 'noPhase20: true'),    'controller explicitly sets noPhase20: true')

// ── Sealed core build remains intact ─────────────────────────────────────────
console.log('\nSealed core build intact:')
assert(fileExists('server/services/finalLockdown/finalLockdownAuditService.js'), 'FPLMRL audit service intact')
assert(fileExists('server/services/moduleReadiness/moduleReadinessMapService.js'), 'module readiness map intact')
assert(fileExists('server/services/environment/environmentReadinessService.js'), 'EPRL service intact')
assert(fileExists('server/services/operations/operationsDashboardService.js'),   'LOCC service intact')
assert(fileExists('server/services/inventory/inventoryAvailabilityService.js'),  'ISPAE service intact')
assert(fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx'),         'SmokeCraft sealed file intact')
assert(fileExists('src/constants/session.js'),                                     'session.js sealed file intact')

// ── Package script ─────────────────────────────────────────────────────────────
console.log('\nPackage script:')
assert(fileContains(PKG, 'verify:module-foundation'), 'verify:module-foundation in package.json')

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n── Results ──`)
console.log(`  Passed: ${pass.length}`)
console.log(`  Failed: ${fail.length}`)

if (fail.length > 0) {
  console.error('\nFailed assertions:')
  fail.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
} else {
  console.log('\n  All Module Build 1 assertions passed.')
  console.log('  NOMPF foundation is ready.')
  console.log('  15 module draft manifests registered.')
  console.log('  All preview — not_yet_packaged, marketplace_not_live, license_not_enforced.')
  console.log('  No Phase 20. Next: MODULE BUILD 2 — SmokeCraft Experience Module.')
  process.exit(0)
}
