/**
 * NOMPF — NOVEE OS Module Packaging Foundation
 * Module Manifest Schema
 *
 * Defines the canonical shape of a NOVEE OS module manifest.
 * All module builds plug into this schema.
 */

export const MODULE_TYPES = [
  'core_platform',
  'experience_module',
  'commerce_module',
  'management_module',
  'inventory_module',
  'connector_module',
  'intelligence_module',
  'operations_module',
  'marketplace_module',
  'licensing_module',
  'addon_module',
]

export const MODULE_STATUSES = [
  'manifest_ready',
  'registered',
  'installed',
  'enabled',
  'disabled',
  'uninstall_ready',
  'upgrade_available',
  'rollback_available',
  'dependency_blocked',
  'license_blocked',
  'marketplace_draft',
  'white_label_ready',
  'not_yet_packaged',
]

export const MODULE_CATEGORIES = [
  'hospitality',
  'commerce',
  'inventory',
  'operations',
  'intelligence',
  'licensing',
  'marketplace',
  'platform',
]

export const PRICING_MODELS = [
  'included',
  'premium_addon',
  'enterprise_addon',
  'per_venue',
  'per_location',
  'per_module',
  'reseller_license',
  'white_label_license',
]

export function createModuleManifest(overrides = {}) {
  const now = new Date().toISOString()
  return {
    moduleId:               overrides.moduleId               ?? null,
    moduleName:             overrides.moduleName             ?? null,
    moduleSlug:             overrides.moduleSlug             ?? null,
    moduleType:             overrides.moduleType             ?? 'addon_module',
    moduleCategory:         overrides.moduleCategory         ?? 'platform',
    moduleDescription:      overrides.moduleDescription      ?? '',
    moduleVersion:          overrides.moduleVersion          ?? '0.0.0',
    moduleStatus:           overrides.moduleStatus           ?? 'not_yet_packaged',
    coreOrAddon:            overrides.coreOrAddon            ?? 'addon',
    premiumEligible:        overrides.premiumEligible        ?? false,
    enterpriseEligible:     overrides.enterpriseEligible     ?? false,
    whiteLabelEligible:     overrides.whiteLabelEligible     ?? false,
    marketplaceEligible:    overrides.marketplaceEligible    ?? false,
    dependencies:           overrides.dependencies           ?? [],
    optionalDependencies:   overrides.optionalDependencies   ?? [],
    incompatibleModules:    overrides.incompatibleModules    ?? [],
    requiredServices:       overrides.requiredServices       ?? [],
    requiredRoutes:         overrides.requiredRoutes         ?? [],
    requiredComponents:     overrides.requiredComponents     ?? [],
    requiredHooks:          overrides.requiredHooks          ?? [],
    requiredPermissions:    overrides.requiredPermissions    ?? [],
    requiredEnvVars:        overrides.requiredEnvVars        ?? [],
    requiredMigrations:     overrides.requiredMigrations     ?? [],
    requiredDocs:           overrides.requiredDocs           ?? [],
    installHooks:           overrides.installHooks           ?? [],
    uninstallHooks:         overrides.uninstallHooks         ?? [],
    enableHooks:            overrides.enableHooks            ?? [],
    disableHooks:           overrides.disableHooks           ?? [],
    upgradeHooks:           overrides.upgradeHooks           ?? [],
    rollbackHooks:          overrides.rollbackHooks          ?? [],
    licenseRequirements:    overrides.licenseRequirements    ?? { tier: 'none', enforced: false },
    pricingModel:           overrides.pricingModel           ?? 'included',
    tenantScope:            overrides.tenantScope            ?? 'all',
    venueScope:             overrides.venueScope             ?? 'all',
    createdAt:              overrides.createdAt              ?? now,
    updatedAt:              overrides.updatedAt              ?? now,
  }
}

export function validateManifestShape(manifest) {
  const required = ['moduleId', 'moduleName', 'moduleSlug', 'moduleType', 'moduleStatus']
  const missing = required.filter(k => !manifest[k])
  if (missing.length > 0) {
    return { valid: false, missing, error: 'manifest_incomplete' }
  }
  if (!MODULE_TYPES.includes(manifest.moduleType)) {
    return { valid: false, error: 'invalid_module_type', received: manifest.moduleType }
  }
  if (!MODULE_STATUSES.includes(manifest.moduleStatus)) {
    return { valid: false, error: 'invalid_module_status', received: manifest.moduleStatus }
  }
  return { valid: true }
}

export function buildManifestSchemaReport() {
  return {
    schemaName: 'NOVEE OS Module Manifest Schema',
    engine: 'NOMPF',
    moduleTypes: MODULE_TYPES,
    moduleStatuses: MODULE_STATUSES,
    moduleCategories: MODULE_CATEGORIES,
    pricingModels: PRICING_MODELS,
    totalTypeCount: MODULE_TYPES.length,
    totalStatusCount: MODULE_STATUSES.length,
    status: 'schema_ready',
    note: 'This is the foundation schema. Modules are not yet packaged.',
  }
}
