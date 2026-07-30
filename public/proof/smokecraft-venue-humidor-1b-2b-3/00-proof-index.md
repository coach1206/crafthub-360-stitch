# Venue Humidor 1B-2B-3 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 6eb978d1

## Goal

Build only the real customer pickup, table/lounge service, staff
handoff confirmation, and final fulfillment verification layer for
Venue Humidor orders, on top of the completed staff order and
fulfillment queue. No second completion/cancellation path, no direct
inventory deduction during handoff, no fabricated Passport save.

## Routes added

`/smokecraft/admin/humidor/orders/:orderId/handoff` (staff,
`VenueHumidorHandoff.jsx`) and `/smokecraft/orders/:orderId/pickup`
(customer, `VenueHumidorPickup.jsx`) — the two routes explicitly
required by the mandate. `VenueHumidorOrderDetail.jsx` gained new
in-place controls (no new route) for block/unblock/no-show/expire.

## Customer pickup result

Real, redacted order data (venue name, fulfillment method, items,
total, honest per-fulfillment-status messaging) — verified live that
the screen shows a real pre-ready state, the real Ready state once
staff prepare the order, and the real Completed/Cancelled/Expired
state after the corresponding staff action, always via genuine reload
or auto-refresh, never optimistic local state.

## Venue service result

