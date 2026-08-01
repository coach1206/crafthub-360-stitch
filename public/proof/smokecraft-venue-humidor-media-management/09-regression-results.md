# Regression Results

## Media feature tests (this pass — new)

- `verify-smokecraft-venue-humidor-media-1-api.mjs` — **30/30 passed** (`03-api-test-results.txt`)
- `verify-smokecraft-venue-humidor-media-1-browser.mjs` — **15/15 passed**, 3 viewports (desktop/tablet/mobile), 0 console errors other than a pre-existing favicon 404 (`05-browser-test-results.txt`, `screenshots/`)

## Venue Humidor authority validators (all pre-existing, all still pass)

| Validator | Result |
|---|---|
| `validateSmokecraftVenueHumidorAuthority.mjs` | PASS |
| `validateSmokecraftVenueHumidorAdminAuthority.mjs` | PASS |
| `validateSmokecraftVenueHumidorCheckoutAuthority.mjs` | PASS |
| `validateSmokecraftVenueHumidorCustomerAuthority.mjs` | PASS |
| `validateSmokecraftVenueHumidorFulfillmentAuthority.mjs` | PASS |
| `validateSmokecraftVenueHumidorPickupAuthority.mjs` | PASS |
| `validateSmokecraftVenueHumidorPostPurchaseAuthority.mjs` | PASS |
| `validateSmokecraftVenueHumidorRecommendationAuthority.mjs` | PASS |

## Golden Box regression (pre-existing, all still pass)

| Validator | Result |
|---|---|
| `validateSmokecraftGoldenBoxAuthority.mjs` | PASS |
| `validateSmokecraftGoldenBoxAwardsAuthority.mjs` | PASS |
| `validateSmokecraftGoldenBoxJudgingAuthority.mjs` | PASS |
| `validateSmokecraftGoldenBoxResultsAuthority.mjs` | PASS |

## Venue Humidor API regression (spot-checked, representative)

| Script | Result |
|---|---|
| `verify-smokecraft-venue-humidor-1a-api.mjs` | 32/32 passed |
| `verify-smokecraft-venue-humidor-1b1-api.mjs` | 32/32 passed |

## Full Game Fresh-Player Closure

`scripts/verify-smokecraft-full-game-fresh-player.mjs` — **62/62 passed**
(see `10-fresh-player-closure.log`). Drives one fresh guest identity
through all 27 curriculum sessions, the full Golden Box competition
lifecycle, and cross-player isolation — no regression from this pass's
media/schema changes.

## Final Gameplay Acceptance

`scripts/verify-smokecraft-final-gameplay-acceptance.mjs` — see
`11-final-gameplay-acceptance.log` for the full, real result. This
pass added no changes to curriculum/Golden Box/scorecard screens; any
failures in that log are either the two carried-forward, pre-existing,
explicitly out-of-scope visual issues (mobile/tablet letterboxing,
Golden Box Rules text overlap) or transient rate-limiting from running
this script concurrently with the system-wide responsive sweep against
the same local dev server in this sandbox — re-run in isolation where
noted.

## System-wide responsive-regression validator (`npm run build` gate)

`scripts/validateSmokecraftResponsive.mjs`, backed by
`verify-smokecraft-hf3-responsive-inventory.mjs` re-swept against all
131 live routes (130 pre-existing + this pass's new
`/smokecraft/admin/humidor/media` route) — see `12-build.log` for the
full `npm run build` output including this validator's final PASS/FAIL
line.

## Build

Full `npm run build` (all prebuild validators, including
`validateSmokecraftManifest.mjs`, `validateSmokecraftControlCoverage.mjs`,
and `validateSmokecraftResponsive.mjs`) — see `12-build.log`.
