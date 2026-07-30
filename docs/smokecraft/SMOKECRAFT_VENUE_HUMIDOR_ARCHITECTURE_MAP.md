# SmokeCraft Venue Humidor — Architecture Map

Venue Humidor 1A — backend foundation only (schema, inventory service,
venue isolation, RBAC). No customer, checkout, or admin screens exist
yet — see the 1B handoff.

## Existing systems audited and reused

- **Venue identity**: `venues` / `venue_memberships` (migration 010).
  Every Venue Humidor table's `venue_id` is a real FK to `venues(venue_id)`
  — no parallel venue concept was invented. Staff RBAC reuses
  `venue_memberships.membership_type IN ('staff','manager','admin','owner')`
  with `status = 'active'`, matching the exact venue-scope check
  pattern already established and proven in Golden Box's
  `judgingService.assignJudge()` (Holistic Fix 5C-2A).
- **Authentication and RBAC**: `requireAuth` / `requireRole`
  (`server/middleware/authMiddleware.js`, `roleMiddleware.js`) — reused
  unchanged. A new venue-scoped `requireVenueStaff()` middleware
  (`venueHumidorRoutes.js`) additionally validates real
  `venue_memberships` for the exact `:venueId` in the route path — a
  platform admin (`requireRole('admin')`-equivalent) bypasses the
  membership check; every other authenticated user must have a real,
  active membership row for that specific venue.
- **POS360/tab services** (`pos360OrderBridgeService.js`,
  `pos360ItemMappingService.js`, etc.): audited, not reused directly —
  they bridge to an external POS provider for a different commerce
  surface (bar/restaurant tabs). Venue Humidor cigar inventory is a
  first-party, database-authoritative system; no dependency on POS360
  was introduced this pass.
- **Passport services**: audited (`passportService.js`,
  `passport360SmokeCraftPersistenceService.js`) — not touched this
  pass (no customer-facing reward integration in 1A's scope).
- **Pairing engine**: audited (`pairingEngineRoutes.js`) — not touched
  this pass (no customer-facing recommendation integration in 1A's
  scope).
- **Inventory systems**: `inventoryAvailabilityService.js` and related
  files under `server/services/inventory/` are an in-memory, "preview-
  safe," multi-craft-module prototype (never database-backed, explicitly
  documented as non-authoritative). Venue Humidor does NOT reuse this
  module — it needs a real, transactional, database-backed inventory
  ledger for real cigar stock, which did not exist anywhere in this
  codebase before this pass.
- **Order/payment services**: `orderLifecycleService.js` and
  `orderTotalsService.js` under `server/services/order/` are audited —
  they model a different order domain (not cigar-specific,
  no per-product inventory decrement). Not reused directly; Venue
  Humidor's own `venueCigarOrderService.js` is a small, cigar-specific
  order/sale-completion service built this pass, following the same
  transactional/idempotent conventions.
- **Audit/event infrastructure**: reused the exact append-only,
  idempotency-key-guarded event-ledger pattern established by
  `golden_box_activity_log` / `golden_box_result_finalizations` /
  `golden_box_award_issuances` — `venue_cigar_inventory_events` is the
  append-only ledger; every mutation requires a caller-supplied
  idempotency key, checked with a real `UNIQUE` partial index.
- **Database conventions**: `BIGSERIAL` primary key + `UUID` public
  identifier (`gen_random_uuid()`), `TEXT venue_id` FK to
  `venues(venue_id)`, `CHECK` constraints for enums and non-negative
  quantities, partial `UNIQUE` indexes for nullable idempotency keys —
  all directly reused from the Golden Box migrations (077, 102-105).

## New schema (migration 106)

`venue_cigar_products`, `venue_cigar_inventory_events` (append-only),
`venue_cigar_inventory_holds` (short-lived, expiring), 
`venue_cigar_reservations` (longer-lived, staff-created),
`venue_cigar_orders`, `venue_cigar_order_items`. See the migration file
for full column/constraint detail.

