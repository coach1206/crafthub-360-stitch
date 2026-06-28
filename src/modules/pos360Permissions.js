/**
 * POS360 Hospitality Role Permissions — Phase 4.13, Part 2.
 *
 * `roleAccessRules.js` governs which broad *experience* (guest/staff tool/
 * reports/etc.) a coarse platform role may reach. It has no concept of
 * hospitality job roles like server/bartender/kitchen/host — those don't
 * exist anywhere in CraftHub's backend auth model yet. This module adds
 * that missing layer for POS360 specifically.
 *
 * Local/demo only: there is no backend record of "this staff member is a
 * bartender." The active POS360 role is whatever the floor UI currently
 * has selected/assigned for that staff member in local state. Treat every
 * check here as a UI-level guardrail, not real access control — a backend
 * authorization layer keyed to verified staff identity is still required
 * for production.
 */

export const POS360_ROLES = {
  OWNER: 'owner',
  VENUE_ADMIN: 'venue_admin',
  MANAGER: 'manager',
  SERVER: 'server',
  BARTENDER: 'bartender',
  KITCHEN: 'kitchen',
  HUMIDOR_STAFF: 'humidor_staff',
  HOST: 'host',
  SUPPORT_RUNNER: 'support_runner',
}

export const POS360_ACTIONS = {
  FLOOR_EDIT_MODE: 'floor_edit_mode',
  LAYOUT_OBJECT_MOVE: 'layout_object_move',
  LAYOUT_SAVE: 'layout_save',
  OPEN_TABLE: 'open_table',
  ADD_ORDER: 'add_order',
  VOID_ITEM: 'void_item',
  COMP_ITEM: 'comp_item',
  REFUND: 'refund',
  DISCOUNT: 'discount',
  MERGE_TABLES: 'merge_tables',
  TRANSFER_CHECK: 'transfer_check',
  SPLIT_CHECK: 'split_check',
  CLOSE_SHIFT: 'close_shift',
  SETTINGS_PRICING: 'settings_pricing',
  REPORTS_ACCESS: 'reports_access',
  STAFF_REASSIGN: 'staff_reassign',
  VIEW_BAR_QUEUE: 'view_bar_queue',
  UPDATE_DRINK_STATUS: 'update_drink_status',
  VIEW_KITCHEN_QUEUE: 'view_kitchen_queue',
  UPDATE_PREP_STATUS: 'update_prep_status',
  VIEW_HUMIDOR_QUEUE: 'view_humidor_queue',
  UPDATE_HUMIDOR_FULFILLMENT: 'update_humidor_fulfillment',
  RESERVATIONS_WAITLIST: 'reservations_waitlist',
  TABLE_HOLDS: 'table_holds',
  SEAT_GUESTS: 'seat_guests',
  VIEW_ASSIGNED_TASKS: 'view_assigned_tasks',
  UPDATE_DELIVERED_STATUS: 'update_delivered_status',
  APPROVE_MONEY_ACTION: 'approve_money_action',
}

const FULL_ACCESS = Object.values(POS360_ACTIONS)

const MANAGER_ACTIONS = [
  POS360_ACTIONS.FLOOR_EDIT_MODE, POS360_ACTIONS.LAYOUT_OBJECT_MOVE, POS360_ACTIONS.LAYOUT_SAVE,
  POS360_ACTIONS.OPEN_TABLE, POS360_ACTIONS.ADD_ORDER,
  POS360_ACTIONS.VOID_ITEM, POS360_ACTIONS.COMP_ITEM, POS360_ACTIONS.REFUND, POS360_ACTIONS.DISCOUNT,
  POS360_ACTIONS.MERGE_TABLES, POS360_ACTIONS.TRANSFER_CHECK, POS360_ACTIONS.SPLIT_CHECK,
  POS360_ACTIONS.CLOSE_SHIFT, POS360_ACTIONS.STAFF_REASSIGN, POS360_ACTIONS.REPORTS_ACCESS,
  POS360_ACTIONS.RESERVATIONS_WAITLIST, POS360_ACTIONS.TABLE_HOLDS, POS360_ACTIONS.SEAT_GUESTS,
  POS360_ACTIONS.APPROVE_MONEY_ACTION,
]

