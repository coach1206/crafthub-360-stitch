/**
 * Ticket Tapper Promotion Service — Phase F.10
 * Real DB persistence with safe local fallback.
 * Does NOT claim payment processing, POS provider integration, or live vendor ordering.
 */

const SAFE_CLAIM = 'ticket_tapper_promotion_backend'

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

export async function getTicketTapperHealth() {
  if (!(await isDbAvailable())) return localFallback('health')
  try {
    await dbQuery('SELECT 1')
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('health', { error: e.message })
  }
}

export async function createPromotion({ venueId, tenantId, title, subtitle, description, promotionType, promotedByRole, specialPrice, regularPrice, discountAmount, callToAction, imagePath, badgeLabel, startsAt, endsAt, createdByStaffId, approvalStatus }) {
  if (!(await isDbAvailable())) return localFallback('createPromotion')
  try {
    const res = await dbQuery(
      `INSERT INTO ticket_tapper_promotions
         (venue_id, tenant_id, title, subtitle, description, promotion_type, promoted_by_role,
          special_price, regular_price, discount_amount, call_to_action, image_path, badge_label,
          starts_at, ends_at, created_by_staff_id, approval_status, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'draft')
       RETURNING *`,
      [venueId, tenantId || null, title, subtitle || null, description || null, promotionType,
       promotedByRole || null, specialPrice || null, regularPrice || null, discountAmount || null,
       callToAction || null, imagePath || null, badgeLabel || null,
       startsAt || null, endsAt || null, createdByStaffId || null, approvalStatus || 'auto_approved']
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', promotion: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('createPromotion', { error: e.message })
  }
}

export async function updatePromotion(promotionId, fields) {
  if (!(await isDbAvailable())) return localFallback('updatePromotion')
  try {
    const allowed = ['title','subtitle','description','promotion_type','promoted_by_role','special_price',
      'regular_price','discount_amount','call_to_action','image_path','badge_label','starts_at','ends_at','approval_status']
    const sets = []
    const vals = []
    let i = 1
    for (const [k, v] of Object.entries(fields)) {
      const col = k.replace(/([A-Z])/g, '_$1').toLowerCase()
      if (allowed.includes(col)) { sets.push(`${col} = $${i++}`); vals.push(v) }
    }
    if (sets.length === 0) return localFallback('updatePromotion', { error: 'no_valid_fields' })
    sets.push(`updated_at = NOW()`)
    vals.push(promotionId)
    const res = await dbQuery(`UPDATE ticket_tapper_promotions SET ${sets.join(', ')} WHERE promotion_id = $${i} RETURNING *`, vals)
    return { ok: true, backendConnected: true, persistenceMode: 'database', promotion: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('updatePromotion', { error: e.message })
  }
}

export async function activatePromotion(promotionId) {
  if (!(await isDbAvailable())) return localFallback('activatePromotion')
  try {
    const res = await dbQuery(
      `UPDATE ticket_tapper_promotions SET status = 'active', updated_at = NOW() WHERE promotion_id = $1 RETURNING *`,
      [promotionId]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', promotion: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('activatePromotion', { error: e.message })
  }
}

export async function deactivatePromotion(promotionId) {
  if (!(await isDbAvailable())) return localFallback('deactivatePromotion')
  try {
    const res = await dbQuery(
      `UPDATE ticket_tapper_promotions SET status = 'paused', updated_at = NOW() WHERE promotion_id = $1 RETURNING *`,
      [promotionId]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', promotion: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('deactivatePromotion', { error: e.message })
  }
}

export async function listPromotions({ venueId, tenantId, status }) {
  if (!(await isDbAvailable())) return localFallback('listPromotions')
  try {
    const conds = ['venue_id = $1']
    const vals = [venueId]
    let i = 2
    if (tenantId) { conds.push(`tenant_id = $${i++}`); vals.push(tenantId) }
    if (status)   { conds.push(`status = $${i++}`); vals.push(status) }
    const res = await dbQuery(`SELECT * FROM ticket_tapper_promotions WHERE ${conds.join(' AND ')} ORDER BY created_at DESC`, vals)
    return { ok: true, backendConnected: true, persistenceMode: 'database', promotions: res.rows, safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('listPromotions', { error: e.message })
  }
}

export async function getPromotion(promotionId) {
  if (!(await isDbAvailable())) return localFallback('getPromotion')
  try {
    const res = await dbQuery('SELECT * FROM ticket_tapper_promotions WHERE promotion_id = $1', [promotionId])
    return { ok: true, backendConnected: true, persistenceMode: 'database', promotion: res.rows[0] || null, safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('getPromotion', { error: e.message })
  }
}

export async function listActivePromotionsForSmokeCraft(venueId) {
  if (!(await isDbAvailable())) return localFallback('listActivePromotionsForSmokeCraft')
  try {
    const res = await dbQuery(
      `SELECT * FROM ticket_tapper_promotions WHERE venue_id = $1 AND status = 'active' AND approval_status IN ('auto_approved','approved') ORDER BY created_at DESC`,
      [venueId]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', promotions: res.rows, safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('listActivePromotionsForSmokeCraft', { error: e.message })
  }
}

export async function recordPromotionRedemption({ promotionId, venueId, guestId, smokecraftSessionId, redemptionMode, quantity, unitPrice, metadata }) {
  if (!(await isDbAvailable())) return localFallback('recordPromotionRedemption')
  try {
    const res = await dbQuery(
      `INSERT INTO ticket_tapper_promotion_redemptions
         (promotion_id, venue_id, guest_id, smokecraft_session_id, redemption_mode, quantity, unit_price, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [promotionId, venueId, guestId || null, smokecraftSessionId || null,
       redemptionMode || 'smokecraft_guest', quantity || 1, unitPrice || null, JSON.stringify(metadata || {})]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', redemption: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('recordPromotionRedemption', { error: e.message })
  }
}

export async function writeTicketTapperAuditEvent({ promotionId, venueId, eventType, performedBy, metadata }) {
  if (!(await isDbAvailable())) return localFallback('writeTicketTapperAuditEvent')
  try {
    const res = await dbQuery(
      `INSERT INTO ticket_tapper_management_audit_log (promotion_id, venue_id, event_type, performed_by, metadata)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [promotionId || null, venueId || null, eventType, performedBy || null, JSON.stringify(metadata || {})]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', auditEvent: res.rows[0], safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('writeTicketTapperAuditEvent', { error: e.message })
  }
}

export async function getTicketTapperAuditLog({ venueId, promotionId, limit = 50 }) {
  if (!(await isDbAvailable())) return localFallback('getTicketTapperAuditLog')
  try {
    const conds = ['1=1']
    const vals = []
    let i = 1
    if (venueId)     { conds.push(`venue_id = $${i++}`); vals.push(venueId) }
    if (promotionId) { conds.push(`promotion_id = $${i++}`); vals.push(promotionId) }
    vals.push(limit)
    const res = await dbQuery(
      `SELECT * FROM ticket_tapper_management_audit_log WHERE ${conds.join(' AND ')} ORDER BY created_at DESC LIMIT $${i}`,
      vals
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', auditLog: res.rows, safeClaim: SAFE_CLAIM }
  } catch (e) {
    return localFallback('getTicketTapperAuditLog', { error: e.message })
  }
}
