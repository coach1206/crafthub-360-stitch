# Venue Humidor 1B-2B-4 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 08ab72e2

## Goal

Build the real customer post-purchase experience for completed Venue
Humidor cigar orders: order history, order detail, digital receipts, a
verified Passport-acquisition read surface, cigar-education follow-up,
reorder access, and a narrow verified-purchase rating/tasting-note
boundary — reading only canonical order, fulfillment, and
`venue_cigar_passport_acquisitions` records, with no duplicate order-
history table, no duplicate acquisition table, and no duplicate receipt-
totals table.

## Routes added

`/smokecraft/orders`, `/smokecraft/orders/:orderId`,
`/smokecraft/orders/:orderId/receipt`, `/smokecraft/passport/acquisitions`,
`/smokecraft/passport/acquisitions/:acquisitionId` — the five customer
routes required by the mandate, plus the supporting
`POST /passport/acquisitions/:acquisitionId/note` API for rating/tasting/
smoked. All five backend GET routes and the one POST route were added to
the existing `venueHumidorCustomerRoutes.js`, reusing its identity
middleware chain rather than creating a new router.

## Customer order-history result

Real, server-backed history of every order belonging to the authenticated
customer across all venues — order number, venue name/city, date,
fulfillment method, item/quantity counts, total, payment/fulfillment
status, and Passport-acquisition indicator — verified live with status
filtering, venue filtering, and search by order number/venue/brand/name.
Cross-customer access to another customer's order list is denied
server-side (filtered by `customer_reference` at the SQL layer, not just
in application code).

## Order-detail result

Customer-safe order detail (venue, fulfillment method/location, all
lifecycle timestamps, items with image/brand/vitola/strength/quantity/
line total, per-item reorder eligibility, Passport-acquisition link) —
verified live that internal staff fields (`pickup_code_hash`,
`handoff_notes`, `assigned_staff_id`, `blocked_reason`, `idempotency_key`,
etc.) are never present in the response, reusing the exact
`CUSTOMER_INTERNAL_FIELDS` redaction pattern from `checkoutService.getOrder()`.

## Receipt result

A real receipt built only from the canonical order's stored columns
(`subtotal_cents`, `tax_cents`, `service_charge_cents`, `discount_cents`,
`tip_cents`, `total_cents`, and each item's `unit_price_cents`/
`line_total_cents`) — verified live that a product price change made
after order completion never alters the receipt or the order's stored
`total_cents`. A receipt is honestly unavailable (`409 receipt_not_available`)
for a ready-but-not-completed order; a cancelled order's receipt
honestly shows a non-completed-sale banner rather than presenting a fake
sale. A printable browser view (`window.print()`) is provided; PDF export
shows an honest disabled note rather than a fake download.

## Passport acquisition result

A customer-facing read surface over `venue_cigar_passport_acquisitions`
(the sole acquisition source of truth, written only inside
`checkoutService.completeOrder()`) — verified live that a completed order
produces exactly one acquisition row, a cancelled or expired order
produces zero, and a completion retry never double-inserts. Cross-
customer and cross-venue acquisition access are both denied server-side.

## Collection integration result

Acquisition detail links to the existing pairing page
(`/smokecraft/pairing`) and shows real cigar-education fields (country,
wrapper, binder, filler, vitola, strength, body, smoke time, flavor
notes, venue notes) sourced from the product record, with an honest
"unknown" fallback per field rather than fabricated data. No existing
gameplay/collection/mentorship table (`smokecraft_tasting_drafts`,
`golden_box_mentor_reviews`, `smokecraft_collection_ownership`) was
reused or duplicated for this — confirmed by audit that none of them
represent real-purchase consumption tracking.

## Post-purchase education result

Where the product record has the data it is shown; where it does not,
the UI honestly displays "unknown" per field rather than fabricating
values — verified live across several acquisitions with differing data
completeness.

## Reorder result

Reorder eligibility is computed server-side per order item
(`!is_archived && is_customer_visible && product_status !== 'discontinued'`,
plus a live inventory-availability check) — verified live that an
archived or out-of-stock item shows an honest disabled reorder state
("no longer carried" / real availability text) while an eligible item's
"Reorder" button navigates into the existing canonical catalog detail
route (`/smokecraft/venue-humidor/:cigarId`), reusing the entire existing
hold/checkout/completion flow. No new reorder-specific backend or price-
freezing logic was added; reorder always reflects the current catalog
price, never the historical receipt price.

## Rating and tasting result

A new, narrow, single-row-per-acquisition table
(`venue_cigar_acquisition_notes`, migration 112) supports a verified-
purchase 1–5 star rating, a free-text tasting note, and a mark-as-smoked
flag — verified live that only the acquisition's owning customer may
rate/annotate it, out-of-range ratings are rejected, and a concurrent
double-submission sharing one idempotency key produces exactly one row
(pre-lock fast path + `FOR UPDATE` in-lock authoritative recheck).

## RBAC result

Verified live and via the build-blocking validator: every new controller
handler requires a resolved customer/guest identity; staff/manager
identities attempting to read a customer's order/acquisition data
through these customer routes receive no leaked data (the routes are
scoped to the resolved identity, not a URL-supplied one).

