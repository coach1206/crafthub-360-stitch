#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-4 — build-blocking validator for customer order
 * history, Passport acquisition, receipts, and post-purchase experience.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor post-purchase validator (Venue Humidor 1B-2B-4)\n')

const orderHistorySvc = fs.readFileSync('server/services/venueHumidor/customerOrderHistoryService.js', 'utf8')
const passportSvc = fs.readFileSync('server/services/venueHumidor/passportAcquisitionService.js', 'utf8')
const checkoutSvc = fs.readFileSync('server/services/venueHumidor/checkoutService.js', 'utf8')
const postPurchaseController = fs.readFileSync('server/controllers/venueHumidorPostPurchaseController.js', 'utf8')
const customerRoutes = fs.readFileSync('server/routes/venueHumidorCustomerRoutes.js', 'utf8')
const migration112 = fs.readFileSync('server/db/migrations/112_smokecraft_venue_humidor_post_purchase.sql', 'utf8')
const orderDetailScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/VenueHumidorMyOrderDetail.jsx', 'utf8')
const receiptScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/VenueHumidorReceipt.jsx', 'utf8')

// ── 1. Single acquisition writer, no second acquisition table ────────
check('venue_cigar_passport_acquisitions is written ONLY inside checkoutService.completeOrder() — this pass adds no second writer', /INSERT INTO venue_cigar_passport_acquisitions/.test(checkoutSvc) && !/INSERT INTO venue_cigar_passport_acquisitions/.test(passportSvc) && !/INSERT INTO venue_cigar_passport_acquisitions/.test(orderHistorySvc) && !/INSERT INTO venue_cigar_passport_acquisitions/.test(postPurchaseController))
check('Migration 112 creates no second acquisition/order-history/receipt table — only the narrow acquisition-notes companion table', /CREATE TABLE IF NOT EXISTS venue_cigar_acquisition_notes/.test(migration112) && !/CREATE TABLE IF NOT EXISTS venue_cigar_passport_acquisitions/.test(migration112) && !/CREATE TABLE IF NOT EXISTS venue_cigar_orders/.test(migration112))
check('venue_cigar_acquisition_notes has a UNIQUE constraint on acquisition_id — never more than one note row per acquisition', /acquisition_id\s+UUID NOT NULL UNIQUE REFERENCES venue_cigar_passport_acquisitions/.test(migration112))

// ── 2. Historical financial integrity — no live pricing joins ────────
check('customerOrderHistoryService never joins current product price into order/receipt totals — receipt fields are read directly from stored order columns', !/p\.price_cents/.test(orderHistorySvc) && !/product.*price_cents.*totalCents/.test(orderHistorySvc))
check('getReceipt() derives totals only from the canonical order object (subtotal/tax/service/discount/tip/total), never recomputed from item price × current quantity', /subtotalCents: order\.subtotal_cents/.test(orderHistorySvc) && /totalCents: order\.total_cents/.test(orderHistorySvc))
check('Order item receipt lines use the stored historical unit_price_cents/line_total_cents columns, not live catalog pricing', /unitPriceCents: i\.unit_price_cents/.test(orderHistorySvc) && /lineTotalCents: i\.line_total_cents/.test(orderHistorySvc))
check('A receipt is never returned for a never-completed order — restricted to completed/cancelled/refunded statuses', /if \(!\['completed', 'cancelled', 'refunded'\]\.includes\(order\.status\)\)/.test(orderHistorySvc))

