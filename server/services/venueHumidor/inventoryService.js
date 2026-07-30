/**
 * Venue Humidor 1A — server-authoritative cigar inventory engine.
 * See docs/smokecraft/SMOKECRAFT_VENUE_HUMIDOR_ARCHITECTURE_MAP.md.
 *
 * Every mutation: runs in one transaction, locks the product row
 * before computing the new quantity, rejects negative inventory,
 * requires an idempotency key (checked before AND after the lock),
 * writes exactly one append-only inventory event, and returns the
 * final authoritative quantities — never a client-echoed value.
 */
import { getDb } from '../../db/connection.js'

export class InventoryError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

const QUANTITY_EVENT_TYPES = new Set([
  'receiving', 'box_opened', 'stick_added', 'stick_removed', 'damage',
  'loss', 'complimentary', 'return', 'count_correction',
  'sale_completed', 'cancellation_restored',
])

export async function computeAvailableQuantity(client, productId) {
  const { rows: productRows } = await client.query(
    `SELECT physical_quantity, unavailable_quantity FROM venue_cigar_products WHERE product_id = $1`,
    [productId]
  )
  const product = productRows[0]
  if (!product) throw new InventoryError('product_not_found')
  const { rows: heldRows } = await client.query(
    `SELECT COALESCE(SUM(quantity), 0) AS total FROM venue_cigar_inventory_holds WHERE product_id = $1 AND status = 'active'`,
    [productId]
  )
  const { rows: reservedRows } = await client.query(
    `SELECT COALESCE(SUM(quantity), 0) AS total FROM venue_cigar_reservations WHERE product_id = $1 AND status = 'active'`,
    [productId]
  )
  const held = Number(heldRows[0].total)
  const reserved = Number(reservedRows[0].total)
  const available = Math.max(0, Number(product.physical_quantity) - Number(product.unavailable_quantity) - held - reserved)
  return {
    physicalQuantity: Number(product.physical_quantity),
    unavailableQuantity: Number(product.unavailable_quantity),
    heldQuantity: held,
    reservedQuantity: reserved,
    availableQuantity: available,
  }
}

export async function getProductAvailability(productId) {
  const db = getDb()
  const client = await db.connect()
  try {
    return await computeAvailableQuantity(client, productId)
  } finally {
    client.release()
  }
}

/**
 * The single primitive for every quantity-affecting mutation
 * (receiving, box_opened [inventory-neutral, quantityDelta must be 0],
 * stick_added, stick_removed, damage, loss, complimentary, return,
 * count_correction, sale_completed, cancellation_restored).
 */