## Inventory calculation

```
available_quantity = physical_quantity
                    - unavailable_quantity
                    - SUM(active holds' quantity)
                    - SUM(active reservations' quantity)
```

Computed on read (`inventoryService.getProductAvailability()`), never
cached/duplicated — the same "never overwrite with a stale aggregate"
principle Golden Box's `golden_box_results` follows relative to
individual judge scores.

## Mutation model

Every inventory-affecting operation goes through
`inventoryService.applyInventoryEvent()` (receiving, box_opened,
stick_added, stick_removed, damage, loss, complimentary, return,
count_correction, sale_completed, cancellation_restored) or the
dedicated hold/reservation functions (`createHold`, `expireHold`,
`releaseHold`, `createReservation`, `cancelReservation`,
`fulfillReservation`). Every one of these:

1. Runs inside one database transaction.
2. Locks the product row (`SELECT ... FOR UPDATE`) before computing
   the new quantity — never a read-then-write race.
3. Rejects any mutation that would drive `physical_quantity` negative
   (`insufficient_inventory` error, transaction rolled back).
4. Requires a caller-supplied idempotency key — checked once before
   the lock (fast path) and once more after acquiring it (authoritative
   recheck, closes the two-tab race a pre-lock-only check would still
   allow) — the same pattern established throughout the Golden Box
   passes.
5. Writes exactly one append-only `venue_cigar_inventory_events` row.
6. Returns the final, authoritative product quantities — never a
   client-echoed value.

## Venue isolation

Every read/write query is scoped by a real `venue_id` parameter — no
query aggregates across venues. `requireVenueStaff()` additionally
validates that the caller has a real, active membership for the exact
venue in the route path before any mutation is attempted — a
client-supplied `venueId` is never trusted on its own.

## Venue Humidor 1B-1 update — customer browsing and cigar detail

Migration 107 (additive) extends `venue_cigar_products` with customer-
facing display fields (country, body, flavor_notes, smoke_time_minutes,
experience_level, length/ring gauge, binder/filler, box price/quantity,
images, venue description, staff notes, is_staff_pick, is_archived,
is_customer_visible) and adds `venue_cigar_favorites`
(`UNIQUE(guest_reference, product_id)`).

`customerCatalogService.js` is the read/write surface for browsing:
`validateActiveVenue()` re-validates a real, active venue before any
catalog data is returned — a client-supplied `venueId` is never
trusted alone. `browseCatalog()` builds every search/filter/sort as a
real parameterized SQL condition (never a client-side-only cosmetic
filter) and excludes archived/non-customer-visible products
unconditionally, hiding sold-out by default. `getCigarDetail()`
re-validates the product's real venue ownership (`WHERE venue_id = $1
AND product_id = $2`) — a wrong-venue product id returns an honest
404, never leaked data.

Customer actions (Add One Stick, Purchase Box, Reserve) create real
holds/reservations through the exact same `inventoryService.js`
primitives built in 1A — no parallel inventory mechanism. Add to
Venue Tab and Request Table/Seat Delivery are honest `501`
unavailable-boundary responses (no POS integration exists yet) —
never a fabricated success. Favorites are a small, real, idempotent
persistence table, reloaded from the server on every mount (not local-
only optimistic state).

Routes are mounted at `/api/smokecraft/venue-humidor/customer`,
reusing the same SmokeCraft guest-identity middleware Golden Box
already uses — no second, competing guest-identity scheme.

## Explicitly out of scope for this pass

Checkout, staff admin screens, order fulfillment, POS/Passport
integration, full-route/five-viewport sweeps as new targeted work
(the pre-existing five-viewport proof was regenerated only because the
build's own prebuild gate requires an up-to-date route count, not as
new 1B-1 scope) — see the Venue Humidor 1B-2 handoff in
`public/proof/smokecraft-venue-humidor-1b-1/00-proof-index.md`.

## Venue Humidor 1B-2A update — checkout, order creation, hold conversion

Migration 108 (additive) extends `venue_cigar_orders` with real
checkout-authority columns: `order_number`, `hold_id`/`reservation_id`
(real FKs), `fulfillment_method`/`fulfillment_details`,
`customer_notes`, `tax_cents`/`service_charge_cents`/`discount_cents`/
`tip_cents`, `currency`, `age_verification_required`/`age_verified`,
`payment_status`, `product_snapshot`/`pairing_snapshot`.

`checkoutService.js` is the new, sole owner of checkout-quote
computation and hold-to-order conversion. `getCheckoutQuote()` and
`createOrderFromHold()` compute price/tax/total entirely server-side
from the locked hold and product rows — a client-submitted price,
subtotal, tax, or total is never read or trusted. Tax is computed via
the real, pre-existing `taxCalculationEngine.js` (reused, not
duplicated). Fulfillment options are sourced from the real
`venues.settings` JSONB column (reused, not a new config store),
merged over a documented default-support map; POS360 tab options are
unsupported by default, matching the honest `501` boundary already
established for "Add to Venue Tab" in 1B-1.

`createOrderFromHold()` converts the hold to `'converted'` and creates
a real `pending_payment` order but never deducts physical inventory —
inventory is deducted exactly once, only inside `completeOrder()`, on
valid staff/payment/POS completion. `completeOrder()` is now the
single completion path for every `venue_cigar_orders` row regardless
of creation path (the pre-existing 1A staff complete/cancel routes
were repointed to it) — no second, divergent completion function
remains reachable for the same table.

Two real defects were found and closed via the mandate's own required
concurrency tests — see SC-D065 (double-sell via converted-hold
undercounting) and SC-D066 (idempotency-ordering race) in
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`.

