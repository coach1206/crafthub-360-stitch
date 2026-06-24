// Novi OS module registry — Phase 6.
//
// This is Novi OS's own catalog of CraftHub-sourced, externally
// controllable modules. It does NOT copy SmokeCraft/POS3/E.A.T. screens or
// logic — every record here is derived from the existing CraftHub
// registry (src/modules/moduleRegistry.js, via the read-only
// src/services/noviModuleBridge.js) plus the Phase 5 readiness layer, so
// the two registries cannot drift apart. Building a second source of
// truth was deliberately avoided.
//
// Hard rule carried over from Phase 1: Novi OS controls, it does not
// duplicate. This file is read-only data — no deployment, no device
// control, no billing happens as a result of this file existing.

import { getAllModules } from '../services/noviModuleBridge.js'
import { validateModuleReadiness } from './deploymentReadinessValidator.js'
import { DEPLOYMENT_STATUS } from './moduleIntegrationContract.js'

export const SOURCE_SYSTEM = {
  CRAFTHUB: 'CraftHub',
}

export const SECURITY_LEVEL = {
  GUEST_OPEN: 'guest_open',
  STAFF_REQUIRED: 'staff_required',
  NOT_APPLICABLE: 'not_applicable',
}

export const CONTROL_MODE = {
  READ_ONLY: 'read_only',
  PLANNED_DEPLOYABLE: 'planned_deployable',
  NOT_READY: 'not_ready',
}

// Modules CraftHub has confirmed must remain standalone (no hard
// dependency on SmokeCraft or anything else), per Phase 1-5.
const STANDALONE_ALLOWED_IDS = ['pos3', 'eat-command-hub', 'smokecraft']

function deriveSecurityLevel(moduleRecord) {
  if (!moduleRecord.permissions) return SECURITY_LEVEL.NOT_APPLICABLE
  if (moduleRecord.permissions.guestAccess) return SECURITY_LEVEL.GUEST_OPEN
  if (moduleRecord.permissions.requiredPermission) return SECURITY_LEVEL.STAFF_REQUIRED
  return SECURITY_LEVEL.NOT_APPLICABLE
}

function deriveSupportedEnvironments(moduleRecord) {
  // Mirrors deploymentProfiles.js's honest defaults: a module with a real
  // deployment status supports the full environment range; a placeholder
  // (not_applicable) only supports demo, since nothing beyond demo exists.
  if (moduleRecord.deploymentStatus === DEPLOYMENT_STATUS.NOT_APPLICABLE) return ['demo']
  return ['demo', 'staging', 'production']
}

function deriveControlMode(moduleId, readiness) {
  if (!readiness.ready) return CONTROL_MODE.NOT_READY
  return CONTROL_MODE.PLANNED_DEPLOYABLE
}

function buildNoviModuleRecord(moduleRecord) {
  const readiness = validateModuleReadiness(moduleRecord.id)
  const standaloneAllowed = STANDALONE_ALLOWED_IDS.includes(moduleRecord.id)

  return {
    moduleId: moduleRecord.id,
    moduleName: moduleRecord.name,
    sourceSystem: SOURCE_SYSTEM.CRAFTHUB,
    // Version placeholder — mirrors the source module's own version field;
    // Novi OS does not maintain an independent version number yet.
    version: moduleRecord.version,
    readinessStatus: readiness.ready ? 'ready' : 'not_ready',
    deploymentStatus: moduleRecord.deploymentStatus,
    licenseRequired: moduleRecord.id !== 'atmosphere',
    vendorAssignable: readiness.ready,
    standaloneAllowed,
    dependencies: moduleRecord.dependencies ?? [],
    optionalIntegrations: moduleRecord.optionalIntegrations ?? {},
    securityLevel: deriveSecurityLevel(moduleRecord),
    supportedEnvironments: deriveSupportedEnvironments(moduleRecord),
    controlMode: deriveControlMode(moduleRecord.id, readiness),
  }
}

const noviModuleRegistry = Object.fromEntries(
  getAllModules().map(moduleRecord => [moduleRecord.id, buildNoviModuleRecord(moduleRecord)]),
)

export function getNoviModule(moduleId) {
  return noviModuleRegistry[moduleId] || null
}

export function listNoviModules() {
  return Object.values(noviModuleRegistry)
}

export default noviModuleRegistry
