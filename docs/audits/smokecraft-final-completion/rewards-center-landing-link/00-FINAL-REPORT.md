# 00 — Final Report: Approved Rewards Center Landing Link

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `9501dff3ad8ca028d19f29096c70a9d27ccdbb7a` — verified local=remote, clean tree, before this pass.

## Phase 1 audit finding: the objective was already fully built by earlier passes

Per this mandate's own instruction to audit before changing code, reuse existing architecture, and not create duplicate Rewards routes/cards/navigation controls — a full audit of the current source found every core requirement already implemented and correctly wired by two earlier passes ("Approved Asset Control Plane" and "Final Sequence and CraftHub Route Correction"):

- **Landing entry**: the approved `smokecraft-landing.png` image already contains a baked "REWARDS / Earn. Unlock. Enjoy." card in its own bottom navigation bar — the exact title and copy this mandate requests, already part of the approved artwork itself, not something to add.
- **Live control**: that card is wired via `<StaticHotspot label="Rewards" onClick={() => runAction(ACTIONS.REWARDS)} .../>` in `src/pages/SmokeCraft.jsx`, calling the one canonical `resolveSmokeCraftLandingAction` resolver — no inline route string, no duplicate control.
- **Asset registry**: `SC_ASSETS.rewardCenter` in `src/constants/smokecraftAssets.js` already maps to `${RAW}/rewards/Reward%20Center.png` — resolving to exactly `public/assets/smokecraft/rewards/Reward Center.png`, the exact required path, filename, and case, with spaces correctly percent-encoded per this registry's established convention. Not renamed, not moved, not substituted.
- **Route**: `/smokecraft/rewards-center` in `src/App.jsx` renders the real, live `RewardsCenter.jsx` component — not a placeholder, not a static poster.
- **Live screen**: `RewardsCenter.jsx` already renders the approved `Reward Center.png` as its full visual shell (via `SmokeCraftImageBoundsOverlay`, the established non-destructive pattern), with real values placed into the image's own designated blank zones (four point circles, a tier ring), an honest "no venue reward catalog is connected" message in the image's own blank "MY REWARDS" zone, a live Back-to-Journey control, and a live version of the image's own bottom navigation bar.

Given this, this pass made **no changes to `RewardsCenter.jsx`, `SmokeCraft.jsx`, or the asset registry** — doing so would have violated this mandate's own Phase 1 instructions ("reuse the existing architecture," "do not create duplicate Rewards routes, cards, or navigation controls," "do not redesign unrelated landing-page sections") and the broader, repeatedly-reinforced rule from prior passes that approved images are the visual source of truth and must not be supplemented with a second Claude-composed layout.

## Why the detailed Phase 4 data-shell list (My Rewards tabs, Today at Your Venue, QR codes, redemption codes, venue validation, etc.) was not added

The approved `Reward Center.png` is an explicit overlay *template* with a fixed, already-mapped set of blank zones: four point circles, one tier ring, one "MY REWARDS" detail panel, and its own bottom nav bar. It has no blank zones reserved for tabs, a venue-offer carousel, QR codes, or redemption-code fields. Building those as new Claude-composed sections stacked around the approved image would exactly reproduce the "giant black content block" / "second dashboard" defect this operation's prior passes found and removed from this same screen. No real venue-rewards backend exists (confirmed across multiple prior passes) to populate any of those fields with genuine data, and this mandate itself requires "blank, neutral live shells until real data exists" — the honest, correct current state is exactly that: the image's own "MY REWARDS" zone already carries a real, honest, live-rendered message ("No venue reward catalog is connected to this build yet, so no offers can be listed") rather than fabricated tabs pointing at nothing. This is disclosed here explicitly rather than silently treated as out of scope.

## Verified live (18/18, new suite)

- The Landing Rewards entry exists, is not permanently marked as the current page, and clicking it opens `/smokecraft/rewards-center`.
- Rewards Center renders the approved image — rendered sha256 matches the approved file on disk exactly.
- No fake venue names, reward totals, or redemption codes render anywhere.
- The honest blank-state message renders correctly.
- Keyboard focus lands on a real interactive element (Tab reaches a real `<button>`).
- Back to Journey returns to `/smokecraft`.
- Direct deep-link and refresh both correctly preserve the Rewards Center route.
- Rankings, Passport, and CraftHub destinations are all unaffected (no regression).
- No horizontal overflow at any of the 4 required desktop viewports (1024×768, 1280×800, 1366×768, 1440×900).
- No blocking console error.

## Tests

`verify-smokecraft-rewards-center-landing-link.mjs` — 18/18.

## Regressions

| Suite | Result |
|---|---|
| `verify-smokecraft-entry-sequence-and-crafthub.mjs` | 32/33 (1 failure is the repo owner's own unrelated `public/assets/smokecraft/pairing/.gitkeep` addition between passes — an added file, not a modified/removed approved asset, not caused by this pass) |
| `verify-smokecraft-approved-landing-control-plane.mjs` | 62/62 |
| `verify-smokecraft-canonical-runtime.mjs` | 19/19 |
| `verify-smokecraft-canonical-journey-authority.mjs` | 25/25 |
| `verify-smokecraft-zero-old-visuals.mjs` | 20/20 |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 |
| `npm run build` | pass |

## Build / startup / health

`npm run build` passes. Backend health 200. Preview server 200.

## Files changed

New only: `verify-smokecraft-rewards-center-landing-link.mjs`, `public/proof/smokecraft-rewards-center-landing-link/**`, this documentation. **No `src/` file was modified** — the objective was already fully and correctly implemented.

## Remaining blockers

None for this pass's actual scope. No real venue-rewards backend exists (unchanged, disclosed across multiple prior passes) — the honest empty state is the correct current behavior, not a defect. Live Railway deployment verification remains outside this session's reach (unchanged, confirmed network block).

**Status: Landing already correctly links to the live Rewards Center using the approved `Reward Center.png` asset, verified end-to-end this pass with real browser evidence, all required viewports pass, and the production build passes.**
