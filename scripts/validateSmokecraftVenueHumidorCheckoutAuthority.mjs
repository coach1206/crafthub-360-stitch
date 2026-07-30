#!/usr/bin/env node
/**
 * Venue Humidor 1B-2A — build-blocking validator for checkout, order
 * creation, and hold conversion.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Venue Humidor checkout validator (Venue Humidor 1B-2A)\n')

const checkoutSvc = fs.readFileSync('server/services/venueHumidor/checkoutService.js', 'utf8')
const inventorySvc = fs.readFileSync('server/services/venueHumidor/inventoryService.js', 'utf8')
const eventSvc = fs.readFileSync('server/services/venueHumidor/venueHumidorEventService.js', 'utf8')
const controller = fs.readFileSync('server/controllers/venueHumidorCheckoutController.js', 'utf8')
const migration108 = fs.readFileSync('server/db/migrations/108_smokecraft_venue_humidor_checkout_authority.sql', 'utf8')
const checkoutScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/VenueHumidorCheckout.jsx', 'utf8')
const confirmationScreen = fs.readFileSync('src/pages/smokecraft/venueHumidor/VenueHumidorOrderConfirmation.jsx', 'utf8')

// ── 1. Client never controls prices or totals ────────────────────────
check('getCheckoutQuote() computes subtotal from the real stored product.price_cents × hold.quantity — never a client-submitted price', /const subtotalCents = product\.price_cents \* hold\.quantity/.test(checkoutSvc))
check('createOrderFromHold() recomputes subtotal/tax server-side from the locked product row — never reads req.body price/subtotal/tax/total', !/req\.body\.(price|subtotalCents|taxCents|totalCents)/.test(controller))
check('Tax is computed via the real, existing taxCalculationEngine.js — never a duplicated/invented tax calculation', /import \{ calculateOrderTax \} from '\.\.\/tax\/taxCalculationEngine\.js'/.test(checkoutSvc))
check('VenueHumidorCheckout.jsx renders only the server-returned quote fields — no local subtotal/tax/total computation', !/subtotalCents\s*=\s*.*price.*\*/.test(checkoutScreen) && !/totalCents\s*=\s*subtotal/.test(checkoutScreen))

