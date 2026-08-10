/**
 * POS360 SmokeCraft Order Bridge Service — Phase F.8
 *
 * Real database-backed persistence for SmokeCraft → POS360 order intent and handoff.
 * Falls back to safe local-only responses when database is unavailable.
 * Never fakes backendConnected: true.
 * Never claims payment completed unless payment processor confirms.
 */

const SAFE_CLAIM = 'pos360_smokecraft_order_bridge'

async function isDbAvailable() {
  try {
    const { isDbAvailable: check } = await import('../../db/connection.js')
    return check()
  } catch {
    return false
  }
}

async function dbQuery(sql, params = []) {
  const { query } = await import('../../db/connection.js')
  return query(sql, params)
}

function localFallback(area, extra = {}) {
  return {
    ok: false,
    backendConnected: false,
    orderStatus: 'local_fallback',
    persistenceMode: 'local_fallback',
    error: 'database_not_configured',
    safeClaim: SAFE_CLAIM,
    area,
    ...extra,
  }
}

// ── Health ────────────────────────────────────────────────────

export async function getPOS360SmokeCraftBridgeHealth() {
  const available = await isDbAvailable()
  if (!available) {
    return {
      ok: true,
      backendConnected: false,
      orderStatus: 'not_connected',
      persistenceMode: 'local_fallback',
      safeClaim: SAFE_CLAIM,
      message: 'Database not configured. POS360 SmokeCraft bridge running in local-fallback mode.',
    }
  }
  try {
    await dbQuery('SELECT 1')
    return {
      ok: true,
      backendConnected: true,
      orderStatus: 'connected',
      persistenceMode: 'database',
      safeClaim: SAFE_CLAIM,
    }
  } catch (err) {
    return {
      ok: false,
      backendConnected: false,
      orderStatus: 'error',
      persistenceMode: 'local_fallback',
      error: err.message,
      safeClaim: SAFE_CLAIM,
    }
  }
}

// ── Order intent ──────────────────────────────────────────────

export async function createSmokeCraftOrderIntent({
  tenantId, venueId, guestId, smokecraftSessionId, passportSessionId,
  cigarReference, menuItemReference, quantity, modifiers, orderPayload,
  orderSource, orderType, idempotencyKey,
}) {
  if (!await isDbAvailable()) return localFallback('createSmokeCraftOrderIntent')
  const resolvedTenant = tenantId || 'novee-default'
  try {
    // Real idempotency: if a caller retries with the same key (network
    // timeout, double-click, refresh mid-submit), return the original
    // row instead of inserting a second order intent. ON CONFLICT DO
    // NOTHING + a follow-up SELECT (rather than a single upsert) keeps
    // the RETURNING clause honest about whether this call created the
    // row or found an existing one.
    if (idempotencyKey) {
      const existing = await dbQuery(
        `SELECT order_intent_id, order_type, order_status, created_at FROM pos360_smokecraft_order_intents
         WHERE tenant_id = $1 AND idempotency_key = $2`,
        [resolvedTenant, idempotencyKey]
      )
      if (existing.rows[0]) {
        return {
          ok: true, backendConnected: true, orderStatus: existing.rows[0].order_status,
          persistenceMode: 'database', safeClaim: SAFE_CLAIM,
          orderIntent: existing.rows[0], duplicate: true,
        }
      }
    }
    const result = await dbQuery(
      `INSERT INTO pos360_smokecraft_order_intents
         (tenant_id, venue_id, guest_id, smokecraft_session_id, passport_session_id,
          cigar_reference, menu_item_reference, quantity, modifiers_json, order_payload_json,
          order_source, order_type, backend_connected, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13)
       ON CONFLICT (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING order_intent_id, order_type, order_status, created_at`,
      [
        resolvedTenant,
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        smokecraftSessionId || null,
        passportSessionId   || null,
        cigarReference      || null,
        menuItemReference   || null,
        quantity            || 1,
        JSON.stringify(modifiers    || []),
        JSON.stringify(orderPayload || {}),
        orderSource || 'smokecraft',
        orderType   || 'cigar_request',
        idempotencyKey || null,
      ]
    )
    if (!result.rows[0] && idempotencyKey) {
      // Lost a race against a concurrent identical request — fetch what
      // the other request just inserted rather than reporting failure.
      const raced = await dbQuery(
        `SELECT order_intent_id, order_type, order_status, created_at FROM pos360_smokecraft_order_intents
         WHERE tenant_id = $1 AND idempotency_key = $2`,
        [resolvedTenant, idempotencyKey]
      )
      return {
        ok: true, backendConnected: true, orderStatus: raced.rows[0]?.order_status,
        persistenceMode: 'database', safeClaim: SAFE_CLAIM,
        orderIntent: raced.rows[0], duplicate: true,
      }
    }
    return {
      ok: true, backendConnected: true, orderStatus: 'pending_staff_review',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      orderIntent: result.rows[0], duplicate: false,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'createSmokeCraftOrderIntent' }
  }
}

