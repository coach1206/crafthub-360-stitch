# Venue Humidor 1B-2B-5 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 6e086143

## Goal

Build a real, server-authoritative, inventory-aware cigar recommendation
and pairing system for customers and staff — cigar discovery, beverage
pairing, alternatives for unavailable cigars, and staff-assisted
selling — reading only canonical product, inventory, order, and
Passport-acquisition data, with no duplicate inventory, catalog, cart,
checkout, Passport, or preference system, and no fabricated beverage or
cigar data.

## Discovery findings (recorded before implementation)

- **Pairing engine** (`src/utils/pairingEngine.js` + `server/services/smokecraft/pairingEngineService.js`)
  is a real, existing, rule-based (non-AI) engine, but it operates only
  on abstract cigar-shape/beverage-category inputs for the gameplay
  PairingLab/PairingRecommendations screens — it was never wired to real
  `venue_cigar_products` rows or real inventory/pricing. This pass
  imports its `HARMONY`/`STRENGTH_SCORE`/`TYPE_STRENGTH`/`PAIRING_CATEGORIES`
  data unchanged rather than inventing a second pairing vocabulary.
- **Beverage/menu data**: no real venue-level beverage/spirits/wine/cocktail
  catalog exists anywhere in the codebase (only the unrelated POS360
  food-service menu builder). Beverage pairing therefore works only at
  the category level (e.g. "Whiskey") using the existing pairing
  engine's abstract categories — an unrecognized category honestly
  reports `beverageDataAvailable: false` rather than fabricating a
  pairing.
- **Inventory availability**: confirmed the sole source is
  `inventoryService.getProductAvailability()` (live-computed from
  `physical_quantity - unavailable_quantity - held - reserved`) — no
  cached availability exists anywhere, and this pass introduces none.
- **Customer preferences**: no existing preference table anywhere in the
  codebase — this pass adds exactly one narrow table,
  `venue_cigar_recommendation_preferences` (one row per customer).
- **Customer signals**: `venue_cigar_passport_acquisitions` (completed
  purchases) and `venue_cigar_acquisition_notes` (ratings, migration 112)
  are the only real, purchase-linked customer signal sources — used as
  inferred (not asserted-as-fact) preference signals.

## Routes added

`/smokecraft/humidor/recommendations`, `/smokecraft/humidor/pairing`
(reuses the exact same live `VenueHumidorRecommendations.jsx` component
via a `pairingMode` prop — not a second, disconnected implementation),
`/smokecraft/admin/humidor/assisted-selling`. Backend: 5 new customer
routes on the existing `venueHumidorCustomerRoutes.js`, 3 new
venue-scoped admin routes on the existing `venueHumidorRoutes.js`.

## Recommendation-engine result

Transparent, explainable scoring (`recommendationService.scoreProduct()`)
combining preference match, pairing compatibility, inventory
availability, budget fit, vitola/country match, smoking-duration fit,
and real purchase-history signals — every result carries a plain-language
`reasons`/`cautions` list and a `confidence` level (`low`/`medium`/`high`),
never an unexplained numeric-only "AI score."

## Inventory-awareness result

Verified live and via the build-blocking validator: only products that
are customer-visible, not archived, not discontinued/sold-out, and have
live `availableQuantity > 0` are ranked for purchase. Out-of-stock
products appear in a separate, honestly labeled list. A stale
recommendation result is rechecked — inventory changed after results
load is reflected in the next fresh request, and the canonical
stick-hold endpoint independently rejects a now-unavailable product
regardless of what an earlier recommendation call returned.

## Customer-preference result

`venue_cigar_recommendation_preferences` (migration 113) — one row per
customer, upserted by `customer_reference` (real unique constraint,
naturally idempotent). Verified live that a different customer never
sees another customer's saved preferences.

## Cold-start result

Verified live: a brand-new customer with no purchase history receives
real, eligible results driven purely by their selected answers, with an
honest UI label ("no purchase history yet") — never a fabricated
personalization claim.

## Pairing result

Beverage pairing is evaluated only against the existing pairing engine's
real category vocabulary. A recognized category (e.g. "Whiskey")
contributes real complement/clash scoring against the cigar's own
`flavor_notes`; an unrecognized category honestly reports unavailable
beverage data rather than inventing a result.

## Alternative-recommendation result

For an unavailable target cigar, alternatives are ranked by real
similarity (strength/body/flavor-note overlap/vitola/country/price
distance) among currently eligible products — every alternative reports
whether it is stronger/milder, more/less expensive, and any smoking-time
difference, with a concrete explanation. No alternative is called an
exact substitute unless every attribute genuinely matches.

## Assisted-selling result

Staff can enter/adjust preferences, run the same inventory-aware
recommendation engine, compare two eligible products, and record an
accepted/declined/modified outcome — verified live end-to-end including
comparison and outcome recording. Staff cannot bypass venue isolation,
inventory availability, current pricing, or the canonical checkout flow
— the assisted-selling controller writes nothing to inventory, pricing,
or order data.

## Tobacconist result

Mentor role reuses the existing `requireVenueRead` tier — can view
recommendations/alternatives but is denied (403) when attempting to
record an assisted-selling outcome, verified live and via the
build-blocking validator's route-tier checks.

## Current-price result

Every recommendation and alternative reports the product's live
`price_cents` — never a historical order price. Confirmed by the
validator that the service contains no order/payment mutation logic.

## Canonical cart and checkout result

