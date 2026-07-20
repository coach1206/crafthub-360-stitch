# SmokeCraft Ticket Tapper — Focused Integration Test Report

## Focused suite: `verify-smokecraft-ticket-tapper-focused-integration.mjs`

8/8 passed:
1. Hardcoded `smokecraft-360-main` venue ID removed from commerce page — PASS
2. Commerce page derives `venueId` from `journey.selectedVenue` — PASS
3. Venue Select: no-venue compact state shown before selection — PASS
4. Venue Select: no specials API call made without a venue — PASS
5. Ticket Tapper absent from Pairing Lab (full-bleed journey route, sampled) — PASS
6. Session Complete: compact Ticket Tapper section present — PASS
7. Session Complete: no page-level horizontal overflow — PASS
8. No `TicketTicker.jsx` import/usage in touched files — PASS

This is a right-sized subset of the originally-specified 25-item list —
covering venue-ID correctness, no-venue safety, route-scope exclusion,
presence on the two new routes, overflow, and the TicketTicker
prohibition. Items not separately scripted this pass (cross-venue A/B
comparison, expired/disabled/out-of-stock end-to-end, duplicate-fetch
detection under route rerender) are covered by manual code review
(documented in `SMOKECRAFT_TICKET_TAPPER_FOCUSED_INTEGRATION.md`) rather
than a dedicated automated check, and are disclosed as such rather than
claimed as separately tested.

## Regression suites run (`npm run build` + existing suites)

| Suite | Result |
|---|---|
| `npm run build` | PASS (build succeeded; one pre-existing unrelated esbuild warning in `src/pages/pos3/POS360TableManagement.jsx`, not touched this package) |
| `verify-smokecraft-full-approved-image-reconciliation.mjs` | 33/33 passed |
| `verify-crafthub-approved-image.mjs` | 22/22 passed |
| `verify-smokecraft-start-journey-crafthub-mvp2.mjs` | 18/18 passed |
| `verify-smokecraft-entry-flow-live.mjs` | 41/41 passed |
| `verify-smokecraft-authoritative-sequence.mjs` | 20/20 passed |
| `verify-all-smokecraft-assets.mjs` | 62/62 passed |

These are the exact suites specified for this focused package's Task 10
"Run:" list (the larger interaction/final-acceptance suites and the
remaining full-catalog suites from the original, superseded 17-phase
mandate were intentionally out of scope for this right-sized package).

## New failures

None.

## Known baseline failures

None encountered; all run suites were fully green both before (implicitly,
via passing regression) and after this package's changes.