Two new customer screens: `VenueHumidorCheckout.jsx`
(`/smokecraft/venue-humidor/checkout`) and
`VenueHumidorOrderConfirmation.jsx`
(`/smokecraft/venue-humidor/order/:orderId`), built in the same
`SmokeCraftScreenShell` navy/gold system as 1B-1's screens — no
existing approved screen was touched. Payment processing is not
connected; both screens display an honest "Payment processing not
connected" boundary and never claim a successful purchase unless the
authoritative server order status is `completed`.

Explicitly out of scope for this pass (per mandate): staff inventory
administration, the full staff fulfillment queue, simulated card
payment, full-route/five-viewport sweeps as new targeted work (the
five-viewport proof was regenerated only because the build's own
prebuild gate requires an up-to-date route count).

## Venue Humidor 1B-2B-1 update — staff inventory administration

Migration 109 (additive) extends `venue_cigar_products` with staff
admin display/classification fields: `cost_cents`, `product_line`,
`region`, `tags`, `supplier_name`/`supplier_sku`, `humidor_zone`/
`storage_location`, `is_venue_exclusive`, `sealed_box_count`/
`opened_box_count`. No new inventory-event types were needed — the
106 `venue_cigar_inventory_events.event_type` CHECK constraint already
covered every admin mutation action this pass required (receiving,
box_opened, stick_added, stick_removed, damage, loss, complimentary,
return, count_correction).

`productService.js` (the existing, sole 1A product-catalog service) is
extended — not duplicated — with `updateProduct()` (full field-level
validated edit), `listProductsForAdmin()` (dashboard read with live
availability per row, reusing `computeAvailableQuantity()`), and
`updateProductClassification()` (the single entry point for archive/
restore/activate/deactivate/visibility/featured/staff-pick/limited-
release/venue-exclusive). Quantity-affecting mutations flow
exclusively through 1A's `inventoryService.applyInventoryEvent()` via
a new thin controller (`venueHumidorAdminController.js`) that computes
a delta from the requested action (or, for count correction, from the
real current row) and forwards it — it never computes or trusts a
final resulting quantity.

