/**
 * POS360 Production Display System — Service Layer (Phase B.4)
 *
 * All functions guard with isDbAvailable().
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * writeAudit: containsSecrets always false, exposesPrivateData always false.
 */
import { isDbAvailable, query } from '../../db/connection.js'
import { PRODUCTION_EVENTS } from './pos360ProductionEventContracts.js'

// ── Internal helpers ──────────────────────────────────────────────────────────

const listeners = []
export function onProductionEvent(fn) { listeners.push(fn) }

function emitEvent(ev) {
  listeners.forEach(fn => { try { fn(ev) } catch { /* isolate */ } })
  persistStationEvent(ev).catch(() => {})
}

async function persistStationEvent(ev) {
  if (!isDbAvailable() || !ev.stationId) return
  await query(
    `INSERT INTO pos360_production_station_events (tenant_id,venue_id,station_id,device_id,event_type,event_payload,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [ev.tenantId || '', ev.venueId || '', ev.stationId || '', ev.deviceId || '', ev.type, JSON.stringify(ev), ev.actorId || null]
  ).catch(() => {})
}

async function writeAudit({ tenantId, venueId, locationId, stationId, deviceId, orderId, staffUserId, action, entityType, entityId, actorRole, previousValue = {}, newValue = {} }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_production_audit
       (tenant_id,venue_id,location_id,station_id,device_id,order_id,staff_user_id,action,entity_type,entity_id,actor_role,previous_value,new_value,contains_secrets,exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,false)`,
    [tenantId, venueId, locationId, stationId, deviceId, orderId, staffUserId, action, entityType, entityId, actorRole, JSON.stringify(previousValue), JSON.stringify(newValue)]
  ).catch(() => {})
}

function buildSet(updates, allowed) {
  const keys = Object.keys(updates).filter(k => allowed.includes(k))
  if (!keys.length) return null
  const sets = keys.map((k, i) => `${k} = $${i + 1}`)
  return { clause: sets.join(', '), values: keys.map(k => updates[k]), count: keys.length }
}

// ── Production Stations ───────────────────────────────────────────────────────

export async function createStation({ tenantId, venueId, locationId, stationName, stationType, displayMode, prepSlaSec, escalationSec, printerSettings = {}, displaySettings = {}, routingRules = [], escalationRules = {}, sortOrder, createdBy }) {
  const area = 'createStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_stations
       (tenant_id,venue_id,location_id,station_name,station_type,display_mode,prep_sla_seconds,escalation_seconds,printer_settings,display_settings,routing_rules,escalation_rules,sort_order,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [tenantId, venueId, locationId, stationName, stationType || 'kitchen', displayMode || 'station_view', prepSlaSec || 900, escalationSec || 1200, JSON.stringify(printerSettings), JSON.stringify(displaySettings), JSON.stringify(routingRules), JSON.stringify(escalationRules), sortOrder || 0, createdBy]
  )
  const station = r.rows[0]
  emitEvent({ type: PRODUCTION_EVENTS.STATION_CREATED, tenantId, venueId, stationId: station.id })
  await writeAudit({ tenantId, venueId, locationId, stationId: station.id, staffUserId: createdBy, action: 'station.created', entityType: 'station', entityId: station.id, newValue: { stationName, stationType } })
  return { ok: true, station }
}