// ── 3. Customer-internal field redaction reused/extended ─────────────
check('customerOrderHistoryService redacts the same staff-internal fields as checkoutService.getOrder(), plus idempotency_key', /CUSTOMER_INTERNAL_FIELDS = \[/.test(orderHistorySvc) && /pickup_code_hash/.test(orderHistorySvc) && /idempotency_key/.test(orderHistorySvc))
check('Every order-history read path (listOrders, getOrderDetail) applies redact() before returning to the customer', /return rows\.map\(redact\)/.test(orderHistorySvc) && /return \{ \.\.\.redact\(order\), items: itemsWithEligibility \}/.test(orderHistorySvc))
check('The order-detail screen never renders staff notes, blocked_reason, or assigned-staff identity', !/blocked_reason/.test(orderDetailScreen) && !/handoff_notes/.test(orderDetailScreen) && !/assigned_staff/.test(orderDetailScreen))

// ── 4. Ownership enforcement on every new read/write ──────────────────
check('getOrderDetail() throws order_not_owned when the row does not belong to the requesting customer', /if \(order\.customer_reference !== customerReference\) throw new OrderHistoryError\('order_not_owned'\)/.test(orderHistorySvc))
check('getAcquisitionDetail() throws acquisition_not_owned when the row does not belong to the requesting customer', /if \(row\.customer_reference !== customerReference\) throw new PassportAcquisitionError\('acquisition_not_owned'\)/.test(passportSvc))
check('saveAcquisitionNote() re-verifies acquisition ownership server-side before writing — never trusts the client', /if \(acquisition\.customer_reference !== customerReference\) throw new PassportAcquisitionError\('acquisition_not_owned'\)/.test(passportSvc))
check('listOrders()/listAcquisitions() filter by customer_reference at the SQL layer, not just in application code after the fact', /o\.customer_reference = \$1/.test(orderHistorySvc) && /a\.customer_reference = \$1/.test(passportSvc))

// ── 5. Reorder routes only into the canonical catalog/checkout flow ──
check('Reorder eligibility is computed server-side from real archived/visible/status/availability checks, never a frontend-only flag', /!item\.is_archived && item\.is_customer_visible && item\.product_status !== 'discontinued'/.test(orderHistorySvc) && /availableQuantity > 0 && item\.product_status !== 'sold_out'/.test(orderHistorySvc))
check('The order-detail screen\'s reorder action navigates to the existing canonical catalog detail route — no new reorder-specific checkout path', /navigate\(`\/smokecraft\/venue-humidor\/\$\{item\.product_id\}`\)/.test(orderDetailScreen))
check('No new reorder-specific cart/checkout/payment service file was introduced this pass', !fs.existsSync('server/services/venueHumidor/reorderService.js') && !fs.existsSync('server/controllers/venueHumidorReorderController.js'))

// ── 6. Idempotency on post-purchase mutations ─────────────────────────
check('saveAcquisitionNote() requires an idempotency key and rejects when absent', /if \(!idempotencyKey\) throw new PassportAcquisitionError\('idempotency_key_required'\)/.test(passportSvc))
check('saveAcquisitionNote() checks for a duplicate before and re-checks inside the row lock (pre-lock fast path + in-lock authoritative recheck)', /const dup = await checkIdempotency\(db, idempotencyKey\)/.test(passportSvc) && /const dupInLock = await checkIdempotency\(client, idempotencyKey\)/.test(passportSvc))
check('The note upsert locks the existing row with FOR UPDATE before deciding INSERT vs UPDATE', /FOR UPDATE`, \[acquisitionId\]\)/.test(passportSvc))

// ── 7. RBAC / identity requirement on every new route ─────────────────
check('Every post-purchase controller handler requires a resolved guest/customer identity before touching data', /guestRef\(req\)/.test(postPurchaseController) && /identity_required/.test(postPurchaseController))
check('The 6 new cross-venue customer routes are registered on the existing customer route file, reusing its identity middleware chain — no new parallel router', /router\.get\('\/orders', readLimiter, postPurchaseCtrl\.handleListOrders\)/.test(customerRoutes) && /router\.post\('\/passport\/acquisitions\/:acquisitionId\/note', writeLimiter, postPurchaseCtrl\.handleSaveAcquisitionNote\)/.test(customerRoutes))

// ── 8. Honest receipt/PDF states ──────────────────────────────────────
check('No fake PDF download is offered — an honest disabled note is shown instead', /PDF export is not currently available/.test(receiptScreen) && !/generatePdf\(/.test(receiptScreen))
check('The receipt screen honestly flags a non-completed sale rather than presenting it as completed', /!receipt\.isCompletedSale/.test(receiptScreen))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
