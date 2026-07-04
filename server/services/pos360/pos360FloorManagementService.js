/**
 * POS360 Floor Management Service — Phase B.1
 *
 * Handles all floor, section, table, server assignment, merge/transfer,
 * guest linking, and event emission for any venue type.
 *
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * All audit entries: containsSecrets: false, exposesPrivateData: false.
 */
import { isDbAvailable, query } from '../../db/connection.js'

// ── Event emitter (in-process; future: replace with pub/sub) ─────────────────
const eventListeners = []

export function onFloorEvent(fn) { eventListeners.push(fn) }

function emitFloorEvent(event) {
  for (const fn of eventListeners) {
    try { fn(event) } catch { /* listener error never breaks the caller */ }
  }
}

async function persistEvent(event) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_floor_events
       (event_id, tenant_id, venue_id, event_type, entity_type, entity_id,
        actor_id, actor_role, payload, device_id, device_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (event_id) DO NOTHING`,
    [
      event.eventId, event.tenantId ?? null, event.venueId,
      event.eventType, event.entityType ?? null, event.entityId ?? null,
      event.actorId ?? null, event.actorRole ?? null,
      JSON.stringify(event.payload ?? {}),
      event.deviceId ?? null, event.deviceType ?? null,
    ]
  )
}

async function writeAudit(venueId, tenantId, eventType, entityType, entityId, actorId, actorRole, payload) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_floor_audit
       (tenant_id, venue_id, event_type, entity_type, entity_id,
        actor_id, actor_role, payload, contains_secrets, exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,false)`,
    [tenantId ?? null, venueId, eventType, entityType ?? null, entityId ?? null,
     actorId ?? null, actorRole ?? null, JSON.stringify(payload ?? {})]
  )
}

function makeEventId() {
  return `fev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function dbFallback(area) {
  return { ok: false, localPreview: true, error: 'database_not_configured', area }
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function createSection({ venueId, tenantId, sectionName, sectionType = 'general', displayOrder = 0, colorHex, icon, capacity, createdBy, metadata = {}, featureFlags = {} }) {
  if (!isDbAvailable()) return dbFallback('sections')
  const sectionId = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_floor_sections
       (section_id, tenant_id, venue_id, section_name, section_type,
        display_order, color_hex, icon, capacity, created_by, metadata, feature_flags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [sectionId, tenantId ?? null, venueId, sectionName, sectionType,
     displayOrder, colorHex ?? null, icon ?? null, capacity ?? null,
     createdBy ?? null, JSON.stringify(metadata), JSON.stringify(featureFlags)]
  )
  const section = row.rows[0]
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.section.created', entityType: 'section', entityId: sectionId, actorId: createdBy, payload: { sectionName } }
  await persistEvent(ev)
  await writeAudit(venueId, tenantId, 'floor.section.created', 'section', sectionId, createdBy, null, { sectionName })
  emitFloorEvent(ev)
  return { ok: true, section }
}

export async function updateSection({ sectionId, venueId, tenantId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('sections')
  const allowed = ['section_name','section_type','display_order','color_hex','icon','capacity','is_active','feature_flags','metadata']
  const sets = []; const vals = []
  for (const k of allowed) {
    if (k in updates) { sets.push(`${k} = $${vals.length + 1}`); vals.push(typeof updates[k] === 'object' ? JSON.stringify(updates[k]) : updates[k]) }
  }
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length + 1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, sectionId, venueId)
  const row = await query(
    `UPDATE pos360_floor_sections SET ${sets.join(', ')} WHERE section_id = $${vals.length - 1} AND venue_id = $${vals.length} RETURNING *`,
    vals
  )
  const section = row.rows[0]
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.section.updated', entityType: 'section', entityId: sectionId, actorId: updatedBy, payload: updates }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return { ok: true, section }
}

export async function listSections({ venueId, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, sections: [], localPreview: true }
  const row = await query(
    `SELECT * FROM pos360_floor_sections WHERE venue_id = $1 ${includeInactive ? '' : 'AND is_active = true AND deleted_at IS NULL'} ORDER BY display_order ASC, created_at ASC`,
    [venueId]
  )
  return { ok: true, sections: row.rows }
}

export async function archiveSection({ sectionId, venueId, archivedBy }) {
  if (!isDbAvailable()) return dbFallback('sections')
  await query(
    `UPDATE pos360_floor_sections SET is_active = false, deleted_at = NOW(), updated_by = $1, updated_at = NOW() WHERE section_id = $2 AND venue_id = $3`,
    [archivedBy ?? null, sectionId, venueId]
  )
  const ev = { eventId: makeEventId(), venueId, eventType: 'floor.section.archived', entityType: 'section', entityId: sectionId, actorId: archivedBy, payload: {} }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return { ok: true }
}

// ── Floor Maps ────────────────────────────────────────────────────────────────

export async function createFloorMap({ venueId, tenantId, mapName, canvasWidth = 1200, canvasHeight = 800, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('floor_maps')
  const mapId = `map_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_floor_maps (map_id, tenant_id, venue_id, map_name, canvas_width, canvas_height, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [mapId, tenantId ?? null, venueId, mapName, canvasWidth, canvasHeight, createdBy ?? null, JSON.stringify(metadata)]
  )
  return { ok: true, map: row.rows[0] }
}