export async function updateStation({ stationId, venueId, updates, updatedBy }) {
  const area = 'updateStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const allowed = ['station_name','station_type','display_mode','prep_sla_seconds','escalation_seconds','printer_settings','display_settings','routing_rules','escalation_rules','sort_order','is_active','metadata']
  const s = buildSet(updates, allowed)
  if (!s) return { ok: false, error: 'no_valid_fields' }
  const r = await query(
    `UPDATE pos360_production_stations SET ${s.clause}, updated_by=$${s.count+1}, updated_at=NOW() WHERE id=$${s.count+2} AND venue_id=$${s.count+3} RETURNING *`,
    [...s.values, updatedBy, stationId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitEvent({ type: PRODUCTION_EVENTS.STATION_UPDATED, venueId, stationId })
  return { ok: true, station: r.rows[0] }
}

export async function listStations({ venueId, includeInactive = false }) {
  const area = 'listStations'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, stations: [] }
  const cond = includeInactive ? 'venue_id=$1 AND deleted_at IS NULL' : 'venue_id=$1 AND is_active=true AND deleted_at IS NULL'
  const r = await query(`SELECT * FROM pos360_production_stations WHERE ${cond} ORDER BY sort_order ASC, station_name ASC`, [venueId])
  return { ok: true, stations: r.rows }
}

export async function getStation({ stationId, venueId }) {
  const area = 'getStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`SELECT * FROM pos360_production_stations WHERE id=$1 AND venue_id=$2 AND deleted_at IS NULL`, [stationId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, station: r.rows[0] }
}

export async function activateStation({ stationId, venueId, updatedBy }) {
  const area = 'activateStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`UPDATE pos360_production_stations SET is_active=true, updated_by=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`, [updatedBy, stationId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitEvent({ type: PRODUCTION_EVENTS.STATION_ACTIVATED, venueId, stationId })
  await writeAudit({ venueId, stationId, staffUserId: updatedBy, action: 'station.activated', entityType: 'station', entityId: stationId })
  return { ok: true, station: r.rows[0] }
}

export async function deactivateStation({ stationId, venueId, updatedBy }) {
  const area = 'deactivateStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`UPDATE pos360_production_stations SET is_active=false, updated_by=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`, [updatedBy, stationId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitEvent({ type: PRODUCTION_EVENTS.STATION_DEACTIVATED, venueId, stationId })
  await writeAudit({ venueId, stationId, staffUserId: updatedBy, action: 'station.deactivated', entityType: 'station', entityId: stationId })
  return { ok: true, station: r.rows[0] }
}

export async function assignDeviceToStation({ tenantId, venueId, locationId, stationId, deviceId, deviceType, deviceName, isPrimary = false, createdBy }) {
  const area = 'assignDeviceToStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  if (isPrimary) await query(`UPDATE pos360_production_station_devices SET is_primary=false WHERE station_id=$1 AND venue_id=$2`, [stationId, venueId])
  const r = await query(
    `INSERT INTO pos360_production_station_devices (tenant_id,venue_id,location_id,station_id,device_id,device_type,device_name,is_primary,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT DO NOTHING RETURNING *`,
    [tenantId, venueId, locationId, stationId, deviceId, deviceType || 'kitchen_display', deviceName, isPrimary, createdBy]
  )
  emitEvent({ type: PRODUCTION_EVENTS.STATION_DEVICE_ASSIGNED, venueId, stationId, deviceId })
  await writeAudit({ tenantId, venueId, stationId, deviceId, staffUserId: createdBy, action: 'device.assigned_to_station', entityType: 'station_device', entityId: stationId, newValue: { deviceId, deviceType } })
  return { ok: true, assignment: r.rows[0] }
}

export async function removeDeviceFromStation({ stationId, deviceId, venueId, updatedBy }) {
  const area = 'removeDeviceFromStation'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  await query(`UPDATE pos360_production_station_devices SET is_active=false, updated_by=$1, updated_at=NOW() WHERE station_id=$2 AND device_id=$3 AND venue_id=$4`, [updatedBy, stationId, deviceId, venueId])
  return { ok: true }
}

export async function getStationStatus({ stationId, venueId }) {
  const area = 'getStationStatus'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const [stationR, countR] = await Promise.all([
    query(`SELECT * FROM pos360_production_stations WHERE id=$1 AND venue_id=$2`, [stationId, venueId]),
    query(`SELECT ticket_status, COUNT(*) as cnt FROM pos360_production_tickets WHERE station_id=$1 AND venue_id=$2 AND is_active=true AND ticket_status NOT IN ('completed','canceled','voided') GROUP BY ticket_status`, [stationId, venueId]),
  ])
  if (!stationR.rows.length) return { ok: false, error: 'not_found' }
  const statusCounts = {}
  countR.rows.forEach(r => { statusCounts[r.ticket_status] = parseInt(r.cnt) })
  return { ok: true, station: stationR.rows[0], statusCounts, activeTickets: Object.values(statusCounts).reduce((a, b) => a + b, 0) }
}

// ── Production Tickets ────────────────────────────────────────────────────────

export async function createTicket({ tenantId, venueId, locationId, stationId, stationType, orderId, tableId, guestId, staffUserId, deviceId, sourceDeviceId, routingSource, notes, expoNotes, allergyFlags = [], vipFlags = {}, smokecraftFlags = {}, loyaltyFlags = {}, isRush = false, promisedAt, createdBy }) {
  const area = 'createTicket'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_tickets
       (tenant_id,venue_id,location_id,station_id,station_type,order_id,table_id,guest_id,staff_user_id,device_id,source_device_id,routing_source,notes,expo_notes,allergy_flags,vip_flags,smokecraft_flags,loyalty_flags,is_rush,promised_at,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
    [tenantId, venueId, locationId, stationId, stationType || 'kitchen', orderId, tableId, guestId, staffUserId, deviceId, sourceDeviceId, routingSource, notes, expoNotes, JSON.stringify(allergyFlags), JSON.stringify(vipFlags), JSON.stringify(smokecraftFlags), JSON.stringify(loyaltyFlags), isRush, promisedAt, createdBy]
  )
  const ticket = r.rows[0]
  emitEvent({ type: PRODUCTION_EVENTS.TICKET_CREATED, tenantId, venueId, stationId, ticketId: ticket.id, orderId, tableId })
  await writeAudit({ tenantId, venueId, locationId, stationId, deviceId, orderId, staffUserId, action: 'ticket.created', entityType: 'ticket', entityId: ticket.id, newValue: { stationType, orderId, tableId, isRush } })
  return { ok: true, ticket }
}

export async function getTicket({ ticketId, venueId }) {
  const area = 'getTicket'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const [ticketR, itemsR] = await Promise.all([
    query(`SELECT * FROM pos360_production_tickets WHERE id=$1 AND venue_id=$2`, [ticketId, venueId]),
    query(`SELECT * FROM pos360_production_ticket_items WHERE ticket_id=$1 AND is_active=true ORDER BY prep_priority ASC, created_at ASC`, [ticketId]),
  ])
  if (!ticketR.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, ticket: ticketR.rows[0], items: itemsR.rows }
}

export async function listTickets({ venueId, stationId, orderId, tableId, status, rushOnly = false, limit = 50 }) {
  const area = 'listTickets'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, tickets: [] }
  const conditions = ['venue_id=$1', 'is_active=true', 'deleted_at IS NULL']
  const params = [venueId]
  if (stationId) { params.push(stationId); conditions.push(`station_id=$${params.length}`) }
  if (orderId)   { params.push(orderId);   conditions.push(`order_id=$${params.length}`) }
  if (tableId)   { params.push(tableId);   conditions.push(`table_id=$${params.length}`) }
  if (status)    { params.push(status);    conditions.push(`ticket_status=$${params.length}`) }
  if (rushOnly)  { conditions.push('is_rush=true') }
  params.push(limit)
  const r = await query(`SELECT * FROM pos360_production_tickets WHERE ${conditions.join(' AND ')} ORDER BY is_rush DESC, priority DESC, created_at ASC LIMIT $${params.length}`, params)
  return { ok: true, tickets: r.rows }
}