Table/lounge delivery handoff confirmed via staff visual confirmation
(no pickup code required for these methods, matching the mandate's
"require staff handoff confirmation, recipient confirmation where
supported") — verified live end-to-end including real completion and
real inventory deduction.

## Verification result

A real 6-digit code, bcrypt-hashed (never stored or logged in
plaintext), venue- and order-scoped, expiring (24h), rate-limited (5
attempts before auto-block) — verified live: correct code succeeds,
incorrect code is honestly rejected, expired code is honestly
rejected, wrong-venue verification attempt is denied, exceeding the
attempt limit auto-blocks the order server-side, and the code becomes
unusable immediately after the order completes.

## Handoff result

Staff must confirm handoff (recording real actor/timestamp/location/
notes) before an order may complete — verified live that completion
without any handoff is honestly denied (`handoff_required`), and that
handoff for a `counter_pickup` order without prior code verification
is honestly denied (`verification_required`).

## Blocked-state result

A blocked order cannot be completed — verified live. Staff (non-full-
access) can block but cannot unblock; only owner/admin/manager can
unblock, requiring a real resolution and preserving the original
block event (append-only, never erased). Repeated verification
failures past the limit auto-block the order.

## Expired-state result

Only owner/admin/manager may expire an eligible order. Expiration
delegates the entire inventory effect exclusively to
`checkoutService.cancelOrder()` — verified live that real availability
is neither double-restored nor left un-restored — then stamps the
real reserved `'expired'` `fulfillment_status` value as a follow-up
write to the column `fulfillmentService.js` already exclusively owns
(never touching `status`/`payment_status`). An expired order cannot
later be completed.

## No-show result

Staff can mark an eligible ready order as a real, append-only
operational event (never a fabricated terminal status) — verified
live that the event records real actor/timestamp/notes, and that
pickup-window extension (a manager-only action) persists a real new
promised time.

## Completion result

`completeOrderFromQueue()` now requires a real `handoff_at` (and, for
`counter_pickup`, a real `verified_at`) before delegating the entire
completion effect to `checkoutService.completeOrder()` — verified live
and via the build-blocking validator that no second completion
implementation exists anywhere.

## Cancellation result

Unchanged from 1B-2B-2 — still delegates entirely to
`checkoutService.cancelOrder()`; verified live that a blocked/expired/
completed order remains correctly ineligible.

## Passport result

A minimal, honest Passport-acquisition boundary
(`venue_cigar_passport_acquisitions`), written ONLY inside
`checkoutService.completeOrder()`, guarded by a real
`UNIQUE (order_item_id)` constraint — verified live that a completed
order has exactly one real acquisition row with real customer/venue/
quantity data, and that cancelled/expired orders have zero rows.
Confirmed by audit that no prior purchase-completion flow in the
codebase wrote to any passport/collection table — this is genuinely
new, minimal surface, not a duplicate of an existing system.

## RBAC result

Verified live: owner/admin/manager (full access) can unblock, expire,
and extend the pickup window; staff (write access) can verify,
confirm handoff, mark no-show, and complete/cancel eligible orders but
cannot unblock/expire/extend; mentor (read access) is denied every
mutation via direct API call, not just a hidden UI button.

## Inventory-integrity result

Verified live: real inventory decreases by exactly the ordered
quantity on completion (both pickup and table-service paths);
expiration never double-restores or fails to restore; concurrent
completion requests deduct exactly once.

## Idempotency result

Every mutating action (verify, handoff, no-show, extend, expire,
complete, cancel) requires a real idempotency key, checked pre-lock
and in-lock — verified live that duplicate completion calls are
idempotent.

## Concurrency result

Verified live via the 1B-2B-2 regression's concurrent-completion test
(still passing under the new handoff precondition) and the new
claim/assignment version-guarded concurrency inherited unchanged from
1B-2B-2.

## Venue-isolation result

Verified live: a code cannot be verified against the wrong venue path
(denied 403/404); direct cross-venue API attempts on verify/handoff/
expire are all denied.

## Customer synchronization result

Verified live end-to-end for Ready, Completed, Cancelled, and Expired
— the customer pickup screen never shows an active order as
pending after real completion, and never shows a cancelled/expired
order as active.

## Event-history result

Real, append-only `venue_cigar_fulfillment_events` widened to cover
verification/handoff/no-show/expiration/Passport event types — no
edit or delete path exists anywhere. Verified live that a completed
order's history includes real `verification_generated`,
`verification_passed`, `handoff_confirmed`, and `order_completed`
events.

## Responsive result

Five-viewport sweep regenerated against a fresh `dist` build covering
all 122 live routes (up from 120) — `validateSmokecraftResponsive.mjs`
passes 0 failed.

## Defects found and fixed

None in previously-locked behavior. Several bugs were caught in this
pass's own new code before commit, via its own required tests: a
missing regex closing slash in a Playwright text-selector; an ASI
parsing bug from a bare parenthesized ternary on its own line; and a
React dev-mode `border`/`borderColor` shorthand-mix warning. None
reached the committed baseline, so none receive an SC-D number.

## Tests and build

- `verify-smokecraft-venue-humidor-1b2b3-api.mjs`: 31/31
- `verify-smokecraft-venue-humidor-1b2b3-browser.mjs`: 18/18
- `scripts/validateSmokecraftVenueHumidorPickupAuthority.mjs`: 27/27
- `verify-smokecraft-venue-humidor-1a-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-browser.mjs` (regression): 23/23
- `verify-smokecraft-venue-humidor-1b2a-api.mjs` (checkout regression): 30/30
- `verify-smokecraft-venue-humidor-1b2a-browser.mjs` (checkout regression): 16/16
- `verify-smokecraft-venue-humidor-1b2b1-api.mjs` (admin regression): 41/41
- `verify-smokecraft-venue-humidor-1b2b1-browser.mjs` (admin regression): 15/15
- `scripts/validateSmokecraftVenueHumidorAdminAuthority.mjs` (regression): 22/22
- `verify-smokecraft-venue-humidor-1b2b2-api.mjs` (fulfillment regression, updated for real handoff precondition): 40/40
- `verify-smokecraft-venue-humidor-1b2b2-browser.mjs` (fulfillment regression, updated): 20/20
- `scripts/validateSmokecraftVenueHumidorFulfillmentAuthority.mjs` (regression): 28/28
- `npm run build` (full prebuild validator chain + Vite build): succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1b-2b-3/`

## Final verification report

All 31 live-verification steps from the mandate's section 24 were
exercised via the real running server and real Playwright browser
sessions (no mocking): eligible order → staff prep → ready → customer
pickup screen → staff handoff screen → invalid verification (recorded)
→ valid verification → handoff confirmed → completion via
`checkoutService.completeOrder()` → inventory changed exactly once →
customer screen shows completed → pickup code invalidated → Passport
row created exactly once → reload persistence on all screens →
second order → no-show → pickup-window extension → third order →
block → completion denied → manager unblock → fourth order → expire
→ hold/reservation resolved correctly → cross-venue verification
denied → concurrent completion resolves to exactly one success →
append-only history confirmed.

## Venue Humidor next handoff

Venue Humidor 1B-2B-4 — Customer Order History, Passport Acquisition,
Receipts, and Post-Purchase Experience: a customer-facing order-
history list surface, a real receipt/acknowledgment view built on the
`venue_cigar_passport_acquisitions` boundary this pass created, and
richer post-purchase presentation. `venue_cigar_passport_acquisitions`
already has real venue/customer/product/quantity/timestamp data ready
to read from — 1B-2B-4 should build a read surface over it rather than
inventing a second acquisition record.
