// Novi deployment safety checklist — Phase 9.
//
// Evaluates every precondition a real live deployment would need before it
// could safely happen. Checks backed by real Phase 1-8 data (module
// readiness, vendor assignment, license status, role authorization,
// environment, disable state, audit log) are computed honestly from that
// data. Checks with no real backing system yet (production secrets,
// billing, device APIs, rollback plan) are hardcoded to NOT_READY — this
// file never reports a placeholder as ready just because no failure
// occurred. The overall checklist is intentionally unable to pass in full
// until those placeholders become real integrations in a later phase.

import { getNoviModule } from './noviModuleRegistry.js'
import { getAssignedModuleIds } from './noviVendorModuleAssignments.js'
import { getVendor, LICENSE_STATUS } from './vendorModuleAccess.js'
import { isExperienceAllowedForRole, EXPERIENCE_TYPES, ROLES } from './roleAccessRules.js'
import { isModuleDisabledForVendor, DISABLE_SCOPE, getDisableRecords } from '../services/noviRemoteDisableService.js'
import { getNoviAuditLog } from './noviDeploymentAuditLog.js'

export const CHECK_STATUS = {
  READY: 'ready',
  NOT_READY: 'not_ready',
}

const VALID_ENVIRONMENTS = ['demo', 'staging', 'production']

// The real, enforced session roles (src/config/roleMap.js) are not the
// same vocabulary roleAccessRules.js uses (see Phase 7 audit). This maps
// the two real roles that can reach this checklist to their closest Phase
// 4/6 equivalent, purely so this check can be evaluated — it does not
// invent a new session role.
const REAL_ROLE_TO_PROTOTYPE_ROLE = {
  admin: ROLES.NOVI_ADMIN,
  founder_level_0: ROLES.SUPER_ADMIN,
}

function toStatus(condition) {
  return condition ? CHECK_STATUS.READY : CHECK_STATUS.NOT_READY
}

/**
 * Runs the full safety checklist for one vendor/module/role/environment
 * combination. Returns `{ checks: { [name]: CHECK_STATUS }, allReady: boolean }`.
 * `allReady` is true only if every single check — including the
 * not-yet-real placeholders — reports READY, which today is never true for
 * the placeholder checks, by design.
 */
export function runDeploymentSafetyChecklist({ vendorId, moduleId, role, environment } = {}) {
  const module = moduleId ? getNoviModule(moduleId) : null
  const vendor = vendorId ? getVendor(vendorId) : null

  const moduleReady = toStatus(Boolean(module) && module.controlMode !== 'not_ready')

  const vendorAssigned = toStatus(
    Boolean(vendorId && moduleId && getAssignedModuleIds(vendorId).includes(moduleId)),
  )

  const licenseActive = toStatus(Boolean(vendor && vendor.licenseStatus === LICENSE_STATUS.ACTIVE))

  const prototypeRole = REAL_ROLE_TO_PROTOTYPE_ROLE[role] ?? role
  const roleAuthorized = toStatus(
    Boolean(role) && (
      isExperienceAllowedForRole(prototypeRole, EXPERIENCE_TYPES.MODULE_REGISTRY_MANAGEMENT) ||
      isExperienceAllowedForRole(prototypeRole, EXPERIENCE_TYPES.VENDOR_MODULE_MANAGEMENT)
    ),
  )

  const environmentValid = toStatus(VALID_ENVIRONMENTS.includes(environment))

  const noGlobalDisable = toStatus(
    Boolean(moduleId) && !getDisableRecords().some(r => r.moduleId === moduleId && r.scope === DISABLE_SCOPE.GLOBAL && r.restoreStatus !== 'restored'),
  )

  const noVendorDisable = toStatus(
    Boolean(moduleId && vendorId) && !isModuleDisabledForVendor(moduleId, vendorId),
  )

  // "Ready" here means the log exists and is queryable — not that any
  // specific event has been recorded for this vendor/module yet.
  const auditLogReady = toStatus(Array.isArray(getNoviAuditLog()))

  // No real rollback API, secrets pipeline, billing system, or device API
  // integration exists anywhere in this codebase yet. These stay
  // permanently NOT_READY until a future phase builds the real thing —
  // they are never inferred as "ready" from the absence of an error.
  const rollbackPlanExists = CHECK_STATUS.NOT_READY
  const productionSecretsConfigured = CHECK_STATUS.NOT_READY
  const billingConnected = CHECK_STATUS.NOT_READY
  const deviceApisConnected = CHECK_STATUS.NOT_READY

  const checks = {
    moduleReady,
    vendorAssigned,
    licenseActive,
    roleAuthorized,
    environmentValid,
    noGlobalDisable,
    noVendorDisable,
    auditLogReady,
    rollbackPlanExists,
    productionSecretsConfigured,
    billingConnected,
    deviceApisConnected,
  }

  const allReady = Object.values(checks).every(status => status === CHECK_STATUS.READY)

  return { checks, allReady }
}

/**
 * Convenience check specifically for whether production deployment could
 * proceed. Always false today, since billing/secrets/device-API checks
 * are permanently NOT_READY placeholders.
 */
export function canDeployToProduction(input) {
  const { allReady } = runDeploymentSafetyChecklist(input)
  return allReady
}

export default {
  CHECK_STATUS,
  runDeploymentSafetyChecklist,
  canDeployToProduction,
}