export async function updateTicketStatus({ ticketId, venueId, newStatus, reason, staffUserId, deviceId, stationId, updatedBy }) {
  const area = 'updateTicketStatus'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const current = await query(`SELECT * FROM pos360_production_tickets WHERE id=$1 AND venue_id=$2`, [ticketId, venueId])
  if (!current.rows.length) return { ok: false, error: 'not_found' }
  const prev = current.rows[0]

  const extra = {}
  if (newStatus === 'fired')      extra.fired_at = 'NOW()'
  if (newStatus === 'in_progress') extra.started_at = 'NOW()'
  if (newStatus === 'ready')      extra.ready_at = 'NOW()'
  if (newStatus === 'bumped')     extra.bumped_at = 'NOW()'
  if (newStatus === 'completed')  extra.completed_at = 'NOW()'

  const extraClauses = Object.keys(extra).map(k => `${k}=${extra[k]}`).join(', ')
  const baseClause = extraClauses ? `, ${extraClauses}` : ''

  const r = await query(
    `UPDATE pos360_production_tickets SET ticket_status=$1, updated_by=$2, updated_at=NOW()${baseClause} WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [newStatus, updatedBy, ticketId, venueId]
  )

  await query(
    `INSERT INTO pos360_production_ticket_status_history (tenant_id,venue_id,ticket_id,station_id,device_id,staff_user_id,previous_status,new_status,reason,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [prev.tenant_id, venueId, ticketId, stationId || prev.station_id, deviceId, staffUserId, prev.ticket_status, newStatus, reason, updatedBy]
  ).catch(() => {})

  const evMap = {
    held: PRODUCTION_EVENTS.TICKET_HELD, fired: PRODUCTION_EVENTS.TICKET_FIRED,
    in_progress: PRODUCTION_EVENTS.TICKET_STARTED, ready: PRODUCTION_EVENTS.TICKET_READY,
    bumped: PRODUCTION_EVENTS.TICKET_BUMPED, completed: PRODUCTION_EVENTS.TICKET_COMPLETED,
    canceled: PRODUCTION_EVENTS.TICKET_CANCELED, escalated: PRODUCTION_EVENTS.TICKET_ESCALATED,
  }
  if (evMap[newStatus]) emitEvent({ type: evMap[newStatus], venueId, stationId: prev.station_id, ticketId, orderId: prev.order_id })
  await writeAudit({ tenantId: prev.tenant_id, venueId, stationId: prev.station_id, deviceId, staffUserId, action: `ticket.${newStatus}`, entityType: 'ticket', entityId: ticketId, previousValue: { status: prev.ticket_status }, newValue: { status: newStatus } })

  return { ok: true, ticket: r.rows[0] }
}

export async function bumpTicket({ ticketId, venueId, staffUserId, deviceId, updatedBy }) {
  return updateTicketStatus({ ticketId, venueId, newStatus: 'bumped', staffUserId, deviceId, updatedBy })
}

export async function completeTicket({ ticketId, venueId, staffUserId, deviceId, updatedBy }) {
  return updateTicketStatus({ ticketId, venueId, newStatus: 'completed', staffUserId, deviceId, updatedBy })
}

export async function cancelTicket({ ticketId, venueId, reason, staffUserId, deviceId, updatedBy }) {
  return updateTicketStatus({ ticketId, venueId, newStatus: 'canceled', reason, staffUserId, deviceId, updatedBy })
}

export async function escalateTicket({ ticketId, venueId, reason, staffUserId, deviceId, updatedBy }) {
  return updateTicketStatus({ ticketId, venueId, newStatus: 'escalated', reason, staffUserId, deviceId, updatedBy })
}

export async function reopenTicket({ ticketId, venueId, updatedBy }) {
  return updateTicketStatus({ ticketId, venueId, newStatus: 'queued', updatedBy })
}

// ── Ticket Items ──────────────────────────────────────────────────────────────

export async function addTicketItem({ tenantId, venueId, locationId, ticketId, stationId, orderId, menuItemId, itemName, quantity = 1, modifiers = [], addons = [], notes, allergyFlags = [], smokecraftPairing = {}, vipMemberFlag = false, loyaltyFlag = false, ageGated = false, prepPriority = 0, routingStationId, createdBy }) {
  const area = 'addTicketItem'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_ticket_items
       (tenant_id,venue_id,location_id,ticket_id,station_id,order_id,menu_item_id,item_name,quantity,modifiers,addons,notes,allergy_flags,smokecraft_pairing,vip_member_flag,loyalty_flag,age_gated,prep_priority,routing_station_id,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
    [tenantId, venueId, locationId, ticketId, stationId, orderId, menuItemId, itemName, quantity, JSON.stringify(modifiers), JSON.stringify(addons), notes, JSON.stringify(allergyFlags), JSON.stringify(smokecraftPairing), vipMemberFlag, loyaltyFlag, ageGated, prepPriority, routingStationId, createdBy]
  )
  const item = r.rows[0]
  emitEvent({ type: PRODUCTION_EVENTS.ITEM_CREATED, venueId, stationId, ticketId, itemId: item.id, itemName })
  return { ok: true, item }
}

export async function updateItemStatus({ itemId, venueId, newStatus, reason, staffUserId, deviceId, ticketId, updatedBy }) {
  const area = 'updateItemStatus'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const current = await query(`SELECT * FROM pos360_production_ticket_items WHERE id=$1 AND venue_id=$2`, [itemId, venueId])
  if (!current.rows.length) return { ok: false, error: 'not_found' }
  const prev = current.rows[0]

  const extra = []
  if (newStatus === 'fired')       extra.push('fired_at=NOW()')
  if (newStatus === 'in_progress') extra.push('started_at=NOW()')
  if (newStatus === 'completed')   extra.push('completed_at=NOW()')
  if (newStatus === 'refired')     extra.push('refired_count=refired_count+1', 'fired_at=NOW()')
  const extraStr = extra.length ? `, ${extra.join(', ')}` : ''

  const r = await query(
    `UPDATE pos360_production_ticket_items SET item_status=$1, updated_by=$2, updated_at=NOW()${extraStr} WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [newStatus, updatedBy, itemId, venueId]
  )

  await query(
    `INSERT INTO pos360_production_item_status_history (tenant_id,venue_id,ticket_item_id,ticket_id,station_id,device_id,staff_user_id,previous_status,new_status,reason,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [prev.tenant_id, venueId, itemId, ticketId || prev.ticket_id, prev.station_id, deviceId, staffUserId, prev.item_status, newStatus, reason, updatedBy]
  ).catch(() => {})

  const evMap = {
    held: PRODUCTION_EVENTS.ITEM_HELD, fired: PRODUCTION_EVENTS.ITEM_FIRED,
    in_progress: PRODUCTION_EVENTS.ITEM_STARTED, ready: PRODUCTION_EVENTS.ITEM_READY,
    completed: PRODUCTION_EVENTS.ITEM_COMPLETED, refired: PRODUCTION_EVENTS.ITEM_REFIRED,
    canceled: PRODUCTION_EVENTS.ITEM_CANCELED,
  }
  if (evMap[newStatus]) emitEvent({ type: evMap[newStatus], venueId, stationId: prev.station_id, ticketId: prev.ticket_id, itemId })
  await writeAudit({ tenantId: prev.tenant_id, venueId, stationId: prev.station_id, deviceId, staffUserId, action: `item.${newStatus}`, entityType: 'ticket_item', entityId: itemId, previousValue: { status: prev.item_status }, newValue: { status: newStatus } })

  return { ok: true, item: r.rows[0] }
}

export async function startItem({ itemId, venueId, staffUserId, deviceId, updatedBy }) {
  return updateItemStatus({ itemId, venueId, newStatus: 'in_progress', staffUserId, deviceId, updatedBy })
}

export async function completeItem({ itemId, venueId, staffUserId, deviceId, updatedBy }) {
  return updateItemStatus({ itemId, venueId, newStatus: 'completed', staffUserId, deviceId, updatedBy })
}

export async function refireItem({ itemId, venueId, staffUserId, deviceId, updatedBy }) {
  return updateItemStatus({ itemId, venueId, newStatus: 'refired', staffUserId, deviceId, updatedBy })
}

export async function cancelItem({ itemId, venueId, reason, staffUserId, deviceId, updatedBy }) {
  return updateItemStatus({ itemId, venueId, newStatus: 'canceled', reason, staffUserId, deviceId, updatedBy })
}

export async function voidItem({ itemId, venueId, reason, staffUserId, deviceId, updatedBy }) {
  return updateItemStatus({ itemId, venueId, newStatus: 'voided', reason, staffUserId, deviceId, updatedBy })
}

// ── Hold / Fire ───────────────────────────────────────────────────────────────

export async function holdItem({ tenantId, venueId, locationId, stationId, deviceId, staffUserId, entityType, entityId, orderId, tableId, scheduledFireAt, notes, createdBy }) {
  const area = 'holdItem'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_hold_fire_events (tenant_id,venue_id,location_id,station_id,device_id,staff_user_id,event_type,entity_type,entity_id,order_id,table_id,scheduled_fire_at,notes,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'hold',$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [tenantId, venueId, locationId, stationId, deviceId, staffUserId, entityType || 'ticket', entityId, orderId, tableId, scheduledFireAt, notes, createdBy]
  )
  if (entityType === 'ticket') await query(`UPDATE pos360_production_tickets SET is_held=true, ticket_status='held', updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [entityId, venueId])
  if (entityType === 'ticket_item') await query(`UPDATE pos360_production_ticket_items SET is_held=true, item_status='held', updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [entityId, venueId])
  emitEvent({ type: PRODUCTION_EVENTS.TICKET_HELD, venueId, stationId, entityId, entityType })
  await writeAudit({ tenantId, venueId, stationId, deviceId, staffUserId, action: 'hold', entityType: entityType || 'ticket', entityId })
  return { ok: true, event: r.rows[0] }
}

export async function fireItem({ tenantId, venueId, locationId, stationId, deviceId, staffUserId, entityType, entityId, orderId, tableId, createdBy }) {
  const area = 'fireItem'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_hold_fire_events (tenant_id,venue_id,location_id,station_id,device_id,staff_user_id,event_type,entity_type,entity_id,order_id,table_id,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'fire',$7,$8,$9,$10,$11) RETURNING *`,
    [tenantId, venueId, locationId, stationId, deviceId, staffUserId, entityType || 'ticket', entityId, orderId, tableId, createdBy]
  )
  if (entityType === 'ticket') await query(`UPDATE pos360_production_tickets SET is_held=false, ticket_status='fired', fired_at=NOW(), updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [entityId, venueId])
  if (entityType === 'ticket_item') await query(`UPDATE pos360_production_ticket_items SET is_held=false, item_status='fired', fired_at=NOW(), updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [entityId, venueId])
  emitEvent({ type: PRODUCTION_EVENTS.TICKET_FIRED, venueId, stationId, entityId, entityType })
  await writeAudit({ tenantId, venueId, stationId, deviceId, staffUserId, action: 'fire', entityType: entityType || 'ticket', entityId })
  return { ok: true, event: r.rows[0] }
}

export async function fireOrder({ tenantId, venueId, stationId, orderId, staffUserId, deviceId, createdBy }) {
  const area = 'fireOrder'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`INSERT INTO pos360_production_hold_fire_events (tenant_id,venue_id,station_id,device_id,staff_user_id,event_type,entity_type,entity_id,order_id,created_by) VALUES ($1,$2,$3,$4,$5,'fire_order','order',$6,$7,$8) RETURNING *`, [tenantId, venueId, stationId, deviceId, staffUserId, orderId, orderId, createdBy])
  await query(`UPDATE pos360_production_tickets SET ticket_status='fired', fired_at=NOW(), updated_at=NOW() WHERE order_id=$1 AND venue_id=$2 AND ticket_status IN ('queued','held')`, [orderId, venueId])
  emitEvent({ type: PRODUCTION_EVENTS.TICKET_FIRED, venueId, stationId, orderId })
  return { ok: true, event: r.rows[0] }
}

export async function scheduleFireTime({ tenantId, venueId, stationId, entityType, entityId, scheduledFireAt, staffUserId, deviceId, createdBy }) {
  const area = 'scheduleFireTime'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`INSERT INTO pos360_production_hold_fire_events (tenant_id,venue_id,station_id,device_id,staff_user_id,event_type,entity_type,entity_id,scheduled_fire_at,created_by) VALUES ($1,$2,$3,$4,$5,'timed_fire',$6,$7,$8,$9) RETURNING *`, [tenantId, venueId, stationId, deviceId, staffUserId, entityType || 'ticket', entityId, scheduledFireAt, createdBy])
  return { ok: true, event: r.rows[0] }
}

export async function cancelHold({ tenantId, venueId, stationId, entityType, entityId, staffUserId, deviceId, createdBy }) {
  const area = 'cancelHold'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`INSERT INTO pos360_production_hold_fire_events (tenant_id,venue_id,station_id,device_id,staff_user_id,event_type,entity_type,entity_id,created_by) VALUES ($1,$2,$3,$4,$5,'cancel_hold',$6,$7,$8) RETURNING *`, [tenantId, venueId, stationId, deviceId, staffUserId, entityType || 'ticket', entityId, createdBy])
  if (entityType === 'ticket') await query(`UPDATE pos360_production_tickets SET is_held=false, ticket_status='queued', updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [entityId, venueId])
  return { ok: true, event: r.rows[0] }
}

export async function getHoldFireEvents({ venueId, stationId, entityId, limit = 50 }) {
  const area = 'getHoldFireEvents'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, events: [] }
  const conditions = ['venue_id=$1']
  const params = [venueId]
  if (stationId) { params.push(stationId); conditions.push(`station_id=$${params.length}`) }
  if (entityId)  { params.push(entityId);  conditions.push(`entity_id=$${params.length}`) }
  params.push(limit)
  const r = await query(`SELECT * FROM pos360_production_hold_fire_events WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length}`, params)
  return { ok: true, events: r.rows }
}

