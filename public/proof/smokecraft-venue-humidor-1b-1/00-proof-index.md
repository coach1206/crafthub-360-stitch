# Venue Humidor 1B-1 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: b0cdb351

## Goal

Build only the live customer Venue Humidor browsing and cigar-detail
experience on top of the completed 1A backend. No checkout, no staff
admin, no order fulfillment, no full sweeps as new targeted scope for
this package.

## Routes added

`/smokecraft/venue-humidor` (`VenueHumidorBrowser.jsx`) and
`/smokecraft/venue-humidor/:cigarId` (`VenueHumidorCigarDetail.jsx`).
Both new, additive routes in `App.jsx` — no existing route touched.

## Browser result

`VenueHumidorBrowser.jsx` renders real, server-backed cigar cards
(image, brand, name, vitola, country, wrapper, strength/body, flavor
notes, smoke time, price, live availability state, featured/staff-
pick/limited-release badges). Never trusts a client-supplied venue —
`validateActiveVenue()` re-checks the real `venues` table server-side
on every request. Archived products are excluded unconditionally;
sold-out products are hidden by default. An honest "select a venue
first" state renders when no venue is active.

## Search/filter result

Search and all 13 documented filter dimensions (brand, country,
wrapper, vitola, strength, body, flavor, price, smoking time,
experience level, in-stock-only, featured, staff pick, limited
release) map to real parameterized SQL conditions in
`browseCatalog()` — verified live that each filter genuinely narrows
the real returned dataset, never a client-side cosmetic filter over an
unfiltered payload.

## Sorting result

All 6 documented sort options (recommended, price low/high, strength,
smoking time, newest) map to real SQL `ORDER BY` expressions —
verified live that price sorting is genuinely monotonic in both
directions.

## Detail result

`VenueHumidorCigarDetail.jsx` loads and validates the cigar against
the active venue server-side, displaying full real data (images, full
cigar info, stick/box price, live availability, wrapper/binder/filler,
strength/body, flavor notes, length/ring gauge, origin, smoke time,
experience level, venue description, staff notes, similar available
cigars) plus a working "Find a Pairing" action to the real existing
pairing screen.

## Venue-isolation result

Verified live (API and browser): a venue B product requested under
venue A's path returns an honest 404, never leaked cross-venue data;
every catalog/detail query is scoped by a real `venue_id` parameter.

## Live-availability result

Every returned product's availability is computed via the real
`inventoryService.getProductAvailability()` (physical - unavailable -
held - reserved) — never a client-submitted or component-local value.
Low-stock and sold-out states verified live against real seeded data.

## Hold result

"Add One Stick" and "Purchase Box" create real holds through the
existing 1A `inventoryService.createHold()` primitive — verified live,
including honest rejection (409) when a cigar has no configured box
price/quantity, and real idempotency-key-based duplicate protection.

## Reservation result

"Reserve" creates a real reservation through the existing 1A
`inventoryService.createReservation()` primitive — verified live.

## Unsupported-integration result

"Add to Venue Tab" and "Request Table/Seat Delivery" return a real,
honest `501 action_not_yet_available` — never a fabricated success —
verified live via both API and browser (Chrome DevTools' own 501
network log, filtered as expected test-induced noise, not a defect).

## Favorites result

Favorites are a real, idempotent, server-persisted table
(`venue_cigar_favorites`, `UNIQUE(guest_reference, product_id)`).
Found and fixed a real defect (SC-D064): favorite status was
previously only local optimistic state, never re-fetched on load —
closed by loading the real favorite list on every mount. Verified
live: favorite state survives a full page reload.

## Browser/accessibility result

`verify-smokecraft-venue-humidor-1b1-browser.mjs`: 23/23 — keyboard
Tab moves focus, cigar cards are real clickable pointer/touch targets,
no horizontal layout cutoff, no unexpected console errors, working
back navigation.

## Defects found and fixed

**SC-D064** — Save to Favorites never reflected real persisted state
on load, only local optimistic state. Found live via the browser
test's reload assertion, fixed by fetching real favorites on mount.

## Tests and build

- `verify-smokecraft-venue-humidor-1b1-api.mjs`: 32/32
- `verify-smokecraft-venue-humidor-1b1-browser.mjs`: 23/23
- `scripts/validateSmokecraftVenueHumidorCustomerAuthority.mjs`: 25/25
- `verify-smokecraft-hf5b1-pairing-engine.mjs` (pairing regression): 36/36
- `verify-smokecraft-venue-selection-data.mjs` (venue-selection
  regression): could not run — depends on a throwaway, ad-hoc
  "Test Verification Lounge" venue row (`venue-test-verify-1`) manually
  inserted in a prior session's local Postgres instance; that row does
  not exist in this session's database (36 real venues exist, none
  with that id). This is a pre-existing test-data dependency gap in
  that suite, not a regression introduced by this pass — Venue Humidor
  never touches the general `venues`/venue-selection pipeline this
  suite tests.
- `npm run build` (full prebuild validator chain, 19 validators): succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1b-1/`

## What this pass does NOT cover

Checkout, staff admin screens, order fulfillment, POS/Passport
integration — explicitly out of scope per mandate. A full five-
viewport sweep was regenerated only because `npm run build`'s own
prebuild gate requires an up-to-date route-count-matched inventory
(not run as new targeted 1B-1 scope).

## Venue Humidor 1B-2 handoff

Venue Humidor 1B-2: checkout flow (converting a real hold into a real
completed order via the existing 1A `orderService.completeOrder()`
primitive, real payment integration or an honestly-labeled prototype
payment step) and staff admin inventory management screens (receiving,
adjustments, reservation approval), built on the server-authoritative,
venue-isolated, idempotent inventory/order/catalog foundation closed
across 1A and 1B-1. No new backend authority should be needed for
checkout's core flow — extend `orderService.js` rather than
duplicating logic in the frontend if a gap is found.
