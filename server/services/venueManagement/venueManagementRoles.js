/**
 * Package 6A — Venue Management Command Hub role/permission constants.
 * Extends the existing venue_memberships.membership_type CHECK values
 * (member/staff/mentor/manager/admin/owner) and venue_permissions
 * (venue_id, role, permission_key, enabled) — no schema change needed,
 * since venue_permissions is already a generic role->permission map.
 * This module is the single source of truth for the new permission keys
 * Package 6 introduces, so controllers never hardcode a string.
 */

// Roles this hub recognizes. 'owner'/'manager'/'admin' already exist in
// venue_memberships; the rest map onto the same column (no DB change).
export const VENUE_MANAGEMENT_ROLES = Object.freeze({
  VENUE_OWNER: 'owner',
  VENUE_MANAGER: 'manager',
  CONTENT_MANAGER: 'content_manager',
  PROMOTIONS_MANAGER: 'promotions_manager',
  INVENTORY_MANAGER: 'inventory_manager',
  EVENTS_MANAGER: 'events_manager',
  STAFF_MANAGER: 'staff_manager',
  VENUE_STAFF: 'staff',
  NOVEE_SUPPORT_OPERATOR: 'novee_support_operator',
  NOVEE_OPERATIONS_OPERATOR: 'novee_operations_operator',
  PLATFORM_ADMIN: 'admin',
})

// Permission keys stored in venue_permissions.permission_key.
export const VENUE_MANAGEMENT_PERMISSIONS = Object.freeze({
  PROFILE_EDIT: 'venue_management.profile.edit',
  MEDIA_UPLOAD: 'venue_management.media.upload',
  MEDIA_DELETE: 'venue_management.media.delete',
  CONTENT_PUBLISH: 'venue_management.content.publish',
  CONTENT_APPROVE: 'venue_management.content.approve',
  STAFF_MANAGE: 'venue_management.staff.manage',
  ANNOUNCEMENTS_MANAGE: 'venue_management.announcements.manage',
  AUDIT_VIEW: 'venue_management.audit.view',
})

// Roles allowed to operate the NOVEE OS Remote Venue Operations Hub.
// Platform-scoped, not venue-membership-scoped — checked against
// req.user.role (global), matching the existing requireRole convention.
export const NOVEE_REMOTE_OPERATOR_ROLES = Object.freeze([
  'novee_support_operator',
  'novee_operations_operator',
  'admin',
  'founder_level_0',
])
