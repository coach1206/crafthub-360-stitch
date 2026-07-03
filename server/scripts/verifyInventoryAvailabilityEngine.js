/**
 * Verify Inventory Availability Engine (Phase 14 — ISPAE)
 * 80 checks
 */

import { readFileSync, existsSync } from 'fs'

let passed = 0, failed = 0
const failures = []

function check(label, condition) {
  if (condition) { passed++; process.stdout.write('.') }
  else { failed++; failures.push(label); process.stdout.write('F') }
}

function readFile(path) {
  try { return existsSync(path) ? readFileSync(path, 'utf8') : '' } catch { return '' }
}

// 1-25. inventoryAvailabilityService
const ias = readFile('server/services/inventory/inventoryAvailabilityService.js')
check('inventoryAvailabilityService exists', ias.length > 0)
check('buildInventoryRecord exists', ias.includes('export function buildInventoryRecord'))
check('setInventory exists', ias.includes('export function setInventory'))
check('getInventory exists', ias.includes('export function getInventory'))
check('getVenueInventory exists', ias.includes('export function getVenueInventory'))
check('adjustInventory exists', ias.includes('export function adjustInventory'))
check('checkProductAvailability exists', ias.includes('export function checkProductAvailability'))
check('blockProduct exists', ias.includes('export function blockProduct'))
check('unblockProduct exists', ias.includes('export function unblockProduct'))
check('getVenueLowStockItems exists', ias.includes('export function getVenueLowStockItems'))
check('getInventoryEvents exists', ias.includes('export function getInventoryEvents'))
check('getInventoryReadiness exists', ias.includes('export function getInventoryReadiness'))
check('in_stock status exists', ias.includes("'in_stock'"))
check('low_stock status exists', ias.includes("'low_stock'"))
check('sold_out status exists', ias.includes("'sold_out'"))
check('availability_required status exists', ias.includes("'availability_required'"))
check('inventory_sync_pending status exists', ias.includes('inventory_sync_pending'))
check('INVENTORY_STORE is a Map', ias.includes('new Map()'))
check('persistenceStatus present', ias.includes('persistenceStatus'))
check('database_required present', ias.includes('database_required'))
check('not_persisted present', ias.includes('not_persisted'))
check('Math.max prevents negative stock', ias.includes('Math.max(0'))
check('reserved_stock accounted', ias.includes('reserved_stock'))
check('reorder_threshold used', ias.includes('reorder_threshold'))
check('availability_blocked status exists', ias.includes('availability_blocked'))

// 26-40. productAvailabilityService
const pas = readFile('server/services/inventory/productAvailabilityService.js')
check('productAvailabilityService exists', pas.length > 0)
check('validateProductsForCheckout exists', pas.includes('export async function validateProductsForCheckout'))
check('validateProductsForStaffOrder exists', pas.includes('export async function validateProductsForStaffOrder'))
check('buildProductAvailabilityMap exists', pas.includes('export async function buildProductAvailabilityMap'))
check('buildNcieAvailabilityContext exists', pas.includes('export async function buildNcieAvailabilityContext'))
check('buildCheckoutAvailabilityDemandSignals exists', pas.includes('export async function buildCheckoutAvailabilityDemandSignals'))
check('buildPos360AvailabilityDemandSignals exists', pas.includes('export function buildPos360AvailabilityDemandSignals'))
check('getProductAvailabilityReadiness exists', pas.includes('export function getProductAvailabilityReadiness'))
check('demand signal ncie source', pas.includes("signal_source: 'ncie'"))
check('demand signal checkout source', pas.includes("'checkout'"))
check('inventory_unavailable in productAvailability', pas.includes('inventory_unavailable'))
check('product_recommended_but_unavailable signal', pas.includes('product_recommended_but_unavailable'))
check('product_checkout_blocked signal', pas.includes('product_checkout_blocked_due_to_inventory'))
check('syncStatus present', pas.includes('syncStatus'))
check('staffOrderAllowed present', pas.includes('staffOrderAllowed'))