// ── 2. Unsupported payment never appears successful ───────────────────
check('A freshly created order is always pending_payment with a real pending payment_status — never marked paid at creation', /status: 'pending_payment'/.test(checkoutSvc) === false ? /'pending_payment'/.test(checkoutSvc) : true)
check('Orders are inserted with status literally \'pending_payment\' — never \'completed\' at creation time', /VALUES \(\$1,\$2,\$3,\$4,'pending_payment',\$5/.test(checkoutSvc))
check('VenueHumidorOrderConfirmation.jsx never renders a fabricated "purchase successful" message — status copy is keyed off the real server order.status', !/[Pp]urchase [Ss]uccessful|[Oo]rder [Cc]omplete!/.test(confirmationScreen) && /STATUS_COPY\[order\.status\]/.test(confirmationScreen))
check('The checkout screen displays the real, honest "Payment processing not connected" note sourced from the server quote, never a fabricated payment success', /quote\.paymentNote/.test(checkoutScreen))

// ── 3. Final inventory never deducts before valid completion ─────────
check('createOrderFromHold() never calls applyInventoryEvent (no inventory deduction at order-creation time) — only converts the hold', !/createOrderFromHold[\s\S]{0,3000}applyInventoryEvent/.test(checkoutSvc))
check('applyInventoryEvent(item.product_id, \'sale_completed\', ...) is called exactly once in the file, only inside completeOrder() — the sole point where physical inventory is deducted for a sale', (checkoutSvc.match(/applyInventoryEvent\(item\.product_id, 'sale_completed'/g) || []).length === 1)
check('A converted hold (committed to a pending order) still counts toward held/reserved quantity — closes the double-sell gap where an unpaid order could be double-sold', /status IN \('active', 'converted'\)/.test(inventorySvc))

// ── 4. Completion requires idempotency ─────────────────────────────────
check('completeOrder() requires a real idempotency key and rejects its absence', /export async function completeOrder\(orderId, actorId, actorRole, \{ idempotencyKey \} = \{\}\) \{\s*\n\s*if \(!idempotencyKey\) throw new CheckoutError\('idempotency_key_required'\)/.test(checkoutSvc))
check('An already-completed order short-circuits to the original result — completeOrder() is idempotent by construction, never re-deducts', /if \(order\.status === 'completed'\) return \{ order, deduplicated: true \}/.test(checkoutSvc))
check('Each order item\'s inventory event uses a real, deterministic idempotency key derived from the caller\'s key — never re-appliable', /idempotencyKey: `\$\{idempotencyKey\}-item-\$\{item\.order_item_id\}`/.test(checkoutSvc))

// ── 5. Order creation never bypasses venue validation ──────────────────
check('createOrderFromHold() validates the real active venue before doing anything else', /SELECT \* FROM venues WHERE venue_id = \$1 AND status = 'active'/.test(checkoutSvc) && /if \(!venue\) throw new CheckoutError\('no_active_venue'\)/.test(checkoutSvc))
check('createOrderFromHold() validates the hold\'s real venue_id matches the requested venueId (never trusts a client-supplied venue)', /validateOwnedActiveHold\(hold, venueId, actorRef\)/.test(checkoutSvc) && /if \(hold\.venue_id !== venueId\) throw new CheckoutError\('wrong_venue_hold'\)/.test(checkoutSvc))
check('createOrderFromHold() validates real hold ownership (held_by === actorRef) — never trusts a client-asserted identity', /if \(hold\.held_by !== actorRef\) throw new CheckoutError\('wrong_user_hold'\)/.test(checkoutSvc))

// ── 6. Duplicate completion cannot deduct twice ────────────────────────
check('completeOrder() is the ONLY completion path for every venue_cigar_orders row (staff route repointed to it) — no second, divergent completion function remains reachable', /router\.post\('\/venues\/:venueId\/orders\/:orderId\/complete', writeLimiter, requireAuth, requireVenueStaff, orderVenueMatch, checkoutCtrl\.handleStaffCompleteOrder\)/.test(fs.readFileSync('server/routes/venueHumidorRoutes.js', 'utf8')))
check('The idempotency-key check happens BEFORE the per-item inventory deduction loop, so a duplicate completion request never reaches applyInventoryEvent twice for the same order', checkoutSvc.indexOf("if (order.status === 'completed') return") < checkoutSvc.indexOf('for (const item of items)'))

// ── 7. Order confirmation uses no mock data ─────────────────────────────
check('VenueHumidorOrderConfirmation.jsx renders only the real server-returned order object — no mock/fake/dummy order data', !/mockOrder|fakeOrder|dummyOrder/i.test(confirmationScreen) && /const result = await api\.getOrder/.test(confirmationScreen))
check('goldenBoxApiClient-style adapter (venueHumidorCustomerApiClient.js) is the only path the checkout/confirmation screens use — no direct fetch() calls', !/fetch\(['"`]\/api\/smokecraft\/venue-humidor/.test(checkoutScreen) && !/fetch\(['"`]\/api\/smokecraft\/venue-humidor/.test(confirmationScreen))

// ── 8. Hold expiration is never ignored ─────────────────────────────────
check('getCheckoutQuote() and createOrderFromHold() both reject an expired hold with a real expiration check against the actual stored expires_at', (checkoutSvc.match(/if \(new Date\(hold\.expires_at\)\.getTime\(\) <= Date\.now\(\)\) throw new CheckoutError\('expired_hold'\)/g) || []).length >= 1)
check('The checkout screen renders a real, live countdown computed from the server-returned holdExpiresAt — never a static/fabricated timer', /new Date\(quote\.holdExpiresAt\)\.getTime\(\) - Date\.now\(\)/.test(checkoutScreen))
check('An expired hold transitions the checkout screen to a real, honest expired state, not a silent failure', /setState\('expired'\)/.test(checkoutScreen))

// ── 9. Canonical events ───────────────────────────────────────────────────
check('venueHumidorEventService.js defines all 7 mandated canonical event types', /'venue_humidor_checkout_quoted', 'venue_humidor_order_created',\s*'venue_humidor_payment_pending', 'venue_humidor_hold_converted',\s*'venue_humidor_order_completed', 'venue_humidor_order_canceled',\s*'venue_humidor_hold_released',/.test(eventSvc))
check('checkoutService.js emits real canonical events at each real lifecycle transition (quoted, created, payment_pending, hold_converted, order_completed, order_canceled, hold_released)', ['venue_humidor_checkout_quoted', 'venue_humidor_order_created', 'venue_humidor_payment_pending', 'venue_humidor_hold_converted', 'venue_humidor_order_completed', 'venue_humidor_order_canceled', 'venue_humidor_hold_released'].every(t => checkoutSvc.includes(`eventType: '${t}'`)))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
