/**
 * POS 3 Provider Adapters — per-provider SAMPLE/MOCK data generators only.
 * These NEVER make real network calls; they return clearly-fake, bundled
 * sample records shaped like what each provider's real API would return,
 * for use by posSyncService.js's syncProvider().
 */

function sampleMenu(providerId) {
  return [
    { id: `${providerId}_item_1`, name: 'Sample Espresso Martini', price: 14.0, category: 'Bar' },
    { id: `${providerId}_item_2`, name: 'Sample Wagyu Slider', price: 18.0, category: 'Food' },
    { id: `${providerId}_item_3`, name: 'Sample Toro Cigar', price: 22.0, category: 'Cigars' },
  ]
}

function sampleOrders(providerId) {
  return [
    { id: `${providerId}_order_1`, total: 64.5, status: 'closed', items: ['Sample Espresso Martini', 'Sample Wagyu Slider'], createdAt: Date.now() - 3600000 },
    { id: `${providerId}_order_2`, total: 22.0, status: 'closed', items: ['Sample Toro Cigar'], createdAt: Date.now() - 1800000 },
  ]
}

function sampleInventory(providerId) {
  return [
    { sku: `${providerId}_sku_1`, name: 'Sample Bottle of Bourbon', quantityOnHand: 8, parLevel: 12 },
    { sku: `${providerId}_sku_2`, name: 'Sample Box of Robustos', quantityOnHand: 4, parLevel: 10 },
  ]
}

function sampleStaff(providerId) {
  return [
    { id: `${providerId}_staff_1`, name: 'Sample Server A', role: 'server' },
    { id: `${providerId}_staff_2`, name: 'Sample Bartender B', role: 'bartender' },
  ]
}

/** Returns sample external records for a provider, keyed by data type. */
export function getSampleData(providerId, types = ['menu', 'orders', 'inventory', 'staff']) {
  const out = {}
  if (types.includes('menu')) out.menu = sampleMenu(providerId)
  if (types.includes('orders')) out.orders = sampleOrders(providerId)
  if (types.includes('inventory')) out.inventory = sampleInventory(providerId)
  if (types.includes('staff')) out.staff = sampleStaff(providerId)
  return out
}