export async function listFloorMaps({ venueId }) {
  if (!isDbAvailable()) return { ok: true, maps: [], localPreview: true }
  const row = await query(`SELECT * FROM pos360_floor_maps WHERE venue_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`, [venueId])
  return { ok: true, maps: row.rows }
}

export async function updateFloorMap({ mapId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('floor_maps')
  const allowed = ['map_name','is_active','canvas_width','canvas_height','background_url','metadata']
  const sets = []; const vals = []
  for (const k of allowed) {
    if (k in updates) { sets.push(`${k} = $${vals.length + 1}`); vals.push(typeof updates[k] === 'object' ? JSON.stringify(updates[k]) : updates[k]) }
  }
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length + 1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, mapId, venueId)
  const row = await query(
    `UPDATE pos360_floor_maps SET ${sets.join(', ')} WHERE map_id = $${vals.length - 1} AND venue_id = $${vals.length} RETURNING *`,
    vals
  )
  return { ok: true, map: row.rows[0] }
}

// ── Tables ────────────────────────────────────────────────────────────────────

export async function createTable({ venueId, tenantId, sectionId, mapId, tableName, tableNumber, seatCount = 2, shape = 'rectangle', posX = 0, posY = 0, width = 80, height = 60, isVip = false, objectType = 'table', createdBy, metadata = {}, featureFlags = {} }) {
  if (!isDbAvailable()) return dbFallback('tables')
  const tableId = `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_tables
       (table_id, tenant_id, venue_id, section_id, map_id, table_name, table_number,
        seat_count, shape, pos_x, pos_y, width, height, is_vip, object_type,
        created_by, metadata, feature_flags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [tableId, tenantId ?? null, venueId, sectionId ?? null, mapId ?? null,
     tableName, tableNumber ?? null, seatCount, shape, posX, posY, width, height,
     isVip, objectType, createdBy ?? null, JSON.stringify(metadata), JSON.stringify(featureFlags)]
  )
  const table = row.rows[0]
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.table.created', entityType: 'table', entityId: tableId, actorId: createdBy, payload: { tableName, sectionId } }
  await persistEvent(ev)
  await writeAudit(venueId, tenantId, 'floor.table.created', 'table', tableId, createdBy, null, { tableName })
  emitFloorEvent(ev)
  return { ok: true, table }
}

export async function updateTable({ tableId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('tables')
  const allowed = ['table_name','table_number','section_id','map_id','seat_count','shape','pos_x','pos_y','width','height','rotation','is_vip','is_active','object_type','feature_flags','metadata']
  const sets = []; const vals = []
  for (const k of allowed) {
    if (k in updates) { sets.push(`${k} = $${vals.length + 1}`); vals.push(typeof updates[k] === 'object' ? JSON.stringify(updates[k]) : updates[k]) }
  }
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length + 1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, tableId, venueId)
  const row = await query(
    `UPDATE pos360_tables SET ${sets.join(', ')} WHERE table_id = $${vals.length - 1} AND venue_id = $${vals.length} RETURNING *`,
    vals
  )
  const table = row.rows[0]
  const ev = { eventId: makeEventId(), venueId, eventType: 'floor.table.updated', entityType: 'table', entityId: tableId, actorId: updatedBy, payload: updates }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return { ok: true, table }
}

export async function moveTable({ tableId, venueId, posX, posY, movedBy }) {
  return updateTable({ tableId, venueId, updates: { pos_x: posX, pos_y: posY }, updatedBy: movedBy })
}

export async function changeTableStatus({ tableId, venueId, tenantId, newStatus, changedBy, changedByRole, reason }) {
  if (!isDbAvailable()) return dbFallback('table_status')
  const prev = await query(`SELECT status FROM pos360_tables WHERE table_id = $1 AND venue_id = $2`, [tableId, venueId])
  const fromStatus = prev.rows[0]?.status ?? null
  await query(
    `UPDATE pos360_tables SET status = $1, updated_at = NOW(), updated_by = $2 WHERE table_id = $3 AND venue_id = $4`,
    [newStatus, changedBy ?? null, tableId, venueId]
  )
  await query(
    `INSERT INTO pos360_table_status_history (tenant_id, venue_id, table_id, from_status, to_status, changed_by, changed_by_role, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [tenantId ?? null, venueId, tableId, fromStatus, newStatus, changedBy ?? null, changedByRole ?? null, reason ?? null]
  )
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.table.status_changed', entityType: 'table', entityId: tableId, actorId: changedBy, actorRole: changedByRole, payload: { fromStatus, toStatus: newStatus, reason } }
  await persistEvent(ev)
  await writeAudit(venueId, tenantId, 'floor.table.status_changed', 'table', tableId, changedBy, changedByRole, { fromStatus, toStatus: newStatus })
  emitFloorEvent(ev)
  return { ok: true, fromStatus, toStatus: newStatus }
}

