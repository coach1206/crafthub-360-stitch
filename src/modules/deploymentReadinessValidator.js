// Deployment readiness validator — Phase 5.
//
// Combines the module registry, the health monitor, and deployment
// profiles into one clear readiness result per module/profile. This does
// not deploy anything — it only reports whether the pieces a deployment
// would need are actually in place today.

import { getModule } from './moduleRegistry.js'
import { getModuleHealthSnapshot } from './moduleHealthMonitor.js'
import { getDeploymentProfile } from './deploymentProfiles.js'

/**
 * Validates a single module's deployment readiness. Returns
 * { moduleId, ready: boolean, checks: { [name]: boolean }, issues: string[] }.
 */
export function validateModuleReadiness(moduleId) {
  const moduleRecord = getModule(moduleId)
  const issues = []

  const moduleRegistered = Boolean(moduleRecord)
  if (!moduleRegistered) issues.push(`Module "${moduleId}" is not registered.`)

  const permissionsConfigured = Boolean(
    moduleRecord?.permissions && typeof moduleRecord.permissions.guestAccess === 'boolean',
  )
  if (moduleRegistered && !permissionsConfigured) issues.push(`Module "${moduleId}" has no valid permissions configuration.`)

  const routesValid = Boolean(moduleRecord?.routes && Object.keys(moduleRecord.routes).length > 0)
  if (moduleRegistered && !routesValid) issues.push(`Module "${moduleId}" has no routes configured.`)

  const health = moduleRegistered ? getModuleHealthSnapshot(moduleId) : null
  const healthValid = Boolean(health?.deploymentReady)
  if (moduleRegistered && !healthValid) {
    issues.push(...(health?.issues ?? [`Module "${moduleId}" health snapshot is not deployment ready.`]))
  }

  // "Security configured" = the module's own permission shape is sane
  // (mirrors moduleHealthMonitor's securityValid check) — this validator
  // does not require a vendor to be assigned, since readiness is about the
  // module itself, not any one vendor's access.
  const securityConfigured = Boolean(health?.securityValid)

  const checks = {
    moduleRegistered,
    securityConfigured,
    permissionsConfigured,
    routesValid,
    healthValid,
  }

  const ready = Object.values(checks).every(Boolean)

  return { moduleId, ready, checks, issues }
}

/**
 * Validates whether a named deployment profile is itself ready — every
 * module it includes must individually be ready, and the profile must
 * exist.
 */
export function validateProfileReadiness(profileId) {
  const profile = getDeploymentProfile(profileId)
  if (!profile) {
    return { profileId, profileExists: false, ready: false, moduleResults: [], issues: [`Deployment profile "${profileId}" does not exist.`] }
  }

  const moduleResults = profile.modules.map(validateModuleReadiness)
  const issues = moduleResults.flatMap(result => result.issues)
  const ready = moduleResults.every(result => result.ready)

  return { profileId, profileExists: true, ready, moduleResults, issues }
}

export default {
  validateModuleReadiness,
  validateProfileReadiness,
}