// ── Handoff request ───────────────────────────────────────────

export async function createSmokeCraftHandoffRequest({
  tenantId, venueId, guestId, smokecraftSessionId, passportSessionId,
  source, targetSystem, handoffPayload, staffActionRequired,
}) {
  if (!await isDbAvailable()) return localFallback('createSmokeCraftHandoffRequest')
  try {
    const result = await dbQuery(
      `INSERT INTO pos360_smokecraft_handoff_requests
         (tenant_id, venue_id, guest_id, smokecraft_session_id, passport_session_id,
          source, target_system, handoff_payload_json, staff_action_required, backend_connected)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
       RETURNING handoff_id, handoff_status, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        smokecraftSessionId || null,
        passportSessionId   || null,
        source       || 'smokecraft',
        targetSystem || 'pos360',
        JSON.stringify(handoffPayload || {}),
        staffActionRequired !== false,
      ]
    )
    return {
      ok: true, backendConnected: true, orderStatus: 'pending_staff_action',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      handoff: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'createSmokeCraftHandoffRequest' }
  }
}

// ── Menu item reference ───────────────────────────────────────

export async function attachSmokeCraftMenuItemReference({
  tenantId, venueId, smokecraftSessionId, orderIntentId,
  cigarReference, menuItemReference, pairingReference, quantity, modifiers, pricePointSignal,
}) {
  if (!await isDbAvailable()) return localFallback('attachSmokeCraftMenuItemReference')
  try {
    const result = await dbQuery(
      `INSERT INTO pos360_smokecraft_menu_item_refs
         (tenant_id, venue_id, smokecraft_session_id, order_intent_id, cigar_reference,
          menu_item_reference, pairing_reference, quantity, modifiers_json, price_point_signal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING ref_id, cigar_reference, menu_item_reference, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        smokecraftSessionId || null,
        orderIntentId       || null,
        cigarReference      || null,
        menuItemReference   || null,
        pairingReference    || null,
        quantity            || 1,
        JSON.stringify(modifiers || []),
        pricePointSignal    || null,
      ]
    )
    return {
      ok: true, backendConnected: true, orderStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      menuRef: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'attachSmokeCraftMenuItemReference' }
  }
}

// ── Staff action ──────────────────────────────────────────────

// Loyalty accrual is only ever triggered from this one real commerce event
// — a staff member marking a SmokeCraft order intent as actually fulfilled
// at the venue (a genuine purchase), never from request creation, never
// from XP/gameplay. Points are tracked entirely inside the existing real
// POS360 loyalty ledger (pos360_loyalty_profiles / pos360_loyalty_points_ledger)
// — completely separate storage from SmokeCraft's journeyXP. The guest is
// auto-provisioned into pos360_customers/pos360_loyalty_profiles keyed by
// the same smokecraftSessionId-derived guestId so the mapping is stable
// and inspectable, never duplicated (guestId is looked up by a stable
// external reference before any INSERT).
const POINTS_PER_FULFILLED_ORDER = 10

