/**
 * pos360ReservationGuestFlowService.js — Phase B.9
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import {
  RESERVATION_STATUSES,
  WAITLIST_STATUSES,
  TABLE_STATUSES,
  GUEST_FLOW_EVENT_TYPES,
  PRIVATE_EVENT_STATUSES,
  MANAGER_APPROVAL_ACTIONS,
  isValidReservationStatus,
  isValidWaitlistStatus,
  isValidTableStatus,
  isValidPrivateEventStatus,
} from './pos360ReservationEventContracts.js'

const AREA = 'reservations_guest_flow'

async function auditRecord(venueId, tenantId, actorUserId, action, entityType, entityId, before, after, reason, managerOverride = false) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_reservation_audit
       (tenant_id, venue_id, actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason, manager_override, contains_secrets, exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,FALSE)`,
    [tenantId, venueId, actorUserId, action, entityType, entityId, JSON.stringify(before || {}), JSON.stringify(after || {}), reason, !!managerOverride]
  )
}

async function writeStatusHistory(table, fkField, fkValue, fromStatus, toStatus, reason, actorUserId, tenantId, venueId, managerOverride = false) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO ${table} (tenant_id, venue_id, ${fkField}, from_status, to_status, reason, actor_user_id, manager_override)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [tenantId, venueId, fkValue, fromStatus, toStatus, reason, actorUserId, !!managerOverride]
  )
}

// ── Reservations ──────────────────────────────────────────────────────────────

export async function createReservation({ venueId, tenantId, actorUserId, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const dup = await query(`SELECT id FROM pos360_reservations WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, duplicate: true, reservation: dup.rows[0] }
  const {
    reservationCode, customerId, guestProfileId, guestName, guestPhone, guestEmail,
    partySize, reservationDate, reservationTime, durationMinutes, preferredSectionId,
    occasion, source, notes, internalNotes,
  } = payload
  const result = await query(
    `INSERT INTO pos360_reservations
       (tenant_id, venue_id, reservation_code, customer_id, guest_profile_id, guest_name, guest_phone, guest_email,
        party_size, reservation_date, reservation_time, duration_minutes, preferred_section_id,
        occasion, source, notes, internal_notes, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
    [tenantId, venueId, reservationCode, customerId, guestProfileId, guestName, guestPhone, guestEmail,
     partySize || 1, reservationDate, reservationTime, durationMinutes || 90, preferredSectionId,
     occasion, source || 'staff', notes, internalNotes, idempotencyKey, actorUserId]
  )
  const res = result.rows[0]
  await writeStatusHistory('pos360_reservation_status_history', 'reservation_id', res.id, null, 'pending', 'created', actorUserId, tenantId, venueId)
  await auditRecord(venueId, tenantId, actorUserId, 'create_reservation', 'reservation', res.id, {}, res, null)
  return { ok: true, reservation: res, note: 'Reservation created. No SMS or email confirmation was sent. No table assigned yet.' }
}

export async function getReservation({ venueId, reservationId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(`SELECT * FROM pos360_reservations WHERE id=$1 AND venue_id=$2 LIMIT 1`, [reservationId, venueId])
  if (!result.rows.length) return { ok: false, error: 'not_found', note: 'No reservations found for this venue.', area: AREA }
  return { ok: true, reservation: result.rows[0] }
}

export async function listReservations({ venueId, filters = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { date, status, limit = 50, offset = 0 } = filters
  let sql = `SELECT * FROM pos360_reservations WHERE venue_id=$1`
  const params = [venueId]
  if (date) { params.push(date); sql += ` AND reservation_date=$${params.length}` }
  if (status) { params.push(status); sql += ` AND status=$${params.length}` }
  sql += ` ORDER BY reservation_date, reservation_time LIMIT $${params.length+1} OFFSET $${params.length+2}`
  params.push(limit, offset)
  const result = await query(sql, params)
  if (!result.rows.length) return { ok: true, reservations: [], note: 'No reservations found for this venue.' }
  return { ok: true, reservations: result.rows }
}

export async function updateReservationStatus({ venueId, tenantId, reservationId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  if (!isValidReservationStatus(status)) return { ok: false, error: 'invalid_status', area: AREA }
  const existing = await query(`SELECT * FROM pos360_reservations WHERE id=$1 AND venue_id=$2 LIMIT 1`, [reservationId, venueId])
  if (!existing.rows.length) return { ok: false, error: 'not_found', area: AREA }
  const before = existing.rows[0]
  await query(`UPDATE pos360_reservations SET status=$1, updated_by=$2, updated_at=now() WHERE id=$3 AND venue_id=$4`, [status, actorUserId, reservationId, venueId])
  await writeStatusHistory('pos360_reservation_status_history', 'reservation_id', reservationId, before.status, status, reason, actorUserId, tenantId, venueId)
  await auditRecord(venueId, tenantId, actorUserId, 'update_reservation_status', 'reservation', reservationId, { status: before.status }, { status }, reason)
  return { ok: true }
}

export async function assignReservationTable({ venueId, tenantId, reservationId, tableId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const dup = await query(`SELECT id FROM pos360_table_assignments WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, duplicate: true }
  const tableCheck = await query(`SELECT * FROM pos360_tables WHERE id=$1 AND venue_id=$2 LIMIT 1`, [tableId, venueId])
  if (!tableCheck.rows.length) return { ok: false, error: 'table_not_found', note: 'No tables have been configured for this venue.', area: AREA }
  if (tableCheck.rows[0].status === 'blocked') return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: MANAGER_APPROVAL_ACTIONS.BLOCKED_TABLE_ASSIGNMENT, area: AREA }
  await query(`INSERT INTO pos360_table_assignments (tenant_id, venue_id, table_id, reservation_id, assigned_by, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6)`,
    [tenantId, venueId, tableId, reservationId, actorUserId, idempotencyKey])
  await query(`UPDATE pos360_reservations SET assigned_table_id=$1 WHERE id=$2 AND venue_id=$3`, [tableId, reservationId, venueId])
  await query(`UPDATE pos360_tables SET status='reserved' WHERE id=$1 AND venue_id=$2`, [tableId, venueId])
  await auditRecord(venueId, tenantId, actorUserId, 'assign_table', 'reservation', reservationId, {}, { tableId }, null)
  return { ok: true }
}

export async function cancelReservation({ venueId, tenantId, reservationId, actorUserId, reason, idempotencyKey }) {
  return updateReservationStatus({ venueId, tenantId, reservationId, status: RESERVATION_STATUSES.CANCELLED, actorUserId, reason, idempotencyKey })
}

export async function markReservationNoShow({ venueId, tenantId, reservationId, actorUserId, reason, idempotencyKey }) {
  return updateReservationStatus({ venueId, tenantId, reservationId, status: RESERVATION_STATUSES.NO_SHOW, actorUserId, reason, idempotencyKey })
}

// ── Waitlist ──────────────────────────────────────────────────────────────────

export async function createWaitlistEntry({ venueId, tenantId, actorUserId, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const dup = await query(`SELECT id FROM pos360_waitlist_entries WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, duplicate: true }
  const { customerId, guestProfileId, guestName, guestPhone, partySize, quotedWaitMinutes, preferredSectionId, priorityLevel, priorityReason, source, notes } = payload
  const managerRequired = (priorityLevel || 0) > 5
  const result = await query(
    `INSERT INTO pos360_waitlist_entries
       (tenant_id, venue_id, customer_id, guest_profile_id, guest_name, guest_phone, party_size,
        quoted_wait_minutes, preferred_section_id, priority_level, priority_reason,
        manager_override_required, source, notes, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [tenantId, venueId, customerId, guestProfileId, guestName, guestPhone, partySize || 1,
     quotedWaitMinutes, preferredSectionId, priorityLevel || 0, priorityReason,
     managerRequired, source || 'staff', notes, idempotencyKey, actorUserId]
  )
  const entry = result.rows[0]
  await writeStatusHistory('pos360_waitlist_status_history', 'waitlist_entry_id', entry.id, null, 'waiting', 'added', actorUserId, tenantId, venueId)
  await auditRecord(venueId, tenantId, actorUserId, 'create_waitlist_entry', 'waitlist_entry', entry.id, {}, entry, null)
  return { ok: true, entry, managerApprovalRequired: managerRequired, note: 'Added to waitlist. No SMS notification was sent.' }
}

export async function listWaitlist({ venueId, filters = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { status, limit = 50, offset = 0 } = filters
  let sql = `SELECT * FROM pos360_waitlist_entries WHERE venue_id=$1`
  const params = [venueId]
  if (status) { params.push(status); sql += ` AND status=$${params.length}` }
  sql += ` ORDER BY priority_level DESC, created_at LIMIT $${params.length+1} OFFSET $${params.length+2}`
  params.push(limit, offset)
  const result = await query(sql, params)
  if (!result.rows.length) return { ok: true, entries: [], note: 'The waitlist is empty.' }
  return { ok: true, entries: result.rows }
}

export async function updateWaitlistStatus({ venueId, tenantId, waitlistEntryId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  if (!isValidWaitlistStatus(status)) return { ok: false, error: 'invalid_status', area: AREA }
  const existing = await query(`SELECT * FROM pos360_waitlist_entries WHERE id=$1 AND venue_id=$2 LIMIT 1`, [waitlistEntryId, venueId])
  if (!existing.rows.length) return { ok: false, error: 'not_found', area: AREA }
  const before = existing.rows[0]
  await query(`UPDATE pos360_waitlist_entries SET status=$1, updated_at=now() WHERE id=$2 AND venue_id=$3`, [status, waitlistEntryId, venueId])
  await writeStatusHistory('pos360_waitlist_status_history', 'waitlist_entry_id', waitlistEntryId, before.status, status, reason, actorUserId, tenantId, venueId)
  await auditRecord(venueId, tenantId, actorUserId, 'update_waitlist_status', 'waitlist_entry', waitlistEntryId, { status: before.status }, { status }, reason)
  return { ok: true }
}

export async function approveWaitlistPriorityOverride({ venueId, tenantId, waitlistEntryId, managerUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(`UPDATE pos360_waitlist_entries SET manager_override_required=FALSE, manager_approved_by=$1, manager_approved_at=now() WHERE id=$2 AND venue_id=$3`,
    [managerUserId, waitlistEntryId, venueId])
  await auditRecord(venueId, tenantId, managerUserId, 'approve_waitlist_priority', 'waitlist_entry', waitlistEntryId, {}, { approved: true }, reason, true)
  return { ok: true }
}

// ── Floor Sections ────────────────────────────────────────────────────────────

export async function createFloorSection({ venueId, tenantId, actorUserId, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { name, sectionType, capacity, displayOrder, layoutMetadata = {} } = payload
  const result = await query(
    `INSERT INTO pos360_floor_sections (tenant_id, venue_id, name, section_type, capacity, display_order, layout_metadata, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [tenantId, venueId, name, sectionType || 'dining', capacity || 0, displayOrder || 0, JSON.stringify(layoutMetadata), actorUserId]
  )
  await auditRecord(venueId, tenantId, actorUserId, 'create_section', 'section', result.rows[0].id, {}, result.rows[0], null)
  return { ok: true, section: result.rows[0] }
}

export async function listFloorSections({ venueId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(`SELECT * FROM pos360_floor_sections WHERE venue_id=$1 AND active=TRUE ORDER BY display_order`, [venueId])
  return { ok: true, sections: result.rows }
}

// ── Tables ────────────────────────────────────────────────────────────────────

export async function createTable({ venueId, tenantId, actorUserId, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { sectionId, tableName, tableNumber, capacityMin, capacityMax, tableShape, xPosition, yPosition, rotation } = payload
  const result = await query(
    `INSERT INTO pos360_tables (tenant_id, venue_id, section_id, table_name, table_number, capacity_min, capacity_max, table_shape, x_position, y_position, rotation, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [tenantId, venueId, sectionId, tableName, tableNumber, capacityMin || 1, capacityMax || 4, tableShape || 'rectangle', xPosition || 0, yPosition || 0, rotation || 0, actorUserId]
  )
  await auditRecord(venueId, tenantId, actorUserId, 'create_table', 'table', result.rows[0].id, {}, result.rows[0], null)
  return { ok: true, table: result.rows[0] }
}

export async function listTables({ venueId, filters = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { sectionId, status } = filters
  let sql = `SELECT * FROM pos360_tables WHERE venue_id=$1 AND active=TRUE`
  const params = [venueId]
  if (sectionId) { params.push(sectionId); sql += ` AND section_id=$${params.length}` }
  if (status) { params.push(status); sql += ` AND status=$${params.length}` }
  sql += ` ORDER BY table_number, table_name`
  const result = await query(sql, params)
  if (!result.rows.length) return { ok: true, tables: [], note: 'No tables have been configured for this venue.' }
  return { ok: true, tables: result.rows }
}

export async function updateTableStatus({ venueId, tenantId, tableId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  if (!isValidTableStatus(status)) return { ok: false, error: 'invalid_status', area: AREA }
  const existing = await query(`SELECT * FROM pos360_tables WHERE id=$1 AND venue_id=$2 LIMIT 1`, [tableId, venueId])
  if (!existing.rows.length) return { ok: false, error: 'not_found', area: AREA }
  const before = existing.rows[0]
  if (status === TABLE_STATUSES.BLOCKED) {
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: MANAGER_APPROVAL_ACTIONS.TABLE_CAPACITY_OVERRIDE, area: AREA }
  }
  await query(`UPDATE pos360_tables SET status=$1, updated_at=now() WHERE id=$2 AND venue_id=$3`, [status, tableId, venueId])
  await writeStatusHistory('pos360_table_status_history', 'table_id', tableId, before.status, status, reason, actorUserId, tenantId, venueId)
  await auditRecord(venueId, tenantId, actorUserId, 'update_table_status', 'table', tableId, { status: before.status }, { status }, reason)
  return { ok: true }
}

export async function assignTableToServer({ venueId, tenantId, tableId, serverId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(`UPDATE pos360_tables SET server_id=$1, updated_at=now() WHERE id=$2 AND venue_id=$3`, [serverId, tableId, venueId])
  await auditRecord(venueId, tenantId, actorUserId, 'assign_server', 'table', tableId, {}, { serverId }, null)
  return { ok: true }
}

export async function mergeTables({ venueId, tenantId, tableIds, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  if (!tableIds || tableIds.length < 2) return { ok: false, error: 'merge_requires_2_tables', area: AREA }
  const [primaryTableId, ...rest] = tableIds
  const caps = await query(`SELECT SUM(capacity_max) as total FROM pos360_tables WHERE id=ANY($1) AND venue_id=$2`, [tableIds, venueId])
  const result = await query(
    `INSERT INTO pos360_table_merge_groups (tenant_id, venue_id, primary_table_id, merged_table_ids, combined_capacity, reason, merged_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [tenantId, venueId, primaryTableId, rest, caps.rows[0]?.total || 0, reason, actorUserId]
  )
  await auditRecord(venueId, tenantId, actorUserId, 'merge_tables', 'table', primaryTableId, {}, { mergedTableIds: rest }, reason)
  return { ok: true, mergeGroup: result.rows[0] }
}

export async function releaseTable({ venueId, tenantId, tableId, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(`UPDATE pos360_table_assignments SET released_at=now(), status='released' WHERE table_id=$1 AND venue_id=$2 AND status='active'`, [tableId, venueId])
  await query(`UPDATE pos360_tables SET status='dirty', updated_at=now() WHERE id=$1 AND venue_id=$2`, [tableId, venueId])
  await auditRecord(venueId, tenantId, actorUserId, 'release_table', 'table', tableId, {}, { status: 'dirty' }, reason)
  return { ok: true }
}

// ── Private Events ────────────────────────────────────────────────────────────

export async function createPrivateEventInquiry({ venueId, tenantId, actorUserId, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const dup = await query(`SELECT id FROM pos360_private_events WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, duplicate: true }
  const {
    customerId, guestProfileId, eventName, hostName, hostPhone, hostEmail,
    eventDate, startTime, endTime, guestCount, sectionId, minimumSpendCents,
    depositAmountCents, kitchenNotes, barNotes, humidorNotes, cigarPackageNotes, staffNotes, packageSummary,
  } = payload
  const result = await query(
    `INSERT INTO pos360_private_events
       (tenant_id, venue_id, customer_id, guest_profile_id, event_name, host_name, host_phone, host_email,
        event_date, start_time, end_time, guest_count, section_id, minimum_spend_cents, deposit_amount_cents,
        kitchen_notes, bar_notes, humidor_notes, cigar_package_notes, staff_notes, package_summary,
        manager_approval_required, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,TRUE,$22,$23) RETURNING *`,
    [tenantId, venueId, customerId, guestProfileId, eventName, hostName, hostPhone, hostEmail,
     eventDate, startTime, endTime, guestCount || 1, sectionId, minimumSpendCents || 0, depositAmountCents || 0,
     kitchenNotes, barNotes, humidorNotes, cigarPackageNotes, staffNotes, packageSummary,
     idempotencyKey, actorUserId]
  )
  const evt = result.rows[0]
  await writeStatusHistory('pos360_private_event_status_history', 'private_event_id', evt.id, null, 'inquiry', 'created', actorUserId, tenantId, venueId)
  await auditRecord(venueId, tenantId, actorUserId, 'create_private_event', 'private_event', evt.id, {}, evt, null)
  return { ok: true, event: evt, note: 'Private event inquiry created. No deposit was processed. No contract was sent. Manager approval required.' }
}

export async function listPrivateEvents({ venueId, filters = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { status, limit = 50, offset = 0 } = filters
  let sql = `SELECT * FROM pos360_private_events WHERE venue_id=$1`
  const params = [venueId]
  if (status) { params.push(status); sql += ` AND status=$${params.length}` }
  sql += ` ORDER BY event_date, start_time LIMIT $${params.length+1} OFFSET $${params.length+2}`
  params.push(limit, offset)
  const result = await query(sql, params)
  if (!result.rows.length) return { ok: true, events: [], note: 'No private events on record.' }
  return { ok: true, events: result.rows }
}

export async function updatePrivateEventStatus({ venueId, tenantId, privateEventId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  if (!isValidPrivateEventStatus(status)) return { ok: false, error: 'invalid_status', area: AREA }
  const existing = await query(`SELECT * FROM pos360_private_events WHERE id=$1 AND venue_id=$2 LIMIT 1`, [privateEventId, venueId])
  if (!existing.rows.length) return { ok: false, error: 'not_found', area: AREA }
  const before = existing.rows[0]
  await query(`UPDATE pos360_private_events SET status=$1, updated_by=$2, updated_at=now() WHERE id=$3 AND venue_id=$4`, [status, actorUserId, privateEventId, venueId])
  await writeStatusHistory('pos360_private_event_status_history', 'private_event_id', privateEventId, before.status, status, reason, actorUserId, tenantId, venueId)
  await auditRecord(venueId, tenantId, actorUserId, 'update_private_event_status', 'private_event', privateEventId, { status: before.status }, { status }, reason)
  return { ok: true }
}

export async function approvePrivateEvent({ venueId, tenantId, privateEventId, managerUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(`UPDATE pos360_private_events SET manager_approval_required=FALSE, manager_approved_by=$1, manager_approved_at=now(), updated_at=now() WHERE id=$2 AND venue_id=$3`,
    [managerUserId, privateEventId, venueId])
  await auditRecord(venueId, tenantId, managerUserId, 'approve_private_event', 'private_event', privateEventId, {}, { approved: true }, reason, true)
  return { ok: true }
}

export async function updatePrivateEventDepositStatus({ venueId, tenantId, privateEventId, depositStatus, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  if (depositStatus === 'refunded') {
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: MANAGER_APPROVAL_ACTIONS.PRIVATE_EVENT_DEPOSIT_REVERSAL, note: 'No deposit was processed. Payment integration is not connected.', area: AREA }
  }
  await query(`UPDATE pos360_private_events SET deposit_status=$1, updated_at=now() WHERE id=$2 AND venue_id=$3`, [depositStatus, privateEventId, venueId])
  await auditRecord(venueId, tenantId, actorUserId, 'update_deposit_status', 'private_event', privateEventId, {}, { depositStatus }, reason)
  return { ok: true, note: 'No deposit was processed. Payment integration is not connected.' }
}

// ── Guest Flow ────────────────────────────────────────────────────────────────

export async function createGuestFlowEvent({ venueId, tenantId, actorUserId, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { reservationId, waitlistEntryId, privateEventId, customerId, guestProfileId, eventType, eventPayload = {}, source } = payload
  const result = await query(
    `INSERT INTO pos360_guest_flow_events
       (tenant_id, venue_id, reservation_id, waitlist_entry_id, private_event_id, customer_id, guest_profile_id,
        event_type, event_payload, source, contains_ai_generated_content)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE) RETURNING *`,
    [tenantId, venueId, reservationId, waitlistEntryId, privateEventId, customerId, guestProfileId,
     eventType, JSON.stringify(eventPayload), source || 'pos360']
  )
  return { ok: true, event: result.rows[0] }
}

export async function listGuestFlowEvents({ venueId, filters = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { eventType, limit = 100, offset = 0 } = filters
  let sql = `SELECT * FROM pos360_guest_flow_events WHERE venue_id=$1`
  const params = [venueId]
  if (eventType) { params.push(eventType); sql += ` AND event_type=$${params.length}` }
  sql += ` ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`
  params.push(limit, offset)
  const result = await query(sql, params)
  if (!result.rows.length) return { ok: true, events: [], note: 'No guest flow data available.' }
  return { ok: true, events: result.rows }
}

export async function getGuestFlowInsights({ venueId, filters = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(`SELECT * FROM pos360_guest_flow_insights WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 50`, [venueId])
  if (!result.rows.length) return { ok: true, insights: [], note: 'E.A.T. guest flow insights are not connected yet.' }
  return { ok: true, insights: result.rows }
}

// ── Offline Queue ─────────────────────────────────────────────────────────────

export async function queueOfflineReservationAction({ venueId, tenantId, actorUserId, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const dup = await query(`SELECT id FROM pos360_reservation_offline_queue WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, duplicate: true }
  await query(`INSERT INTO pos360_reservation_offline_queue (tenant_id, venue_id, action_type, payload, idempotency_key) VALUES ($1,$2,$3,$4,$5)`,
    [tenantId, venueId, payload.actionType, JSON.stringify(payload), idempotencyKey])
  return { ok: true, note: 'Reservation action queued for offline sync.' }
}

export async function listOfflineReservationQueue({ venueId, filters = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(`SELECT * FROM pos360_reservation_offline_queue WHERE venue_id=$1 AND status='queued' ORDER BY created_at`, [venueId])
  if (!result.rows.length) return { ok: true, items: [], note: 'No offline reservation actions are queued.' }
  return { ok: true, items: result.rows }
}

export async function markOfflineActionSynced({ venueId, tenantId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(`UPDATE pos360_reservation_offline_queue SET status='synced', replayed_at=now() WHERE id=$1 AND venue_id=$2`, [offlineActionId, venueId])
  await auditRecord(venueId, tenantId, actorUserId, 'mark_offline_synced', 'offline_queue', offlineActionId, {}, { status: 'synced' }, null)
  return { ok: true }
}