Four new staff screens (`VenueHumidorAdminDashboard.jsx`,
`VenueHumidorAdminProductForm.jsx` shared by `/new` and `/:cigarId/edit`,
`VenueHumidorAdminInventoryEvents.jsx`) at `/smokecraft/admin/humidor`,
`/smokecraft/admin/humidor/new`, `/smokecraft/admin/humidor/:cigarId/edit`,
`/smokecraft/admin/humidor/inventory-events` — same `SmokeCraftScreenShell`
system, no existing screen touched. No dedicated staff-venue React
context exists in this app (staff screens like
`VenueManagementCommandHub` take a plain venueId input) — the new
`useAdminVenueId` hook follows that same convention rather than
inventing a new context; it is a convenience only, never an
authorization boundary (the server independently re-validates real
venue membership on every request).

RBAC reuses the real, existing `venue_memberships.membership_type`
enum (migration 010: member/staff/mentor/manager/admin/owner) — no
parallel role table invented. Mapped onto the mandate's named roles:
owner/general-manager -> owner/admin/manager (full access); inventory
manager -> staff (products + inventory mutations); tobacconist ->
mentor (read-only, plus server-enforced staffNotes-only edits); a
plain `member` row (a venue's customer/club membership, not a staff
role) and no membership at all are both denied admin access. Every
tier is enforced server-side in `requireVenueRole()` and the
controller — never only a hidden UI button.

Explicitly out of scope for this pass (per mandate): the staff order/
fulfillment queue, payment integration, full-route/five-viewport
sweeps as new targeted work (route count is now 117; the five-viewport
proof was regenerated only because the build's own prebuild gate
requires it).

## Venue Humidor 1B-2B-2 update — staff order and fulfillment queue

Migration 110 (additive) extends `venue_cigar_orders` with a
`fulfillment_status` dimension (new/awaiting_confirmation/confirmed/
in_preparation/ready/completed/cancelled/expired/blocked),
`assigned_staff_id`/`assigned_staff_role`/`assigned_at`/
`assignment_version` (optimistic-concurrency claim/assignment),
`promised_at`/`ready_at`, `blocked_reason`, `cancellation_reason`; and
`venue_cigar_order_items` with `is_picked`/`picked_at`/`picked_by`
(whole-item picking only — the backend has no partial-quantity
fulfillment concept, so this is a real boolean, never a faked
partial-quantity counter). A new append-only
`venue_cigar_fulfillment_events` table (same pattern as
`venue_cigar_inventory_events`) is the sole fulfillment audit trail.

`fulfillment_status` is a genuinely NEW dimension — it does not
rename or duplicate `venue_cigar_orders.status`/`payment_status`,
which remain exclusively owned by `checkoutService.js`. The two are
kept from drifting apart by having `checkoutService.completeOrder()`
and `checkoutService.cancelOrder()` stamp `fulfillment_status` inside
the SAME authoritative `UPDATE` that sets `status`/`payment_status` —
never a second write path.

`fulfillmentService.js` (new) owns only the pre-completion staff
workflow: queue listing, order-detail read, claim/assign (optimistic
concurrency via `assignment_version`), confirm/prepare/pick/ready
transitions (validated against an explicit `ALLOWED_TRANSITIONS` map;
`ready` requires every item picked first), block/unblock, and staff
notes. Final completion and cancellation are pure delegation —
`completeOrderFromQueue()`/`cancelOrderFromQueue()` call
`checkoutService.completeOrder()`/`checkoutService.cancelOrder()`
directly and never reimplement order-state mutation, inventory
deduction, or hold/reservation release. No second complete/cancel
service, no direct SQL inventory deduction, no direct hold release,
and no cached available-quantity value exist anywhere in this file —
verified by the build-blocking validator.

RBAC reuses 1B-2B-1's exact `requireVenueRole()`/`FULL_ACCESS_TYPES`/
`WRITE_ACCESS_TYPES`/`READ_ACCESS_TYPES` — no parallel system. Only
full-access (owner/admin/manager) may reassign a claimed order;
write-access (+ staff) may claim/transition/complete/cancel;
read-access (+ mentor) may view the queue/detail/history but never
mutate — enforced entirely server-side.

