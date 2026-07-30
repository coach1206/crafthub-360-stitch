# Venue Humidor 1B-2B-1 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: ba4acde4

## Goal

Build only the real staff Venue Humidor inventory administration
screens on top of the completed 1A inventory service. No staff order
queue, no duplication of `checkoutService.completeOrder()`/`cancelOrder()`,
no payment integration, no full-route/five-viewport sweeps as new
targeted scope for this package.

## Routes added

`/smokecraft/admin/humidor` (`VenueHumidorAdminDashboard.jsx`),
`/smokecraft/admin/humidor/new` and `/smokecraft/admin/humidor/:cigarId/edit`
(both `VenueHumidorAdminProductForm.jsx`), and
`/smokecraft/admin/humidor/inventory-events`
(`VenueHumidorAdminInventoryEvents.jsx`). All new, additive routes in
`App.jsx` — no existing route touched.

## Inventory dashboard

Real, server-backed table: image, brand/name, SKU/barcode, vitola,
strength, price, sealed/opened box counts, physical/reserved/held/
available quantities (live-computed via the existing
`computeAvailableQuantity()`, never cached) with a low-stock
indicator, reorder point, status, visibility, humidor zone/location.
Honest states: loading, empty, error/retry, no-venue, unauthorized,
offline, session-expired. Verified live in both suites.

## Add-cigar form

Full field-level validated create form covering every approved
product field. Duplicate SKU and duplicate barcode are both honestly
rejected (409) — verified live. Missing required fields (SKU, name,
price) return real per-field errors, never a silent failure or a
generic message.

## Edit-cigar form

Same full field set, pre-populated from the real server row. Edited
values (including `staffNotes`) persist across a genuine full page
reload — verified live in the browser suite.

## Receiving inventory

`receiving` mutation increases real `physical_quantity` by the
requested quantity, through `inventoryService.applyInventoryEvent()`
— verified live via both the raw quantity change and the on-screen
live re-render.

## Opening a box

`box_opened` mutation applies as inventory-neutral (matching 1A's
documented "opening a box does not change stick count" model) while
updating the administrative sealed/opened box counters — verified
live.

## Adjustment controls

Add/remove loose sticks, damage, loss, complimentary, return, and
count correction all verified live to move real `physical_quantity`
in the correct direction (complimentary and damage/loss/removal
decrease; receiving/add/return increase; count correction sets to the
corrected total computed from the real current row) and to write
exactly one real inventory event each.

## Negative-inventory rejection

Removing more sticks than exist is honestly rejected
(`409 insufficient_inventory`) both at the API and in the admin UI —
verified live that the rejected mutation never changes real
`physical_quantity`.

## Duplicate-race result

A rapid double-click sharing one idempotency key results in exactly
one real quantity change (verified at the API). Two genuinely distinct
concurrent mutations (different idempotency keys) both apply exactly
once each, verified at the API to leave no lost update and no
double-apply. The admin UI's own rapid-double-click test confirms a
sane, non-corrupted resulting quantity.

## Archive/restore

Archiving a product removes it from the default admin dashboard list
and the real customer browser; restoring returns it to both —
verified live at the API and in the browser.

## Visibility synchronization

Hiding/showing a product, and marking/unmarking featured, staff-pick,
and limited-release, are verified live to change the exact same
`is_customer_visible`/`is_featured`/`is_staff_pick`/`is_limited_release`
columns the existing 1B-1 customer catalog already reads — a visible,
featured product appears in the real customer browser; hiding or
archiving it removes it; restoring returns it.

## Event-history screen

Real, append-only, filterable (by product, event type, actor, date
range) inventory event history — verified live that each filter
narrows the real returned dataset. No edit or delete control exists
anywhere in the admin UI or API for an existing event.

## Venue-isolation proof

A staff member with no membership row for a venue is denied (403);
one staff member cannot list or mutate another venue's products even
by pairing their own real venueId with the other venue's real
productId — verified live at the API (reusing 1A's existing
`productVenueMatch` pattern) and in the browser (an unauthorized user
sees an honest permission-denied state, never leaked inventory data).

## RBAC proof

Server-side tiers verified live: owner/admin/manager get full access;
staff (inventory-manager tier) gets product + inventory-mutation
access; mentor (tobacconist tier) gets read-only access plus a
server-enforced staffNotes-only edit path — verified live that a
mentor CAN edit staffNotes but CANNOT edit any other field, and CANNOT
reach the inventory-mutation route at all, even by calling the API
directly (never only a hidden UI button). A user with no membership
row at all is denied.

## Customer-browser synchronization

Verified live end-to-end: a newly visible/featured product appears in
the real customer catalog; archiving removes it; restoring returns it
— using the exact same classification columns, not a second
visibility mechanism.

## Cross-device consistency

Two independent authenticated staff sessions read identical
authoritative product state for the same product — verified live.

## Tests and build

- `verify-smokecraft-venue-humidor-1b2b1-api.mjs`: 41/41
- `verify-smokecraft-venue-humidor-1b2b1-browser.mjs`: 15/15
- `scripts/validateSmokecraftVenueHumidorAdminAuthority.mjs`: 22/22
- `verify-smokecraft-venue-humidor-1a-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-browser.mjs` (regression): 23/23
- `verify-smokecraft-venue-humidor-1b2a-api.mjs` (checkout regression): 30/30
- `npm run build` (full prebuild validator chain + Vite build): succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1b-2b-1/`

## What this pass does NOT cover

The staff order/fulfillment queue, payment integration — explicitly
out of scope per mandate. A full five-viewport sweep was regenerated
only because `npm run build`'s own prebuild gate requires an
up-to-date route-count-matched inventory (route count now 117; not run
as new targeted 1B-2B-1 scope).

## Venue Humidor 1B-2B-2 handoff

Venue Humidor 1B-2B-2: the staff order/fulfillment queue (approving/
completing/cancelling real customer checkout orders from 1B-2A),
built on this pass's RBAC tiers and the existing
`checkoutService.completeOrder()`/`cancelOrder()` — the sole
completion/cancellation path for every `venue_cigar_orders` row.
1B-2B-2 should call those same functions rather than duplicating
completion/cancellation logic, and should reuse this pass's
`requireVenueRole()` tiers (`FULL_ACCESS_TYPES`/`WRITE_ACCESS_TYPES`/
`READ_ACCESS_TYPES` in `venueHumidorRoutes.js`) rather than inventing
a second RBAC scheme.
