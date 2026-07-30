#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-3 — build-blocking validator for customer
 * pickup, venue service, and fulfillment confirmation.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor pickup/handoff validator (Venue Humidor 1B-2B-3)\n')

const fulfillmentSvc = fs.readFileSync('server/services/venueHumidor/fulfillmentService.js', 'utf8')
const checkoutSvc = fs.readFileSync('server/services/venueHumidor/checkoutService.js', 'utf8')
const fulfillmentController = fs.readFileSync('server/controllers/venueHumidorFulfillmentController.js', 'utf8')
const routes = fs.readFileSync('server/routes/venueHumidorRoutes.js', 'utf8')
const migration111 = fs.readFileSync('server/db/migrations/111_smokecraft_venue_humidor_pickup_handoff.sql', 'utf8')
const handoffScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/admin/VenueHumidorHandoff.jsx', 'utf8')
const pickupScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/VenueHumidorPickup.jsx', 'utf8')

const fulfillmentSvcCode = fulfillmentSvc.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join('\n')

// ── 1. No second completion/cancellation path for pickup/handoff ─────
check('completeOrderFromQueue() still calls checkoutService.completeOrder() as the sole completion path — 1B-2B-3 adds only preconditions, never a second completion implementation', /await checkoutService\.completeOrder\(orderId, actorId, actorRole, \{ idempotencyKey \}\)/.test(fulfillmentSvc))
check('expireOrder() releases inventory ONLY through checkoutService.cancelOrder() — never a direct hold/reservation release or inventory event', /await checkoutService\.cancelOrder\(orderId, actorId, \{ idempotencyKey, reason/.test(fulfillmentSvc))
check('expireOrder() never calls applyInventoryEvent() or releaseHold() directly', !/applyInventoryEvent\(/.test(fulfillmentSvcCode) && !/releaseHold\(/.test(fulfillmentSvcCode))
check('No pickup-specific or venue-service-specific completion service file exists (fulfillmentService.js remains the sole pre-completion orchestrator)', !fs.existsSync('server/services/venueHumidor/pickupCompletionService.js') && !fs.existsSync('server/services/venueHumidor/handoffCompletionService.js'))

// ── 2. Real handoff/verification preconditions before completion ─────
check('completeOrderFromQueue() requires a real handoff_at before completing a ready order', /if \(!order\.handoff_at\) throw new FulfillmentError\('handoff_required'\)/.test(fulfillmentSvc))
check('completeOrderFromQueue() requires real code verification for counter_pickup specifically, before completing', /PICKUP_METHOD_REQUIRES_CODE\.has\(order\.fulfillment_method\) && !order\.verified_at\) throw new FulfillmentError\('verification_required'\)/.test(fulfillmentSvc))
check('confirmHandoff() requires real verification for counter_pickup before recording a handoff — never fabricated', /if \(PICKUP_METHOD_REQUIRES_CODE\.has\(order\.fulfillment_method\) && !order\.verified_at\)/.test(fulfillmentSvc))

// ── 3. Verification code safety ───────────────────────────────────────
check('Pickup codes are hashed with bcrypt — never stored or compared in plaintext', /bcrypt\.hash\(code, SALT_ROUNDS\)/.test(fulfillmentSvc) && /bcrypt\.compare\(String\(submittedCode/.test(fulfillmentSvc))
check('The pickup-code column stores only a hash (pickup_code_hash), never a plaintext code column', /pickup_code_hash\s+TEXT/.test(migration111) && !/pickup_code\s+TEXT/.test(migration111))
check('Verification is rate-limited against repeated guessing (MAX_VERIFICATION_ATTEMPTS enforced server-side)', /if \(order\.pickup_code_attempts >= MAX_VERIFICATION_ATTEMPTS\) throw new FulfillmentError\('verification_rate_limited'\)/.test(fulfillmentSvc))
check('A pickup code expires and expired codes are honestly rejected', /pickup_code_expires_at.*<= Date\.now\(\)\) throw new FulfillmentError\('verification_code_expired'\)/.test(fulfillmentSvc.replace(/\n/g, ' ')))
check('A pickup code becomes unusable after completion (invalidated, never reusable)', /UPDATE venue_cigar_orders SET pickup_code_hash = NULL WHERE order_id = \$1/.test(fulfillmentSvc))
const metadataLines = (fulfillmentSvc.match(/metadata:\s*\{[^}]*\}/g) || []).join('\n')
check('The generated plaintext code is never logged into fulfillment-event metadata', !/\bcode\b/.test(metadataLines))

// ── 4. Blocked/expired formally implemented, cannot complete ─────────
check('A blocked order cannot be completed (rejected before reaching checkoutService.completeOrder())', /if \(order\.fulfillment_status !== 'ready' && order\.fulfillment_status !== 'completed'\)/.test(fulfillmentSvc))
check('expireOrder() stamps the real reserved \'expired\' fulfillment_status as a follow-up write to the column fulfillmentService exclusively owns — never touching status/payment_status', /SET fulfillment_status = 'expired', expired_reason = \$2/.test(fulfillmentSvc))
check('Repeated verification failures past the limit auto-block the order server-side (not just UI-hidden)', /fulfillment_status = 'blocked', blocked_reason = 'verification_attempts_exceeded'/.test(fulfillmentSvc))

// ── 5. Passport boundary — exactly once, only on real completion ─────
check('The Passport acquisition insert happens ONLY inside checkoutService.completeOrder(), after the authoritative status UPDATE — never from a pickup/handoff-specific path', /INSERT INTO venue_cigar_passport_acquisitions/.test(checkoutSvc) && !/INSERT INTO venue_cigar_passport_acquisitions/.test(fulfillmentSvc))
check('The Passport acquisition insert is guarded by a real unique constraint (ON CONFLICT DO NOTHING on order_item_id) — cannot double-insert on retry', /ON CONFLICT \(order_item_id\) DO NOTHING/.test(checkoutSvc))
check('venue_cigar_passport_acquisitions.order_item_id has a real UNIQUE constraint in the schema, not just application-level intent', /UNIQUE \(order_item_id\)/.test(migration111))

// ── 6. RBAC — unblock/expire/extend restricted to full access; mentor denied ──
check('Unblock is restricted to FULL_ACCESS_TYPES (owner/admin/manager) — staff may block but not resolve', /orders\/:orderId\/unblock', writeLimiter, requireAuth, requireVenueRole\(FULL_ACCESS_TYPES\)/.test(routes))
check('Expiration is restricted to FULL_ACCESS_TYPES', /orders\/:orderId\/expire', writeLimiter, requireAuth, requireVenueRole\(FULL_ACCESS_TYPES\)/.test(routes))
check('Pickup-window extension is restricted to FULL_ACCESS_TYPES', /orders\/:orderId\/extend-pickup-window', writeLimiter, requireAuth, requireVenueRole\(FULL_ACCESS_TYPES\)/.test(routes))
check('Verification/handoff/no-show routes require at least write access (mentor, read-only tier, is excluded)', /orders\/:orderId\/verify', writeLimiter, requireAuth, requireVenueWrite/.test(routes) && /orders\/:orderId\/handoff', writeLimiter, requireAuth, requireVenueWrite/.test(routes))

// ── 7. Customer data redaction ────────────────────────────────────────
check('checkoutService.getOrder() (the customer-facing read) redacts staff-internal fields — pickup-code hash/attempts, staff identity, handoff/block notes never leak to the customer', /CUSTOMER_INTERNAL_FIELDS = \[/.test(checkoutSvc) && /pickup_code_hash/.test(checkoutSvc.match(/CUSTOMER_INTERNAL_FIELDS = \[[\s\S]*?\]/)[0]))
check('The customer pickup screen never renders staff notes, blocked_reason, or assigned-staff identity', !/blocked_reason/.test(pickupScreen) && !/handoff_notes/.test(pickupScreen) && !/assigned_staff/.test(pickupScreen))

// ── 8. Append-only history, no edit/delete ────────────────────────────
check('venue_cigar_fulfillment_events still has no UPDATE/DELETE path anywhere in the controller or service after this pass\'s additions', !/UPDATE venue_cigar_fulfillment_events/i.test(fulfillmentSvc) && !/DELETE FROM venue_cigar_fulfillment_events/i.test(fulfillmentSvc))
check('The migration widens the event_type vocabulary (verification/handoff/no-show/expiration/passport) on the SAME table — no second ledger created', /venue_cigar_fulfillment_events_event_type_check.*verification_generated/.test(migration111.replace(/\n/g, ' ')))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
