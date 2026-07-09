/**
 * DayOne360 SmokeCraft Connection Service — Phase F.10
 * Connects SmokeCraft guest sessions to DayOne360 internal workflow reference layer.
 * Reference: www.dayone360.com
 *
 * IMPORTANT CONSTRAINTS:
 * - Does NOT claim live travel booking, relocation, or concierge fulfillment.
 * - Does NOT fake DayOne360 external website integration.
 * - Does NOT claim DayOne360 connection delivers real-world services.
 * - Returns backendConnected: true only when DB persistence confirmed.
 * - Safe local fallback when DB unavailable — never blocks guest screen.
 */

const SAFE_CLAIM = 'dayone360_smokecraft_connection_internal'

const ASSET_INVENTORY = [
  { assetId: 'dayone360-concierge-hero', path: '/assets/dayone/concierge-hero.png', type: 'image', description: 'DayOne360 concierge hero image' },
  { assetId: 'dayone360-concierge-reference', path: '/public/design-references/mvp2/dayone360/concierge-reference.png', type: 'design-reference', description: 'DayOne360 concierge design reference' },
]

async function isDbAvailable() {
  try {
    const { isDbAvailable: check } = await import('../../db/connection.js')
    return check()
  } catch { return false }
}

async function dbQuery(sql, params = []) {
  const { query } = await import('../../db/connection.js')
  return query(sql, params)
}

function localFallback(area, extra = {}) {
  return {
    ok: false,
    backendConnected: false,
    persistenceMode: 'local_fallback',
    error: 'database_not_configured',
    safeClaim: SAFE_CLAIM,
    area,
    ...extra,
  }
}

export async function getDayOne360ConnectionHealth() {
  if (!(await isDbAvailable())) return localFallback('health')
  try {
    await dbQuery('SELECT 1')
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, websiteReference: 'www.dayone360.com' }
  } catch (e) {
    return localFallback('health', { error: e.message })
  }
}

export async function getDayOne360AssetInventory() {
  return {
    ok: true,
    backendConnected: false,
    persistenceMode: 'static_asset_scan',
    safeClaim: SAFE_CLAIM,
    assets: ASSET_INVENTORY,
    websiteReference: 'www.dayone360.com',
    note: 'Asset inventory is static — no live DayOne360 external API connection',
  }
}

export async function createSmokeCraftDayOneConnection({ venueId, guestId, smokecraftSessionId, tenantId, connectionType, workflowReference, metadata }) {
  if (!(await isDbAvailable())) return localFallback('createSmokeCraftDayOneConnection')
  try {
    const res = await dbQuery(
      `INSERT INTO dayone360_smokecraft_connections
         (venue_id, guest_id, smokecraft_session_id, tenant_id, connection_type, workflow_reference, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [venueId, guestId || null, smokecraftSessionId || null, tenantId || null,
       connectionType || 'smokecraft_session_link', workflowReference || null,
       JSON.stringify(metadata || {})]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', connection: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('createSmokeCraftDayOneConnection', { error: e.message })
  }
}

export async function recordDayOneGuestWorkflowEvent({ connectionId, venueId, guestId, smokecraftSessionId, eventType, eventPayload }) {
  if (!(await isDbAvailable())) return localFallback('recordDayOneGuestWorkflowEvent')
  try {
    const res = await dbQuery(
      `INSERT INTO dayone360_guest_workflow_events
         (connection_id, venue_id, guest_id, smokecraft_session_id, event_type, event_payload, backend_connected)
       VALUES ($1,$2,$3,$4,$5,$6, TRUE) RETURNING *`,
      [connectionId || null, venueId, guestId || null, smokecraftSessionId || null,
       eventType, JSON.stringify(eventPayload || {})]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', workflowEvent: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('recordDayOneGuestWorkflowEvent', { error: e.message })
  }
}

export async function getSmokeCraftDayOneConnections({ venueId, guestId, limit = 50 }) {
  if (!(await isDbAvailable())) return localFallback('getSmokeCraftDayOneConnections')
  try {
    const conds = ['venue_id = $1']
    const vals = [venueId]
    let i = 2
    if (guestId) { conds.push(`guest_id = $${i++}`); vals.push(guestId) }
    vals.push(limit)
    const res = await dbQuery(
      `SELECT * FROM dayone360_smokecraft_connections WHERE ${conds.join(' AND ')} ORDER BY created_at DESC LIMIT $${i}`,
      vals
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', connections: res.rows, safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('getSmokeCraftDayOneConnections', { error: e.message })
  }
}

export async function getDayOneGuestWorkflowEvents({ venueId, guestId, connectionId, limit = 50 }) {
  if (!(await isDbAvailable())) return localFallback('getDayOneGuestWorkflowEvents')
  try {
    const conds = ['venue_id = $1']
    const vals = [venueId]
    let i = 2
    if (guestId)      { conds.push(`guest_id = $${i++}`); vals.push(guestId) }
    if (connectionId) { conds.push(`connection_id = $${i++}`); vals.push(connectionId) }
    vals.push(limit)
    const res = await dbQuery(
      `SELECT * FROM dayone360_guest_workflow_events WHERE ${conds.join(' AND ')} ORDER BY created_at DESC LIMIT $${i}`,
      vals
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', events: res.rows, safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('getDayOneGuestWorkflowEvents', { error: e.message })
  }
}

export async function writeDayOneConnectionAuditEvent({ connectionId, venueId, eventType, syncStatus, backendConnected, metadata }) {
  if (!(await isDbAvailable())) return localFallback('writeDayOneConnectionAuditEvent')
  try {
    const res = await dbQuery(
      `INSERT INTO dayone360_connection_audit_log (connection_id, venue_id, event_type, sync_status, backend_connected, metadata)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [connectionId || null, venueId || null, eventType,
       syncStatus || 'ok', backendConnected || false, JSON.stringify(metadata || {})]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', auditEvent: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('writeDayOneConnectionAuditEvent', { error: e.message })
  }
}

export async function getDayOneConnectionAuditLog({ venueId, connectionId, limit = 50 }) {
  if (!(await isDbAvailable())) return localFallback('getDayOneConnectionAuditLog')
  try {
    const conds = ['1=1']
    const vals = []
    let i = 1
    if (venueId)      { conds.push(`venue_id = $${i++}`); vals.push(venueId) }
    if (connectionId) { conds.push(`connection_id = $${i++}`); vals.push(connectionId) }
    vals.push(limit)
    const res = await dbQuery(
      `SELECT * FROM dayone360_connection_audit_log WHERE ${conds.join(' AND ')} ORDER BY created_at DESC LIMIT $${i}`,
      vals
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', auditLog: res.rows, safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('getDayOneConnectionAuditLog', { error: e.message })
  }
}
