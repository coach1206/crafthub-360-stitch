/**
 * pos360StaffLaborGovernanceService.js — Phase B.12 Prompt Y
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { getStaffFlags } from '../../config/pos360StaffFeatureFlags.js'
import {
  isValidRoleType, isValidAssignmentType, isValidAssignmentStatus,
  isValidShiftStatus, isValidPublishStatus, isValidAvailabilityPreference,
  isValidTimeOffType, isValidTimeOffStatus, isValidPunchType,
  isValidPunchSource, isValidPunchStatus, isValidCorrectionType,
  isValidCorrectionStatus, isValidLaborCostSource, isValidLaborSummaryStatus,
  isValidRiskType, isValidLaborInsightType, isValidPayrollProvider,
  isValidProviderStatus, isValidProtectedManagerAction,
} from './pos360StaffContracts.js'

const AREA = 'pos360-staff-labor-governance'
const LOCAL = (extra = {}) => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra })

// ── Audit ─────────────────────────────────────────────────────────────────────
async function auditRecord({ venueId, actorUserId, action, entityType, entityId, meta = {}, isFinancial = false, isPrivate = true }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_staff_audit
       (venue_id, actor_user_id, action, entity_type, entity_id,
        contains_secrets, exposes_private_data, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,FALSE,$6,$7)`,
    [venueId, actorUserId, action, entityType, entityId, isPrivate, isFinancial]
  )
}

// ── Staff profiles ────────────────────────────────────────────────────────────
export async function createStaffProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.staffProfilesEnabled) return { ok: false, error: 'feature_disabled', feature: 'staffProfilesEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_profiles WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, staffProfile: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_profiles
       (venue_id, staff_user_id, display_name, legal_name, staff_code, email, phone,
        emergency_contact_snapshot, preferred_language, active, hire_date, staff_notes,
        idempotency_key, exposes_private_data, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,$14) RETURNING *`,
    [venueId, payload.staffUserId, payload.displayName, payload.legalName, payload.staffCode,
     payload.email, payload.phone, JSON.stringify(payload.emergencyContact || {}),
     payload.preferredLanguage || 'en-US', true, payload.hireDate, payload.staffNotes,
     idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_staff_profile', entityType: 'staff_profile', entityId: String(r.rows[0].id) })
  return { ok: true, staffProfile: r.rows[0], note: 'Staff PII is protected. Personal data is access-controlled.' }
}

export async function getStaffProfile({ venueId, staffProfileId }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(`SELECT * FROM pos360_staff_profiles WHERE id=$1 AND venue_id=$2`, [staffProfileId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, staffProfile: r.rows[0] }
}

export async function listStaffProfiles({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ staffProfiles: [] })
  let q = `SELECT * FROM pos360_staff_profiles WHERE venue_id=$1`
  const params = [venueId]
  if (filters.active !== undefined) { params.push(filters.active); q += ` AND active=$${params.length}` }
  q += ` ORDER BY display_name ASC`
  const r = await query(q, params)
  return { ok: true, staffProfiles: r.rows }
}

export async function updateStaffProfile({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_staff_profiles SET
       display_name=COALESCE($1,display_name),
       email=COALESCE($2,email),
       phone=COALESCE($3,phone),
       staff_notes=COALESCE($4,staff_notes),
       preferred_language=COALESCE($5,preferred_language),
       updated_by=$6, updated_at=NOW()
     WHERE id=$7 AND venue_id=$8 RETURNING *`,
    [payload.displayName, payload.email, payload.phone, payload.staffNotes,
     payload.preferredLanguage, actorUserId, staffProfileId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_staff_profile', entityType: 'staff_profile', entityId: String(staffProfileId) })
  return { ok: true, staffProfile: r.rows[0] }
}

export async function deactivateStaffProfile({ venueId, staffProfileId, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_staff_profiles SET active=FALSE, termination_date=NOW(), updated_by=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [actorUserId, staffProfileId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId, action: 'deactivate_staff_profile', entityType: 'staff_profile', entityId: String(staffProfileId) })
  return { ok: true, staffProfile: r.rows[0] }
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export async function createStaffRole({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidRoleType(payload.roleType)) return { ok: false, error: 'invalid_role_type' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_roles WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, staffRole: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_roles
       (venue_id, role_name, role_key, role_type, description, is_manager_role, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [venueId, payload.roleName, payload.roleKey, payload.roleType, payload.description,
     payload.isManagerRole || false, idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_staff_role', entityType: 'staff_role', entityId: String(r.rows[0].id), isPrivate: false })
  return { ok: true, staffRole: r.rows[0] }
}

export async function listStaffRoles({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ staffRoles: [] })
  const r = await query(`SELECT * FROM pos360_staff_roles WHERE venue_id=$1 AND active=TRUE ORDER BY role_name ASC`, [venueId])
  return { ok: true, staffRoles: r.rows }
}

export async function updateStaffRole({ venueId, roleId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_staff_roles SET role_name=COALESCE($1,role_name), description=COALESCE($2,description), updated_by=$3, updated_at=NOW() WHERE id=$4 AND venue_id=$5 RETURNING *`,
    [payload.roleName, payload.description, actorUserId, roleId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_staff_role', entityType: 'staff_role', entityId: String(roleId), isPrivate: false })
  return { ok: true, staffRole: r.rows[0] }
}

export async function listRoleTemplates({ filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ roleTemplates: [] })
  const r = await query(`SELECT * FROM pos360_staff_role_templates WHERE active=TRUE ORDER BY template_name ASC`)
  return { ok: true, roleTemplates: r.rows }
}

export async function seedVenueRoleTemplatesPlaceholder({ venueId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  return {
    ok: true,
    note: 'Role template seeding is a placeholder. No templates have been applied. Configure roles manually.',
    venueId,
    seeded: false,
  }
}

// ── Permissions ───────────────────────────────────────────────────────────────
export async function listStaffPermissions({ filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ permissions: [] })
  const r = await query(`SELECT * FROM pos360_staff_permissions WHERE active=TRUE ORDER BY permission_group, permission_key`)
  return { ok: true, permissions: r.rows }
}

export async function grantRolePermission({ venueId, roleId, permissionKey, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_role_permissions WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, rolePermission: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_role_permissions (venue_id, role_id, permission_key, allowed, granted_by, idempotency_key)
     VALUES ($1,$2,$3,TRUE,$4,$5)
     ON CONFLICT DO NOTHING RETURNING *`,
    [venueId, roleId, permissionKey, actorUserId, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'grant_role_permission', entityType: 'role_permission', entityId: `${roleId}:${permissionKey}`, isPrivate: false })
  return { ok: true, rolePermission: r.rows[0] || { venueId, roleId, permissionKey } }
}

export async function revokeRolePermission({ venueId, roleId, permissionKey, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  await query(`DELETE FROM pos360_staff_role_permissions WHERE venue_id=$1 AND role_id=$2 AND permission_key=$3`, [venueId, roleId, permissionKey])
  await auditRecord({ venueId, actorUserId, action: 'revoke_role_permission', entityType: 'role_permission', entityId: `${roleId}:${permissionKey}`, isPrivate: false })
  return { ok: true, revoked: true, permissionKey, roleId }
}

export async function createPermissionOverride({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.permissionOverridesEnabled) return { ok: false, error: 'feature_disabled', feature: 'permissionOverridesEnabled' }
  if (!flags.managerGovernanceEnabled) {
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: 'permission_override' }
  }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_permission_overrides WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, permissionOverride: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_permission_overrides
       (venue_id, staff_profile_id, permission_key, override_type, reason, starts_at, ends_at, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [venueId, staffProfileId, payload.permissionKey, payload.overrideType, payload.reason,
     payload.startsAt, payload.endsAt, idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_permission_override', entityType: 'permission_override', entityId: String(r.rows[0].id) })
  return { ok: true, permissionOverride: r.rows[0] }
}

export async function decidePermissionOverride({ venueId, overrideId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_staff_permission_overrides
     SET manager_approved_by=$1, manager_approved_at=NOW(), active=$2, updated_at=NOW()
     WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [managerUserId, decision === 'approve', overrideId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: `${decision}_permission_override`, entityType: 'permission_override', entityId: String(overrideId) })
  return { ok: true, permissionOverride: r.rows[0] }
}

export async function evaluateStaffPermission({ venueId, staffProfileId, permissionKey }) {
  if (!isDbAvailable()) return LOCAL()
  const override = await query(
    `SELECT * FROM pos360_staff_permission_overrides WHERE venue_id=$1 AND staff_profile_id=$2 AND permission_key=$3 AND active=TRUE ORDER BY created_at DESC LIMIT 1`,
    [venueId, staffProfileId, permissionKey]
  )
  if (override.rows.length) {
    const o = override.rows[0]
    return { ok: true, permissionKey, allowed: o.override_type === 'grant', source: 'override' }
  }
  return { ok: true, permissionKey, allowed: false, source: 'role_default', note: 'Role permission evaluation requires full role lookup.' }
}

// ── Assignments ───────────────────────────────────────────────────────────────
export async function createStaffAssignment({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidAssignmentType(payload.assignmentType)) return { ok: false, error: 'invalid_assignment_type' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_assignments WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, staffAssignment: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_assignments
       (venue_id, staff_profile_id, role_id, assignment_type, section_id, table_id,
        reservation_id, waitlist_entry_id, private_event_id, order_id,
        payment_record_id, cash_drawer_id, closeout_id,
        assignment_status, starts_at, ends_at, assigned_by, assignment_notes, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'assigned',$14,$15,$16,$17,$18) RETURNING *`,
    [venueId, staffProfileId, payload.roleId, payload.assignmentType,
     payload.sectionId, payload.tableId, payload.reservationId, payload.waitlistEntryId,
     payload.privateEventId, payload.orderId, payload.paymentRecordId,
     payload.cashDrawerId, payload.closeoutId,
     payload.startsAt, payload.endsAt, actorUserId, payload.notes, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_staff_assignment', entityType: 'staff_assignment', entityId: String(r.rows[0].id), isPrivate: false })
  return { ok: true, staffAssignment: r.rows[0] }
}

export async function listStaffAssignments({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ staffAssignments: [] })
  let q = `SELECT * FROM pos360_staff_assignments WHERE venue_id=$1`
  const params = [venueId]
  if (filters.staffProfileId) { params.push(filters.staffProfileId); q += ` AND staff_profile_id=$${params.length}` }
  if (filters.assignmentType) { params.push(filters.assignmentType); q += ` AND assignment_type=$${params.length}` }
  if (filters.privateEventId) { params.push(filters.privateEventId); q += ` AND private_event_id=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, staffAssignments: r.rows }
}

export async function updateStaffAssignmentStatus({ venueId, assignmentId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidAssignmentStatus(status)) return { ok: false, error: 'invalid_assignment_status' }
  const r = await query(
    `UPDATE pos360_staff_assignments SET assignment_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, assignmentId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_assignment_status', entityType: 'staff_assignment', entityId: String(assignmentId), isPrivate: false })
  return { ok: true, staffAssignment: r.rows[0] }
}

export async function transferStaffAssignment({ venueId, assignmentId, newStaffProfileId, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  await query(`UPDATE pos360_staff_assignments SET assignment_status='transferred', updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [assignmentId, venueId])
  const flags = getStaffFlags()
  const r = await query(
    `INSERT INTO pos360_staff_assignments
       (venue_id, staff_profile_id, assignment_type, assignment_status, assigned_by, assignment_notes)
     SELECT venue_id, $1, assignment_type, 'assigned', $2, $3
     FROM pos360_staff_assignments WHERE id=$4 RETURNING *`,
    [newStaffProfileId, actorUserId, reason, assignmentId]
  )
  await auditRecord({ venueId, actorUserId, action: 'transfer_staff_assignment', entityType: 'staff_assignment', entityId: String(assignmentId), isPrivate: false })
  return { ok: true, newAssignment: r.rows[0] }
}

// ── Scheduling ────────────────────────────────────────────────────────────────
export async function createScheduleTemplate({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_schedule_templates WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, scheduleTemplate: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_schedule_templates (venue_id, template_name, template_type, shift_patterns, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [venueId, payload.templateName, payload.templateType || 'weekly', JSON.stringify(payload.shiftPatterns || []), idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_schedule_template', entityType: 'schedule_template', entityId: String(r.rows[0].id), isPrivate: false })
  return { ok: true, scheduleTemplate: r.rows[0] }
}

export async function listScheduleTemplates({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ scheduleTemplates: [] })
  const r = await query(`SELECT * FROM pos360_staff_schedule_templates WHERE venue_id=$1 AND active=TRUE ORDER BY template_name ASC`, [venueId])
  return { ok: true, scheduleTemplates: r.rows }
}

export async function createScheduledShift({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.schedulingEnabled) return { ok: false, error: 'feature_disabled', feature: 'schedulingEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_scheduled_shifts WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, scheduledShift: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_scheduled_shifts
       (venue_id, staff_profile_id, role_id, shift_date, start_time, end_time, scheduled_minutes,
        section_id, position_label, shift_status, publish_status, notes, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft','draft',$10,$11,$12) RETURNING *`,
    [venueId, staffProfileId, payload.roleId, payload.shiftDate, payload.startTime, payload.endTime,
     payload.scheduledMinutes || 0, payload.sectionId, payload.positionLabel,
     payload.notes, idempotencyKey, actorUserId]
  )
  await query(
    `INSERT INTO pos360_staff_shift_status_history (venue_id, scheduled_shift_id, to_status, changed_by) VALUES ($1,$2,'draft',$3)`,
    [venueId, r.rows[0].id, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_scheduled_shift', entityType: 'scheduled_shift', entityId: String(r.rows[0].id), isPrivate: false })
  return { ok: true, scheduledShift: r.rows[0] }
}

export async function listScheduledShifts({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ scheduledShifts: [] })
  let q = `SELECT * FROM pos360_staff_scheduled_shifts WHERE venue_id=$1`
  const params = [venueId]
  if (filters.staffProfileId) { params.push(filters.staffProfileId); q += ` AND staff_profile_id=$${params.length}` }
  if (filters.shiftDate) { params.push(filters.shiftDate); q += ` AND shift_date=$${params.length}` }
  if (filters.shiftStatus) { params.push(filters.shiftStatus); q += ` AND shift_status=$${params.length}` }
  q += ` ORDER BY shift_date ASC, start_time ASC`
  const r = await query(q, params)
  return { ok: true, scheduledShifts: r.rows }
}

export async function updateShiftStatus({ venueId, scheduledShiftId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidShiftStatus(status)) return { ok: false, error: 'invalid_shift_status' }
  const r = await query(
    `UPDATE pos360_staff_scheduled_shifts SET shift_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [status, actorUserId, scheduledShiftId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await query(
    `INSERT INTO pos360_staff_shift_status_history (venue_id, scheduled_shift_id, to_status, changed_by, reason) VALUES ($1,$2,$3,$4,$5)`,
    [venueId, scheduledShiftId, status, actorUserId, reason]
  )
  await auditRecord({ venueId, actorUserId, action: 'update_shift_status', entityType: 'scheduled_shift', entityId: String(scheduledShiftId), isPrivate: false })
  return { ok: true, scheduledShift: r.rows[0] }
}

export async function publishSchedulePlaceholder({ venueId, filters, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.schedulePublishPlaceholderEnabled) return { ok: false, error: 'feature_disabled', feature: 'schedulePublishPlaceholderEnabled' }
  await query(
    `UPDATE pos360_staff_scheduled_shifts
     SET publish_status='published_placeholder', shift_status='published_placeholder', updated_at=NOW()
     WHERE venue_id=$1 AND shift_status='scheduled'`,
    [venueId]
  )
  return {
    ok: true,
    note: 'Schedule notification has not been sent. Notification provider is not connected. SMS/email delivery is not connected. This is a publish placeholder only.',
    publishedPlaceholder: true,
  }
}

// ── Availability / Time Off ───────────────────────────────────────────────────
export async function createStaffAvailability({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidAvailabilityPreference(payload.preferenceLevel)) return { ok: false, error: 'invalid_preference_level' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_availability WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, availability: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_availability
       (venue_id, staff_profile_id, day_of_week, available_start_time, available_end_time, preference_level, notes, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [venueId, staffProfileId, payload.dayOfWeek, payload.availableStartTime, payload.availableEndTime,
     payload.preferenceLevel, payload.notes, idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_staff_availability', entityType: 'staff_availability', entityId: String(r.rows[0].id) })
  return { ok: true, availability: r.rows[0] }
}

export async function listStaffAvailability({ venueId, staffProfileId }) {
  if (!isDbAvailable()) return LOCAL({ availability: [] })
  const r = await query(`SELECT * FROM pos360_staff_availability WHERE venue_id=$1 AND staff_profile_id=$2 AND active=TRUE ORDER BY day_of_week ASC`, [venueId, staffProfileId])
  return { ok: true, availability: r.rows }
}

export async function createTimeOffRequest({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidTimeOffType(payload.requestType)) return { ok: false, error: 'invalid_time_off_type' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_time_off_requests WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, timeOffRequest: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_time_off_requests
       (venue_id, staff_profile_id, request_start_date, request_end_date, request_type, reason, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [venueId, staffProfileId, payload.requestStartDate, payload.requestEndDate,
     payload.requestType, payload.reason, idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_time_off_request', entityType: 'time_off_request', entityId: String(r.rows[0].id) })
  return { ok: true, timeOffRequest: r.rows[0] }
}

export async function listTimeOffRequests({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ timeOffRequests: [] })
  let q = `SELECT * FROM pos360_staff_time_off_requests WHERE venue_id=$1`
  const params = [venueId]
  if (filters.staffProfileId) { params.push(filters.staffProfileId); q += ` AND staff_profile_id=$${params.length}` }
  if (filters.requestStatus) { params.push(filters.requestStatus); q += ` AND request_status=$${params.length}` }
  q += ` ORDER BY request_start_date ASC`
  const r = await query(q, params)
  return { ok: true, timeOffRequests: r.rows }
}

export async function decideTimeOffRequest({ venueId, timeOffRequestId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const status = decision === 'approve' ? 'approved' : 'denied'
  const r = await query(
    `UPDATE pos360_staff_time_off_requests
     SET request_status=$1, manager_approved_by=$2, manager_approved_at=NOW(), updated_at=NOW()
     WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [status, managerUserId, timeOffRequestId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: `${decision}_time_off`, entityType: 'time_off_request', entityId: String(timeOffRequestId) })
  return { ok: true, timeOffRequest: r.rows[0] }
}

// ── Time Clock ────────────────────────────────────────────────────────────────
export async function createTimeClockPunch({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidPunchType(payload.punchType)) return { ok: false, error: 'invalid_punch_type' }
  const flags = getStaffFlags()
  if (!flags.timeClockEnabled) return { ok: false, error: 'feature_disabled', feature: 'timeClockEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_time_clock_punches WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, timeClockPunch: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_time_clock_punches
       (venue_id, staff_profile_id, scheduled_shift_id, punch_type, punch_time, punch_source,
        punch_status, location_metadata, idempotency_key, exposes_private_data, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'recorded',$7,$8,TRUE,$9) RETURNING *`,
    [venueId, staffProfileId, payload.scheduledShiftId, payload.punchType,
     payload.punchTime || new Date().toISOString(),
     payload.punchSource || 'staff',
     JSON.stringify(payload.locationMetadata || {}),
     idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: `time_clock_${payload.punchType}`, entityType: 'time_clock_punch', entityId: String(r.rows[0].id) })
  return { ok: true, timeClockPunch: r.rows[0] }
}

export async function listTimeClockPunches({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ timeClockPunches: [] })
  let q = `SELECT * FROM pos360_staff_time_clock_punches WHERE venue_id=$1`
  const params = [venueId]
  if (filters.staffProfileId) { params.push(filters.staffProfileId); q += ` AND staff_profile_id=$${params.length}` }
  if (filters.punchType) { params.push(filters.punchType); q += ` AND punch_type=$${params.length}` }
  q += ` ORDER BY punch_time DESC`
  const r = await query(q, params)
  return { ok: true, timeClockPunches: r.rows }
}

export async function createTimeClockCorrection({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidCorrectionType(payload.correctionType)) return { ok: false, error: 'invalid_correction_type' }
  const flags = getStaffFlags()
  if (flags.managerApprovalForTimeCorrectionsEnabled) {
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: 'time_clock_correction' }
  }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_time_clock_corrections WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, timeClockCorrection: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_time_clock_corrections
       (venue_id, staff_profile_id, time_clock_punch_id, correction_type, previous_snapshot,
        corrected_snapshot, correction_reason, manager_approval_required, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8,$9) RETURNING *`,
    [venueId, staffProfileId, payload.timeClockPunchId, payload.correctionType,
     JSON.stringify(payload.previousSnapshot || {}), JSON.stringify(payload.correctedSnapshot || {}),
     payload.correctionReason, idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_time_clock_correction', entityType: 'time_clock_correction', entityId: String(r.rows[0].id) })
  return { ok: true, timeClockCorrection: r.rows[0] }
}

export async function decideTimeClockCorrection({ venueId, correctionId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const status = decision === 'approve' ? 'approved' : 'rejected'
  const r = await query(
    `UPDATE pos360_staff_time_clock_corrections
     SET correction_status=$1, manager_approved_by=$2, manager_approved_at=NOW(), updated_at=NOW()
     WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [status, managerUserId, correctionId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: `${decision}_time_correction`, entityType: 'time_clock_correction', entityId: String(correctionId) })
  return { ok: true, timeClockCorrection: r.rows[0] }
}

export async function createBreakRecord({ venueId, staffProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.breakTrackingEnabled) return { ok: false, error: 'feature_disabled', feature: 'breakTrackingEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_break_records WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, breakRecord: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_break_records
       (venue_id, staff_profile_id, scheduled_shift_id, break_type, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [venueId, staffProfileId, payload.scheduledShiftId, payload.breakType || 'unpaid', idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_break_record', entityType: 'break_record', entityId: String(r.rows[0].id) })
  return { ok: true, breakRecord: r.rows[0] }
}

export async function listBreakRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ breakRecords: [] })
  let q = `SELECT * FROM pos360_staff_break_records WHERE venue_id=$1`
  const params = [venueId]
  if (filters.staffProfileId) { params.push(filters.staffProfileId); q += ` AND staff_profile_id=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, breakRecords: r.rows }
}

// ── Labor ─────────────────────────────────────────────────────────────────────
export async function createLaborSummaryPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.laborSummaryEnabled) return { ok: false, error: 'feature_disabled', feature: 'laborSummaryEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_labor_summaries WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, laborSummary: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_labor_summaries
       (venue_id, staff_profile_id, role_id, summary_date, scheduled_minutes, actual_minutes,
        break_minutes, overtime_minutes, labor_cost_source, payroll_connected, summary_status,
        idempotency_key, exposes_financial_data, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'none',FALSE,'calculated_placeholder',$9,TRUE,$10) RETURNING *`,
    [venueId, payload.staffProfileId, payload.roleId, payload.summaryDate,
     payload.scheduledMinutes || 0, payload.actualMinutes || 0,
     payload.breakMinutes || 0, payload.overtimeMinutes || 0,
     idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_labor_summary', entityType: 'labor_summary', entityId: String(r.rows[0].id), isFinancial: true })
  return {
    ok: true,
    laborSummary: r.rows[0],
    note: 'Labor cost is a placeholder only. No wage data is connected. No payroll has been processed.',
  }
}

export async function listLaborSummaries({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ laborSummaries: [] })
  let q = `SELECT * FROM pos360_staff_labor_summaries WHERE venue_id=$1`
  const params = [venueId]
  if (filters.staffProfileId) { params.push(filters.staffProfileId); q += ` AND staff_profile_id=$${params.length}` }
  if (filters.summaryDate) { params.push(filters.summaryDate); q += ` AND summary_date=$${params.length}` }
  q += ` ORDER BY summary_date DESC`
  const r = await query(q, params)
  return { ok: true, laborSummaries: r.rows, note: 'Labor cost is a placeholder only. No wage data is connected.' }
}

export async function lockLaborSummary({ venueId, laborSummaryId, managerUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_staff_labor_summaries SET summary_status='locked', locked_by=$1, locked_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [managerUserId, laborSummaryId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: 'lock_labor_summary', entityType: 'labor_summary', entityId: String(laborSummaryId), isFinancial: true })
  return { ok: true, laborSummary: r.rows[0] }
}

// ── Manager Governance ────────────────────────────────────────────────────────
export async function createManagerGovernanceRule({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidProtectedManagerAction(payload.protectedAction)) return { ok: false, error: 'invalid_protected_action' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_manager_governance_rules WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, governanceRule: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_manager_governance_rules
       (venue_id, governance_key, protected_action, requires_manager_approval, required_role_type, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [venueId, payload.governanceKey, payload.protectedAction, payload.requiresManagerApproval !== false,
     payload.requiredRoleType, idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_governance_rule', entityType: 'governance_rule', entityId: String(r.rows[0].id), isPrivate: false })
  return { ok: true, governanceRule: r.rows[0] }
}

export async function listManagerGovernanceRules({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ governanceRules: [] })
  const r = await query(`SELECT * FROM pos360_manager_governance_rules WHERE venue_id=$1 AND active=TRUE ORDER BY protected_action ASC`, [venueId])
  return { ok: true, governanceRules: r.rows }
}

export async function createManagerApprovalRequest({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_manager_approval_requests WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, approvalRequest: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_manager_approval_requests
       (venue_id, requested_by_staff_profile_id, protected_action, entity_type, entity_id,
        request_reason, before_snapshot, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [venueId, payload.requestedByStaffProfileId, payload.protectedAction, payload.entityType,
     payload.entityId, payload.requestReason, JSON.stringify(payload.beforeSnapshot || {}), idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_manager_approval_request', entityType: 'manager_approval_request', entityId: String(r.rows[0].id) })
  return { ok: true, approvalRequest: r.rows[0] }
}

export async function listManagerApprovalRequests({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ approvalRequests: [] })
  let q = `SELECT * FROM pos360_manager_approval_requests WHERE venue_id=$1`
  const params = [venueId]
  if (filters.approvalStatus) { params.push(filters.approvalStatus); q += ` AND approval_status=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, approvalRequests: r.rows }
}

export async function decideManagerApprovalRequest({ venueId, approvalRequestId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const status = decision === 'approve' ? 'approved' : 'rejected'
  const r = await query(
    `UPDATE pos360_manager_approval_requests
     SET approval_status=$1, manager_staff_profile_id=(SELECT id FROM pos360_staff_profiles WHERE staff_user_id=$2 AND venue_id=$3 LIMIT 1),
         decision_reason=$4, decided_at=NOW(), updated_at=NOW()
     WHERE id=$5 AND venue_id=$3 RETURNING *`,
    [status, managerUserId, venueId, reason, approvalRequestId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: `${decision}_manager_approval`, entityType: 'manager_approval_request', entityId: String(approvalRequestId) })
  return { ok: true, approvalRequest: r.rows[0] }
}

// ── Risk Flags ────────────────────────────────────────────────────────────────
export async function createStaffRiskFlag({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidRiskType(payload.riskType)) return { ok: false, error: 'invalid_risk_type' }
  const flags = getStaffFlags()
  if (!flags.staffRiskFlagsEnabled) return { ok: false, error: 'feature_disabled', feature: 'staffRiskFlagsEnabled' }
  const r = await query(
    `INSERT INTO pos360_staff_risk_flags (venue_id, staff_profile_id, risk_type, risk_payload)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [venueId, payload.staffProfileId, payload.riskType, JSON.stringify(payload.riskPayload || {})]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_staff_risk_flag', entityType: 'staff_risk_flag', entityId: String(r.rows[0].id) })
  return { ok: true, riskFlag: r.rows[0] }
}

export async function listStaffRiskFlags({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ riskFlags: [] })
  let q = `SELECT * FROM pos360_staff_risk_flags WHERE venue_id=$1`
  const params = [venueId]
  if (filters.riskStatus) { params.push(filters.riskStatus); q += ` AND risk_status=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, riskFlags: r.rows }
}

export async function reviewStaffRiskFlag({ venueId, riskFlagId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const status = decision === 'dismiss' ? 'dismissed' : decision === 'escalate' ? 'escalated' : 'reviewed'
  const r = await query(
    `UPDATE pos360_staff_risk_flags SET risk_status=$1, reviewed_by=$2, reviewed_at=NOW(), updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [status, managerUserId, riskFlagId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: 'review_staff_risk_flag', entityType: 'staff_risk_flag', entityId: String(riskFlagId) })
  return { ok: true, riskFlag: r.rows[0] }
}

// ── Labor Insights ────────────────────────────────────────────────────────────
export async function createLaborInsightPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.eatLaborInsightsEnabled) {
    return {
      ok: false, error: 'feature_disabled', feature: 'eatLaborInsightsEnabled',
      note: 'E.A.T. labor insights are not connected yet.',
    }
  }
  const r = await query(
    `INSERT INTO pos360_staff_labor_insights (venue_id, insight_type, insight_payload, contains_ai_generated_content, source, honest_state)
     VALUES ($1,$2,$3,FALSE,'system','placeholder') RETURNING *`,
    [venueId, payload.insightType, JSON.stringify(payload.insightPayload || {})]
  )
  return { ok: true, laborInsight: r.rows[0], note: 'E.A.T. labor insights are not connected yet.' }
}

export async function listLaborInsights({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ laborInsights: [] })
  const r = await query(`SELECT * FROM pos360_staff_labor_insights WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, laborInsights: r.rows, note: 'E.A.T. labor insights are not connected yet.' }
}

export async function getLaborIntelligenceSummary({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const [profiles, shifts, punches, summaries, flags] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM pos360_staff_profiles WHERE venue_id=$1 AND active=TRUE`, [venueId]),
    query(`SELECT COUNT(*) as count FROM pos360_staff_scheduled_shifts WHERE venue_id=$1 AND shift_date=CURRENT_DATE`, [venueId]),
    query(`SELECT COUNT(*) as count FROM pos360_staff_time_clock_punches WHERE venue_id=$1 AND DATE(punch_time)=CURRENT_DATE AND punch_type='clock_in'`, [venueId]),
    query(`SELECT SUM(actual_minutes) as total FROM pos360_staff_labor_summaries WHERE venue_id=$1 AND summary_date=CURRENT_DATE`, [venueId]),
    query(`SELECT COUNT(*) as count FROM pos360_staff_risk_flags WHERE venue_id=$1 AND risk_status='open'`, [venueId]),
  ])
  return {
    ok: true,
    summary: {
      activeStaff: parseInt(profiles.rows[0].count),
      shiftsToday: parseInt(shifts.rows[0].count),
      clockedInToday: parseInt(punches.rows[0].count),
      totalLaborMinutesToday: parseInt(summaries.rows[0].total || 0),
      openRiskFlags: parseInt(flags.rows[0].count),
    },
    note: 'Labor cost is a placeholder only. No wage data is connected. E.A.T. AI insights not connected.',
  }
}

// ── Payroll Provider ──────────────────────────────────────────────────────────
export async function createPayrollProviderProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidPayrollProvider(payload.providerName)) return { ok: false, error: 'invalid_provider_name' }
  const flags = getStaffFlags()
  if (!flags.payrollProviderContractsEnabled) return { ok: false, error: 'feature_disabled', feature: 'payrollProviderContractsEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_payroll_provider_profiles WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, payrollProvider: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_payroll_provider_profiles
       (venue_id, provider_name, provider_status, display_name, stores_secrets, idempotency_key, created_by)
     VALUES ($1,$2,'not_connected',$3,FALSE,$4,$5) RETURNING *`,
    [venueId, payload.providerName, payload.displayName, idempotencyKey, actorUserId]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_payroll_provider', entityType: 'payroll_provider', entityId: String(r.rows[0].id), isFinancial: true })
  return {
    ok: true,
    payrollProvider: r.rows[0],
    note: 'Payroll provider is not connected. No wages have been processed. No payroll has been processed.',
  }
}

export async function listPayrollProviderProfiles({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ payrollProviders: [] })
  const r = await query(`SELECT * FROM pos360_staff_payroll_provider_profiles WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, payrollProviders: r.rows, note: 'Payroll provider is not connected. No wages have been processed.' }
}

export async function updatePayrollProviderStatus({ venueId, providerProfileId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidProviderStatus(status)) return { ok: false, error: 'invalid_provider_status' }
  const r = await query(
    `UPDATE pos360_staff_payroll_provider_profiles SET provider_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, providerProfileId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_payroll_provider_status', entityType: 'payroll_provider', entityId: String(providerProfileId), isFinancial: true })
  return { ok: true, payrollProvider: r.rows[0] }
}

// ── Offline Queue ─────────────────────────────────────────────────────────────
export async function queueOfflineStaffAction({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getStaffFlags()
  if (!flags.offlineStaffQueueEnabled) return { ok: false, error: 'feature_disabled', feature: 'offlineStaffQueueEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_staff_offline_queue WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, offlineAction: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_staff_offline_queue (venue_id, actor_user_id, action_type, entity_type, entity_id, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [venueId, actorUserId, payload.actionType, payload.entityType, payload.entityId, JSON.stringify(payload.payload || {}), idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'queue_offline_staff_action', entityType: 'staff_offline_queue', entityId: String(r.rows[0].id), isPrivate: false })
  return { ok: true, offlineAction: r.rows[0], note: 'Action queued for sync when connection is restored.' }
}

export async function listOfflineStaffQueue({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ offlineQueue: [] })
  const r = await query(`SELECT * FROM pos360_staff_offline_queue WHERE venue_id=$1 AND sync_status='queued' ORDER BY created_at ASC`, [venueId])
  return { ok: true, offlineQueue: r.rows }
}

export async function markOfflineStaffActionSynced({ venueId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_staff_offline_queue SET sync_status='synced', synced_by=$1, synced_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [actorUserId, offlineActionId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorUserId, action: 'mark_offline_staff_action_synced', entityType: 'staff_offline_queue', entityId: String(offlineActionId), isPrivate: false })
  return { ok: true, offlineAction: r.rows[0] }
}