const SERVER_ACTIONS = [
  POS360_ACTIONS.OPEN_TABLE, POS360_ACTIONS.ADD_ORDER,
  POS360_ACTIONS.VOID_ITEM, POS360_ACTIONS.COMP_ITEM, POS360_ACTIONS.REFUND, POS360_ACTIONS.DISCOUNT,
  POS360_ACTIONS.TRANSFER_CHECK, POS360_ACTIONS.SPLIT_CHECK,
]

const BARTENDER_ACTIONS = [
  POS360_ACTIONS.VIEW_BAR_QUEUE, POS360_ACTIONS.UPDATE_DRINK_STATUS,
]

const KITCHEN_ACTIONS = [
  POS360_ACTIONS.VIEW_KITCHEN_QUEUE, POS360_ACTIONS.UPDATE_PREP_STATUS,
]

const HUMIDOR_ACTIONS = [
  POS360_ACTIONS.VIEW_HUMIDOR_QUEUE, POS360_ACTIONS.UPDATE_HUMIDOR_FULFILLMENT,
]

const HOST_ACTIONS = [
  POS360_ACTIONS.RESERVATIONS_WAITLIST, POS360_ACTIONS.TABLE_HOLDS, POS360_ACTIONS.SEAT_GUESTS,
]

const SUPPORT_RUNNER_ACTIONS = [
  POS360_ACTIONS.VIEW_ASSIGNED_TASKS, POS360_ACTIONS.UPDATE_DELIVERED_STATUS,
]

const POS360_ROLE_ACTIONS = {
  [POS360_ROLES.OWNER]: FULL_ACCESS,
  [POS360_ROLES.VENUE_ADMIN]: FULL_ACCESS,
  [POS360_ROLES.MANAGER]: MANAGER_ACTIONS,
  [POS360_ROLES.SERVER]: SERVER_ACTIONS,
  [POS360_ROLES.BARTENDER]: BARTENDER_ACTIONS,
  [POS360_ROLES.KITCHEN]: KITCHEN_ACTIONS,
  [POS360_ROLES.HUMIDOR_STAFF]: HUMIDOR_ACTIONS,
  [POS360_ROLES.HOST]: HOST_ACTIONS,
  [POS360_ROLES.SUPPORT_RUNNER]: SUPPORT_RUNNER_ACTIONS,
}

// Actions a server may request but never approve for themselves — they
// must go through approvalService and another role's sign-off.
const SERVER_REQUEST_ONLY = new Set([
  POS360_ACTIONS.VOID_ITEM, POS360_ACTIONS.COMP_ITEM, POS360_ACTIONS.REFUND, POS360_ACTIONS.DISCOUNT,
  POS360_ACTIONS.TRANSFER_CHECK,
])

/** Returns true if `role` may perform `action` at all (not whether it needs approval first). */
export function canPerformAction(role, action) {
  const allowed = POS360_ROLE_ACTIONS[role]
  return Array.isArray(allowed) && allowed.includes(action)
}

/** Returns true if `role` must route `action` through the approval engine rather than acting directly. */
export function actionRequiresApprovalForRole(role, action) {
  if (role === POS360_ROLES.SERVER && SERVER_REQUEST_ONLY.has(action)) return true
  if (![POS360_ROLES.OWNER, POS360_ROLES.VENUE_ADMIN, POS360_ROLES.MANAGER].includes(role)) {
    return [POS360_ACTIONS.VOID_ITEM, POS360_ACTIONS.COMP_ITEM, POS360_ACTIONS.REFUND, POS360_ACTIONS.DISCOUNT].includes(action)
  }
  return false
}

export function getAllowedActionsForRole(role) {
  return POS360_ROLE_ACTIONS[role] ?? []
}

export function isValidPos360Role(role) {
  return Object.values(POS360_ROLES).includes(role)
}

export default {
  POS360_ROLES,
  POS360_ACTIONS,
  canPerformAction,
  actionRequiresApprovalForRole,
  getAllowedActionsForRole,
  isValidPos360Role,
}
