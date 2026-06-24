// Role access rules — Phase 4.
//
// Defines, as plain data, which roles may reach which kind of experience.
// This is a prototype rule set for moduleSecurityGuard.js to consult — it
// does not replace or duplicate any existing staff/guest permission check
// already enforced elsewhere in CraftHub (e.g. requiredPermission fields
// in moduleRegistry.js); it adds an explicit, centrally-readable rule
// table for the module-security layer specifically.

export const ROLES = {
  GUEST: 'guest',
  STAFF: 'staff',
  MANAGER: 'manager',
  VENDOR_ADMIN: 'vendor_admin',
  NOVI_ADMIN: 'novi_admin',
  SUPER_ADMIN: 'super_admin',
}

export const EXPERIENCE_TYPES = {
  GUEST_EXPERIENCE: 'guest_experience',
  STAFF_TOOL: 'staff_tool',
  REPORTS_OPERATIONS: 'reports_operations',
  VENDOR_MODULE_MANAGEMENT: 'vendor_module_management',
  MODULE_REGISTRY_MANAGEMENT: 'module_registry_management',
  REMOTE_MODULE_DISABLE: 'remote_module_disable',
}

// Each role lists exactly which experience types it may reach. Nothing
// here grants an experience type to a role that wasn't explicitly listed
// in the Phase 4 instructions — guests get only guest experiences, etc.
const ROLE_EXPERIENCE_MAP = {
  [ROLES.GUEST]: [EXPERIENCE_TYPES.GUEST_EXPERIENCE],
  [ROLES.STAFF]: [EXPERIENCE_TYPES.GUEST_EXPERIENCE, EXPERIENCE_TYPES.STAFF_TOOL],
  [ROLES.MANAGER]: [
    EXPERIENCE_TYPES.GUEST_EXPERIENCE,
    EXPERIENCE_TYPES.STAFF_TOOL,
    EXPERIENCE_TYPES.REPORTS_OPERATIONS,
  ],
  [ROLES.VENDOR_ADMIN]: [
    EXPERIENCE_TYPES.GUEST_EXPERIENCE,
    EXPERIENCE_TYPES.VENDOR_MODULE_MANAGEMENT,
  ],
  [ROLES.NOVI_ADMIN]: [
    EXPERIENCE_TYPES.GUEST_EXPERIENCE,
    EXPERIENCE_TYPES.MODULE_REGISTRY_MANAGEMENT,
  ],
  [ROLES.SUPER_ADMIN]: [
    EXPERIENCE_TYPES.GUEST_EXPERIENCE,
    EXPERIENCE_TYPES.STAFF_TOOL,
    EXPERIENCE_TYPES.REPORTS_OPERATIONS,
    EXPERIENCE_TYPES.VENDOR_MODULE_MANAGEMENT,
    EXPERIENCE_TYPES.MODULE_REGISTRY_MANAGEMENT,
    EXPERIENCE_TYPES.REMOTE_MODULE_DISABLE,
  ],
}

/** Returns true if `role` is permitted to reach `experienceType`. Unknown roles get nothing. */
export function isExperienceAllowedForRole(role, experienceType) {
  const allowed = ROLE_EXPERIENCE_MAP[role]
  return Array.isArray(allowed) && allowed.includes(experienceType)
}

/** Returns the list of experience types a role may reach (empty array for unknown roles). */
export function getAllowedExperiencesForRole(role) {
  return ROLE_EXPERIENCE_MAP[role] ?? []
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(role)
}

export default {
  ROLES,
  EXPERIENCE_TYPES,
  isExperienceAllowedForRole,
  getAllowedExperiencesForRole,
  isValidRole,
}
