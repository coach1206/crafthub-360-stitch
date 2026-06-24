// Novi OS module bridge — Phase 3.
//
// Read-only observer surface over src/modules/moduleRegistry.js. Novi OS
// (or any future orchestrator) should import from here to OBSERVE module
// state, never to control or duplicate it. Nothing in this file performs
// deployment, device control, or licensing — those remain explicitly out
// of scope until a later phase decides to build them for real.

import { listModules, getModule } from '../modules/moduleRegistry.js'
import { DEPLOYMENT_STATUS, HEALTH_STATUS } from '../modules/moduleIntegrationContract.js'

/** Returns every registered module record, unmodified. */
export function getAllModules() {
  return listModules()
}

/** Returns a single module record by id, or null if not registered. */
export function getModuleById(moduleId) {
  return getModule(moduleId)
}

/**
 * Returns modules whose deploymentStatus is anything other than
 * NOT_APPLICABLE. This does NOT mean "successfully deployed" — it means
 * "has a deployment story at all" (e.g. LOCAL_ONLY, PENDING). Modules like
 * Atmosphere (NOT_APPLICABLE, not built) are correctly excluded.
 */
export function getDeployableModules() {
  return listModules().filter(module => module.deploymentStatus !== DEPLOYMENT_STATUS.NOT_APPLICABLE)
}

/**
 * Returns the module's honest current health status. No live health check
 * exists yet, so this returns whatever the registry record holds — which
 * defaults to HEALTH_STATUS.UNKNOWN unless a real check has populated it.
 */
export function getModuleHealth(moduleId) {
  const module = getModule(moduleId)
  if (!module) return HEALTH_STATUS.UNKNOWN
  return module.healthStatus ?? HEALTH_STATUS.UNKNOWN
}

/** Returns the module's routes object, or null if the module isn't registered. */
export function getModuleRoutes(moduleId) {
  const module = getModule(moduleId)
  return module ? module.routes : null
}

/** Returns the module's permissions object, or null if the module isn't registered. */
export function getModulePermissions(moduleId) {
  const module = getModule(moduleId)
  return module ? module.permissions : null
}

export default {
  getAllModules,
  getModuleById,
  getDeployableModules,
  getModuleHealth,
  getModuleRoutes,
  getModulePermissions,
}
