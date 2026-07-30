/**
 * Venue Humidor 1B-2B-2 — staff order and fulfillment queue. Owns
 * only the pre-completion staff workflow dimension
 * (`fulfillment_status`: new/awaiting_confirmation/confirmed/
 * in_preparation/ready/blocked) plus claim/assignment and item
 * picking. Final completion and cancellation ALWAYS delegate to the
 * existing, sole authoritative `checkoutService.completeOrder()` /
 * `checkoutService.cancelOrder()` — this file never updates order
 * `status`/`payment_status`, never calls `applyInventoryEvent()`
 * directly, and never releases a hold directly.
 */
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { getDb } from '../../db/connection.js'
import * as checkoutService from './checkoutService.js'
import { getProductAvailability } from './inventoryService.js'

const SALT_ROUNDS = 10
const MAX_VERIFICATION_ATTEMPTS = 5
const PICKUP_CODE_TTL_MS = 24 * 60 * 60 * 1000
const PICKUP_METHOD_REQUIRES_CODE = new Set(['counter_pickup'])

export class FulfillmentError extends Error {
  constructor(code) { super(code); this.code = code }
}

const PRE_COMPLETION_STATES = ['new', 'awaiting_confirmation', 'confirmed', 'in_preparation', 'ready', 'blocked']

const ALLOWED_TRANSITIONS = {
  order_confirmed: { from: ['new', 'awaiting_confirmation'], to: 'confirmed' },
  preparation_started: { from: ['confirmed'], to: 'in_preparation' },
  order_ready: { from: ['in_preparation'], to: 'ready' },
}

async function recordFulfillmentEvent(client, {
  venueId, orderId, orderItemId, eventType, previousState, newState,
  actorId, actorRole, assignedStaffId, reason, staffNote, idempotencyKey, metadata,
}) {
  await client.query(
    `INSERT INTO venue_cigar_fulfillment_events (
       venue_id, order_id, order_item_id, event_type, previous_state, new_state,
       actor_id, actor_role, assigned_staff_id, reason, staff_note, idempotency_key, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      venueId, orderId, orderItemId || null, eventType, previousState || null, newState || null,
      actorId, actorRole || null, assignedStaffId || null, reason || null, staffNote || null,
      idempotencyKey || null, JSON.stringify(metadata || {}),
    ]
  )
}

async function checkIdempotency(db, idempotencyKey) {
  if (!idempotencyKey) throw new FulfillmentError('idempotency_key_required')
  const { rows } = await db.query(`SELECT * FROM venue_cigar_fulfillment_events WHERE idempotency_key = $1`, [idempotencyKey])
  return rows[0] || null
}

async function loadOrderForVenue(client, venueId, orderId, forUpdate = false) {
  const { rows } = await client.query(
    `SELECT * FROM venue_cigar_orders WHERE order_id = $1${forUpdate ? ' FOR UPDATE' : ''}`,
    [orderId]
  )
  const order = rows[0]
  if (!order) throw new FulfillmentError('order_not_found')
  if (order.venue_id !== venueId) throw new FulfillmentError('order_not_found') // never leak cross-venue existence
  return order
}

// ── Queue listing ────────────────────────────────────────────────────
export async function listQueue(venueId, filters = {}) {
  const db = getDb()
  const conditions = ['o.venue_id = $1']
  const params = [venueId]
  if (filters.fulfillmentStatus) { params.push(filters.fulfillmentStatus); conditions.push(`o.fulfillment_status = $${params.length}`) }
  if (filters.paymentStatus) { params.push(filters.paymentStatus); conditions.push(`o.payment_status = $${params.length}`) }
  if (filters.fulfillmentMethod) { params.push(filters.fulfillmentMethod); conditions.push(`o.fulfillment_method = $${params.length}`) }
  if (filters.assignedStaffId === 'unassigned') { conditions.push(`o.assigned_staff_id IS NULL`) }
  else if (filters.assignedStaffId) { params.push(filters.assignedStaffId); conditions.push(`o.assigned_staff_id = $${params.length}`) }
  if (filters.from) { params.push(filters.from); conditions.push(`o.created_at >= $${params.length}`) }
  if (filters.to) { params.push(filters.to); conditions.push(`o.created_at <= $${params.length}`) }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(o.order_number ILIKE $${params.length} OR o.customer_reference ILIKE $${params.length})`)
  }
  const { rows } = await db.query(
    `SELECT o.*,
       (SELECT COALESCE(SUM(quantity), 0) FROM venue_cigar_order_items WHERE order_id = o.order_id) AS total_quantity,
       (SELECT COUNT(*) FROM venue_cigar_order_items WHERE order_id = o.order_id) AS item_count
     FROM venue_cigar_orders o
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.created_at DESC
     LIMIT 300`,
    params
  )
  return rows
}

