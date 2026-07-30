# Venue Humidor 1A — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 38a54cad

## Goal

Build only the Venue Humidor backend foundation — architecture map,
venue-isolated schema, inventory events, holds, reservations, orders/
order items, migrations, server-side inventory calculations. No
customer/checkout/admin screens, no full sweeps.

## Existing systems reused

`venues`/`venue_memberships` (migration 010, unchanged) for venue
identity and staff RBAC — the exact same venue-scope check pattern
already proven in Golden Box's `judgingService.assignJudge()`.
`requireAuth` (unchanged) for authentication. Golden Box's established
database conventions (BIGSERIAL + UUID public id, append-only event
ledger, partial unique idempotency-key indexes, row-lock +
pre-lock/in-lock idempotency recheck, SAVEPOINT-equivalent race
handling) — all directly reused, none reinvented. POS360/order/
inventory-prototype systems were audited and NOT reused (different
domains, or non-authoritative in-memory prototypes) — see
`SMOKECRAFT_VENUE_HUMIDOR_ARCHITECTURE_MAP.md` for full detail.

## Migrations added

`106_smokecraft_venue_humidor_foundation.sql` — `venue_cigar_products`,
`venue_cigar_inventory_events` (append-only), `venue_cigar_inventory_holds`,
`venue_cigar_reservations`, `venue_cigar_orders`, `venue_cigar_order_items`.
Verified live: apply → rollback → reapply all clean, tracked correctly
in `schema_migrations`.

## Inventory service result

`inventoryService.js`'s `applyInventoryEvent()` is the single primitive
for every quantity-affecting mutation (receiving, box_opened,
stick_added, stick_removed, damage, loss, complimentary, return,
count_correction, sale_completed, cancellation_restored) — transactional,
row-locked, idempotent, negative-inventory-proof, always writes exactly
one append-only event, always returns server-computed final quantities.
`createHold()`/`createReservation()` (and their release/expire/cancel/
fulfill counterparts) share the same primitives. All verified live —
see `01-backend-foundation-api-results.json`.

## Venue isolation result

Verified live: a stranger with no membership for a venue is denied
(403); products/lists never leak across venues; a staff member of
venue A cannot act on venue B's product even by pairing A's real
venueId with B's real productId (`requireResourceVenueMatch`
defense-in-depth, 404).

## RBAC result

Verified live: a non-member is denied product creation (403);
`requireVenueStaff()` requires a real, active `venue_memberships` row
(staff/manager/admin/owner) for the exact venue, or a platform-admin
bypass — never a client-supplied venueId trusted alone.

## Idempotency result

Verified live: a repeated mutation with the same idempotency key
returns the identical original event and applies exactly once; a
genuine two-tab race with the same key resolves to the same real
event, never a double-apply.

## Negative-stock result

Verified live: an adjustment that would drive physical quantity
negative is rejected with a real 409, and the rejected mutation leaves
the real physical quantity provably unchanged (transaction rolled
back).

## Hold/reservation result

Verified live: hold creation reduces real computed available quantity;
an already-expired hold can be expired and availability is restored;
a staff-created reservation reduces availability and cancellation
restores it; sale completion decrements real physical inventory and
order cancellation restores it (refund path).

## Seed result

`seedVenueHumidorPrototypeData.mjs` — 2 venues, 8 cigars each
(including a low-stock item, a sold-out item, a featured item, and a
limited release), distinct manager/staff accounts with real
`venue_memberships` rows per venue. Hard-guarded against production
(`NODE_ENV === 'production'` skip, matching `seedPrototypeUsers.js`'s
established pattern), fully idempotent (`ON CONFLICT ... DO NOTHING`
throughout, safe to re-run). Verified live: ran clean, 8 products per
venue confirmed in the database.

## Defects found and fixed

None — this is new backend foundation, not a fix to prior work. See
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` for the two defect classes
proactively designed out from the start (NULL-uniqueness idempotency
gap, `user:` identity-prefix gap) based on lessons from earlier Golden
Box passes.

## Tests and build

- `verify-smokecraft-venue-humidor-1a-api.mjs`: 32/32
- `scripts/validateSmokecraftVenueHumidorAuthority.mjs`: 20/20
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1a/`

## What this pass does NOT cover

Customer browsing/checkout screens, staff admin screens, POS/Passport/
pairing integration, full-route/five-viewport sweeps — explicitly out
of scope per mandate.

## Venue Humidor 1B handoff

Venue Humidor 1B: customer-facing browsing and checkout screens (real
availability display, hold-then-checkout flow using the real
`createHold`/`completeOrder` primitives already built here), plus a
staff admin screen for inventory management (receiving, adjustments,
reservations) — built on the server-authoritative, venue-isolated,
idempotent inventory/order foundation closed in this pass. No new
backend authority should be needed for 1B's core flows; if a gap is
found, extend `inventoryService.js`/`orderService.js` rather than
duplicating logic in the frontend.