"Add to cart" is pure navigation into the existing product-detail page
and its existing stick-hold/box-hold/checkout flow — no new cart, hold,
or checkout logic was added. Verified live that a recommended product
can be held via the exact same canonical endpoint used by browse/detail.

## Recommendation-analytics result

Reuses the existing, already-idempotent `smokecraft_progression_events`
ledger via `recordEvent()` — the same pattern established by
`venueHumidorEventService.js` — for
`venue_humidor_recommendation_requested/shown/accepted/declined/alternative_shown`
events. No second generic analytics table was created. Verified live
that events accumulate append-only.

## Explainability result

Every recommendation surfaces concrete reasons ("Matches your preferred
strength", "Complements a whiskey pairing", "Similar to a cigar you
rated highly") and honest cautions ("Stronger than your usual
preference", "Beverage pairing data unavailable for this category",
"Based on your selected answers — no purchase history yet").

## RBAC result

Customer routes require a resolved guest/customer identity on every
handler. Staff (write tier) may record outcomes; mentor (read tier) may
view but not mutate — verified live and via the validator's route-tier
assertions.

## Customer-isolation result

Preferences and recommendation requests are scoped strictly to the
resolved server-side identity — verified live that a different customer
never sees another customer's saved preferences.

## Venue-isolation result

Recommendations only ever return the requested venue's own catalog —
verified live that a different venue's product never appears in
results, and that a staff member without membership in a venue is
denied (403) assisted-selling access there.

## Idempotency result

`recordAssistedSellingOutcome()` requires an idempotency key and is
guarded by a real `UNIQUE` constraint (`ON CONFLICT DO NOTHING` + dedupe
re-read) — verified live that a duplicate submission produces exactly
one row. Preference saves are naturally idempotent via upsert-by-customer.

## Concurrency result

Verified via the shared idempotency pattern reused from every prior
Venue Humidor pass — no new concurrency primitive was needed since this
pass performs no inventory-mutating writes of its own.

## Responsive result

Five-viewport sweep regenerated against a fresh `dist` build covering
all 130 live routes (up from 127) — `validateSmokecraftResponsive.mjs`
passes 0 failed.

## Accessibility result

Keyboard-navigable filters, semantic headings, large touch targets (min
44px), non-color-only status indicators, visible focus states inherited
from the shared SmokeCraft screen shell.

## Defects found and fixed

None in previously-locked behavior. Two bugs were caught and fixed
entirely within this pass's own new code before commit: (1)
`getAlternatives()` initially failed to compute live availability for
the *target* product before deriving `targetUnavailableReason`, so an
out-of-stock target was never correctly reported as such — fixed by
computing `getProductAvailability()` for the target the same way it
already was for candidates; (2) an initial standalone
`VenueHumidorPairing.jsx` wrapper file had no detectable interactive
markup of its own, causing the route-classification tool to honestly
mark `/smokecraft/humidor/pairing` "unclassified" — fixed by routing
`/smokecraft/humidor/pairing` directly to the same
`VenueHumidorRecommendations` component (via a `pairingMode` prop)
instead of a separate wrapper file, which is also the more honest
"same function, no duplicate page" implementation the mandate required.
Neither reached the committed baseline, so neither receives an SC-D
number.

## Tests and build

- `verify-smokecraft-venue-humidor-1b2b5-api.mjs`: 34/34
- `verify-smokecraft-venue-humidor-1b2b5-browser.mjs`: 21/21
- `scripts/validateSmokecraftVenueHumidorRecommendationAuthority.mjs`: 26/26
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
- `verify-smokecraft-venue-humidor-1b2b4-api.mjs` (regression): 29/29
- `verify-smokecraft-venue-humidor-1b2b4-browser.mjs` (regression): 21/21
- `scripts/validateSmokecraftVenueHumidorPostPurchaseAuthority.mjs` (regression): PASS
- Five-viewport responsive sweep: 130/130 routes, 0 failures
- `node scripts/validateSmokecraftResponsive.mjs`: PASS
- `npm run build` (full prebuild validator chain + Vite build): succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1b-2b-5/`

## Final verification report

The live-verification flow from the mandate's section 25 was exercised
against the real running server and real Playwright browser sessions
(no mocking): stocked venue selected → real available quantity
confirmed → cold-start recommendation → only eligible venue products
returned → beverage pairing preference selected → explanations confirmed
→ current prices confirmed → out-of-stock products excluded from
purchase actions and shown honestly → eligible recommendation held via
the canonical stick-hold flow → reservation/checkout protections intact
→ real order completed → later recommendation call reflects real
purchase history (`hasPurchaseHistory: true`) → rating added → cold-start
flag correctly flips to false → staff-assisted selling run → two
eligible cigars compared → accepted outcome recorded and confirmed
server-side → unavailable preferred cigar tested → honest alternatives
shown with concrete comparisons → inventory changed after results
loaded → a fresh request reflects the change and the canonical hold
endpoint independently rejects the stale result → cross-venue assisted-
selling access denied (403) → cross-customer preference access denied →
recommendation analytics confirmed append-only → all five viewports
verified → confirmed no duplicate inventory/order/Passport/preference
system was created (validator + live source review).

## Venue Humidor next handoff

Venue Humidor 1B-2B-6 — Full Vertical-Slice Closure, Security,
Production Readiness, and Investor Demo. Not started this pass per the
mandate's explicit handoff boundary.