async function accrueLoyaltyForFulfilledOrder({ tenantId, venueId, guestId, orderIntentId }) {
  if (!guestId || !orderIntentId) return { ok: false, error: 'missing_guest_or_order' }
  const tid = tenantId || 'novee-default'
  const vid = venueId  || 'novee-grand-lounge'
  try {
    // Find-or-create the POS360 customer for this SmokeCraft guest. The
    // guest's SmokeCraft id is stored verbatim in metadata so the mapping
    // is auditable and never re-derived by guesswork.
    let customer = await dbQuery(
      `SELECT id FROM pos360_customers WHERE venue_id=$1 AND metadata->>'smokecraft_guest_id' = $2 LIMIT 1`,
      [vid, guestId]
    )
    let customerId
    if (customer.rows.length) {
      customerId = customer.rows[0].id
    } else {
      const created = await dbQuery(
        `INSERT INTO pos360_customers (tenant_id, venue_id, display_name, is_anonymous, metadata)
         VALUES ($1,$2,$3,TRUE,$4) RETURNING id`,
        [tid, vid, `SmokeCraft Guest ${String(guestId).slice(0, 8)}`, JSON.stringify({ smokecraft_guest_id: guestId })]
      )
      customerId = created.rows[0].id
    }

    let profile = await dbQuery(
      `SELECT id, points_balance FROM pos360_loyalty_profiles WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`,
      [vid, customerId]
    )
    if (!profile.rows.length) {
      await dbQuery(
        `INSERT INTO pos360_loyalty_profiles (tenant_id, venue_id, customer_id, loyalty_number) VALUES ($1,$2,$3,$4)`,
        [tid, vid, customerId, `SC-${orderIntentId.slice(0, 8)}`]
      )
      profile = await dbQuery(`SELECT id, points_balance FROM pos360_loyalty_profiles WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`, [vid, customerId])
    }
    const loyaltyProfileId = profile.rows[0].id

    // Same idempotency pattern as the rest of this bridge: idempotencyKey
    // is the order_intent_id itself, so a retried/duplicated "fulfilled"
    // staff action can never double-award points for the same order.
    const idempotencyKey = `pos360-fulfilled-${orderIntentId}`
    const dup = await dbQuery(`SELECT id, balance_after FROM pos360_loyalty_points_ledger WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, vid])
    if (dup.rows.length) {
      return { ok: true, duplicate: true, pointsEarned: 0, newBalance: dup.rows[0].balance_after, customerId, loyaltyProfileId }
    }

    const points = POINTS_PER_FULFILLED_ORDER
    await dbQuery(`UPDATE pos360_loyalty_profiles SET points_balance=points_balance+$2, lifetime_points_earned=lifetime_points_earned+$2, last_activity_at=now() WHERE id=$1`, [loyaltyProfileId, points])
    // pos360_loyalty_profiles.points_balance is bigint — the driver
    // returns bigint columns as strings, so this MUST be parsed before
    // arithmetic or "0" + 10 silently becomes the string "010".
    const newBalance = (parseInt(profile.rows[0].points_balance, 10) || 0) + points
    await dbQuery(
      `INSERT INTO pos360_loyalty_points_ledger (tenant_id, venue_id, loyalty_profile_id, customer_id, transaction_type, points_delta, balance_after, reference_id, reference_type, reason, idempotency_key)
       VALUES ($1,$2,$3,$4,'earn',$5,$6,$7,'smokecraft_order_intent','SmokeCraft order fulfilled',$8)`,
      [tid, vid, loyaltyProfileId, customerId, points, newBalance, orderIntentId, idempotencyKey]
    )
    return { ok: true, duplicate: false, pointsEarned: points, newBalance, customerId, loyaltyProfileId }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export async function recordSmokeCraftStaffAction({
  tenantId, venueId, orderIntentId, handoffId, smokecraftSessionId,
  staffUserId, actionType, actionNotes, actionPayload,
}) {
  if (!await isDbAvailable()) return localFallback('recordSmokeCraftStaffAction')
  try {
    const result = await dbQuery(
      `INSERT INTO pos360_smokecraft_staff_actions
         (tenant_id, venue_id, order_intent_id, handoff_id, smokecraft_session_id,
          staff_user_id, action_type, action_notes, action_payload_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING action_id, action_type, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        orderIntentId       || null,
        handoffId           || null,
        smokecraftSessionId || null,
        staffUserId         || null,
        actionType,
        actionNotes         || null,
        JSON.stringify(actionPayload || {}),
      ]
    )

    let loyalty = null
    if (actionType === 'order_fulfilled' && orderIntentId) {
      await dbQuery(`UPDATE pos360_smokecraft_order_intents SET order_status='fulfilled', updated_at=now() WHERE order_intent_id=$1`, [orderIntentId])
      const guestRow = await dbQuery(`SELECT guest_id FROM pos360_smokecraft_order_intents WHERE order_intent_id=$1`, [orderIntentId])
      const guestId = guestRow.rows[0]?.guest_id
      loyalty = await accrueLoyaltyForFulfilledOrder({ tenantId, venueId, guestId, orderIntentId })
    }

    return {
      ok: true, backendConnected: true, orderStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      staffAction: result.rows[0],
      loyalty,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'recordSmokeCraftStaffAction' }
  }
}

// ── Order sync status ─────────────────────────────────────────