// ── Routing ───────────────────────────────────────────────────────────────────

export async function createRoutingRule({ tenantId, venueId, locationId, stationId, ruleName, ruleType, matchCriteria = {}, priorityOrder = 0, createdBy }) {
  const area = 'createRoutingRule'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_routing_rules (tenant_id,venue_id,location_id,station_id,rule_name,rule_type,match_criteria,priority_order,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [tenantId, venueId, locationId, stationId, ruleName, ruleType || 'item_category', JSON.stringify(matchCriteria), priorityOrder, createdBy]
  )
  return { ok: true, rule: r.rows[0] }
}

export async function listRoutingRules({ venueId, stationId }) {
  const area = 'listRoutingRules'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, rules: [] }
  const conditions = ['venue_id=$1', 'is_active=true']
  const params = [venueId]
  if (stationId) { params.push(stationId); conditions.push(`station_id=$${params.length}`) }
  const r = await query(`SELECT * FROM pos360_production_routing_rules WHERE ${conditions.join(' AND ')} ORDER BY priority_order ASC`, params)
  return { ok: true, rules: r.rows }
}

export async function resolveRoutingForItem({ venueId, menuItemId, itemTags = [], stationType }) {
  const area = 'resolveRoutingForItem'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }

  // Consumes menu item routing from Phase B.2 (pos360_menu_item_routing)
  const menuRoutingR = await query(
    `SELECT r.*, s.station_name, s.station_type FROM pos360_menu_item_routing r
     LEFT JOIN pos360_production_stations s ON s.id::text = r.routing_station_id AND s.venue_id=$1
     WHERE r.item_id=$2 AND r.venue_id=$1 ORDER BY r.is_primary DESC`,
    [venueId, menuItemId]
  ).catch(() => ({ rows: [] }))

  emitEvent({ type: PRODUCTION_EVENTS.ROUTING_RESOLVED, venueId, menuItemId })
  return {
    ok: true,
    menuItemId,
    venueId,
    routingStations: menuRoutingR.rows,
    resolvedFrom: menuRoutingR.rows.length > 0 ? 'menu_item_routing' : 'venue_station_config',
  }
}

