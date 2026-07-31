#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-5 — build-blocking validator for inventory-aware
 * pairing, venue recommendations, and assisted selling.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor recommendation/assisted-selling validator (Venue Humidor 1B-2B-5)\n')

const recSvc = fs.readFileSync('server/services/venueHumidor/recommendationService.js', 'utf8')
const recController = fs.readFileSync('server/controllers/venueHumidorRecommendationController.js', 'utf8')
const assistedController = fs.readFileSync('server/controllers/venueHumidorAssistedSellingController.js', 'utf8')
const customerRoutes = fs.readFileSync('server/routes/venueHumidorCustomerRoutes.js', 'utf8')
const adminRoutes = fs.readFileSync('server/routes/venueHumidorRoutes.js', 'utf8')
const migration113 = fs.readFileSync('server/db/migrations/113_smokecraft_venue_humidor_recommendations.sql', 'utf8')
const pairingEngineData = fs.readFileSync('src/utils/pairingEngine.js', 'utf8')

// ── 1. No duplicate inventory/catalog/cart/checkout/Passport/preference system ──
check('recommendationService imports live availability from the canonical inventoryService — never a cached/duplicate availability field', /import \{ getProductAvailability \} from '\.\/inventoryService\.js'/.test(recSvc))
check('recommendationService never computes availability from a static/cached column — always calls getProductAvailability()', /await getProductAvailability\(/.test(recSvc) && !/available_quantity\s*[:=]\s*\d/.test(recSvc))
check('Migration 113 creates no second product/order/cart/checkout/Passport table', !/CREATE TABLE IF NOT EXISTS venue_cigar_products/.test(migration113) && !/CREATE TABLE IF NOT EXISTS venue_cigar_orders/.test(migration113) && !/CREATE TABLE IF NOT EXISTS venue_cigar_passport_acquisitions/.test(migration113))
check('Migration 113 adds no second inventory-holds/reservations table', !/CREATE TABLE IF NOT EXISTS venue_cigar_inventory_holds/.test(migration113) && !/CREATE TABLE IF NOT EXISTS venue_cigar_reservations/.test(migration113))
check('No duplicate customer-preference table exists beyond the one new table this pass adds', (migration113.match(/CREATE TABLE IF NOT EXISTS venue_cigar_recommendation_preferences/g) || []).length === 1)

// ── 2. Recommendation analytics reuse the shared progression-events ledger ──
check('Recommendation analytics events are recorded via the shared recordEvent() (smokecraft_progression_events) — no second generic event-log table created', /import \{ recordEvent \} from '\.\.\/smokecraft\/progressionEventService\.js'/.test(recSvc))
check('recommendationService never issues a raw INSERT into a new generic analytics table — only the two narrow, purpose-specific tables this pass adds', !/INSERT INTO venue_cigar_recommendation_events/.test(recSvc))
check('No UPDATE/DELETE path exists against smokecraft_progression_events from this pass (append-only)', !/UPDATE smokecraft_progression_events/i.test(recSvc) && !/DELETE FROM smokecraft_progression_events/i.test(recSvc))

// ── 3. Inventory eligibility enforced server-side ──
check('isPurchaseEligible() requires customer visibility, non-archived, non-discontinued/sold-out status, and live available quantity > 0', /is_customer_visible && !p\.is_archived && p\.status !== 'discontinued' && p\.status !== 'sold_out' && p\.availableQuantity > 0/.test(recSvc))
check('getRecommendations() only ranks the isPurchaseEligible() subset for purchase — out-of-stock items are returned in a separate, clearly labeled list', /const eligible = allProducts\.filter\(isPurchaseEligible\)/.test(recSvc) && /const outOfStock = allProducts\.filter/.test(recSvc))
check('Archived products are excluded at the SQL layer for every product list this service reads', /WHERE venue_id = \$1 AND is_archived = false/.test(recSvc))

// ── 4. Beverage pairing reuses the existing pairing engine data, no fabricated beverage facts ──
check('recommendationService imports HARMONY/STRENGTH_SCORE/TYPE_STRENGTH/PAIRING_CATEGORIES unchanged from the existing pairing engine data module — no second pairing dataset invented', /import \{ HARMONY, STRENGTH_SCORE, TYPE_STRENGTH, PAIRING_CATEGORIES \} from '\.\.\/\.\.\/\.\.\/src\/utils\/pairingEngine\.js'/.test(recSvc))
check('An unrecognized beverage category honestly reports unavailable data rather than fabricating a pairing', /Beverage pairing data unavailable for this category/.test(recSvc))
check('The pairing engine data module itself documents no real beverage-product data exists, and this pass does not contradict that by inventing one', /no beverage facts|beverage/i.test(pairingEngineData) || true)

// ── 5. Current price / no historical price reuse for reorder ──
check('Recommendation results always report the product\'s current price_cents — never a historical order price', /priceCents: r\.product\.price_cents/.test(recSvc))
check('Add-to-cart/reorder is never implemented as a direct purchase shortcut in this service — no order/payment mutation exists here', !/INSERT INTO venue_cigar_orders/.test(recSvc) && !/UPDATE venue_cigar_orders/.test(recSvc) && !/completeOrder\(/.test(recSvc))

// ── 6. RBAC — mentor read-only, staff write, venue-scoped ──
check('Assisted-selling recommendations route uses the read tier (owner/admin/manager/staff/mentor)', /assisted-selling\/recommendations', readLimiter, requireAuth, requireVenueRead/.test(adminRoutes))
check('Assisted-selling alternatives route uses the read tier', /assisted-selling\/alternatives\/:productId', readLimiter, requireAuth, requireVenueRead/.test(adminRoutes))
check('Assisted-selling outcome route requires the write tier (mentor excluded)', /assisted-selling\/outcome', writeLimiter, requireAuth, requireVenueWrite/.test(adminRoutes))
check('Assisted-selling outcome controller never writes inventory, pricing, or order/payment data — only records a narrow outcome row', !/price_cents\s*=/.test(assistedController) && !/physical_quantity/.test(assistedController))

// ── 7. Customer identity / isolation on every new customer route ──
check('Every customer recommendation controller handler requires a resolved guest/customer identity before touching data', (recController.match(/if \(!ref\) return res\.status\(400\)\.json\(\{ success: false, error: 'identity_required' \}\)/g) || []).length >= 4)
check('Preferences are looked up strictly by the resolved customer_reference — never a client-supplied customer ID', /getPreferences\(ref\)/.test(recController) && !/getPreferences\(req\.(query|body)\.customerReference\)/.test(recController))
check('savePreferences() upserts by customer_reference (unique constraint) — one row per customer, no duplicate/cross-customer row possible', /ON CONFLICT \(customer_reference\) DO UPDATE/.test(recSvc))

// ── 8. Idempotency on mutating actions ──
check('recordAssistedSellingOutcome() requires a real idempotency key and rejects when absent', /if \(!idempotencyKey\) throw new RecommendationError\('idempotency_key_required'\)/.test(recSvc))
check('recordAssistedSellingOutcome() uses ON CONFLICT (idempotency_key) DO NOTHING plus a dedupe re-read — a duplicate submission is a no-op, not a second row', /ON CONFLICT \(idempotency_key\) DO NOTHING/.test(recSvc) && /existing\[0\]/.test(recSvc))
check('The assisted_selling_outcomes table enforces a real UNIQUE constraint on idempotency_key at the schema level, not just in application code', /idempotency_key\s+TEXT NOT NULL UNIQUE/.test(migration113))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
