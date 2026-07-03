/**
 * Product Availability Service
 * Integrates inventory checks into checkout, staff orders, NCIE, KDS, POS360.
 * Returns availability_required when inventory record missing.
 * Returns inventory_unavailable when product is sold out or blocked.
 */

import { checkProductAvailability, getInventory } from './inventoryAvailabilityService.js'

const dbAvailable = () => !!process.env.DATABASE_URL

export async function validateProductsForCheckout(venueId, items = []) {
  const results = []
  let allAvailable = true
  for (const item of items) {
    const check = checkProductAvailability(venueId, item.product_id ?? item.item_name, item.quantity ?? 1)
    if (!check.available) allAvailable = false
    results.push({
      product_id:         item.product_id ?? item.item_name,
      product_name:       item.item_name ?? item.product_id,
      requested_quantity: item.quantity ?? 1,
      available:          check.available,
      availabilityStatus: check.availabilityStatus,
      reason:             check.reason ?? null,
    })
  }
  return {
    ok:                allAvailable,
    venueId,
    results,
    checkoutAllowed:   allAvailable,
    availabilityStatus: allAvailable ? 'in_stock' : 'inventory_unavailable',
    blockedItems:      results.filter(r => !r.available),
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export async function validateProductsForStaffOrder(venueId, items = []) {
  const result = await validateProductsForCheckout(venueId, items)
  return { ...result, staffOrderAllowed: result.checkoutAllowed, sessionStatus: 'staff_order_preview' }
}

export async function buildProductAvailabilityMap(venueId, productIds = []) {
  const map = {}
  for (const pid of productIds) {
    const check = checkProductAvailability(venueId, pid)
    map[pid] = {
      availabilityStatus: check.availabilityStatus,
      available:          check.available,
      availableStock:     check.availableStock ?? 0,
    }
  }
  return {
    ok: true, venueId,
    availabilityMap:   map,
    syncStatus:        'inventory_sync_pending',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export async function buildNcieAvailabilityContext(venueId, recommendedProductIds = []) {
  const map = await buildProductAvailabilityMap(venueId, recommendedProductIds)
  const unavailable = Object.entries(map.availabilityMap)
    .filter(([,v]) => !v.available)
    .map(([k]) => k)
  return {
    ...map,
    unavailableProducts:   unavailable,
    inventoryStatus:       'inventory_unavailable',
    ncieNote:              'NCIE recommendations filtered by live inventory availability.',
    demandSignals:         unavailable.map(pid => ({
      product_id:    pid,
      signal_type:   'product_recommended_but_unavailable',
      signal_source: 'ncie',
    })),
  }
}

export async function buildCheckoutAvailabilityDemandSignals(venueId, blockedItems = []) {
  return blockedItems.map(item => ({
    venue_id:      venueId,
    product_id:    item.product_id,
    product_name:  item.product_name,
    signal_type:   'product_checkout_blocked_due_to_inventory',
    signal_source: 'checkout',
    signal_strength: item.availabilityStatus === 'sold_out' ? 'urgent' : 'normal',
    current_stock: item.availableStock ?? 0,
  }))
}

export function buildPos360AvailabilityDemandSignals(venueId, blockedItems = []) {
  return blockedItems.map(item => ({
    venue_id:       venueId,
    product_id:     item.product_id,
    product_name:   item.product_name ?? item.product_id,
    signal_type:    'product_staff_blocked_due_to_inventory',
    signal_source:  'pos360',
    signal_strength: 'normal',
  }))
}

export function getProductAvailabilityReadiness(venueId) {
  return {
    ok:                 true,
    venueId,
    availabilityStatus: 'availability_required',
    syncStatus:         'inventory_sync_pending',
    inventoryStatus:    'inventory_unavailable',
    persistenceStatus:  dbAvailable() ? 'database_required' : 'not_persisted',
    note:               'Product availability requires inventory records. Set inventory via /api/inventory/set.',
  }
}