// 41-47. inventoryController
const ic = readFile('server/controllers/inventoryController.js')
check('inventoryController exists', ic.length > 0)
check('handleSetInventory exists', ic.includes('handleSetInventory'))
check('handleAdjustInventory exists', ic.includes('handleAdjustInventory'))
check('handleValidateCheckout exists', ic.includes('handleValidateCheckout'))
check('handleNcieAvailabilityContext exists', ic.includes('handleNcieAvailabilityContext'))
check('handleGetLowStock exists', ic.includes('handleGetLowStock'))
check('handleGetInventoryReadiness exists', ic.includes('handleGetInventoryReadiness'))

// 48-54. inventoryRoutes
const ir = readFile('server/routes/inventoryRoutes.js')
check('inventoryRoutes exists', ir.length > 0)
check('/venue/:venueId/set route exists', ir.includes('/venue/:venueId/set'))
check('/adjust route exists', ir.includes('/adjust'))
check('/low-stock route exists', ir.includes('/low-stock'))
check('/validate-checkout route exists', ir.includes('/validate-checkout'))
check('/availability-map route exists', ir.includes('/availability-map'))
check('/ncie-availability route exists', ir.includes('/ncie-availability'))

// 55-60. index.js mounts
const idx = readFile('server/index.js')
check('inventoryRoutes imported in index.js', idx.includes("inventoryRoutes"))
check('/api/inventory mounted', idx.includes("'/api/inventory'") || idx.includes('"/api/inventory"'))
check('reorderRoutes imported in index.js', idx.includes("reorderRoutes"))
check('/api/reorder mounted', idx.includes("'/api/reorder'") || idx.includes('"/api/reorder"'))

// 61-65. Frontend inventoryApi
const iapi = readFile('src/services/inventory/inventoryApi.js')
check('inventoryApi exists', iapi.length > 0)
check('setInventory fn in api', iapi.includes('export async function setInventory'))
check('validateCheckout fn in api', iapi.includes('export async function validateCheckout'))
check('getInventoryReadiness fn in api', iapi.includes('export async function getInventoryReadiness'))
check('buildAvailabilityMap fn in api', iapi.includes('export async function buildAvailabilityMap'))

// 66-70. UI components
check('InventoryStatusBadge exists', existsSync('src/components/inventory/InventoryStatusBadge.jsx'))
check('ProductAvailabilityCard exists', existsSync('src/components/inventory/ProductAvailabilityCard.jsx'))
check('LowStockAlert exists', existsSync('src/components/inventory/LowStockAlert.jsx'))
check('SoldOutAlert exists', existsSync('src/components/inventory/SoldOutAlert.jsx'))
check('InventoryReadinessPanel exists', existsSync('src/components/inventory/InventoryReadinessPanel.jsx'))

// 71-75. Demo page
const demo = readFile('src/pages/inventory/InventoryAndReorderDemo.jsx')
check('InventoryAndReorderDemo exists', demo.length > 0)
check('Demo shows inventory_sync_pending', demo.includes('inventory_sync_pending'))
check('Demo shows sold_out', demo.includes('sold_out'))
check('Demo shows low_stock', demo.includes('low_stock'))
check('Demo shows availability_required', demo.includes('availability_required'))

// 76-78. Documentation
const doc = readFile('docs/INVENTORY_AVAILABILITY_ENGINE.md')
check('INVENTORY_AVAILABILITY_ENGINE.md exists', doc.length > 0)
check('Doc mentions inventory_sync_pending', doc.includes('inventory_sync_pending'))
check('Doc mentions availability_required', doc.includes('availability_required'))

// 79-80. Forbidden fake-live language
const allSrc = [ias, pas, ic, ir].join('\n')
check('No "inventory synced live" language', !allSrc.includes('inventory synced live'))
check('No "inventory reserved" fake language', !allSrc.includes('inventory reserved successfully'))

console.log(`\n\n${passed + failed} checks: ${passed} passed, ${failed} failed`)
if (failures.length) { console.log('FAILED:'); failures.forEach(f => console.log(`  - ${f}`)) }
process.exit(failed > 0 ? 1 : 0)
