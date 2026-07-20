# SmokeCraft Ticket Tapper — Focused Journey Integration

## Corrected discovery (recap)

See `docs/SMOKECRAFT_TICKET_TAPPER_IDENTIFICATION.md` — a real, complete
Ticket Tapper implementation exists (migrations 017/071, controllers,
services, routes, `TicketTapperSpecialsStrip.jsx`), previously wired only
into SmokeCraft Venue Commerce.

## What changed this package

### 1. Hardcoded venue ID removed
`src/pages/smokecraft/SmokeCraftVenueCommerce.jsx` previously had
`const venueId = 'smokecraft-360-main'` (line 233). Replaced with:
```js
const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped)
  ? journey.selectedVenue.id : null
```
sourced from `SmokeCraftJourneyContext` (the same context
`/smokecraft/venue-select` already writes to via `setSelectedVenue`). When
`venueId` is `null`, no venue-scoped API call is made and specials state
is cleared — no fallback to any default venue.

### 2. Live vs. demo preview behavior
Added `useDemoMode()` (existing `src/context/DemoModeContext.jsx`, the
repository's real demo-mode source — no new flag invented). In live mode
(`isDemoMode === false`), a backend-unavailable response from
`fetchTicketTapperSpecials`/`fetchTicketTapperInventory` (`res.localPreview
=== true`) now results in an honest "unavailable" state (empty specials,
no CTA), not a silent fallback to `smokeCraftTicketTapperSpecialsSeed`.
In demo mode, the existing seed-fallback + `LOCAL PREVIEW` label behavior
is preserved unchanged.

### 3. Compact mode added to `TicketTapperSpecialsStrip.jsx`
New props: `compact`, `noVenue`, `unavailable`. Compact mode renders a
horizontally-scrolling row of small chips (title, price, inventory
badge, 48px-min-height "Add" button) in normal document flow — no fixed/
absolute/sticky positioning, no 220px image cards. Full mode is
byte-for-byte unchanged aside from the new optional props being ignored
when `compact` is false.

### 4. Venue Selection integration
`src/pages/smokecraft/VenueSelect.jsx` fetches specials for
`journey.selectedVenue.id` only after a real (non-skipped) selection;
renders the compact strip in normal flow below the venue list / "continue
without venue" control, above the nav bar. Before selection, shows
"Select a venue to see specials" — no API call is made.

### 5. Session Complete integration
`src/pages/smokecraft/SessionComplete.jsx` fetches specials for the same
`journey.selectedVenue.id`, rendered in reserved normal-flow space after
the existing completion/recommendation/controls sections — does not
cover any of them. The "Add" action only fires on explicit click; it
does not trigger XP, rewards, or auto-redemption (confirmed by reading
`handleTap`/`CompactSpecialChip` — the only side effects are the existing
tap/add tracking calls already used on the commerce screen).

## Honest states verified

- **Loading**: strip renders its empty/no-venue state until the fetch
  resolves (no fabricated placeholder promotion).
- **No venue**: "Select a venue to see specials" (venue-select) — no API
  call made (verified by network listener in the focused test).
- **Empty** (venue selected, zero active specials): "No venue specials
  available".
- **Live-mode backend unavailable**: honest unavailable state, no seed
  data shown.
- **Demo mode**: seed data shown, always labeled `LOCAL PREVIEW`.
- **Expired/disabled**: unchanged — filtered by the existing
  `status === 'active'` / approval checks in
  `TicketTapperSpecialsStrip.jsx`, not modified this package.
- **Out of stock**: `InventoryBadge`/`canOneTapOrderSpecial` reused
  unchanged; compact "Add" button is omitted entirely when sold out.

## Security / venue isolation

No backend code was changed this package. Isolation depends on the
existing server-side `venue_id` scoping in the Ticket Tapper tables
(unchanged). Client-side: venueId now always traces to
`journey.selectedVenue.id` or `null` — never a hardcoded/default value —
so a guest can never be shown a venue's specials other than the one they
selected. See `docs/SMOKECRAFT_TICKET_TAPPER_SECURITY_AND_DATA.md`.

## Known limitation / blocker

`/smokecraft/venue-select` currently has zero real venues to select
(`VENUES = []`, a pre-existing, separate honest-empty-state — no live
venue directory backend exists). This means in the current running app,
`journey.selectedVenue` will in practice almost always be `null` or
`{skipped: true}`, so the compact strips on Venue Select and Session
Complete will predominantly render their "select a venue" / no-venue
state until a real venue directory is connected. This is the correct,
honest behavior given the constraint — not a defect in this package —
but is worth surfacing since it limits how often guests will actually
see live specials on these two routes today.

## Files changed

- `src/pages/smokecraft/SmokeCraftVenueCommerce.jsx`
- `src/pages/smokecraft/VenueSelect.jsx`
- `src/pages/smokecraft/SessionComplete.jsx`
- `src/components/smokecraft/TicketTapperSpecialsStrip.jsx`
- `docs/SMOKECRAFT_TICKET_TAPPER_IDENTIFICATION.md` (updated)
- New: `docs/SMOKECRAFT_TICKET_TAPPER_FOCUSED_INTEGRATION.md`,
  `docs/SMOKECRAFT_TICKET_TAPPER_ROUTE_SCOPE.md`,
  `docs/SMOKECRAFT_TICKET_TAPPER_TEST_REPORT.md`
- New: `verify-smokecraft-ticket-tapper-focused-integration.mjs`
- New: `public/proof/smokecraft-ticket-tapper-focused-integration/*`
