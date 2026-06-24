// Novi module security policy — Phase 6.
//
// Pure decision rules for who may do what with the Novi module registry.
// Reuses the Phase 4 role vocabulary (src/modules/roleAccessRules.js)
// rather than inventing a second role system. This file does not enforce
// anything by itself — it answers yes/no questions a future route/UI
// guard would call.

import { ROLES } from './roleAccessRules.js'

export const NOVI_ACTION = {
  VIEW_REGISTRY: 'view_registry',
  VIEW_ASSIGNED_MODULES: 'view_assigned_modules',
  DEPLOY_MODULE: 'deploy_module',
  MANAGE_REGISTRY: 'manage_registry',
  DISABLE_MODULE_GLOBALLY: 'disable_module_globally',
}

// Each role lists exactly which Novi actions it may take. Guests get
// nothing — they cannot view or touch the module registry at all.
const ROLE_ACTION_MAP = {
  [ROLES.GUEST]: [],
  [ROLES.STAFF]: [NOVI_ACTION.VIEW_ASSIGNED_MODULES],
  [ROLES.MANAGER]: [NOVI_ACTION.VIEW_ASSIGNED_MODULES],
  [ROLES.VENDOR_ADMIN]: [NOVI_ACTION.VIEW_ASSIGNED_MODULES],
  [ROLES.NOVI_ADMIN]: [NOVI_ACTION.VIEW_REGISTRY, NOVI_ACTION.MANAGE_REGISTRY],
  [ROLES.SUPER_ADMIN]: [
    NOVI_ACTION.VIEW_REGISTRY,
    NOVI_ACTION.MANAGE_REGISTRY,
    NOVI_ACTION.DISABLE_MODULE_GLOBALLY,
  ],
}

/** Returns true if `role` may perform `action` against the Novi module registry. */
export function isNoviActionAllowed(role, action) {
  const allowed = ROLE_ACTION_MAP[role]
  return Array.isArray(allowed) && allowed.includes(action)
}

export function canViewModuleRegistry(role) {
  return isNoviActionAllowed(role, NOVI_ACTION.VIEW_REGISTRY)
}

export function canViewAssignedModulesOnly(role) {
  return isNoviActionAllowed(role, NOVI_ACTION.VIEW_ASSIGNED_MODULES) && !canViewModuleRegistry(role)
}

/** No role is ever allowed to deploy a module today — deployment is intentionally not built yet. */
export function canDeployModule(_role) {
  return false
}

export function canManageModuleRegistry(role) {
  return isNoviActionAllowed(role, NOVI_ACTION.MANAGE_REGISTRY)
}

export function canDisableModuleGlobally(role) {
  return isNoviActionAllowed(role, NOVI_ACTION.DISABLE_MODULE_GLOBALLY)
}

export default {
  NOVI_ACTION,
  isNoviActionAllowed,
  canViewModuleRegistry,
  canViewAssignedModulesOnly,
  canDeployModule,
  canManageModuleRegistry,
  canDisableModuleGlobally,
}
