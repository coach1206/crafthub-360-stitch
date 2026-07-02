/**
 * Venue Staff Policy Engine
 * Determines what staff roles can create, publish, approve specials and adjust inventory.
 */

import { getVenueStaffPolicySettings } from './venueSettingsService.js'

const PUBLISH_ROLES = ['owner', 'admin', 'manager']
const SUGGEST_ROLES = ['bartender', 'cook', 'server']
const ALL_STAFF_ROLES = [...PUBLISH_ROLES, ...SUGGEST_ROLES]

export async function getStaffPolicy(venueId) {
  const result = await getVenueStaffPolicySettings(venueId)
  return { ok: true, venueId, policy: result.data, storageMode: result.storageMode }
}

export async function canRoleCreateSpecial(venueId, role) {
  if (!ALL_STAFF_ROLES.includes(role)) {
    return { allowed: false, reason: 'unknown_role', role }
  }
  const policy = (await getVenueStaffPolicySettings(venueId)).data

  // Publish roles can always create (they can also publish directly)
  if (PUBLISH_ROLES.includes(role)) {
    return { allowed: true, reason: 'publish_role_can_create', role }
  }

  // Suggest roles check their can_suggest flag
  const fieldMap = { bartender: 'bartender_can_suggest', cook: 'cook_can_suggest', server: 'server_can_suggest' }
  const canSuggest = policy[fieldMap[role]] !== false
  return {
    allowed: canSuggest,
    reason: canSuggest ? 'staff_can_suggest' : 'staff_suggest_disabled',
    role,
    requiresApproval: true,
  }
}

export async function canRolePublishSpecial(venueId, role) {
  if (!ALL_STAFF_ROLES.includes(role)) {
    return { allowed: false, reason: 'unknown_role', role }
  }
  const policy = (await getVenueStaffPolicySettings(venueId)).data

  const publishFieldMap = {
    owner: 'owner_can_publish',
    admin: 'admin_can_publish',
    manager: 'manager_can_publish',
    bartender: 'bartender_can_publish',
    cook: 'cook_can_publish',
    server: 'server_can_publish',
  }

  const canPublish = policy[publishFieldMap[role]] === true
  return {
    allowed: canPublish,
    reason: canPublish ? 'role_can_publish' : 'publish_not_permitted_for_role',
    role,
    requiresApproval: !canPublish && SUGGEST_ROLES.includes(role),
  }
}

export async function canRoleApproveSpecial(venueId, role) {
  const approvingRoles = ['owner', 'admin', 'manager']
  if (!approvingRoles.includes(role)) {
    return { allowed: false, reason: 'role_cannot_approve', role }
  }
  const policy = (await getVenueStaffPolicySettings(venueId)).data

  if (!policy.require_manager_approval_for_staff_specials) {
    return { allowed: true, reason: 'approval_not_required', role }
  }

  const publishFieldMap = { owner: 'owner_can_publish', admin: 'admin_can_publish', manager: 'manager_can_publish' }
  const canApprove = policy[publishFieldMap[role]] === true
  return {
    allowed: canApprove,
    reason: canApprove ? 'role_can_approve' : 'approval_not_permitted_for_role',
    role,
  }
}

export async function canRoleAdjustInventory(venueId, role) {
  const policy = (await getVenueStaffPolicySettings(venueId)).data

  if (PUBLISH_ROLES.includes(role)) {
    return { allowed: true, reason: 'publish_role_can_adjust_inventory', role, requiresApproval: false }
  }

  const requiresApproval = policy.require_manager_approval_for_inventory_adjustments
  return {
    allowed: true,
    reason: requiresApproval ? 'inventory_adjustment_requires_manager_approval' : 'staff_can_adjust_inventory',
    role,
    requiresApproval,
  }
}

export async function getRequiredApprovalStatusForRole(venueId, role) {
  const policy = (await getVenueStaffPolicySettings(venueId)).data

  if (PUBLISH_ROLES.includes(role)) {
    const publishFieldMap = { owner: 'owner_can_publish', admin: 'admin_can_publish', manager: 'manager_can_publish' }
    const canPublish = policy[publishFieldMap[role]] === true
    return {
      role,
      requiredStatus: canPublish ? 'published' : 'pending_approval',
      requiresManagerApproval: !canPublish,
    }
  }

  return {
    role,
    requiredStatus: 'pending_approval',
    requiresManagerApproval: policy.require_manager_approval_for_staff_specials,
  }
}

export async function validateStaffAction(venueId, role, actionType) {
  const allowedActions = ['create_special', 'publish_special', 'approve_special', 'adjust_inventory']
  if (!allowedActions.includes(actionType)) {
    return { ok: false, allowed: false, reason: 'unknown_action_type', actionType }
  }

  let result
  if (actionType === 'create_special') result = await canRoleCreateSpecial(venueId, role)
  else if (actionType === 'publish_special') result = await canRolePublishSpecial(venueId, role)
  else if (actionType === 'approve_special') result = await canRoleApproveSpecial(venueId, role)
  else result = await canRoleAdjustInventory(venueId, role)

  return {
    ok: true,
    venueId,
    role,
    actionType,
    allowed: result.allowed,
    reason: result.reason,
    requiresApproval: result.requiresApproval ?? false,
  }
}
