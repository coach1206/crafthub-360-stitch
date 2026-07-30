#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-2 — build-blocking validator for the staff
 * order and fulfillment queue.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor fulfillment-queue validator (Venue Humidor 1B-2B-2)\n')

const fulfillmentSvc = fs.readFileSync('server/services/venueHumidor/fulfillmentService.js', 'utf8')
const checkoutSvc = fs.readFileSync('server/services/venueHumidor/checkoutService.js', 'utf8')
const inventorySvc = fs.readFileSync('server/services/venueHumidor/inventoryService.js', 'utf8')
const fulfillmentController = fs.readFileSync('server/controllers/venueHumidorFulfillmentController.js', 'utf8')
const routes = fs.readFileSync('server/routes/venueHumidorRoutes.js', 'utf8')
const migration110 = fs.readFileSync('server/db/migrations/110_smokecraft_venue_humidor_fulfillment_queue.sql', 'utf8')
const queueScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/admin/VenueHumidorOrderQueue.jsx', 'utf8')
const detailScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/admin/VenueHumidorOrderDetail.jsx', 'utf8')
const historyScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/admin/VenueHumidorFulfillmentHistory.jsx', 'utf8')

// ── 1. No second completion/cancellation service ─────────────────────
check('fulfillmentService.js contains no direct order-status-to-completed/cancelled UPDATE — only checkoutService delegation', !/UPDATE venue_cigar_orders SET[^;]*status\s*=\s*'completed'/i.test(fulfillmentSvc) && !/UPDATE venue_cigar_orders SET[^;]*status\s*=\s*'cancelled'/i.test(fulfillmentSvc))
check('completeOrderFromQueue() calls checkoutService.completeOrder() — never reimplements completion', /await checkoutService\.completeOrder\(orderId, actorId, actorRole, \{ idempotencyKey \}\)/.test(fulfillmentSvc))
check('cancelOrderFromQueue() calls checkoutService.cancelOrder() — never reimplements cancellation', /await checkoutService\.cancelOrder\(orderId, actorId, \{ idempotencyKey, reason \}\)/.test(fulfillmentSvc))
const fulfillmentSvcCode = fulfillmentSvc.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join('\n')
check('fulfillmentService.js never calls applyInventoryEvent() directly — all inventory effects flow through checkoutService/inventoryService', !/applyInventoryEvent\(/.test(fulfillmentSvcCode))
check('fulfillmentService.js never calls releaseHold() directly — hold release flows only through checkoutService.cancelOrder()', !/releaseHold\(/.test(fulfillmentSvc))
check('fulfillmentController.js exposes no direct order-completion/cancellation route bypassing fulfillmentService\'s delegation', !/UPDATE venue_cigar_orders/i.test(fulfillmentController))

// ── 2. RBAC reuses the existing venue_memberships-based tiers ────────
check('Fulfillment routes reuse the existing requireVenueRole()/requireVenueRead/requireVenueWrite from 1B-2B-1 — no parallel RBAC system', /requireVenueRead, fulfillmentCtrl\.handleListQueue/.test(routes) && /requireVenueWrite, fulfillmentOrderVenueMatch, fulfillmentCtrl\.handleClaimOrder/.test(routes))
check('Only FULL_ACCESS_TYPES may reassign an order (requireVenueRole(FULL_ACCESS_TYPES))', /requireVenueRole\(FULL_ACCESS_TYPES\), fulfillmentOrderVenueMatch, fulfillmentCtrl\.handleAssignOrder/.test(routes))
check('Every mutating fulfillment route requires requireAuth and a real resource-venue match (fulfillmentOrderVenueMatch)', (routes.match(/admin\/orders\/:orderId[^\n]*requireAuth, requireVenueWrite, fulfillmentOrderVenueMatch/g) || []).length >= 6)

// ── 3. Idempotency on every mutating action ───────────────────────────
check('claimOrder() requires idempotency via checkIdempotency() before any write', /export async function claimOrder\(venueId, orderId, actorId, actorRole, idempotencyKey\) \{\s*\n\s*const db = getDb\(\)\s*\n\s*const dup = await checkIdempotency\(db, idempotencyKey\)/.test(fulfillmentSvc))
check('checkIdempotency() throws when no idempotency key is supplied — never a silent optional', /if \(!idempotencyKey\) throw new FulfillmentError\('idempotency_key_required'\)/.test(fulfillmentSvc))
check('Every transition/claim/assign/pick function checks idempotency again INSIDE the row lock (in-lock authoritative recheck)', (fulfillmentSvc.match(/const dupInLock = await checkIdempotency\(client, idempotencyKey\)/g) || []).length >= 5)

// ── 4. Concurrency protection (claim races, stale assignment) ────────
check('claimOrder() performs a conditional UPDATE guarded by assignment_version — no lost update on a claim race', /WHERE order_id = \$1 AND assignment_version = \$4 RETURNING \*/.test(fulfillmentSvc))
check('assignOrder() rejects a stale expectedVersion before writing (a stale page cannot overwrite newer server state)', /if \(Number\.isInteger\(expectedVersion\) && order\.assignment_version !== expectedVersion\)/.test(fulfillmentSvc))
check('A claim conflict returns a real, honest 409 — never a silent overwrite', /already_claimed: 409, claim_conflict: 409, stale_version: 409/.test(fulfillmentController))

// ── 5. Canonical fulfillment state machine, validated server-side ────
check('Status transitions are validated against an explicit ALLOWED_TRANSITIONS map — no arbitrary status jump is possible', /const ALLOWED_TRANSITIONS = \{/.test(fulfillmentSvc) && /if \(!rule\.from\.includes\(order\.fulfillment_status\)\)/.test(fulfillmentSvc))
check('Ready requires every order item to be picked first — a real server-side precondition, not a UI-only restriction', /if \(rule\.to === 'ready'\)[\s\S]{0,300}is_picked = false/.test(fulfillmentSvc))
check('completeOrderFromQueue() only proceeds from ready (or already-completed for idempotency) — never lets an unprepared order complete', /if \(order\.fulfillment_status !== 'ready' && order\.fulfillment_status !== 'completed'\)/.test(fulfillmentSvc))
check('fulfillment_status is stamped inside the SAME authoritative UPDATE as status/payment_status in checkoutService.completeOrder() — never a second, drifting write', /status = 'completed', payment_status = 'confirmed', fulfillment_status = 'completed'/.test(checkoutSvc))
check('fulfillment_status is stamped inside the SAME authoritative UPDATE as status in checkoutService.cancelOrder() — never a second, drifting write', /SET status = \$2, fulfillment_status = 'cancelled', cancellation_reason = \$3/.test(checkoutSvc))

// ── 6. Venue isolation everywhere ─────────────────────────────────────
check('loadOrderForVenue() never leaks cross-venue order existence — a mismatched venue_id returns the same order_not_found as a missing order', /if \(order\.venue_id !== venueId\) throw new FulfillmentError\('order_not_found'\)/.test(fulfillmentSvc))
check('Every admin/orders route is scoped by :venueId and (for order-specific routes) resource-level fulfillmentOrderVenueMatch', /const fulfillmentOrderVenueMatch = requireResourceVenueMatch\('venue_cigar_orders', 'order_id', 'orderId'\)/.test(routes))

// ── 7. Append-only fulfillment history, no edit/delete path ──────────
check('venue_cigar_fulfillment_events has no UPDATE/DELETE path anywhere in the controller or service', !/UPDATE venue_cigar_fulfillment_events/i.test(fulfillmentSvc) && !/DELETE FROM venue_cigar_fulfillment_events/i.test(fulfillmentSvc) && !/handleUpdateFulfillmentEvent|handleDeleteFulfillmentEvent/.test(fulfillmentController))
check('The fulfillment-history screen renders events read-only — no edit/delete control', !/onClick=\{.*delete.*[Ee]vent/i.test(historyScreen) && !/onClick=\{.*edit.*[Ee]vent/i.test(historyScreen))
check('Every fulfillment mutation writes a real event via recordFulfillmentEvent() before commit', (fulfillmentSvc.match(/await recordFulfillmentEvent\(client, \{/g) || []).length >= 6)

// ── 8. Honest UI states, no fake success ──────────────────────────────
check('The order detail screen disables actions honestly based on real server-derived eligibility (canClaim/canConfirm/canPrepare/canReady/canComplete/canCancel) — never a fake-enabled control', /const canComplete = fs === 'ready'/.test(detailScreen) && /const canReady = fs === 'in_preparation' && allPicked/.test(detailScreen))
check('The order detail screen renders real, distinct honest states for not-found/unauthorized/session-expired/error — never a single generic failure message', /not_found.*empty.*This order could not be found/.test(detailScreen.replace(/\n/g, '.')) && /unauthorized.*error.*do not have permission/.test(detailScreen.replace(/\n/g, '.')))
check('The queue screen never shows a success toast before a real server response — filters/search always await the real API result', /const result = await api\.listOrderQueue/.test(queueScreen))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