export async function applyInventoryEvent(productId, eventType, quantityDelta, actorId, actorRole, {
  idempotencyKey, reason, referenceType, referenceId, metadata,
} = {}) {
  if (!QUANTITY_EVENT_TYPES.has(eventType)) throw new InventoryError(`invalid_event_type:${eventType}`)
  if (!idempotencyKey) throw new InventoryError('idempotency_key_required')
  if (!actorId) throw new InventoryError('actor_id_required')

  const db = getDb()

  // Pre-lock fast path — an obvious retry never even reaches the lock.
  const { rows: preCheck } = await db.query(
    `SELECT * FROM venue_cigar_inventory_events WHERE idempotency_key = $1`, [idempotencyKey]
  )
  if (preCheck[0]) return await loadEventResult(db, preCheck[0])

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const { rows: productRows } = await client.query(
      `SELECT * FROM venue_cigar_products WHERE product_id = $1 FOR UPDATE`, [productId]
    )
    const product = productRows[0]
    if (!product) throw new InventoryError('product_not_found')

    // In-lock authoritative recheck — closes the two-tab race a
    // pre-lock-only check would still allow.
    const { rows: dupCheck } = await client.query(
      `SELECT * FROM venue_cigar_inventory_events WHERE idempotency_key = $1`, [idempotencyKey]
    )
    if (dupCheck[0]) { await client.query('ROLLBACK'); return await loadEventResult(db, dupCheck[0]) }

    const before = Number(product.physical_quantity)
    const after = before + Number(quantityDelta)
    if (after < 0) throw new InventoryError('insufficient_inventory')

    const { rows: updatedRows } = await client.query(
      `UPDATE venue_cigar_products SET physical_quantity = $2, updated_at = now() WHERE product_id = $1 RETURNING *`,
      [productId, after]
    )
    const updated = updatedRows[0]

    let eventRow
    try {
      const { rows } = await client.query(
        `INSERT INTO venue_cigar_inventory_events (
           venue_id, product_id, event_type, quantity_delta, physical_quantity_before,
           physical_quantity_after, actor_id, actor_role, reason, reference_type,
           reference_id, idempotency_key, metadata
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          product.venue_id, productId, eventType, quantityDelta, before, after,
          actorId, actorRole || null, reason || null, referenceType || null,
          referenceId || null, idempotencyKey, JSON.stringify(metadata || {}),
        ]
      )
      eventRow = rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        // Two-tab race on the very first insert of this idempotency
        // key: roll back cleanly, return the real winning event.
        await client.query('ROLLBACK')
        return await loadEventResult(db, { idempotency_key: idempotencyKey })
      }
      throw err
    }

    await client.query('COMMIT')
    return { product: updated, event: eventRow, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function loadEventResult(db, eventRow) {
  const key = eventRow.idempotency_key
  const { rows } = await db.query(`SELECT * FROM venue_cigar_inventory_events WHERE idempotency_key = $1`, [key])
  const event = rows[0]
  const { rows: productRows } = await db.query(`SELECT * FROM venue_cigar_products WHERE product_id = $1`, [event.product_id])
  return { product: productRows[0], event, deduplicated: true }
}

/**
 * Creates a short-lived hold (e.g. an active checkout). Revalidates
 * real-time availability under the same product-row lock used by
 * applyInventoryEvent — never a stale read.
 */
export async function createHold(productId, quantity, heldBy, expiresAt, { idempotencyKey } = {}) {
  if (!idempotencyKey) throw new InventoryError('idempotency_key_required')
  if (!(quantity > 0)) throw new InventoryError('invalid_quantity')
  const db = getDb()

  const { rows: preCheck } = await db.query(`SELECT * FROM venue_cigar_inventory_holds WHERE idempotency_key = $1`, [idempotencyKey])
  if (preCheck[0]) return { hold: preCheck[0], deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: productRows } = await client.query(`SELECT * FROM venue_cigar_products WHERE product_id = $1 FOR UPDATE`, [productId])
    const product = productRows[0]
    if (!product) throw new InventoryError('product_not_found')

    const { rows: dupCheck } = await client.query(`SELECT * FROM venue_cigar_inventory_holds WHERE idempotency_key = $1`, [idempotencyKey])
    if (dupCheck[0]) { await client.query('ROLLBACK'); return { hold: dupCheck[0], deduplicated: true } }

    const availability = await computeAvailableQuantity(client, productId)
    if (availability.availableQuantity < quantity) throw new InventoryError('insufficient_inventory')

    let holdRow
    try {
      const { rows } = await client.query(
        `INSERT INTO venue_cigar_inventory_holds (venue_id, product_id, quantity, held_by, expires_at, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [product.venue_id, productId, quantity, heldBy, expiresAt, idempotencyKey]
      )
      holdRow = rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK')
        const { rows } = await db.query(`SELECT * FROM venue_cigar_inventory_holds WHERE idempotency_key = $1`, [idempotencyKey])
        return { hold: rows[0], deduplicated: true }
      }
      throw err
    }

    await client.query(
      `INSERT INTO venue_cigar_inventory_events (venue_id, product_id, event_type, quantity_delta, physical_quantity_before, physical_quantity_after, actor_id, reference_type, reference_id, metadata)
       VALUES ($1,$2,'hold_created',0,$3,$3,$4,'hold',$5,$6)`,
      [product.venue_id, productId, product.physical_quantity, heldBy, holdRow.hold_id, JSON.stringify({ quantity })]
    )
    await client.query('COMMIT')
    return { hold: holdRow, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function transitionHold(holdId, fromStatuses, toStatus, eventType, actorId) {
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: holdRows } = await client.query(`SELECT * FROM venue_cigar_inventory_holds WHERE hold_id = $1 FOR UPDATE`, [holdId])
    const hold = holdRows[0]
    if (!hold) throw new InventoryError('hold_not_found')
    if (!fromStatuses.includes(hold.status)) {
      // Idempotent no-op: already in the target (or another terminal) state.
      await client.query('ROLLBACK')
      return { hold, deduplicated: true }
    }
    const { rows: updatedRows } = await client.query(
      `UPDATE venue_cigar_inventory_holds SET status = $2, updated_at = now() WHERE hold_id = $1 RETURNING *`,
      [holdId, toStatus]
    )
    const { rows: productRows } = await client.query(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = $1`, [hold.product_id])
    await client.query(
      `INSERT INTO venue_cigar_inventory_events (venue_id, product_id, event_type, quantity_delta, physical_quantity_before, physical_quantity_after, actor_id, reference_type, reference_id)
       VALUES ($1,$2,$3,0,$4,$4,$5,'hold',$6)`,
      [hold.venue_id, hold.product_id, eventType, productRows[0].physical_quantity, actorId || 'system', holdId]
    )
    await client.query('COMMIT')
    return { hold: updatedRows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function releaseHold(holdId, actorId) {
  return transitionHold(holdId, ['active'], 'released', 'hold_released', actorId)
}

export async function expireHold(holdId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT expires_at FROM venue_cigar_inventory_holds WHERE hold_id = $1`, [holdId])
  if (!rows[0]) throw new InventoryError('hold_not_found')
  if (new Date(rows[0].expires_at).getTime() > Date.now()) throw new InventoryError('hold_not_yet_expired')
  return transitionHold(holdId, ['active'], 'expired', 'hold_expired', 'system')
}

/**
 * Creates a longer-lived, staff-created reservation. Same real-time
 * availability revalidation as createHold.
 */
export async function createReservation(productId, quantity, reservedFor, reservedBy, expiresAt, { idempotencyKey } = {}) {
  if (!idempotencyKey) throw new InventoryError('idempotency_key_required')
  if (!(quantity > 0)) throw new InventoryError('invalid_quantity')
  const db = getDb()

  const { rows: preCheck } = await db.query(`SELECT * FROM venue_cigar_reservations WHERE idempotency_key = $1`, [idempotencyKey])
  if (preCheck[0]) return { reservation: preCheck[0], deduplicated: true }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: productRows } = await client.query(`SELECT * FROM venue_cigar_products WHERE product_id = $1 FOR UPDATE`, [productId])
    const product = productRows[0]
    if (!product) throw new InventoryError('product_not_found')

    const { rows: dupCheck } = await client.query(`SELECT * FROM venue_cigar_reservations WHERE idempotency_key = $1`, [idempotencyKey])
    if (dupCheck[0]) { await client.query('ROLLBACK'); return { reservation: dupCheck[0], deduplicated: true } }

    const availability = await computeAvailableQuantity(client, productId)
    if (availability.availableQuantity < quantity) throw new InventoryError('insufficient_inventory')

    let reservationRow
    try {
      const { rows } = await client.query(
        `INSERT INTO venue_cigar_reservations (venue_id, product_id, quantity, reserved_for, reserved_by, expires_at, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [product.venue_id, productId, quantity, reservedFor, reservedBy, expiresAt || null, idempotencyKey]
      )
      reservationRow = rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK')
        const { rows } = await db.query(`SELECT * FROM venue_cigar_reservations WHERE idempotency_key = $1`, [idempotencyKey])
        return { reservation: rows[0], deduplicated: true }
      }
      throw err
    }
    await client.query(
      `INSERT INTO venue_cigar_inventory_events (venue_id, product_id, event_type, quantity_delta, physical_quantity_before, physical_quantity_after, actor_id, reference_type, reference_id, metadata)
       VALUES ($1,$2,'reservation_created',0,$3,$3,$4,'reservation',$5,$6)`,
      [product.venue_id, productId, product.physical_quantity, reservedBy, reservationRow.reservation_id, JSON.stringify({ quantity, reservedFor })]
    )
    await client.query('COMMIT')
    return { reservation: reservationRow, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function transitionReservation(reservationId, fromStatuses, toStatus, eventType, actorId) {
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: resRows } = await client.query(`SELECT * FROM venue_cigar_reservations WHERE reservation_id = $1 FOR UPDATE`, [reservationId])
    const reservation = resRows[0]
    if (!reservation) throw new InventoryError('reservation_not_found')
    if (!fromStatuses.includes(reservation.status)) {
      await client.query('ROLLBACK')
      return { reservation, deduplicated: true }
    }
    const { rows: updatedRows } = await client.query(
      `UPDATE venue_cigar_reservations SET status = $2, updated_at = now() WHERE reservation_id = $1 RETURNING *`,
      [reservationId, toStatus]
    )
    const { rows: productRows } = await client.query(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = $1`, [reservation.product_id])
    await client.query(
      `INSERT INTO venue_cigar_inventory_events (venue_id, product_id, event_type, quantity_delta, physical_quantity_before, physical_quantity_after, actor_id, reference_type, reference_id)
       VALUES ($1,$2,$3,0,$4,$4,$5,'reservation',$6)`,
      [reservation.venue_id, reservation.product_id, eventType, productRows[0].physical_quantity, actorId || 'system', reservationId]
    )
    await client.query('COMMIT')
    return { reservation: updatedRows[0], deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function cancelReservation(reservationId, actorId) {
  return transitionReservation(reservationId, ['active'], 'cancelled', 'reservation_released', actorId)
}

export async function fulfillReservation(reservationId, actorId) {
  return transitionReservation(reservationId, ['active'], 'fulfilled', 'reservation_fulfilled', actorId)
}
