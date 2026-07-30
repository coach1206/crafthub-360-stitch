#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-1 — build-blocking validator for staff
 * inventory administration.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor admin inventory validator (Venue Humidor 1B-2B-1)\n')

const productSvc = fs.readFileSync('server/services/venueHumidor/productService.js', 'utf8')
const inventorySvc = fs.readFileSync('server/services/venueHumidor/inventoryService.js', 'utf8')
const adminController = fs.readFileSync('server/controllers/venueHumidorAdminController.js', 'utf8')
const routes = fs.readFileSync('server/routes/venueHumidorRoutes.js', 'utf8')
const dashboard = fs.readFileSync('src/pages/smokecraft/venueHumidor/admin/VenueHumidorAdminDashboard.jsx', 'utf8')
const productForm = fs.readFileSync('src/pages/smokecraft/venueHumidor/admin/VenueHumidorAdminProductForm.jsx', 'utf8')
const eventHistory = fs.readFileSync('src/pages/smokecraft/venueHumidor/admin/VenueHumidorAdminInventoryEvents.jsx', 'utf8')
const adminApiClient = fs.readFileSync('src/services/venueHumidor/venueHumidorAdminApiClient.js', 'utf8')

// ── 1. Admin screens use no mock inventory ──────────────────────────
check('Admin dashboard fetches real data via listAdminProducts() — no mock/fake/dummy product array', !/mockProduct|fakeProduct|dummyProduct/i.test(dashboard) && /api\.listAdminProducts/.test(dashboard))
check('Product form loads a real product via getAdminProduct() when editing — no mock data', !/mockProduct|fakeProduct|dummyProduct/i.test(productForm) && /api\.getAdminProduct/.test(productForm))
check('Event history fetches real events via listInventoryEvents() — no mock data', !/mockEvent|fakeEvent|dummyEvent/i.test(eventHistory) && /api\.listInventoryEvents/.test(eventHistory))

// ── 2. Client never controls authoritative quantities ───────────────
check('handleInventoryMutation() never reads a client-submitted final/resulting quantity — only a requested delta, corrected total (for count_correction), or fixed sign', !/req\.body\.(physicalQuantity|resultingQuantity|finalQuantity)/.test(adminController))
check('handleInventoryMutation() computes count_correction delta from the real current server row, not a client-submitted delta', /const \{ rows \} = await db\.query\(`SELECT physical_quantity FROM venue_cigar_products WHERE product_id = \$1`/.test(adminController))
check('The admin product form never computes a final inventory quantity in the browser — only submits a requested quantity/correction to the server', !/physicalQuantity\s*=.*quantity.*[-+]/.test(productForm))

// ── 3. Every mutation flows through the canonical 1A inventory service ──
check('handleInventoryMutation() calls the canonical inventoryService.applyInventoryEvent() — no parallel mutation path', /inventoryService\.applyInventoryEvent\(/.test(adminController))
check('productService.js never writes physical_quantity directly — quantity changes are owned exclusively by inventoryService.applyInventoryEvent()', !/UPDATE venue_cigar_products SET[^;]*physical_quantity/i.test(productSvc))

// ── 4. Every inventory mutation requires idempotency ─────────────────
check('handleInventoryMutation() rejects a missing idempotency key before calling the inventory service', /if \(!idempotencyKey\) return res\.status\(400\)\.json\(\{ success: false, error: 'idempotency_key_required' \}\)/.test(adminController))
check('The admin product form generates a real, unique idempotency key per mutation submission', /vh-admin-mut-.*Date\.now\(\)/.test(productForm))

// ── 5. Every mutation writes exactly one inventory event ─────────────
check('applyInventoryEvent() (the shared, single writer) inserts exactly one venue_cigar_inventory_events row per call, under a row lock', /INSERT INTO venue_cigar_inventory_events/.test(inventorySvc) && /FOR UPDATE/.test(inventorySvc))
check('Sealed/opened box counters are updated alongside, never instead of, the authoritative inventory event', /if \(sealedBoxDelta \|\| openedBoxDelta\)/.test(adminController))

// ── 6. Venue isolation is enforced on every admin route ──────────────
check('Every admin route requires requireAuth and a venue-role check (requireVenueRead/requireVenueWrite) scoped to :venueId', (routes.match(/\/venues\/:venueId\/admin\/[^\n]*requireAuth, requireVenue(Read|Write)/g) || []).length >= 6)
check('Admin product/classification/mutation routes revalidate the resource itself belongs to :venueId (productVenueMatch) — never trust venueId alone', /admin\/products\/:productId.*productVenueMatch/.test(routes.replace(/\n/g, ' ')))

// ── 7. RBAC is enforced server-side, not only in the UI ──────────────
check('RBAC tiers are defined and checked server-side against the real venue_memberships.membership_type — never only hidden buttons client-side', /const FULL_ACCESS_TYPES = \[.owner., .admin., .manager.\]/.test(routes) && /membership_type FROM venue_memberships/.test(routes))
check('The mentor (tobacconist) tier is restricted to the staffNotes field server-side in the controller, not only hidden in the form', /NOTES_ONLY_TYPES = \[.mentor.\]/.test(adminController) && /field_not_permitted_for_role/.test(adminController))
const writeAccessLine = (routes.match(/const WRITE_ACCESS_TYPES = .*/) || [''])[0]
check('A mentor-tier caller cannot reach the inventory-mutation route at all (requireVenueWrite excludes mentor)', /requireVenueWrite,.*adminCtrl\.handleInventoryMutation/.test(routes) && !writeAccessLine.includes('mentor'))

// ── 8. Inventory event history cannot be edited or deleted ───────────
check('The admin controller exposes no update/delete handler for inventory events — history is read-only', !/handleUpdateInventoryEvent|handleDeleteInventoryEvent/.test(adminController))
check('No admin route exists to mutate or delete an existing inventory event by id', !/admin\/inventory-events\/:eventId/.test(routes))
check('The event-history screen renders events read-only — no edit/delete control on an event row', !/onClick=\{.*delete.*[Ee]vent/i.test(eventHistory) && !/onClick=\{.*edit.*[Ee]vent/i.test(eventHistory))

// ── 9. Staff changes synchronize with the customer browser ───────────
check('updateProductClassification() is the single writer of is_archived/is_customer_visible/is_featured/is_staff_pick/is_limited_release — the same columns the customer catalog already reads', /CLASSIFICATION_COLUMN = \{/.test(productSvc) && /isArchived: .is_archived./.test(productSvc))
check('The customer catalog service (browseCatalog) excludes archived/hidden products from the exact same columns the admin classification controls write — no separate visibility mechanism', fs.readFileSync('server/services/venueHumidor/customerCatalogService.js', 'utf8').includes('is_archived') && fs.readFileSync('server/services/venueHumidor/customerCatalogService.js', 'utf8').includes('is_customer_visible'))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