// ── Order detail (staff view — full item/customer info) ─────────────
export async function getOrderDetail(venueId, orderId) {
  const db = getDb()
  const order = await loadOrderForVenue(db, venueId, orderId, false)
  const { rows: items } = await db.query(
    `SELECT oi.*, p.name AS product_name, p.brand, p.sku, p.barcode, p.vitola, p.strength,
       p.primary_image_url, p.humidor_zone, p.storage_location, p.venue_id AS product_venue_id
     FROM venue_cigar_order_items oi
     JOIN venue_cigar_products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  )
  const itemsWithAvailability = []
  for (const item of items) {
    const availability = await getProductAvailability(item.product_id)
    itemsWithAvailability.push({ ...item, availability })
  }
  return { ...order, items: itemsWithAvailability }
}

// ── Claim / assignment (optimistic concurrency) ──────────────────────
export async function claimOrder(venueId, orderId, actorId, actorRole, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }

    if (order.assigned_staff_id) {
      await client.query('ROLLBACK')
      if (order.assigned_staff_id === actorId) return { order, deduplicated: true }
      throw new FulfillmentError('already_claimed')
    }
    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET assigned_staff_id = $2, assigned_staff_role = $3, assigned_at = now(),
         assignment_version = assignment_version + 1, updated_at = now()
       WHERE order_id = $1 AND assignment_version = $4 RETURNING *`,
      [orderId, actorId, actorRole, order.assignment_version]
    )
    if (!rows[0]) { await client.query('ROLLBACK'); throw new FulfillmentError('claim_conflict') }
    const updated = rows[0]
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'order_claimed', previousState: null, newState: null,
      actorId, actorRole, assignedStaffId: actorId, idempotencyKey,
    })
    await client.query('COMMIT')
    return { order: updated, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// Manager/owner/admin reassignment, requires the client's last-seen
// assignment_version — a stale page cannot silently overwrite newer
// server state.
export async function assignOrder(venueId, orderId, actorId, actorRole, targetStaffId, expectedVersion, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }

    if (Number.isInteger(expectedVersion) && order.assignment_version !== expectedVersion) {
      await client.query('ROLLBACK')
      throw new FulfillmentError('stale_version')
    }
    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET assigned_staff_id = $2, assigned_staff_role = NULL, assigned_at = now(),
         assignment_version = assignment_version + 1, updated_at = now()
       WHERE order_id = $1 AND assignment_version = $3 RETURNING *`,
      [orderId, targetStaffId || null, order.assignment_version]
    )
    if (!rows[0]) { await client.query('ROLLBACK'); throw new FulfillmentError('stale_version') }
    const updated = rows[0]
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'order_assigned', actorId, actorRole, assignedStaffId: targetStaffId || null, idempotencyKey,
    })
    await client.query('COMMIT')
    return { order: updated, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── Generic pre-completion status transition ─────────────────────────
async function transitionStatus(venueId, orderId, actorId, actorRole, eventType, idempotencyKey, extraFields = {}) {
  const rule = ALLOWED_TRANSITIONS[eventType]
  if (!rule) throw new FulfillmentError('invalid_transition')
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }

    if (!rule.from.includes(order.fulfillment_status)) {
      await client.query('ROLLBACK')
      throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->${rule.to}`)
    }

    if (rule.to === 'ready') {
      const { rows: unpicked } = await client.query(
        `SELECT COUNT(*) AS n FROM venue_cigar_order_items WHERE order_id = $1 AND is_picked = false`,
        [orderId]
      )
      if (Number(unpicked[0].n) > 0) { await client.query('ROLLBACK'); throw new FulfillmentError('items_not_picked') }
    }

    const values = [orderId, rule.to]
    const extraSets = []
    for (const [col, val] of Object.entries(extraFields)) { values.push(val); extraSets.push(`${col} = $${values.length}`) }

    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET fulfillment_status = $2, updated_at = now()${extraSets.length ? ', ' + extraSets.join(', ') : ''}
       WHERE order_id = $1 RETURNING *`,
      values
    )
    const updated = rows[0]
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType, previousState: order.fulfillment_status, newState: rule.to,
      actorId, actorRole, idempotencyKey,
    })
    await client.query('COMMIT')
    return { order: updated, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export const confirmOrder = (venueId, orderId, actorId, actorRole, idempotencyKey) =>
  transitionStatus(venueId, orderId, actorId, actorRole, 'order_confirmed', idempotencyKey)

export const startPreparation = (venueId, orderId, actorId, actorRole, idempotencyKey) =>
  transitionStatus(venueId, orderId, actorId, actorRole, 'preparation_started', idempotencyKey)

export const markReady = (venueId, orderId, actorId, actorRole, idempotencyKey) =>
  transitionStatus(venueId, orderId, actorId, actorRole, 'order_ready', idempotencyKey, { ready_at: new Date().toISOString() })

// ── Item picking ──────────────────────────────────────────────────────
export async function markItemPicked(venueId, orderId, orderItemId, actorId, actorRole, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) {
    const { rows } = await db.query(`SELECT * FROM venue_cigar_order_items WHERE order_item_id = $1`, [orderItemId])
    return { item: rows[0], deduplicated: true }
  }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) {
      await client.query('ROLLBACK')
      const { rows } = await db.query(`SELECT * FROM venue_cigar_order_items WHERE order_item_id = $1`, [orderItemId])
      return { item: rows[0], deduplicated: true }
    }
    if (!['confirmed', 'in_preparation'].includes(order.fulfillment_status)) {
      await client.query('ROLLBACK')
      throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->item_picked`)
    }
    const { rows: itemRows } = await client.query(
      `UPDATE venue_cigar_order_items SET is_picked = true, picked_at = now(), picked_by = $3
       WHERE order_item_id = $1 AND order_id = $2 RETURNING *`,
      [orderItemId, orderId, actorId]
    )
    if (!itemRows[0]) { await client.query('ROLLBACK'); throw new FulfillmentError('order_item_not_found') }
    await recordFulfillmentEvent(client, {
      venueId, orderId, orderItemId, eventType: 'item_picked', actorId, actorRole, idempotencyKey,
    })
    await client.query('COMMIT')
    return { item: itemRows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── Block / unblock ────────────────────────────────────────────────────
export async function blockOrder(venueId, orderId, actorId, actorRole, reason, idempotencyKey) {
  if (!reason) throw new FulfillmentError('block_reason_required')
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }
    if (!PRE_COMPLETION_STATES.includes(order.fulfillment_status) || order.fulfillment_status === 'blocked') {
      await client.query('ROLLBACK')
      throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->blocked`)
    }
    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET fulfillment_status = 'blocked', blocked_reason = $2, updated_at = now() WHERE order_id = $1 RETURNING *`,
      [orderId, reason]
    )
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'order_blocked', previousState: order.fulfillment_status, newState: 'blocked',
      actorId, actorRole, reason, idempotencyKey,
    })
    await client.query('COMMIT')
    return { order: rows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function unblockOrder(venueId, orderId, actorId, actorRole, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }
    if (order.fulfillment_status !== 'blocked') { await client.query('ROLLBACK'); throw new FulfillmentError('order_not_blocked') }

    // Restore to the state recorded just before the most recent block.
    const { rows: lastBlock } = await client.query(
      `SELECT previous_state FROM venue_cigar_fulfillment_events WHERE order_id = $1 AND event_type = 'order_blocked' ORDER BY created_at DESC LIMIT 1`,
      [orderId]
    )
    const restoreTo = lastBlock[0]?.previous_state || 'new'
    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET fulfillment_status = $2, blocked_reason = NULL, updated_at = now() WHERE order_id = $1 RETURNING *`,
      [orderId, restoreTo]
    )
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'order_unblocked', previousState: 'blocked', newState: restoreTo,
      actorId, actorRole, idempotencyKey,
    })
    await client.query('COMMIT')
    return { order: rows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── Notes ─────────────────────────────────────────────────────────────
export async function addFulfillmentNote(venueId, orderId, actorId, actorRole, note, idempotencyKey) {
  if (!note) throw new FulfillmentError('note_required')
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { deduplicated: true }
  await loadOrderForVenue(db, venueId, orderId, false)
  await recordFulfillmentEvent(db, {
    venueId, orderId, eventType: 'fulfillment_note_added', actorId, actorRole, staffNote: note, idempotencyKey,
  })
  return { deduplicated: false }
}

// ── Pickup-code verification (1B-2B-3) ────────────────────────────────
// A real, bcrypt-hashed, venue- and order-scoped, expiring, rate-
// limited pickup code — never stored or logged in plaintext.
function generateNumericCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

export async function generateVerificationCode(venueId, orderId, actorId, actorRole, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) throw new FulfillmentError('idempotency_replay_no_code_returned')

  const order = await loadOrderForVenue(db, venueId, orderId, false)
  if (!PRE_COMPLETION_STATES.includes(order.fulfillment_status)) throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->verification_generated`)

  const code = generateNumericCode()
  const hash = await bcrypt.hash(code, SALT_ROUNDS)
  const expiresAt = new Date(Date.now() + PICKUP_CODE_TTL_MS).toISOString()

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await loadOrderForVenue(client, venueId, orderId, true)
    await client.query(
      `UPDATE venue_cigar_orders SET pickup_code_hash = $2, pickup_code_attempts = 0,
         pickup_code_expires_at = $3, pickup_code_generated_at = now(), verified_at = NULL, updated_at = now()
       WHERE order_id = $1`,
      [orderId, hash, expiresAt]
    )
    // Never logs the plaintext code or its hash in event metadata.
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'verification_generated', actorId, actorRole, idempotencyKey,
    })
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
  // The plaintext code is returned exactly once, to the authorized
  // staff caller, for display/handoff to the customer — never persisted.
  return { code, expiresAt }
}