export async function resolveRoutingForOrder({ venueId, orderId, items = [] }) {
  const area = 'resolveRoutingForOrder'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const stationsR = await query(`SELECT * FROM pos360_production_stations WHERE venue_id=$1 AND is_active=true ORDER BY sort_order ASC`, [venueId])
  emitEvent({ type: PRODUCTION_EVENTS.ROUTING_RESOLVED, venueId, orderId })
  return {
    ok: true,
    orderId,
    venueId,
    availableStations: stationsR.rows,
    items,
    message: 'Order routing resolved from venue station configuration. Full item-level routing requires Phase B.5 order service.',
    localPreview: true,
  }
}

export async function applyRoutingOverride({ tenantId, venueId, ticketId, stationId, newStationId, reason, staffUserId, createdBy }) {
  const area = 'applyRoutingOverride'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`UPDATE pos360_production_tickets SET station_id=$1, updated_by=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`, [newStationId, updatedBy || createdBy, ticketId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  emitEvent({ type: PRODUCTION_EVENTS.ROUTING_OVERRIDE_APPLIED, venueId, ticketId, stationId, newStationId })
  await writeAudit({ tenantId, venueId, stationId, staffUserId, action: 'routing.override_applied', entityType: 'ticket', entityId: ticketId, previousValue: { stationId }, newValue: { stationId: newStationId, reason } })
  return { ok: true, ticket: r.rows[0] }
}

// ── Display State ─────────────────────────────────────────────────────────────

export async function getStationDisplayState({ venueId, stationId, displayMode, limit = 30 }) {
  const area = 'getStationDisplayState'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, tickets: [], message: 'No production tickets are active for this station.' }
  const activeStatuses = ['queued', 'held', 'fired', 'in_progress', 'ready', 'delayed', 'escalated']
  const r = await query(
    `SELECT t.*, array_agg(i.*) FILTER (WHERE i.id IS NOT NULL) as items
     FROM pos360_production_tickets t
     LEFT JOIN pos360_production_ticket_items i ON i.ticket_id = t.id AND i.is_active=true
     WHERE t.venue_id=$1 AND t.station_id=$2 AND t.ticket_status = ANY($3) AND t.is_active=true
     GROUP BY t.id ORDER BY t.is_rush DESC, t.priority DESC, t.created_at ASC LIMIT $4`,
    [venueId, stationId, activeStatuses, limit]
  )
  if (!r.rows.length) return { ok: true, tickets: [], message: 'No production tickets are active for this station.' }
  return { ok: true, tickets: r.rows, stationId, displayMode: displayMode || 'station_view' }
}

