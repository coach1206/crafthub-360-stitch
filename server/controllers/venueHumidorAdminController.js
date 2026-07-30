/**
 * Venue Humidor 1B-2B-1 — staff inventory administration. Every
 * handler here calls the same canonical 1A services already used by
 * checkout and the customer browser (productService.js,
 * inventoryService.js) — no parallel product or inventory authority.
 */
import * as productService from '../services/venueHumidor/productService.js'
import * as inventoryService from '../services/venueHumidor/inventoryService.js'
import { getDb } from '../db/connection.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    product_not_found: 404,
    duplicate_sku: 409, duplicate_barcode: 409, insufficient_inventory: 409,
    validation_failed: 422, no_fields_to_update: 400,
    idempotency_key_required: 400, actor_id_required: 400, invalid_quantity: 400,
    invalid_status: 400, invalid_correction: 400,
  }
  const code = err.code || 'internal_error'
  let status = statusByCode[code] || fallback
  if (code.startsWith('invalid_event_type')) status = 400
  const payload = { success: false, error: code }
  if (err.fieldErrors) payload.fieldErrors = err.fieldErrors
  res.status(status).json(payload)
}

// ── Dashboard ────────────────────────────────────────────────────────
export async function handleListAdminProducts(req, res) {
  try {
    const products = await productService.listProductsForAdmin(req.params.venueId, req.query)
    res.json({ success: true, products })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetAdminProduct(req, res) {
  try {
    const product = await productService.getProduct(req.params.venueId, req.params.productId)
    if (!product) return res.status(404).json({ success: false, error: 'product_not_found' })
    const db = getDb()
    const { rows: lastEventRows } = await db.query(
      `SELECT * FROM venue_cigar_inventory_events WHERE product_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.productId]
    )
    res.json({ success: true, product, lastInventoryEvent: lastEventRows[0] || null })
  } catch (err) { sendError(res, err, 500) }
}

// ── Product creation / editing ──────────────────────────────────────
export async function handleCreateAdminProduct(req, res) {
  try {
    const product = await productService.createProduct(req.params.venueId, req.user.id, req.body)
    res.status(201).json({ success: true, product })
  } catch (err) { sendError(res, err, 500) }
}

// mentor ("tobacconist" tier) may edit only the approved staffNotes
// field — every other membership tier below full/inventory-manager
// access is enforced server-side here, never only by hiding form
// fields in the UI.
const READ_ONLY_WRITE_TYPES = ['member']
const NOTES_ONLY_TYPES = ['mentor']

export async function handleUpdateAdminProduct(req, res) {
  try {
    if (READ_ONLY_WRITE_TYPES.includes(req.venueMembershipType)) {
      return res.status(403).json({ success: false, error: 'venue_role_required' })
    }
    if (NOTES_ONLY_TYPES.includes(req.venueMembershipType)) {
      const keys = Object.keys(req.body || {})
      if (keys.some(k => k !== 'staffNotes')) return res.status(403).json({ success: false, error: 'field_not_permitted_for_role' })
    }
    const product = await productService.updateProduct(req.params.venueId, req.params.productId, req.user.id, req.body)
    res.json({ success: true, product })
  } catch (err) { sendError(res, err, 500) }
}

// ── Classification / status controls ────────────────────────────────
export async function handleUpdateClassification(req, res) {
  try {
    const product = await productService.updateProductClassification(req.params.venueId, req.params.productId, req.body)
    res.json({ success: true, product })
  } catch (err) { sendError(res, err, 500) }
}

// ── Inventory mutation controls ─────────────────────────────────────
// The single admin entry point for every quantity-affecting action
// (receive/open box/add or remove loose sticks/damage/loss/
// complimentary/return/count correction). It never computes a final
// quantity itself and never trusts a client-submitted resulting
// quantity — it only forwards the requested delta (or, for count
// correction, computes a delta from the current authoritative row) to
// inventoryService.applyInventoryEvent(), which is the sole writer of
// physical_quantity and the sole writer of inventory events.
const MUTATION_EVENT_TYPES = new Set([
  'receiving', 'box_opened', 'stick_added', 'stick_removed',
  'damage', 'loss', 'complimentary', 'return', 'count_correction',
])

export async function handleInventoryMutation(req, res) {
  try {
    const { eventType, quantity, correctedQuantity, reason, idempotencyKey, sealedBoxDelta, openedBoxDelta } = req.body
    if (!MUTATION_EVENT_TYPES.has(eventType)) return res.status(400).json({ success: false, error: 'invalid_event_type' })
    if (!idempotencyKey) return res.status(400).json({ success: false, error: 'idempotency_key_required' })

    let quantityDelta
    if (eventType === 'count_correction') {
      if (!Number.isInteger(correctedQuantity) || correctedQuantity < 0) return res.status(400).json({ success: false, error: 'invalid_correction' })
      const db = getDb()
      const { rows } = await db.query(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = $1`, [req.params.productId])
      if (!rows[0]) return res.status(404).json({ success: false, error: 'product_not_found' })
      quantityDelta = correctedQuantity - Number(rows[0].physical_quantity)
    } else if (eventType === 'box_opened') {
      quantityDelta = Number(quantity) || 0
    } else if (['stick_removed', 'damage', 'loss', 'complimentary'].includes(eventType)) {
      quantityDelta = -Math.abs(Number(quantity))
    } else {
      quantityDelta = Math.abs(Number(quantity))
    }
    if (!Number.isFinite(quantityDelta)) return res.status(400).json({ success: false, error: 'invalid_quantity' })

    const result = await inventoryService.applyInventoryEvent(
      req.params.productId, eventType, quantityDelta, req.user.id, req.user.role,
      { idempotencyKey, reason, referenceType: null, referenceId: null, metadata: { sealedBoxDelta: sealedBoxDelta || 0, openedBoxDelta: openedBoxDelta || 0 } }
    )

    // Sealed/opened box counters are administrative display fields,
    // updated alongside (not instead of) the authoritative stick
    // event above — never a second source of truth for stick quantity.
    if (sealedBoxDelta || openedBoxDelta) {
      const db = getDb()
      await db.query(
        `UPDATE venue_cigar_products SET
           sealed_box_count = GREATEST(0, sealed_box_count + $2),
           opened_box_count = GREATEST(0, opened_box_count + $3),
           updated_at = now()
         WHERE product_id = $1`,
        [req.params.productId, sealedBoxDelta || 0, openedBoxDelta || 0]
      )
    }

    const availability = await inventoryService.getProductAvailability(req.params.productId)
    res.json({ success: true, ...result, availability })
  } catch (err) { sendError(res, err, 500) }
}

// ── Inventory event history ─────────────────────────────────────────
export async function handleListInventoryEvents(req, res) {
  try {
    const db = getDb()
    const { productId, eventType, actorId, from, to, limit } = req.query
    const conditions = ['e.venue_id = $1']
    const params = [req.params.venueId]
    if (productId) { params.push(productId); conditions.push(`e.product_id = $${params.length}`) }
    if (eventType) { params.push(eventType); conditions.push(`e.event_type = $${params.length}`) }
    if (actorId) { params.push(actorId); conditions.push(`e.actor_id = $${params.length}`) }
    if (from) { params.push(from); conditions.push(`e.created_at >= $${params.length}`) }
    if (to) { params.push(to); conditions.push(`e.created_at <= $${params.length}`) }
    params.push(Math.min(Number(limit) || 200, 500))
    const { rows } = await db.query(
      `SELECT e.*, p.name AS product_name, p.sku AS product_sku
       FROM venue_cigar_inventory_events e
       JOIN venue_cigar_products p ON p.product_id = e.product_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.created_at DESC
       LIMIT $${params.length}`,
      params
    )
    res.json({ success: true, events: rows })
  } catch (err) { sendError(res, err, 500) }
}