export async function verifyPickupCode(venueId, orderId, actorId, actorRole, submittedCode, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) { const order = await loadOrderForVenue(db, venueId, orderId, false); return { order, verified: !!order.verified_at, deduplicated: true } }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, verified: !!order.verified_at, deduplicated: true } }

    if (!order.pickup_code_hash) throw new FulfillmentError('no_active_verification_code')
    if (order.pickup_code_expires_at && new Date(order.pickup_code_expires_at).getTime() <= Date.now()) throw new FulfillmentError('verification_code_expired')
    if (order.pickup_code_attempts >= MAX_VERIFICATION_ATTEMPTS) throw new FulfillmentError('verification_rate_limited')

    const matches = await bcrypt.compare(String(submittedCode || ''), order.pickup_code_hash)
    if (!matches) {
      const { rows } = await client.query(
        `UPDATE venue_cigar_orders SET pickup_code_attempts = pickup_code_attempts + 1, updated_at = now() WHERE order_id = $1 RETURNING *`,
        [orderId]
      )
      const afterFail = rows[0]
      await recordFulfillmentEvent(client, {
        venueId, orderId, eventType: 'verification_failed', actorId, actorRole, idempotencyKey,
      })
      let blocked = false
      if (afterFail.pickup_code_attempts >= MAX_VERIFICATION_ATTEMPTS) {
        await client.query(
          `UPDATE venue_cigar_orders SET fulfillment_status = 'blocked', blocked_reason = 'verification_attempts_exceeded', updated_at = now() WHERE order_id = $1`,
          [orderId]
        )
        await recordFulfillmentEvent(client, {
          venueId, orderId, eventType: 'order_blocked', previousState: afterFail.fulfillment_status, newState: 'blocked',
          actorId: 'system', actorRole: 'system', reason: 'verification_attempts_exceeded', idempotencyKey: `${idempotencyKey}-auto-block`,
        })
        blocked = true
      }
      await client.query('COMMIT')
      throw new FulfillmentError(blocked ? 'verification_failed_order_blocked' : 'verification_failed')
    }

    const { rows: verifiedRows } = await client.query(
      `UPDATE venue_cigar_orders SET verified_at = now(), verification_method = 'pickup_code', updated_at = now() WHERE order_id = $1 RETURNING *`,
      [orderId]
    )
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'verification_passed', actorId, actorRole, idempotencyKey,
    })
    await client.query('COMMIT')
    return { order: verifiedRows[0], verified: true, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── Handoff confirmation ──────────────────────────────────────────────
export async function confirmHandoff(venueId, orderId, actorId, actorRole, { verificationMethod, location, notes }, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }

    if (order.fulfillment_status !== 'ready') throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->handoff_confirmed`)
    // Customer pickup requires real code verification first; other
    // fulfillment methods (table/lounge/bar delivery) accept staff
    // visual/recipient confirmation via the explicit verificationMethod.
    if (PICKUP_METHOD_REQUIRES_CODE.has(order.fulfillment_method) && !order.verified_at) {
      throw new FulfillmentError('verification_required')
    }

    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET handoff_staff_id = $2, handoff_staff_role = $3, handoff_at = now(),
         handoff_location = $4, handoff_notes = $5,
         verification_method = COALESCE(verification_method, $6), updated_at = now()
       WHERE order_id = $1 RETURNING *`,
      [orderId, actorId, actorRole, location || null, notes || null, verificationMethod || 'staff_visual']
    )
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'handoff_confirmed', actorId, actorRole, staffNote: notes, idempotencyKey,
      metadata: { verificationMethod: verificationMethod || 'staff_visual', location: location || null },
    })
    await client.query('COMMIT')
    return { order: rows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── No-show (operational event, not a distinct terminal status) ──────
export async function markNoShow(venueId, orderId, actorId, actorRole, { notes, nextAction }, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }
    if (!['ready', 'in_preparation', 'confirmed'].includes(order.fulfillment_status)) throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->no_show_marked`)

    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET no_show_at = now(), updated_at = now() WHERE order_id = $1 RETURNING *`,
      [orderId]
    )
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'no_show_marked', actorId, actorRole, staffNote: notes, idempotencyKey,
      metadata: { nextAction: nextAction || null },
    })
    await client.query('COMMIT')
    return { order: rows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── Pickup-window extension (full-access only, enforced at the route) ─
export async function extendPickupWindow(venueId, orderId, actorId, actorRole, newPromisedAt, idempotencyKey) {
  if (!newPromisedAt) throw new FulfillmentError('new_promised_at_required')
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { order: await loadOrderForVenue(db, venueId, orderId), deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const order = await loadOrderForVenue(client, venueId, orderId, true)
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { order, deduplicated: true } }
    if (!PRE_COMPLETION_STATES.includes(order.fulfillment_status)) throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->pickup_window_extended`)

    const { rows } = await client.query(
      `UPDATE venue_cigar_orders SET promised_at = $2, updated_at = now() WHERE order_id = $1 RETURNING *`,
      [orderId, newPromisedAt]
    )
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'pickup_window_extended', actorId, actorRole, idempotencyKey,
      metadata: { newPromisedAt },
    })
    await client.query('COMMIT')
    return { order: rows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── Expiration — releases inventory ONLY through the canonical
// cancellation service, then stamps the real 'expired' workflow
// state (a value checkoutService.cancelOrder() itself never writes,
// since expiration is a fulfillment-workflow concept, not a payment
// one) as a follow-up write to the column fulfillmentService already
// exclusively owns. ─────────────────────────────────────────────────
export async function expireOrder(venueId, orderId, actorId, actorRole, reason, idempotencyKey) {
  const db = getDb()
  const order = await loadOrderForVenue(db, venueId, orderId, false)
  if (order.fulfillment_status === 'expired') return { order, deduplicated: true }
  if (!PRE_COMPLETION_STATES.includes(order.fulfillment_status)) throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->expired`)

  const result = await checkoutService.cancelOrder(orderId, actorId, { idempotencyKey, reason: reason || 'pickup_window_expired' })
  const { rows } = await db.query(
    `UPDATE venue_cigar_orders SET fulfillment_status = 'expired', expired_reason = $2, updated_at = now() WHERE order_id = $1 RETURNING *`,
    [orderId, reason || 'pickup_window_expired']
  )
  const client = await db.connect()
  try {
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'order_expired', previousState: order.fulfillment_status, newState: 'expired',
      actorId, actorRole, reason, idempotencyKey: `${idempotencyKey}-fulfillment-log`,
    })
  } catch { /* best-effort log entry; the real state change already committed */ }
  finally { client.release() }
  return { order: rows[0], checkoutResult: result, deduplicated: false }
}