export async function getExpoDisplayState({ venueId, limit = 50 }) {
  const area = 'getExpoDisplayState'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, tickets: [] }
  const r = await query(
    `SELECT t.*, s.station_name, s.station_type FROM pos360_production_tickets t
     LEFT JOIN pos360_production_stations s ON s.id=t.station_id
     WHERE t.venue_id=$1 AND t.ticket_status IN ('ready','in_progress') AND t.is_active=true
     ORDER BY t.ready_at ASC NULLS LAST, t.created_at ASC LIMIT $2`,
    [venueId, limit]
  )
  return { ok: true, tickets: r.rows }
}

export async function getAllStationsDisplayState({ venueId }) {
  const area = 'getAllStationsDisplayState'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, stations: [] }
  const stationsR = await query(`SELECT * FROM pos360_production_stations WHERE venue_id=$1 AND is_active=true ORDER BY sort_order ASC`, [venueId])
  const result = await Promise.all(stationsR.rows.map(async (s) => {
    const countR = await query(`SELECT ticket_status, COUNT(*) as cnt FROM pos360_production_tickets WHERE station_id=$1 AND venue_id=$2 AND is_active=true AND ticket_status NOT IN ('completed','canceled','voided') GROUP BY ticket_status`, [s.id, venueId])
    const statusCounts = {}
    countR.rows.forEach(r => { statusCounts[r.ticket_status] = parseInt(r.cnt) })
    return { ...s, statusCounts, activeCount: Object.values(statusCounts).reduce((a, b) => a + b, 0) }
  }))
  return { ok: true, stations: result }
}