export async function updateSmokeCraftOrderSyncStatus({
  tenantId, venueId, orderIntentId, smokecraftSessionId, syncPhase, syncStatus, syncNotes,
}) {
  if (!await isDbAvailable()) return localFallback('updateSmokeCraftOrderSyncStatus')
  try {
    const result = await dbQuery(
      `INSERT INTO pos360_smokecraft_order_sync_status
         (tenant_id, venue_id, order_intent_id, smokecraft_session_id,
          sync_phase, sync_status, backend_connected, sync_notes)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7)
       RETURNING sync_status_id, sync_phase, sync_status, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        orderIntentId       || null,
        smokecraftSessionId || null,
        syncPhase  || 'intent_created',
        syncStatus || 'pending',
        syncNotes  || null,
      ]
    )
    return {
      ok: true, backendConnected: true, orderStatus: syncStatus || 'pending',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      syncStatusRecord: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'updateSmokeCraftOrderSyncStatus' }
  }
}

// ── Read: order intent ────────────────────────────────────────

export async function getSmokeCraftOrderIntent({ orderIntentId }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftOrderIntent')
  try {
    const result = await dbQuery(
      `SELECT * FROM pos360_smokecraft_order_intents WHERE order_intent_id = $1`,
      [orderIntentId]
    )
    return {
      ok: true, backendConnected: true, orderStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      orderIntent: result.rows[0] || null,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftOrderIntent' }
  }
}

// ── Read: guest order intents ─────────────────────────────────

export async function getSmokeCraftOrderIntentsForGuest({ guestId, limit = 20 }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftOrderIntentsForGuest')
  try {
    const result = await dbQuery(
      `SELECT * FROM pos360_smokecraft_order_intents WHERE guest_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [guestId, Math.min(limit, 100)]
    )
    return {
      ok: true, backendConnected: true, orderStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      orderIntents: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftOrderIntentsForGuest' }
  }
}

// ── Read: handoff requests ────────────────────────────────────

export async function getSmokeCraftHandoffRequests({ venueId, status }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftHandoffRequests')
  try {
    const params = [venueId || 'novee-grand-lounge']
    const statusClause = status ? ' AND handoff_status = $2' : ''
    if (status) params.push(status)
    const result = await dbQuery(
      `SELECT * FROM pos360_smokecraft_handoff_requests WHERE venue_id = $1${statusClause} ORDER BY created_at DESC LIMIT 50`,
      params
    )
    return {
      ok: true, backendConnected: true, orderStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      handoffs: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftHandoffRequests' }
  }
}

// ── Read: order sync status ───────────────────────────────────

export async function getSmokeCraftOrderSyncStatus({ orderIntentId }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftOrderSyncStatus')
  try {
    const result = await dbQuery(
      `SELECT * FROM pos360_smokecraft_order_sync_status WHERE order_intent_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [orderIntentId]
    )
    return {
      ok: true, backendConnected: true, orderStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      syncStatuses: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftOrderSyncStatus' }
  }
}

// ── Audit log ─────────────────────────────────────────────────

export async function writePOS360SmokeCraftOrderAuditEvent({
  tenantId, venueId, guestId, orderIntentId, handoffId,
  smokecraftSessionId, eventType, syncStatus, backendConnected, summary, metadata,
}) {
  if (!await isDbAvailable()) return { ok: false, backendConnected: false, notice: 'audit_skipped_no_db' }
  try {
    await dbQuery(
      `INSERT INTO pos360_smokecraft_order_audit_log
         (tenant_id, venue_id, guest_id, order_intent_id, handoff_id, smokecraft_session_id,
          event_type, sync_status, backend_connected, summary, metadata_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        orderIntentId       || null,
        handoffId           || null,
        smokecraftSessionId || null,
        eventType,
        syncStatus       || 'ok',
        backendConnected || false,
        summary          || null,
        JSON.stringify(metadata || {}),
      ]
    )
    return { ok: true, backendConnected: true }
  } catch {
    return { ok: false, backendConnected: false, notice: 'audit_write_failed' }
  }
}

export async function getPOS360SmokeCraftAuditLog({ guestId, limit = 50 }) {
  if (!await isDbAvailable()) return localFallback('getPOS360SmokeCraftAuditLog')
  try {
    const result = await dbQuery(
      `SELECT * FROM pos360_smokecraft_order_audit_log WHERE guest_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [guestId, Math.min(limit, 200)]
    )
    return {
      ok: true, backendConnected: true, orderStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      auditLog: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, orderStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getPOS360SmokeCraftAuditLog' }
  }
}