export async function listTables({ venueId, sectionId, mapId, status, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, tables: [], localPreview: true }
  let sql = `SELECT * FROM pos360_tables WHERE venue_id = $1`
  const vals = [venueId]
  if (!includeInactive) { sql += ` AND is_active = true AND deleted_at IS NULL` }
  if (sectionId) { vals.push(sectionId); sql += ` AND section_id = $${vals.length}` }
  if (mapId)     { vals.push(mapId);     sql += ` AND map_id = $${vals.length}` }
  if (status)    { vals.push(status);    sql += ` AND status = $${vals.length}` }
  sql += ` ORDER BY table_number ASC, table_name ASC`
  const row = await query(sql, vals)
  return { ok: true, tables: row.rows }
}

export async function getTable({ tableId, venueId }) {
  if (!isDbAvailable()) return { ok: true, table: null, localPreview: true }
  const row = await query(`SELECT * FROM pos360_tables WHERE table_id = $1 AND venue_id = $2`, [tableId, venueId])
  return { ok: true, table: row.rows[0] ?? null }
}

// ── Server Assignment ─────────────────────────────────────────────────────────

export async function assignServer({ venueId, tenantId, tableId, sectionId, serverId, serverName, assignmentType = 'table', shiftId, assignedBy }) {
  if (!isDbAvailable()) return dbFallback('server_assignment')
  // Deactivate any current active assignment for same table/section
  if (tableId) {
    await query(`UPDATE pos360_table_server_assignments SET is_active = false, ended_at = NOW() WHERE venue_id = $1 AND table_id = $2 AND is_active = true`, [venueId, tableId])
  } else if (sectionId) {
    await query(`UPDATE pos360_table_server_assignments SET is_active = false, ended_at = NOW() WHERE venue_id = $1 AND section_id = $2 AND is_active = true`, [venueId, sectionId])
  }
  const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_table_server_assignments
       (assignment_id, tenant_id, venue_id, table_id, section_id, server_id, server_name, shift_id, assigned_by, assignment_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [assignmentId, tenantId ?? null, venueId, tableId ?? null, sectionId ?? null, serverId, serverName ?? null, shiftId ?? null, assignedBy ?? null, assignmentType]
  )
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.server.assigned', entityType: 'assignment', entityId: assignmentId, actorId: assignedBy, payload: { serverId, tableId, sectionId } }
  await persistEvent(ev)
  await writeAudit(venueId, tenantId, 'floor.server.assigned', 'assignment', assignmentId, assignedBy, null, { serverId, tableId, sectionId })
  emitFloorEvent(ev)
  return { ok: true, assignment: row.rows[0] }
}

export async function getServerAssignments({ venueId, serverId, tableId, sectionId, activeOnly = true }) {
  if (!isDbAvailable()) return { ok: true, assignments: [], localPreview: true }
  let sql = `SELECT * FROM pos360_table_server_assignments WHERE venue_id = $1`
  const vals = [venueId]
  if (activeOnly) sql += ` AND is_active = true`
  if (serverId)   { vals.push(serverId);  sql += ` AND server_id = $${vals.length}` }
  if (tableId)    { vals.push(tableId);   sql += ` AND table_id = $${vals.length}` }
  if (sectionId)  { vals.push(sectionId); sql += ` AND section_id = $${vals.length}` }
  const row = await query(sql, vals)
  return { ok: true, assignments: row.rows }
}