export async function getDelayedTickets({ venueId, stationId, thresholdSeconds = 900 }) {
  const area = 'getDelayedTickets'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, tickets: [] }
  const r = await query(
    `SELECT *, EXTRACT(EPOCH FROM (NOW() - created_at))::int as elapsed_seconds FROM pos360_production_tickets
     WHERE venue_id=$1 AND ticket_status IN ('queued','fired','in_progress') AND is_active=true
     AND EXTRACT(EPOCH FROM (NOW() - created_at)) > $2
     ${stationId ? 'AND station_id=$3' : ''}
     ORDER BY created_at ASC`,
    stationId ? [venueId, thresholdSeconds, stationId] : [venueId, thresholdSeconds]
  )
  return { ok: true, tickets: r.rows }
}

export async function getRushTickets({ venueId, stationId }) {
  const area = 'getRushTickets'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, tickets: [] }
  const r = await query(
    `SELECT * FROM pos360_production_tickets WHERE venue_id=$1 AND is_rush=true AND ticket_status NOT IN ('completed','canceled','voided') AND is_active=true ${stationId ? 'AND station_id=$2' : ''} ORDER BY created_at ASC`,
    stationId ? [venueId, stationId] : [venueId]
  )
  return { ok: true, tickets: r.rows }
}

export async function getCompletedTickets({ venueId, stationId, limit = 20 }) {
  const area = 'getCompletedTickets'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, tickets: [] }
  const r = await query(
    `SELECT * FROM pos360_production_tickets WHERE venue_id=$1 AND ticket_status='completed' AND is_active=true ${stationId ? 'AND station_id=$2' : ''} ORDER BY completed_at DESC LIMIT $${stationId ? 3 : 2}`,
    stationId ? [venueId, stationId, limit] : [venueId, limit]
  )
  return { ok: true, tickets: r.rows }
}