// ── Completion / cancellation — DELEGATE ONLY, never reimplement ─────
export async function completeOrderFromQueue(venueId, orderId, actorId, actorRole, idempotencyKey) {
  const db = getDb()
  const order = await loadOrderForVenue(db, venueId, orderId, false)
  // Already-completed is a real idempotent no-op — delegate to
  // checkoutService.completeOrder(), which itself short-circuits on
  // status === 'completed'. Only a genuinely invalid pre-completion
  // state (never reached 'ready') is rejected here.
  if (order.fulfillment_status !== 'ready' && order.fulfillment_status !== 'completed') {
    throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->completed`)
  }
  // Real handoff and (for customer pickup) real code verification are
  // required BEFORE the order may complete — an order never completes
  // merely because a screen was opened.
  if (order.fulfillment_status === 'ready') {
    if (!order.handoff_at) throw new FulfillmentError('handoff_required')
    if (PICKUP_METHOD_REQUIRES_CODE.has(order.fulfillment_method) && !order.verified_at) throw new FulfillmentError('verification_required')
  }
  // The ENTIRE completion effect (order status, payment status,
  // fulfillment_status, inventory deduction, Passport acquisition,
  // audit events) happens inside checkoutService.completeOrder() —
  // the sole authoritative completion path in the codebase.
  const result = await checkoutService.completeOrder(orderId, actorId, actorRole, { idempotencyKey })
  const client = await db.connect()
  try {
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'order_completed', previousState: 'ready', newState: 'completed',
      actorId, actorRole, idempotencyKey: `${idempotencyKey}-fulfillment-log`,
    })
    // Invalidate the pickup code — a used/completed order's code must
    // never be usable again. Owns only its own verification columns,
    // never status/payment_status.
    await client.query(`UPDATE venue_cigar_orders SET pickup_code_hash = NULL WHERE order_id = $1`, [orderId])
  } catch { /* best-effort log entry; completion itself already succeeded/deduped */ }
  finally { client.release() }
  return result
}

export async function cancelOrderFromQueue(venueId, orderId, actorId, actorRole, reason, idempotencyKey) {
  if (!reason) throw new FulfillmentError('cancellation_reason_required')
  const db = getDb()
  const order = await loadOrderForVenue(db, venueId, orderId, false)
  // Already-cancelled is a real idempotent no-op — delegate to
  // checkoutService.cancelOrder(), which itself short-circuits on
  // status === 'cancelled'. A completed/refunded order is genuinely
  // not eligible for this pre-completion cancel path.
  if (!PRE_COMPLETION_STATES.includes(order.fulfillment_status) && order.fulfillment_status !== 'cancelled') {
    throw new FulfillmentError(`invalid_transition:${order.fulfillment_status}->cancelled`)
  }
  // The ENTIRE cancellation effect (order status, hold/reservation
  // release, refund-path inventory restoration, fulfillment_status,
  // audit events) happens inside checkoutService.cancelOrder().
  const result = await checkoutService.cancelOrder(orderId, actorId, { idempotencyKey, reason })
  const client = await db.connect()
  try {
    await recordFulfillmentEvent(client, {
      venueId, orderId, eventType: 'order_cancelled', previousState: order.fulfillment_status, newState: 'cancelled',
      actorId, actorRole, reason, idempotencyKey: `${idempotencyKey}-fulfillment-log`,
    })
  } catch { /* best-effort log entry */ }
  finally { client.release() }
  return result
}

// ── History ───────────────────────────────────────────────────────────
export async function listFulfillmentHistory(venueId, filters = {}) {
  const db = getDb()
  const conditions = ['e.venue_id = $1']
  const params = [venueId]
  if (filters.orderId) { params.push(filters.orderId); conditions.push(`e.order_id = $${params.length}`) }
  if (filters.eventType) { params.push(filters.eventType); conditions.push(`e.event_type = $${params.length}`) }
  if (filters.actorId) { params.push(filters.actorId); conditions.push(`e.actor_id = $${params.length}`) }
  if (filters.assignedStaffId) { params.push(filters.assignedStaffId); conditions.push(`e.assigned_staff_id = $${params.length}`) }
  if (filters.from) { params.push(filters.from); conditions.push(`e.created_at >= $${params.length}`) }
  if (filters.to) { params.push(filters.to); conditions.push(`e.created_at <= $${params.length}`) }
  params.push(Math.min(Number(filters.limit) || 200, 500))
  const { rows } = await db.query(
    `SELECT e.*, o.order_number FROM venue_cigar_fulfillment_events e
     JOIN venue_cigar_orders o ON o.order_id = e.order_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY e.created_at DESC
     LIMIT $${params.length}`,
    params
  )
  return rows
}