// ── Transfer ──────────────────────────────────────────────────────────────────

export async function transferTable({ venueId, tenantId, fromTableId, toTableId, fromServerId, toServerId, orderId, guestLinkId, transferredBy, reason }) {
  if (!isDbAvailable()) return dbFallback('transfer')
  const transferId = `xfr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_table_transfers
       (transfer_id, tenant_id, venue_id, from_table_id, to_table_id, from_server_id, to_server_id, order_id, guest_link_id, transferred_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [transferId, tenantId ?? null, venueId, fromTableId ?? null, toTableId ?? null, fromServerId ?? null, toServerId ?? null, orderId ?? null, guestLinkId ?? null, transferredBy ?? null, reason ?? null]
  )
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.table.transferred', entityType: 'transfer', entityId: transferId, actorId: transferredBy, payload: { fromTableId, toTableId } }
  await persistEvent(ev)
  await writeAudit(venueId, tenantId, 'floor.table.transferred', 'transfer', transferId, transferredBy, null, { fromTableId, toTableId })
  emitFloorEvent(ev)
  return { ok: true, transfer: row.rows[0] }
}

// ── Merge / Split ─────────────────────────────────────────────────────────────

export async function mergeTables({ venueId, tenantId, parentTableId, childTableIds, mergedBy, orderIds = [] }) {
  if (!isDbAvailable()) return dbFallback('merge')
  const mergeId = `mrg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_table_merges (merge_id, tenant_id, venue_id, merge_type, parent_table_id, child_table_ids, merged_by, order_ids)
     VALUES ($1,$2,$3,'merge',$4,$5,$6,$7) RETURNING *`,
    [mergeId, tenantId ?? null, venueId, parentTableId, JSON.stringify(childTableIds), mergedBy ?? null, JSON.stringify(orderIds)]
  )
  // Set child tables to 'merged' status
  for (const cid of childTableIds) {
    await changeTableStatus({ tableId: cid, venueId, tenantId, newStatus: 'merged', changedBy: mergedBy, reason: `merged into ${parentTableId}` })
  }
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.table.merged', entityType: 'merge', entityId: mergeId, actorId: mergedBy, payload: { parentTableId, childTableIds } }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return { ok: true, merge: row.rows[0] }
}

export async function splitTable({ venueId, tenantId, parentTableId, newTableIds, splitBy }) {
  if (!isDbAvailable()) return dbFallback('split')
  const mergeId = `spl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_table_merges (merge_id, tenant_id, venue_id, merge_type, parent_table_id, child_table_ids, merged_by)
     VALUES ($1,$2,$3,'split',$4,$5,$6) RETURNING *`,
    [mergeId, tenantId ?? null, venueId, parentTableId, JSON.stringify(newTableIds), splitBy ?? null]
  )
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.table.split', entityType: 'split', entityId: mergeId, actorId: splitBy, payload: { parentTableId, newTableIds } }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return { ok: true, split: row.rows[0] }
}

// ── Guest Links ───────────────────────────────────────────────────────────────

export async function linkGuest({ venueId, tenantId, tableId, guestSessionId, userId, reservationId, waitlistId, smokecraftSessionId, loyaltyProfileId, partySize, seatedBy }) {
  if (!isDbAvailable()) return dbFallback('guest_link')
  const linkId = `gl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const row = await query(
    `INSERT INTO pos360_table_guest_links
       (link_id, tenant_id, venue_id, table_id, guest_session_id, user_id,
        reservation_id, waitlist_id, smokecraft_session_id, loyalty_profile_id,
        party_size, seated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
    [linkId, tenantId ?? null, venueId, tableId, guestSessionId ?? null, userId ?? null,
     reservationId ?? null, waitlistId ?? null, smokecraftSessionId ?? null,
     loyaltyProfileId ?? null, partySize ?? null]
  )
  const ev = { eventId: makeEventId(), venueId, tenantId, eventType: 'floor.guest.seated', entityType: 'guest_link', entityId: linkId, actorId: seatedBy, payload: { tableId, guestSessionId, userId, partySize } }
  await persistEvent(ev)
  await writeAudit(venueId, tenantId, 'floor.guest.seated', 'guest_link', linkId, seatedBy, null, { tableId, partySize })
  emitFloorEvent(ev)
  return { ok: true, guestLink: row.rows[0] }
}

export async function unlinkGuest({ linkId, venueId, departedBy }) {
  if (!isDbAvailable()) return dbFallback('guest_link')
  const row = await query(
    `UPDATE pos360_table_guest_links SET is_active = false, departed_at = NOW(), updated_at = NOW() WHERE link_id = $1 AND venue_id = $2 RETURNING *`,
    [linkId, venueId]
  )
  const link = row.rows[0]
  const ev = { eventId: makeEventId(), venueId, eventType: 'floor.guest.moved', entityType: 'guest_link', entityId: linkId, actorId: departedBy, payload: {} }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return { ok: true, guestLink: link }
}

export async function linkReservation({ venueId, tableId, reservationId, linkedBy }) {
  if (!isDbAvailable()) return dbFallback('reservation_link')
  const ev = { eventId: makeEventId(), venueId, eventType: 'floor.reservation.linked', entityType: 'table', entityId: tableId, actorId: linkedBy, payload: { reservationId } }
  await persistEvent(ev)
  await writeAudit(venueId, null, 'floor.reservation.linked', 'table', tableId, linkedBy, null, { reservationId })
  emitFloorEvent(ev)
  return { ok: true, tableId, reservationId }
}

export async function linkWaitlist({ venueId, tableId, waitlistId, linkedBy }) {
  if (!isDbAvailable()) return dbFallback('waitlist_link')
  const ev = { eventId: makeEventId(), venueId, eventType: 'floor.waitlist.linked', entityType: 'table', entityId: tableId, actorId: linkedBy, payload: { waitlistId } }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return { ok: true, tableId, waitlistId }
}

// ── Intelligence Hooks ────────────────────────────────────────────────────────
// These return honest empty states when live data is unavailable.
// Wired to real SmokeCraft / EAT data in future prompts.

export async function getTableIntelligence({ tableId, venueId }) {
  const base = {
    tableId,
    venueId,
    smokecraft: {
      available: false,
      profile: null,
      flavorMemory: null,
      passportStatus: null,
      loyaltyStatus: null,
      pairingRecommendations: [],
      previousPurchases: [],
      preferredCigarStyles: [],
      preferredBeveragePairings: [],
      visitHistory: [],
      xpRewardEligibility: null,
      message: 'SmokeCraft intelligence available after guest session is linked.',
    },
    eatRecommendations: {
      available: false,
      recommendations: [],
      message: 'E.A.T. recommendations available when E.A.T. provider is connected.',
    },
  }

  if (!isDbAvailable()) return { ok: true, intelligence: base, localPreview: true }

  const glRow = await query(
    `SELECT * FROM pos360_table_guest_links WHERE table_id = $1 AND venue_id = $2 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
    [tableId, venueId]
  )
  const guestLink = glRow.rows[0]
  if (guestLink?.smokecraft_session_id) {
    base.smokecraft.available = false
    base.smokecraft.sessionLinked = true
    base.smokecraft.sessionId = guestLink.smokecraft_session_id
    base.smokecraft.message = 'SmokeCraft session linked. Live intelligence fetch wired in Phase B.2+.'
  }
  return { ok: true, intelligence: base }
}

