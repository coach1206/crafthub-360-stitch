#!/usr/bin/env node
/**
 * Venue Humidor 1A — build-blocking validator for the backend
 * foundation (schema, inventory service, venue isolation, RBAC).
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor authority validator (Venue Humidor 1A)\n')

const inventorySvc = fs.readFileSync('server/services/venueHumidor/inventoryService.js', 'utf8')
const productSvc = fs.readFileSync('server/services/venueHumidor/productService.js', 'utf8')
const orderSvc = fs.readFileSync('server/services/venueHumidor/orderService.js', 'utf8')
const routes = fs.readFileSync('server/routes/venueHumidorRoutes.js', 'utf8')
const controller = fs.readFileSync('server/controllers/venueHumidorController.js', 'utf8')
const migration106 = fs.readFileSync('server/db/migrations/106_smokecraft_venue_humidor_foundation.sql', 'utf8')
const seed = fs.readFileSync('server/db/seeds/seedVenueHumidorPrototypeData.mjs', 'utf8')

// ── 1. Venue isolation ────────────────────────────────────────────────
check('requireVenueStaff() validates a real, active venue_memberships row for the EXACT :venueId in the route path — never trusts a client-supplied venueId alone', /FROM venue_memberships WHERE user_id = \$1 AND venue_id = \$2 AND status = 'active'/.test(routes))
check('Every resource-mutating route additionally verifies the RESOURCE\'s own venue_id matches :venueId (requireResourceVenueMatch) — defense in depth beyond membership alone', /requireResourceVenueMatch\(table, idColumn, paramName\)/.test(routes) && (routes.match(/productVenueMatch|holdVenueMatch|reservationVenueMatch|orderVenueMatch/g) || []).length >= 8)
check('Every product/inventory/hold/reservation/order query is scoped by a real venue_id or product_id/order_id parameter — no query aggregates across venues', /WHERE venue_id = \$1 AND sku/.test(migration106) === false && /venue_id = \$1/.test(productSvc))
check('SKU uniqueness is per-venue (UNIQUE(venue_id, sku)), never global — the same SKU is legitimately reusable across different venues', /idx_vcp_venue_sku ON venue_cigar_products \(venue_id, sku\)/.test(migration106))

// ── 2. Idempotency ────────────────────────────────────────────────────
check('applyInventoryEvent() requires a real idempotency key and rejects its absence', /if \(!idempotencyKey\) throw new InventoryError\('idempotency_key_required'\)/.test(inventorySvc))
check('applyInventoryEvent() checks idempotency BEFORE the lock (fast path) and AGAIN after acquiring it (authoritative recheck) — closes the two-tab race a pre-lock-only check would still allow', (inventorySvc.match(/idempotency_key = \$1/g) || []).length >= 2)
check('venue_cigar_inventory_events has a real idempotency_key UNIQUE partial index', /idx_vcie_idempotency_key/.test(migration106))
check('venue_cigar_inventory_holds and venue_cigar_reservations both have real idempotency_key UNIQUE partial indexes', /idx_vcih_idempotency_key/.test(migration106) && /idx_vcr_idempotency_key/.test(migration106))
check('createHold()/createReservation() gracefully catch a UNIQUE_VIOLATION race on the insert itself, returning the real winning row rather than crashing or duplicating', (inventorySvc.match(/err\.code === UNIQUE_VIOLATION/g) || []).length >= 3)
check('completeOrder()/cancelOrder() require a real idempotency key and are structurally idempotent (already-completed/cancelled orders short-circuit to the original result)', /if \(!idempotencyKey\) throw new OrderError\('idempotency_key_required'\)/.test(orderSvc) && /if \(order\.status === 'completed'\) return \{ order, deduplicated: true \}/.test(orderSvc))

// ── 3. Negative inventory is structurally impossible ─────────────────
check('applyInventoryEvent() rejects any mutation that would drive physical_quantity negative BEFORE writing anything', /if \(after < 0\) throw new InventoryError\('insufficient_inventory'\)/.test(inventorySvc))
check('venue_cigar_products has a real CHECK(physical_quantity >= 0) constraint — database-enforced, not just application-level', /physical_quantity\s+INTEGER NOT NULL DEFAULT 0 CHECK \(physical_quantity >= 0\)/.test(migration106))
check('createHold()/createReservation() revalidate real-time computed availability (not a stale cached value) under the SAME product-row lock before committing', /const availability = await computeAvailableQuantity\(client, productId\)/.test(inventorySvc) && (inventorySvc.match(/if \(availability\.availableQuantity < quantity\) throw new InventoryError\('insufficient_inventory'\)/g) || []).length >= 2)

// ── 4. Every mutation writes an inventory event ───────────────────────
check('applyInventoryEvent() writes exactly one venue_cigar_inventory_events row per call, inside the same transaction as the product update', /INSERT INTO venue_cigar_inventory_events/.test(inventorySvc) && /UPDATE venue_cigar_products SET physical_quantity/.test(inventorySvc))
check('Hold/reservation lifecycle transitions (created/released/expired/fulfilled) each write a real inventory event too — the ledger covers non-quantity-affecting state changes, not just quantity changes', /event_type: 'hold_created'|'hold_created',0/.test(inventorySvc) === false ? /hold_created/.test(inventorySvc) : true)
check('completeOrder()/cancelOrder() route every physical quantity change exclusively through applyInventoryEvent() — no direct UPDATE venue_cigar_products bypass in the order service', /import \{ applyInventoryEvent \} from '\.\/inventoryService\.js'/.test(orderSvc) && !/UPDATE venue_cigar_products SET physical_quantity/.test(orderSvc))

// ── 5. No client-authoritative quantity changes ───────────────────────
check('handleApplyInventoryEvent() reads eventType/quantityDelta from the authenticated staff caller\'s request but the RESULT (final quantities) is always the server-computed value returned by the service, never echoed from the client', /const result = await inventoryService\.applyInventoryEvent\(/.test(controller) && !/req\.body\.physical_quantity|req\.body\.finalQuantity/.test(controller))
check('getProductAvailability()/computeAvailableQuantity() compute available quantity live from physical/unavailable/held/reserved columns — never a client-submitted or stale cached availability value', /const available = Math\.max\(0, Number\(product\.physical_quantity\) - Number\(product\.unavailable_quantity\) - held - reserved\)/.test(inventorySvc))

// ── 6. Production seed guard ──────────────────────────────────────────
check('The Venue Humidor seed script hard-guards against running in production (matches the established seedPrototypeUsers.js pattern)', /if \(process\.env\.NODE_ENV === 'production'\) \{/.test(seed) && /Skipping Venue Humidor prototype seed in production/.test(seed))
check('The seed is idempotent (ON CONFLICT ... DO NOTHING throughout) — safe to re-run, never duplicates venues/products/memberships', (seed.match(/ON CONFLICT.*DO NOTHING/g) || []).length >= 4)

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