export async function saveDisplayPreferences({ tenantId, venueId, locationId, stationId, deviceId, staffUserId, displayMode, columnsCount, showTimers, showAllergyFlags, showVipFlags, showSmokecraftFlags, showEatAlerts, autoBumpSeconds, fontSize, colorScheme, createdBy }) {
  const area = 'saveDisplayPreferences'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_display_preferences
       (tenant_id,venue_id,location_id,station_id,device_id,staff_user_id,display_mode,columns_count,show_timers,show_allergy_flags,show_vip_flags,show_smokecraft_flags,show_eat_alerts,auto_bump_seconds,font_size,color_scheme,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (station_id, device_id) WHERE station_id IS NOT NULL
     DO UPDATE SET display_mode=EXCLUDED.display_mode, columns_count=EXCLUDED.columns_count, updated_at=NOW()
     RETURNING *`,
    [tenantId, venueId, locationId, stationId, deviceId, staffUserId, displayMode || 'station_view', columnsCount || 4, showTimers !== false, showAllergyFlags !== false, showVipFlags !== false, showSmokecraftFlags !== false, showEatAlerts !== false, autoBumpSeconds, fontSize || 'medium', colorScheme || 'dark_gold', createdBy]
  )
  return { ok: true, preferences: r.rows[0] }
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export async function syncProductionDisplay({ venueId, stationId, deviceId, staffUserId }) {
  const area = 'syncProductionDisplay'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  await query(`UPDATE pos360_production_station_devices SET last_heartbeat_at=NOW(), is_online=true, updated_at=NOW() WHERE device_id=$1 AND station_id=$2`, [deviceId, stationId])
  emitEvent({ type: PRODUCTION_EVENTS.DISPLAY_SYNCED, venueId, stationId, deviceId })
  return { ok: true, syncedAt: new Date(), stationId, deviceId }
}

export async function recordDisplayHeartbeat({ venueId, stationId, deviceId }) {
  if (!isDbAvailable()) return { ok: true, localPreview: true }
  await query(`UPDATE pos360_production_station_devices SET last_heartbeat_at=NOW(), is_online=true WHERE device_id=$1 AND station_id=$2`, [deviceId, stationId]).catch(() => {})
  return { ok: true }
}

export async function recordDisplayOffline({ venueId, stationId, deviceId }) {
  if (!isDbAvailable()) return { ok: true, localPreview: true }
  await query(`UPDATE pos360_production_station_devices SET is_online=false, updated_at=NOW() WHERE device_id=$1 AND station_id=$2`, [deviceId, stationId]).catch(() => {})
  emitEvent({ type: PRODUCTION_EVENTS.DISPLAY_OFFLINE, venueId, stationId, deviceId })
  return { ok: true }
}

export async function recordDisplayOnline({ venueId, stationId, deviceId }) {
  if (!isDbAvailable()) return { ok: true, localPreview: true }
  await query(`UPDATE pos360_production_station_devices SET is_online=true, last_heartbeat_at=NOW(), updated_at=NOW() WHERE device_id=$1 AND station_id=$2`, [deviceId, stationId]).catch(() => {})
  emitEvent({ type: PRODUCTION_EVENTS.DISPLAY_ONLINE, venueId, stationId, deviceId })
  return { ok: true }
}

// ── SmokeCraft Hooks ──────────────────────────────────────────────────────────

export async function getProductionSmokecraftContext({ venueId, guestId, ticketId }) {
  emitEvent({ type: PRODUCTION_EVENTS.SMOKECRAFT_CONTEXT_LOADED, venueId, guestId, ticketId })
  return {
    ok: true,
    guestId,
    ticketId,
    smokecraftContext: null,
    pairingFlags: [],
    cigarRoutingHint: null,
    message: 'SmokeCraft production context not connected. Connect SmokeCraft module for pairing flags.',
    localPreview: true,
  }
}

export async function attachSmokecraftPairingNote({ venueId, ticketItemId, pairingNote, updatedBy }) {
  const area = 'attachSmokecraftPairingNote'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(`UPDATE pos360_production_ticket_items SET smokecraft_pairing=$1, updated_by=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`, [JSON.stringify(pairingNote), updatedBy, ticketItemId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, item: r.rows[0] }
}

// ── E.A.T. Hooks ──────────────────────────────────────────────────────────────

export async function getProductionRecommendations({ venueId, stationId }) {
  emitEvent({ type: PRODUCTION_EVENTS.EAT_RECOMMENDATIONS_LOADED, venueId, stationId })
  return {
    ok: true,
    recommendations: [],
    bottleneckWarnings: [],
    delayWarnings: [],
    rushRecommendations: [],
    message: 'E.A.T. production intelligence not connected. No recommendations available.',
    localPreview: true,
  }
}

export async function getStationBottleneckHooks({ venueId, stationId }) {
  return {
    ok: true,
    stationId,
    bottlenecks: [],
    message: 'Bottleneck detection requires E.A.T. integration.',
    localPreview: true,
  }
}

export async function getDelayWarningHooks({ venueId, stationId }) {
  return {
    ok: true,
    stationId,
    warnings: [],
    message: 'Delay warnings require E.A.T. integration.',
    localPreview: true,
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function recordAnalyticsEvent({ tenantId, venueId, locationId, stationId, deviceId, orderId, ticketId, metricType, metricValue, metricUnit, metricContext = {}, createdBy }) {
  const area = 'recordAnalyticsEvent'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area }
  const r = await query(
    `INSERT INTO pos360_production_analytics_events (tenant_id,venue_id,location_id,station_id,device_id,order_id,ticket_id,metric_type,metric_value,metric_unit,metric_context,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [tenantId, venueId, locationId, stationId, deviceId, orderId, ticketId, metricType, metricValue, metricUnit, JSON.stringify(metricContext), createdBy]
  )
  emitEvent({ type: PRODUCTION_EVENTS.ANALYTICS_RECORDED, venueId, stationId, metricType })
  return { ok: true, event: r.rows[0] }
}

export async function getProductionAnalyticsSummary({ venueId, stationId, since }) {
  const area = 'getProductionAnalyticsSummary'
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area, summary: null, message: 'Analytics unavailable — no database connection.' }
  return { ok: true, venueId, stationId, summary: null, message: 'Full analytics require Phase B.6 reporting service.', localPreview: true }
}

export async function getPrepTimeHooks({ venueId, stationId }) {
  return { ok: true, stationId, avgPrepSeconds: null, message: 'Prep time analytics require Phase B.6.', localPreview: true }
}

export async function getStationPerformanceHooks({ venueId, stationId }) {
  return { ok: true, stationId, performance: null, message: 'Station performance hooks require Phase B.6.', localPreview: true }
}