// ── Floor State ───────────────────────────────────────────────────────────────

export async function getFloorState({ venueId, mapId }) {
  if (!isDbAvailable()) return { ok: true, floorState: { venueId, sections: [], tables: [], events: [], lastSync: null }, localPreview: true }
  const [secRow, tblRow] = await Promise.all([
    query(`SELECT * FROM pos360_floor_sections WHERE venue_id = $1 AND is_active = true AND deleted_at IS NULL ORDER BY display_order ASC`, [venueId]),
    query(`SELECT t.*, ssa.server_id, ssa.server_name FROM pos360_tables t LEFT JOIN pos360_table_server_assignments ssa ON ssa.table_id = t.table_id AND ssa.is_active = true WHERE t.venue_id = $1 AND t.is_active = true AND t.deleted_at IS NULL ${mapId ? 'AND t.map_id = $2' : ''}`, mapId ? [venueId, mapId] : [venueId]),
  ])
  const ev = { eventId: makeEventId(), venueId, eventType: 'floor.sync.completed', entityType: 'venue', entityId: venueId, payload: { tableCount: tblRow.rows.length } }
  await persistEvent(ev)
  emitFloorEvent(ev)
  return {
    ok: true,
    floorState: {
      venueId,
      sections: secRow.rows,
      tables: tblRow.rows,
      lastSync: new Date().toISOString(),
    }
  }
}
