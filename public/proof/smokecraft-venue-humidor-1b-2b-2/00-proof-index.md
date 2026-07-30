# Venue Humidor 1B-2B-2 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: dbb158ba

## Goal

Build only the real venue staff order and fulfillment queue on top of
the completed 1B-2A checkout/hold-conversion services and 1B-2B-1
inventory administration. No staff order queue duplication of
`checkoutService.completeOrder()`/`cancelOrder()`, no payment
integration, no full-route/five-viewport sweeps as new targeted scope.

## Routes added

`/smokecraft/admin/humidor/orders` (`VenueHumidorOrderQueue.jsx`),
`/smokecraft/admin/humidor/orders/:orderId` (`VenueHumidorOrderDetail.jsx`),
`/smokecraft/admin/humidor/orders/history` (`VenueHumidorFulfillmentHistory.jsx`).
All new, additive routes in `App.jsx` — no existing route touched.

## Queue result

Real, server-backed order table with order number, created/age,
fulfillment method, item/quantity counts, total, payment status,
fulfillment status, assigned staff — verified live that a real order
created via the real customer checkout flow appears in the queue.
Filters (status, unassigned, search) narrow the real returned dataset.

## Order-detail result

Real customer/fulfillment info, real order items joined with real
product data and live-computed availability, real totals breakdown,
and a fulfillment-action row whose every enabled/disabled state is
computed from the real server `fulfillment_status`/`assigned_staff_id`/
item-picked state — verified live.

## RBAC result

Owner/admin/manager: full access including reassignment. Staff:
queue/detail/claim/transition/complete/cancel, but not reassignment
(verified live: a staff reassignment attempt is denied 403). Mentor:
read-only — verified live that a mentor can read the queue but cannot
claim, complete, or cancel (403 on direct API calls, not just a hidden
button). No membership: denied (403).

## Claim and assignment result

Claiming an unassigned order succeeds and is visible to a second staff
session after refresh. A genuine two-tab claim race resolves to
exactly one success and one honest 409 conflict — verified live at
both the API (`Promise.all` concurrent claim) and in the browser (two
real authenticated sessions). Reassignment by a manager succeeds and
requires the caller's last-seen `assignment_version`; a stale version
is honestly rejected (409) — no lost update is possible.

## Fulfillment-state result

Transitions (new → confirmed → in_preparation → ready) are validated
against an explicit server-side transition map — verified live that
skipping straight to `ready` without confirm/prepare is rejected
(409), and that marking ready before all items are picked is rejected
(409 `items_not_picked`).

## Item-picking result

Real, whole-item "picked" boolean per order item (the backend has no
partial-quantity fulfillment concept, so this is honest, not faked
partial fulfillment) — verified live that marking an item picked
persists and that `ready` requires every item picked first.

## Completion result

`Complete Order` calls `fulfillmentService.completeOrderFromQueue()`,
which delegates the ENTIRE effect to
`checkoutService.completeOrder()` — verified live and via the
build-blocking validator that no second completion path exists
anywhere in `fulfillmentService.js` or its controller.

## Cancellation result

`Cancel Order` requires a real reason and delegates the ENTIRE effect
to `checkoutService.cancelOrder()` via
`fulfillmentService.cancelOrderFromQueue()` — verified live, including
UI-level required-reason validation and real hold-release on
cancellation of a pre-completion order.

## Inventory-integrity result

Real inventory decreases by exactly the ordered quantity on
completion (verified live at both API and browser level, including
before/after physical-quantity reads). Completing an order whose
product now has zero available inventory is honestly rejected (409
`insufficient_inventory`) — inventory is never driven negative.

## Idempotency result

Every mutating action (claim, assign, confirm, prepare, pick, ready,
complete, cancel) requires a real idempotency key, checked both
pre-lock and in-lock (authoritative recheck) — verified live that
duplicate completion/cancellation calls are idempotent no-ops, never
re-deducting or re-releasing inventory.

## Concurrency result

