import * as catalogService from '../services/venueHumidor/customerCatalogService.js'
import * as inventoryService from '../services/venueHumidor/inventoryService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    product_not_found: 404, insufficient_inventory: 409, idempotency_key_required: 400,
    invalid_quantity: 400, actor_id_required: 400,
  }
  const code = err.code || 'internal_error'
  res.status(statusByCode[code] || fallback).json({ success: false, error: code })
}

function guestRef(req) {
  if (!req.smokecraftIdentity) return null
  return req.smokecraftIdentity.type === 'user' ? `user:${req.smokecraftIdentity.id}` : req.smokecraftIdentity.id
}

export async function handleValidateVenue(req, res) {
  try {
    const venue = await catalogService.validateActiveVenue(req.params.venueId)
    if (!venue) return res.status(404).json({ success: false, error: 'no_active_venue' })
    res.json({ success: true, venue })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleBrowseCatalog(req, res) {
  try {
    const venue = await catalogService.validateActiveVenue(req.params.venueId)
    if (!venue) return res.status(404).json({ success: false, error: 'no_active_venue' })
    const q = req.query
    const filters = {
      search: q.search, brand: q.brand, country: q.country, wrapper: q.wrapper, vitola: q.vitola,
      strength: q.strength, body: q.body, flavor: q.flavor, priceMinCents: q.priceMinCents, priceMaxCents: q.priceMaxCents,
      smokeTimeMaxMinutes: q.smokeTimeMaxMinutes, experienceLevel: q.experienceLevel,
      inStockOnly: q.inStockOnly === 'false' ? false : true,
      featured: q.featured === 'true', staffPick: q.staffPick === 'true', limitedRelease: q.limitedRelease === 'true',
      sort: q.sort,
    }
    const products = await catalogService.browseCatalog(req.params.venueId, filters)
    res.json({ success: true, venue, products })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetCigarDetail(req, res) {
  try {
    const venue = await catalogService.validateActiveVenue(req.params.venueId)
    if (!venue) return res.status(404).json({ success: false, error: 'no_active_venue' })
    const product = await catalogService.getCigarDetail(req.params.venueId, req.params.productId)
    if (!product) return res.status(404).json({ success: false, error: 'product_not_found' })
    res.json({ success: true, venue, product })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateStickHold(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { idempotencyKey } = req.body
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const result = await inventoryService.createHold(req.params.productId, 1, ref, expiresAt, { idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateBoxHold(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const venue = await catalogService.validateActiveVenue(req.params.venueId)
    if (!venue) return res.status(404).json({ success: false, error: 'no_active_venue' })
    const product = await catalogService.getCigarDetail(req.params.venueId, req.params.productId)
    if (!product) return res.status(404).json({ success: false, error: 'product_not_found' })
    if (!product.box_quantity || !product.box_price_cents) {
      return res.status(409).json({ success: false, error: 'box_purchase_unavailable' })
    }
    const { idempotencyKey } = req.body
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const result = await inventoryService.createHold(req.params.productId, product.box_quantity, ref, expiresAt, { idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateReservation(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { quantity, idempotencyKey } = req.body
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const result = await inventoryService.createReservation(req.params.productId, Number(quantity) || 1, ref, ref, expiresAt, { idempotencyKey })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAddFavorite(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await catalogService.addFavorite(req.params.venueId, req.params.productId, ref)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRemoveFavorite(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await catalogService.removeFavorite(req.params.productId, ref)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListFavorites(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const favorites = await catalogService.listFavorites(ref)
    res.json({ success: true, favorites })
  } catch (err) { sendError(res, err, 500) }
}

// Honest unavailable boundary — no POS/tab/table-service integration
// exists for Venue Humidor yet. Never fakes success.
export async function handleUnsupportedAction(req, res) {
  res.status(501).json({ success: false, error: 'action_not_yet_available', message: 'This action is not available yet.' })
}
