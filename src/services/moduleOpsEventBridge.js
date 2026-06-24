// Module ops event bridge — Phase 3.
//
// Connects module-registry status into the existing shared ops event bus
// (src/services/shared/opsEventBus.js) WITHOUT changing that bus's shape or
// behavior. This file only builds normalized module-lifecycle events and
// hands them to the existing emit()/normalizeEvent() — it does not add a
// second event system and does not bypass the bus's own normalization.
//
// opsEventBus.emit() touches `localStorage`/`window`, both of which are
// wrapped in try/catch inside opsStorage.js and opsEventBus.js themselves,
// so calling emit() in a non-browser (Node) context is safe: it normalizes
// the event and returns it, but the actual persistence/dispatch silently
// no-ops. That means this bridge can be imported and exercised from
// server/scripts/verifyModuleRegistry.js without crashing, while still
// emitting for real in the browser.
//
// Hard rule: this bridge never reports a fake success. Health/deployment
// events only carry whatever status the caller actually observed — there is
// no live health checker or deployment pipeline yet, so callers must pass
// real (or honestly "unknown") status values rather than this file
// inventing one.

import { emit, SYSTEMS } from './shared/opsEventBus.js'

export const MODULE_OPS_EVENT_TYPES = {
  MODULE_REGISTERED: 'module_registered',
  MODULE_ENABLED: 'module_enabled',
  MODULE_DISABLED: 'module_disabled',
  MODULE_HEALTH_CHECKED: 'module_health_checked',
  MODULE_DEPENDENCY_WARNING: 'module_dependency_warning',
  MODULE_VENDOR_READY: 'module_vendor_ready',
  MODULE_DEPLOYMENT_PLACEHOLDER: 'module_deployment_placeholder',
}

function emitModuleEvent(eventType, moduleId, payload = {}) {
  return emit({
    sourceSystem: SYSTEMS.NOVEE,
    targetSystem: SYSTEMS.NOVEE,
    eventType,
    payload: { moduleId, ...payload },
  })
}

/** A module record now exists in the registry. Carries no health/deploy claim. */
export function emitModuleRegistered(moduleId, moduleRecord) {
  return emitModuleEvent(MODULE_OPS_EVENT_TYPES.MODULE_REGISTERED, moduleId, {
    name: moduleRecord?.name ?? null,
    version: moduleRecord?.version ?? null,
    status: moduleRecord?.status ?? null,
  })
}

/** A module transitioned to an enabled/active state. Caller must know this is true. */
export function emitModuleEnabled(moduleId) {
  return emitModuleEvent(MODULE_OPS_EVENT_TYPES.MODULE_ENABLED, moduleId)
}

/** A module transitioned to a disabled state. Caller must know this is true. */
export function emitModuleDisabled(moduleId) {
  return emitModuleEvent(MODULE_OPS_EVENT_TYPES.MODULE_DISABLED, moduleId)
}

/**
 * Records the result of an actual health check. `healthStatus` must come
 * from a real check (or HEALTH_STATUS.UNKNOWN if none was run) — this
 * function does not default it to a fabricated "healthy".
 */
export function emitModuleHealthChecked(moduleId, healthStatus) {
  return emitModuleEvent(MODULE_OPS_EVENT_TYPES.MODULE_HEALTH_CHECKED, moduleId, { healthStatus })
}

/** A dependency rule (e.g. POS3/E.A.T. depending on SmokeCraft) was violated. */
export function emitModuleDependencyWarning(moduleId, message) {
  return emitModuleEvent(MODULE_OPS_EVENT_TYPES.MODULE_DEPENDENCY_WARNING, moduleId, { message })
}

/** A module's vendor config became real/complete. Caller supplies the vendor data observed. */
export function emitModuleVendorReady(moduleId, vendor) {
  return emitModuleEvent(MODULE_OPS_EVENT_TYPES.MODULE_VENDOR_READY, moduleId, { vendor })
}

/**
 * Marks that a module COULD be deployed in the future — never that a
 * deployment happened or succeeded. This is the only deployment-related
 * event this bridge exposes today, by design.
 */
export function emitModuleDeploymentPlaceholder(moduleId, deploymentStatus) {
  return emitModuleEvent(MODULE_OPS_EVENT_TYPES.MODULE_DEPLOYMENT_PLACEHOLDER, moduleId, { deploymentStatus })
}

export default {
  MODULE_OPS_EVENT_TYPES,
  emitModuleRegistered,
  emitModuleEnabled,
  emitModuleDisabled,
  emitModuleHealthChecked,
  emitModuleDependencyWarning,
  emitModuleVendorReady,
  emitModuleDeploymentPlaceholder,
}
