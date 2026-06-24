// Module health monitor — Phase 5.
//
// Reports honest, checkable facts about a module's current state. There is
// no live process supervisor and no real uptime tracking — "online/offline"
// here means "does this module have a registered, structurally valid
// config and routes," not "is a server process actually running." Nothing
// in this file invents a positive health signal; every field is derived
// from data that already exists in the registry/validator.

import { getModule } from './moduleRegistry.js'
import { validateModule } from './validateModuleRegistry.js'
import { MODULE_STATUS } from './moduleIntegrationContract.js'

/**
 * Returns an honest health snapshot for one module. Every boolean is
 * derived from real registry/validation data — none are hardcoded true.
 */
export function getModuleHealthSnapshot(moduleId) {
  const moduleRecord = getModule(moduleId)

  if (!moduleRecord) {
    return {
      moduleId,
      online: false,
      configValid: false,
      dependenciesSatisfied: false,
      registryValid: false,
      securityValid: false,
      deploymentReady: false,
      issues: [`Module "${moduleId}" is not registered.`],
    }
  }

  const validationIssues = validateModule(moduleId, moduleRecord)
  const registryValid = validationIssues.length === 0

  // "Config valid" = the module has the minimum descriptive data a real
  // deployment would need (id/name/version/status + at least one route).
  const configValid = Boolean(
    moduleRecord.id && moduleRecord.name && moduleRecord.version && moduleRecord.status &&
    moduleRecord.routes && Object.keys(moduleRecord.routes).length > 0,
  )

  // Dependencies are "satisfied" when every hard dependency this module
  // declares is itself registered. Standalone modules with dependencies: []
  // trivially satisfy this.
  const dependencies = moduleRecord.dependencies ?? []
  const dependenciesSatisfied = dependencies.every(depId => Boolean(getModule(depId)))

  // "Security valid" = permissions are at least declared (guestAccess is a
  // boolean, requiredPermission is null or a string) — this does not run
  // moduleSecurityGuard checks (those need a vendor context), it only
  // confirms the module's own permission shape is present and sane.
  const permissions = moduleRecord.permissions ?? {}
  const securityValid = typeof permissions.guestAccess === 'boolean' &&
    (permissions.requiredPermission === null || typeof permissions.requiredPermission === 'string')

  // "Online" here is honestly defined as "registered and not explicitly
  // disabled/not-built" — there is no real process check.
  const online = moduleRecord.status !== MODULE_STATUS.DISABLED && moduleRecord.status !== MODULE_STATUS.NOT_BUILT

  const deploymentReady = online && configValid && dependenciesSatisfied && registryValid && securityValid

  const issues = [...validationIssues]
  if (!configValid) issues.push(`Module "${moduleId}" config is missing required fields or routes.`)
  if (!dependenciesSatisfied) issues.push(`Module "${moduleId}" has an unregistered dependency.`)
  if (!securityValid) issues.push(`Module "${moduleId}" permissions are not in a valid shape.`)
  if (!online) issues.push(`Module "${moduleId}" status (${moduleRecord.status}) is not deployable today.`)

  return {
    moduleId,
    online,
    configValid,
    dependenciesSatisfied,
    registryValid,
    securityValid,
    deploymentReady,
    issues,
  }
}

export function getHealthSnapshotsForModules(moduleIds) {
  return moduleIds.map(getModuleHealthSnapshot)
}

export default {
  getModuleHealthSnapshot,
  getHealthSnapshotsForModules,
}