## Customer-isolation result

Verified live: direct API attempts using another customer's order ID or
acquisition ID are denied (`order_not_owned` / `acquisition_not_owned` →
403); query-parameter manipulation does not bypass the
`customer_reference` filter, which is enforced at the SQL layer on every
read.

## Venue-isolation result

Order/acquisition rows carry their own `venue_id`; product-availability
and reorder-eligibility checks are scoped to the order item's own
product/venue — verified live that a cross-venue product/order
combination cannot be reached through these routes.

## Historical financial-integrity result

Verified live via direct `psql` mutation of `venue_cigar_products.price_cents`
after order completion: the order's stored `total_cents` and every
receipt total derived from it remain unchanged. Receipt/history services
never join live product pricing into any total — confirmed by the
build-blocking validator's static checks.

## Idempotency result

`saveAcquisitionNote()` requires a real idempotency key and applies the
same pre-lock-fast-path + in-lock-authoritative-recheck pattern used
throughout this operation — verified live that concurrent identical
rating/note/smoked submissions produce exactly one row.

## Customer synchronization result

Verified live: order history, order detail, receipt, and Passport
acquisition all agree on Ready/Completed/Cancelled/Expired for the same
order — a Passport acquisition appears only once an order is genuinely
completed, never before, never for a cancelled/expired order.

## Responsive result

Five-viewport sweep regenerated against a fresh `dist` build covering all
127 live routes (up from 122, +5 new post-purchase routes) —
`validateSmokecraftResponsive.mjs` passes 0 failed.

## Accessibility result

Keyboard-navigable filters and rating control (`role="radiogroup"`/
`role="radio"` with `aria-checked`), semantic headings, non-color-only
status indicators (text + badge), visible focus states inherited from
the shared SmokeCraft screen shell, large touch targets (min 44px),
print-friendly receipt structure.

## Defects found and fixed

None in previously-locked behavior. Two bugs were caught and fixed
entirely within this pass's own new test code before commit: a missing
`.patch()` method on a test-file `makeClient()` helper (caused a false-
negative "archived product still reorder-eligible" failure — the
classification PATCH call silently mismatched the Express route), and an
ASI (automatic-semicolon-insertion) parsing bug in the browser test
(`(a && b) ? ... : ...` on its own line parsed as a call onto the prior
statement). Neither reached the committed baseline, so neither receives
an SC-D number.

## Tests and build

- `verify-smokecraft-venue-humidor-1b2b4-api.mjs`: 29/29
- `verify-smokecraft-venue-humidor-1b2b4-browser.mjs`: 21/21
- `scripts/validateSmokecraftVenueHumidorPostPurchaseAuthority.mjs`: 24/24
- `verify-smokecraft-venue-humidor-1a-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-browser.mjs` (regression): 23/23
- `verify-smokecraft-venue-humidor-1b2a-api.mjs` (regression): 30/30
- `verify-smokecraft-venue-humidor-1b2a-browser.mjs` (regression): 16/16
- `verify-smokecraft-venue-humidor-1b2b1-api.mjs` (regression): 41/41
- `verify-smokecraft-venue-humidor-1b2b1-browser.mjs` (regression): 15/15
- `scripts/validateSmokecraftVenueHumidorAdminAuthority.mjs` (regression): PASS
- `verify-smokecraft-venue-humidor-1b2b2-api.mjs` (regression): 40/40
- `verify-smokecraft-venue-humidor-1b2b2-browser.mjs` (regression): 20/20
- `scripts/validateSmokecraftVenueHumidorFulfillmentAuthority.mjs` (regression): PASS
- `verify-smokecraft-venue-humidor-1b2b3-api.mjs` (regression): 31/31
- `verify-smokecraft-venue-humidor-1b2b3-browser.mjs` (regression): 18/18
- `scripts/validateSmokecraftVenueHumidorPickupAuthority.mjs` (regression): PASS
- Five-viewport responsive sweep: 127/127 routes, 0 failures
- `node scripts/validateSmokecraftResponsive.mjs`: PASS
- `npm run build` (full prebuild validator chain + Vite build): succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1b-2b-4/`

## Final verification report

The live-verification flow from the mandate's section 23 was exercised
against the real running server and real Playwright browser sessions (no
mocking): completed order → appears in history → order detail opens →
receipt opens with totals matching the canonical order → exactly one
Passport acquisition recorded → acquisition detail shows real cigar-
education data → reload persists all screens → product price changed →
historical receipt unchanged, reorder reflects the new price → product
archived → historical order remains visible, reorder disabled → second
order completed and completion retried → still exactly one acquisition →
third order cancelled → no acquisition → fourth order expired → no
acquisition → cross-customer access denied → cross-venue access denied →
rating/tasting requires a verified acquisition → receipt print output
verified → all five viewports verified → no internal staff notes or
sensitive payment data exposed in any customer-facing response.

## Venue Humidor next handoff

Venue Humidor 1B-2B-5 — Inventory-Aware Pairing, Venue Recommendations,
and Assisted Selling. Not started this pass per the mandate's explicit
handoff boundary.