Two simultaneous claim attempts (shared order, different idempotency
keys): exactly one succeeds, one is honestly rejected. Two concurrent
completion requests sharing one idempotency key: inventory deducts
exactly once, both resolve to the identical completed order — verified
live via `Promise.all`.

## Venue-isolation result

Every fulfillment route is scoped by `:venueId` and (for order-
specific routes) a real resource-level venue match
(`fulfillmentOrderVenueMatch`) — verified live: a venue A staff member
cannot list, read, claim, or mutate a venue B order, even by pairing
a real venue A membership with a real venue B order id in the URL. A
mismatched venue returns the same `order_not_found` as a genuinely
missing order — never leaked cross-venue existence.

## Customer synchronization result

Verified live end-to-end: after staff completion, the real customer-
facing order screen shows `Completed` (never `Pending`); after staff
cancellation (with a real reason), the customer-facing screen shows
`Cancelled` (never `Active`) — both via a genuine page reload, not
optimistic local state.

## Event-history result

Real, append-only `venue_cigar_fulfillment_events` — verified live
that every mutation writes a real event, filters (order/event type/
actor) narrow the real returned dataset, and no edit/delete path
exists anywhere in the service, controller, or screen.

## Cross-device result

Two independent, real authenticated staff sessions (different login,
different browser context) observe identical authoritative order
state after a claim, verified live via refresh in both sessions.

## Responsive result

Five-viewport sweep regenerated against a fresh `dist` build covering
all 120 live routes (up from 117) — `validateSmokecraftResponsive.mjs`
passes 0 failed.

## Defects found and fixed

One bug caught in this pass's own new code before commit (via the 1A
regression suite, run as part of this pass's own required regression
sweep): `checkoutService.cancelOrder()`'s refund path initially tried
to stamp `fulfillment_status = 'refunded'`, violating the column's
real `CHECK` constraint (which has no `'refunded'` value). Fixed by
mapping the refund path onto the existing `'cancelled'`
`fulfillment_status` value. Recorded in
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` (no SC-D number — never reached
the committed baseline, per this operation's convention).

## Tests and build

- `verify-smokecraft-venue-humidor-1b2b2-api.mjs`: 40/40
- `verify-smokecraft-venue-humidor-1b2b2-browser.mjs`: 20/20
- `scripts/validateSmokecraftVenueHumidorFulfillmentAuthority.mjs`: 28/28
- `verify-smokecraft-venue-humidor-1a-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-browser.mjs` (regression): 23/23
- `verify-smokecraft-venue-humidor-1b2a-api.mjs` (checkout regression): 30/30
- `verify-smokecraft-venue-humidor-1b2b1-api.mjs` (admin regression): 41/41
- `scripts/validateSmokecraftVenueHumidorAdminAuthority.mjs` (regression): 22/22
- `npm run build` (full prebuild validator chain + Vite build): succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1b-2b-2/`

## What this pass does NOT cover

Customer pickup verification, table/lounge delivery confirmation,
staff handoff confirmation, pickup codes, no-show/expiration
automation, payment integration — explicitly out of scope per mandate.
A full five-viewport sweep was regenerated only because `npm run
build`'s own prebuild gate requires an up-to-date route-count-matched
inventory (route count now 120; not run as new targeted 1B-2B-2
scope).

## Venue Humidor next handoff

Venue Humidor 1B-2B-3 — Customer Pickup, Venue Service, and
Fulfillment Confirmation: customer pickup verification, table/lounge
delivery confirmation, staff handoff confirmation, customer receipt/
acknowledgment, Passport save after verified fulfillment, order-
history presentation, pickup codes/verification tokens, no-show and
expiration handling — built on this pass's completed
`fulfillment_status` state machine and the same
`checkoutService.completeOrder()`/`cancelOrder()` delegation pattern.
The `fulfillment_status` CHECK constraint already reserves `'expired'`
and `'blocked'` values; 1B-2B-3 should decide whether automatic
expiry (a real, driven transition rather than a computed-only
indicator) belongs there or in a dedicated scheduler, rather than
inventing a second status column.