Two new staff screens: `VenueHumidorOrderQueue.jsx`
(`/smokecraft/admin/humidor/orders`) and `VenueHumidorOrderDetail.jsx`
(`/smokecraft/admin/humidor/orders/:orderId`), plus
`VenueHumidorFulfillmentHistory.jsx`
(`/smokecraft/admin/humidor/orders/history`) — same
`SmokeCraftScreenShell` system, no existing screen touched. Every
action button is disabled honestly based on real server-derived
eligibility; no success is ever shown before the server confirms it.

Explicitly out of scope for this pass (per mandate): customer pickup
verification, table/lounge delivery confirmation, staff handoff
confirmation, pickup codes, no-show/expiration automation — these
belong to the next package, Venue Humidor 1B-2B-3.

## Venue Humidor 1B-2B-3 update — customer pickup, venue service, and fulfillment confirmation

Migration 111 (additive) extends `venue_cigar_orders` with pickup-code
verification (`pickup_code_hash` — a bcrypt hash only, never
plaintext — `pickup_code_attempts`, `pickup_code_expires_at`,
`verified_at`, `verification_method`), handoff (`handoff_staff_id`/
`handoff_staff_role`/`handoff_at`/`handoff_location`/`handoff_notes`),
lightweight no-show tracking (`no_show_at`), and `expired_reason`.
Widens `venue_cigar_fulfillment_events.event_type` (same table, same
append-only ledger) to cover verification/handoff/no-show/expiration/
Passport events. Adds a new, minimal
`venue_cigar_passport_acquisitions` table — confirmed by audit that no
purchase-completion flow anywhere in the codebase previously wrote to
any passport/collection table.

`fulfillmentService.js` gains: `generateVerificationCode()`/
`verifyPickupCode()` (bcrypt-hashed, venue/order-scoped, expiring,
rate-limited to 5 attempts before auto-blocking the order),
`confirmHandoff()` (requires real code verification first for
`counter_pickup`; accepts staff-visual confirmation for table/lounge
delivery), `markNoShow()` (a real operational event, never a
fabricated terminal status), `extendPickupWindow()` and `expireOrder()`
(both full-access only). `expireOrder()` releases inventory
exclusively through `checkoutService.cancelOrder()`, then stamps the
real `'expired'` value onto the `fulfillment_status` column
`fulfillmentService.js` already exclusively owns — never touching
`status`/`payment_status`.

`completeOrderFromQueue()` now requires a real `handoff_at` (and, for
`counter_pickup`, a real `verified_at`) before delegating to
`checkoutService.completeOrder()` — an order never completes merely
because a screen was opened. `checkoutService.completeOrder()` itself
gained the Passport-acquisition boundary: after its authoritative
`status = 'completed'` update, it inserts into
`venue_cigar_passport_acquisitions` guarded by a real
`ON CONFLICT (order_item_id) DO NOTHING`, so the insert applies
exactly once regardless of retry or entry path, and never for a
cancelled/expired/blocked/unfulfilled order (which never reaches that
line). `checkoutService.getOrder()` (the customer-facing read) now
redacts every staff-internal column (pickup-code hash/attempts, staff
handoff identity/notes, internal block reason) before returning to a
customer.

Two new screens: `VenueHumidorHandoff.jsx`
(`/smokecraft/admin/humidor/orders/:orderId/handoff`) — staff
verification-code generation/entry and handoff confirmation, gating
the existing Complete Order action — and `VenueHumidorPickup.jsx`
(`/smokecraft/orders/:orderId/pickup`) — the real customer-facing
pickup screen, showing only real, redacted order data and honest
per-status messaging, never a fabricated success. `VenueHumidorOrderDetail.jsx`
(1B-2B-2) gained Block/Unblock/No-Show/Expire controls (the backend
paths already existed from 1B-2B-2 but had no UI until this pass) and
a "Verify & Handoff" gate replacing direct completion for ready
orders that have not yet been handed off.
