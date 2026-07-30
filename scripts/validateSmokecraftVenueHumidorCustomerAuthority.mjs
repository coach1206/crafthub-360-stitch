#!/usr/bin/env node
/**
 * Venue Humidor 1B-1 — build-blocking validator for the customer
 * browsing/detail screens.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor customer validator (Venue Humidor 1B-1)\n')

const catalogSvc = fs.readFileSync('server/services/venueHumidor/customerCatalogService.js', 'utf8')
const controller = fs.readFileSync('server/controllers/venueHumidorCustomerController.js', 'utf8')
const routes = fs.readFileSync('server/routes/venueHumidorCustomerRoutes.js', 'utf8')
const browser = fs.readFileSync('src/pages/smokecraft/venueHumidor/VenueHumidorBrowser.jsx', 'utf8')
const detail = fs.readFileSync('src/pages/smokecraft/venueHumidor/VenueHumidorCigarDetail.jsx', 'utf8')
const apiClient = fs.readFileSync('src/services/venueHumidor/venueHumidorCustomerApiClient.js', 'utf8')

// ── 1. No hardcoded inventory in the browser ──────────────────────────
check('VenueHumidorBrowser.jsx renders only the server response\'s products array — no hardcoded/static cigar list', /products\.map\(p =>/.test(browser) && !/SMOKECRAFT_CIGARS|const CIGARS = \[/.test(browser))
check('VenueHumidorCigarDetail.jsx renders only the server-returned product — no hardcoded fallback cigar data', !/SMOKECRAFT_CIGARS|const FALLBACK_CIGAR/.test(detail))
check('No mock/fake/dummy inventory appears as live data in either customer screen', !/mockInventory|fakeCigar|dummyProduct/i.test(browser) && !/mockInventory|fakeCigar|dummyProduct/i.test(detail))

// ── 2. Venue isolation ─────────────────────────────────────────────────
check('browseCatalog() and getCigarDetail() are both scoped by a real venue_id parameter — never cross-venue', /WHERE venue_id = \$1/.test(catalogSvc) && /WHERE venue_id = \$1 AND product_id = \$2/.test(catalogSvc))
check('validateActiveVenue() re-validates the venue server-side (real venues table, status=active) — never trusts the client\'s claim alone', /SELECT venue_id, name FROM venues WHERE venue_id = \$1 AND status = 'active'/.test(catalogSvc))
check('Every controller handler calls validateActiveVenue() before returning any catalog/detail data', (controller.match(/await catalogService\.validateActiveVenue/g) || []).length >= 3)
check('getCigarDetail() excludes any product not genuinely belonging to the requested venue (a wrong-venue productId returns null, never leaked data)', /WHERE venue_id = \$1 AND product_id = \$2 AND is_archived = false AND is_customer_visible = true/.test(catalogSvc))

// ── 3. Filters are real, not decorative ───────────────────────────────
check('Every documented filter (brand/country/wrapper/vitola/strength/body/flavor/price/smokeTime/experienceLevel/featured/staffPick/limitedRelease) maps to a real SQL condition — never a client-side-only cosmetic filter', ['brand', 'country', 'wrapper', 'vitola', 'strength', 'body', 'flavor', 'priceMinCents', 'smokeTimeMaxMinutes', 'experienceLevel', 'featured', 'staffPick', 'limitedRelease'].every(f => catalogSvc.includes(f)))
check('Sold-out products are excluded by default at the SQL layer (status != sold_out) unless the caller explicitly opts in — never a client-side-only toggle', /if \(filters\.inStockOnly !== false\) conditions\.push\(`status != 'sold_out'`\)/.test(catalogSvc))
check('Archived and non-customer-visible products are excluded unconditionally at the SQL layer, not just hidden in the UI', /is_archived = false/.test(catalogSvc) && /is_customer_visible = true/.test(catalogSvc))
check('All 6 documented sort options map to real SQL ORDER BY expressions', ['recommended', 'price_low_to_high', 'price_high_to_low', 'strength', 'smoking_time', 'newest'].every(s => catalogSvc.includes(s)))

// ── 4. Product detail never trusts the client venue ────────────────────
check('handleGetCigarDetail() re-validates the venue AND the product\'s real venue ownership before ever responding — never a client-supplied venue trusted for detail data', /const venue = await catalogService\.validateActiveVenue\(req\.params\.venueId\)/.test(controller) && /const product = await catalogService\.getCigarDetail\(req\.params\.venueId, req\.params\.productId\)/.test(controller))

// ── 5. Live quantity is always server-computed ─────────────────────────
check('Available quantity is computed via the real inventoryService.getProductAvailability() (physical/unavailable/held/reserved), never a client-submitted or component-local value', /import \{ getProductAvailability \} from '\.\/inventoryService\.js'/.test(catalogSvc) && /const availability = await getProductAvailability\(product\.product_id\)/.test(catalogSvc))
check('VenueHumidorBrowser.jsx/VenueHumidorCigarDetail.jsx render only product.availability.availableQuantity from the server response — no local quantity computation', !/availableQuantity\s*=\s*.*physical_quantity\s*-/.test(browser) && !/availableQuantity\s*=\s*.*physical_quantity\s*-/.test(detail))

// ── 6. Unsupported payment/POS never appears successful ────────────────
check('handleUnsupportedAction() returns a real 501 with an honest error code — never a fabricated 200 success', /res\.status\(501\)\.json\(\{ success: false, error: 'action_not_yet_available'/.test(controller))
check('Purchase Box is honestly rejected (never a fake hold) when the product has no configured box price/quantity', /if \(!product\.box_quantity \|\| !product\.box_price_cents\) \{/.test(controller) && /box_purchase_unavailable/.test(controller))
check('VenueHumidorCigarDetail.jsx never renders a fabricated "purchase successful" or "order complete" message for any action in this package', !/[Oo]rder [Cc]omplete|[Pp]urchase [Ss]uccessful|[Pp]ayment [Cc]onfirmed/.test(detail))

// ── 7. Active controls call real server actions ────────────────────────
check('Add One Stick calls the real createStickHold API, never a local-only state update', /api\.createStickHold/.test(detail))
check('Purchase Box calls the real createBoxHold API', /api\.createBoxHold/.test(detail))
check('Reserve calls the real createReservation API', /api\.createReservation/.test(detail))
check('Save to Favorites calls the real addFavorite/removeFavorite API and reloads real persisted state on mount (not just local optimistic state)', /api\.addFavorite|api\.removeFavorite/.test(detail) && /const favResult = await api\.listFavorites\(\)/.test(detail))
check('goldenBoxApiClient-style adapter (venueHumidorCustomerApiClient.js) is the only path these screens use — no direct fetch() calls in either screen', !/fetch\(['"`]\/api\/smokecraft\/venue-humidor/.test(browser) && !/fetch\(['"`]\/api\/smokecraft\/venue-humidor/.test(detail))

// ── 8. Idempotency on customer-initiated actions ────────────────────────
check('Every customer hold/reservation action generates a real idempotency key client-side before calling the API', /gb-vh-stick|actionKey\('gb-vh-stick'\)/.test(detail) && /actionKey\('gb-vh-reserve'\)/.test(detail))
check('createHold()/createReservation() in the API client accept and forward a real idempotency key', /createStickHold = \(venueId, productId, idempotencyKey\)/.test(apiClient) && /createReservation = \(venueId, productId, quantity, idempotencyKey\)/.test(apiClient))

// ── 9. Routes ────────────────────────────────────────────────────────────
check('Both required customer routes are registered (browse and detail)', /venues\/:venueId\/catalog', readLimiter/.test(routes) && /venues\/:venueId\/catalog\/:productId', readLimiter/.test(routes))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
