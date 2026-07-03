import {
  setInventory, getInventory, getVenueInventory, adjustInventory,
  checkProductAvailability, blockProduct, unblockProduct,
  getVenueLowStockItems, getInventoryEvents, getInventoryReadiness,
} from '../services/inventory/inventoryAvailabilityService.js'
import {
  validateProductsForCheckout, buildProductAvailabilityMap,
  buildNcieAvailabilityContext, getProductAvailabilityReadiness,
} from '../services/inventory/productAvailabilityService.js'

export async function handleSetInventory(req, res) {
  const { venueId } = req.params
  const result = setInventory(venueId, req.body)
  res.status(result.ok ? 200 : 400).json(result)
}

export async function handleGetInventory(req, res) {
  const { venueId, productId } = req.params
  const result = getInventory(venueId, productId)
  res.status(result.ok ? 200 : 404).json(result)
}

export async function handleGetVenueInventory(req, res) {
  const { venueId } = req.params
  const result = getVenueInventory(venueId, req.query)
  res.json(result)
}

export async function handleAdjustInventory(req, res) {
  const { venueId, productId } = req.params
  const { delta, ...actorContext } = req.body
  if (delta === undefined) return res.status(400).json({ ok: false, error: 'delta required' })
  const result = adjustInventory(venueId, productId, delta, actorContext)
  res.status(result.ok ? 200 : 404).json(result)
}

export async function handleCheckAvailability(req, res) {
  const { venueId, productId } = req.params
  const qty = parseInt(req.query.quantity ?? req.body?.quantity ?? 1, 10)
  const result = checkProductAvailability(venueId, productId, qty)
  res.json(result)
}

export async function handleBlockProduct(req, res) {
  const { venueId, productId } = req.params
  const { reason, blocked_for, source } = req.body
  const result = blockProduct(venueId, productId, reason ?? 'manual_block', blocked_for ?? [], source ?? 'staff')
  res.json(result)
}

export async function handleUnblockProduct(req, res) {
  const { venueId, productId } = req.params
  const result = unblockProduct(venueId, productId)
  res.status(result.ok ? 200 : 404).json(result)
}

export async function handleGetLowStock(req, res) {
  const { venueId } = req.params
  res.json(getVenueLowStockItems(venueId))
}

export async function handleGetInventoryEvents(req, res) {
  const { venueId } = req.params
  res.json(getInventoryEvents(venueId, req.query))
}

export async function handleGetInventoryReadiness(req, res) {
  const { venueId } = req.params
  res.json(getInventoryReadiness(venueId))
}

export async function handleValidateCheckout(req, res) {
  const { venueId } = req.params
  const result = await validateProductsForCheckout(venueId, req.body.items ?? [])
  res.status(result.ok ? 200 : 422).json(result)
}

export async function handleBuildAvailabilityMap(req, res) {
  const { venueId } = req.params
  const productIds = req.body.product_ids ?? []
  const result = await buildProductAvailabilityMap(venueId, productIds)
  res.json(result)
}

export async function handleNcieAvailabilityContext(req, res) {
  const { venueId } = req.params
  const productIds = req.body.product_ids ?? []
  const result = await buildNcieAvailabilityContext(venueId, productIds)
  res.json(result)
}

export async function handleProductAvailabilityReadiness(req, res) {
  const { venueId } = req.params
  res.json(getProductAvailabilityReadiness(venueId))
}
