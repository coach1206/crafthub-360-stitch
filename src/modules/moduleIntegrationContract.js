// CraftHub <-> Novi OS module integration contract — Phase 3.
//
// This file defines the SHAPE every registered module must follow. It does
// not wire anything live: no deployment, no device control, no licensing.
// It exists so moduleRegistry.js entries are structurally consistent and so
// a future Novi OS integration (and the read-only bridge in
// src/services/noviModuleBridge.js) has one stable contract to depend on.
//
// Hard rule carried over from Phase 1/2: Novi OS controls these modules, it
// does not duplicate them. Nothing in this contract stores session data,
// guest data, or copies of screens — only metadata/status about the module.

export const MODULE_STATUS = {
  ACTIVE: 'active',
  STANDALONE: 'standalone',
  NOT_BUILT: 'not_built',
  DISABLED: 'disabled',
}

export const HEALTH_STATUS = {
  UNKNOWN: 'unknown',
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNAVAILABLE: 'unavailable',
}

export const DEPLOYMENT_STATUS = {
  NOT_APPLICABLE: 'not_applicable',
  LOCAL_ONLY: 'local_only',
  PENDING: 'pending',
}

// Required top-level fields every module config must define.
export const REQUIRED_FIELDS = ['id', 'name', 'version', 'status']

/**
 * Returns a fully-populated module record shape with honest defaults.
 * Call this with a partial module config to normalize it to the full
 * contract shape — it never invents values for fields the caller didn't
 * supply (deployment/health/lastSync stay at their "unknown"/"not yet
 * checked" defaults rather than being guessed).
 */
export function createModuleContract(partial = {}) {
  return {
    id: partial.id ?? null,
    name: partial.name ?? null,
    version: partial.version ?? null,
    status: partial.status ?? MODULE_STATUS.NOT_BUILT,

    routes: partial.routes ?? {},
    permissions: partial.permissions ?? { guestAccess: false, requiredPermission: null },

    // Modules this one REQUIRES to function. Should be empty for
    // POS 3 / E.A.T. / Atmosphere per the standalone-module rule.
    dependencies: partial.dependencies ?? [],

    // Modules this one MAY connect to, but does not require.
    optionalIntegrations: partial.optionalIntegrations ?? {},

    vendor: partial.vendor ?? { vendorId: null, vendorName: null, vendorConfig: {} },

    // Deployment/health/sync are intentionally inert today — Phase 3 only
    // defines the shape. No live check has been run, so these report
    // honest "not yet checked" defaults, never a fabricated "success".
    deploymentStatus: partial.deploymentStatus ?? DEPLOYMENT_STATUS.NOT_APPLICABLE,
    healthStatus: partial.healthStatus ?? HEALTH_STATUS.UNKNOWN,
    lastSync: partial.lastSync ?? null,

    featureFlags: partial.featureFlags ?? {},

    // Free-form notes carried over from module-specific config (e.g. the
    // Atmosphere "not built yet" disclosure). Not part of the structural
    // contract, but preserved for honesty/traceability.
    notes: partial.notes ?? null,
  }
}

/** Returns the list of REQUIRED_FIELDS missing or null/undefined on `moduleRecord`. */
export function getMissingRequiredFields(moduleRecord) {
  return REQUIRED_FIELDS.filter(field => moduleRecord?.[field] == null)
}
