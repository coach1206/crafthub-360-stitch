// Module security guard — Phase 4.
//
// Pure decision logic (no DOM/storage, no network, no payment calls) that
// answers "can this vendor/role combination use this module right now?"
// by consulting the existing moduleRegistry, vendorModuleAccess registry,
// and roleAccessRules. This is a prototype-safe gate: it has no live
// enforcement hook into any real route yet, and it never approves access
// it cannot justify from real registry/vendor data.

import { getModule } from './moduleRegistry.js'
import { getVendor, isModuleAssignedToVendor, isModuleEnabledForVendor, LICENSE_STATUS, ENVIRONMENT } from './vendorModuleAccess.js'
import { isExperienceAllowedForRole, EXPERIENCE_TYPES } from './roleAccessRules.js'
import { isModuleDisabledForVendor } from './remoteDisableRegistry.js'

export const ACCESS_DENIAL_REASON = {
  MODULE_NOT_FOUND: 'module_not_found',
  VENDOR_NOT_FOUND: 'vendor_not_found',
  MODULE_NOT_ASSIGNED: 'module_not_assigned',
  MODULE_DISABLED: 'module_disabled',
  LICENSE_NOT_ACTIVE: 'license_not_active',
  LICENSE_EXPIRED: 'license_expired',
  ENVIRONMENT_NOT_ALLOWED: 'environment_not_allowed',
  ROLE_NOT_ALLOWED: 'role_not_allowed',
}

function isExpired(expirationDate) {
  if (!expirationDate) return false
  const expiry = new Date(expirationDate)
  if (Number.isNaN(expiry.getTime())) return false
  return expiry.getTime() < Date.now()
}

/**
 * Evaluates whether `vendorId` may use `moduleId` right now, given `role`
 * and the requested `experienceType` (one of roleAccessRules' EXPERIENCE_TYPES)
 * and `environment` (demo/staging/production — defaults to the vendor's own
 * recorded environment if not supplied).
 *
 * Returns { allowed: boolean, reason: string|null } — reason is one of
 * ACCESS_DENIAL_REASON when allowed is false, otherwise null.
 */
export function checkModuleAccess({ vendorId, moduleId, role, experienceType, environment } = {}) {
  const moduleRecord = getModule(moduleId)
  if (!moduleRecord) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.MODULE_NOT_FOUND }
  }

  const vendor = getVendor(vendorId)
  if (!vendor) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.VENDOR_NOT_FOUND }
  }

  if (!isModuleAssignedToVendor(vendorId, moduleId)) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.MODULE_NOT_ASSIGNED }
  }

  if (vendor.disabledModules.includes(moduleId) || !isModuleEnabledForVendor(vendorId, moduleId)) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.MODULE_DISABLED }
  }

  if (isModuleDisabledForVendor(moduleId, vendorId)) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.MODULE_DISABLED }
  }

  if (vendor.licenseStatus !== LICENSE_STATUS.ACTIVE) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.LICENSE_NOT_ACTIVE }
  }

  if (isExpired(vendor.expirationDate)) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.LICENSE_EXPIRED }
  }

  const effectiveEnvironment = environment ?? vendor.environment
  if (!Object.values(ENVIRONMENT).includes(effectiveEnvironment)) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.ENVIRONMENT_NOT_ALLOWED }
  }

  if (experienceType && !isExperienceAllowedForRole(role, experienceType)) {
    return { allowed: false, reason: ACCESS_DENIAL_REASON.ROLE_NOT_ALLOWED }
  }

  return { allowed: true, reason: null }
}

/** Convenience guard matching the Phase 4 instruction's "guest cannot access POS admin" style checks. */
export function canRoleAccessExperience(role, experienceType) {
  return isExperienceAllowedForRole(role, experienceType)
}

export { EXPERIENCE_TYPES }

export default {
  checkModuleAccess,
  canRoleAccessExperience,
  ACCESS_DENIAL_REASON,
}
