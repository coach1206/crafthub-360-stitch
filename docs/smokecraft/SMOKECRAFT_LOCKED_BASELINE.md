# SmokeCraft Locked Baseline — Prompt 1

Baseline commit: `d6469504a2a83ab4acfb27e89a25064d505d4d55` (tag: `smokecraft-audit-baseline-d646950`)

Items below are proven correct via passing automated test + real rendered
screenshot (not source-reading alone), at this exact commit. **Later prompts
must not change these unless a failing requirement or test proves the change
necessary.**

## Locked: Entry flow (Landing → Guest Pass → Identity → Venue → Welcome)

- Route: `/smokecraft` (Landing) — asset `smokecraft-landing.png`, hash
  verified equal on-disk vs rendered in `verify-smokecraft-full-journey-sequence-and-assets.mjs`.
- Route: `/smokecraft/enroll` (Guest Pass) — asset `smokecraft-guest-pass.png`, hash verified.
- Route: `/smokecraft/identity` — required gate, sequence fixed and verified (commit `b5f6fa6b`).
- Route: `/smokecraft/venue-select` — asset `Venue Selection 11.png` (cropped-shell fix, commit `d6469504`), hash verified unchanged (crop is CSS-only, file untouched).
- Route: `/smokecraft/welcome` — asset `session 1.png`, hash verified.
- Test: `verify-smokecraft-full-journey-sequence-and-assets.mjs` — 99-100/101-102 passing across the last several runs (one pre-existing, disclosed asset-status assertion excluded, see defect register).
- Test: `verify-smokecraft-final-three-approved-assets.mjs` — 17/17 passing.

## Locked: 27-session curriculum spine

- `VISIT_STRUCTURE` (src/constants/session.js): exactly 27 sessions across 6 phases — **do not merge, split, renumber, or reorder**.
- All 27 sessions confirmed to resolve to their canonical route/component, correct phase marker, and an on-disk approved asset (`scripts/smokecraft27SessionAudit.mjs`, this pass — see `SMOKECRAFT_27_SESSION_AUDIT.md`).
- Merged/shared sessions S9, S13, S17, S18, S20, S26 intentionally have no dedicated component registry entry (they render via their primary session's shared component) — this is expected, not a defect.

## Locked: previously-investigated screens (screenshot-verified, commit `692e7ccf` and `d6469504`)

- `/smokecraft/crafthub` — renders its own distinct "CRAFTHUB 360 — Venue Table Experience" screen. Proof: `public/proof/smokecraft-full-route-image-audit/02-crafthub.png`.
- `/smokecraft/leaderboard` — renders live sidebar-nav leaderboard, honest "0 XP / Guest (You)" state, no baked scores. Proof: `public/proof/smokecraft-full-route-image-audit/03-leaderboard.png`.
- `/smokecraft/welcome` — correctly uses `session 1.png`. Proof: `public/proof/smokecraft-full-route-image-audit/04-welcome.png`.
- `/smokecraft/venue-select` — clean crop, no bleed-through. Proof: `public/proof/smokecraft-full-route-image-audit/05-venue-select-fixed.png`, `06-venue-select-fixed-tablet.png`.

## Regression protections already in place

- `SC_ASSETS` is the single asset registry (`src/constants/smokecraftAssets.js`) — no page independently guesses an asset path.
- `SMOKECRAFT_SCREEN_MANIFEST` is the single screen registry, derived from `VISIT_STRUCTURE` — cannot silently drift.
- `getSmokeCraftEntryReadiness` is the single entry-gate authority.
- `resolveSmokeCraftLandingAction`/`resolveSmokeCraftEntryDestination` is the single Landing-navigation authority.
- Asset-hash equality assertions already exist in `verify-smokecraft-full-journey-sequence-and-assets.mjs` for every session with a registered asset, and in `verify-smokecraft-final-three-approved-assets.mjs` for the 3 most-recently-wired assets.

## Locked: shared game architecture (Holistic Fix 1 + 2)

- `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json` is the one canonical
  manifest for all 108 active `/smokecraft` routes — regenerate via
  `node scripts/generateSmokecraftGameManifest.mjs`, never hand-edit.
- `scripts/validateSmokecraftManifest.mjs` is wired into `npm run build`'s
  `prebuild` step and fails the build on: a route missing from the
  manifest, a duplicate screenId, an unevidenced live/clean-shell claim, a
  27/6 spine drift, a dangling curriculum asset reference, a
  navigation-registry destination that doesn't resolve, **any route left
  unclassified**, a broken legacy `<Navigate>` alias, or the commerce-alias
  group (`venue-commerce`/`order`/`ticket-tapper/staff-specials`) silently
  diverging to different components.
- `src/constants/smokecraftNavigationRegistry.js` is the one shared
  destination registry. `WelcomeExperience.jsx`, `Leaderboard.jsx`, and
  `SmokeCraftPassport.jsx` now consume it instead of local route literals
  (re-verified via real browser test, zero destination change) — do not
  reintroduce a local hardcoded route literal in these 3 files.
- `PAIRING` (`/smokecraft/pairing-lab`, S11) and `PAIRING_STANDALONE`
  (`/smokecraft/pairing`) are deliberately separate registry keys — do not
  collapse them into one.

## Locked: Holistic Fix 2A — 7 screens fully migrated onto the shared shell

- Welcome, Leaderboard, Passport, Venue Selection, CraftHub, Challenge Hub,
  and Rewards now import and render `SmokeCraftScreenShell` — none of them
  imports `SmokeCraftImageBoundsOverlay` directly anymore.
  `scripts/validateSmokecraftShellAdoption.mjs` (44 checks, wired into
  `npm run build`) fails if any of the 7 regresses to a direct import, if a
  registered navigation destination is reintroduced as a bare local
  literal, or if any of the 5 locked approved-asset references changes.
- Re-verified via a real 5-viewport browser test (35 checks): no
  horizontal overflow, keyboard focus reaches a real control, at handheld
  portrait / 10" tablet / 12" tablet / 15" display / desktop. Proof:
  `public/proof/smokecraft-holistic-fix-2a/`.
- `verify-smokecraft-final-three-approved-assets.mjs`'s Section C now
  accepts `SmokeCraftScreenShell mode="image-shell"` as an equally-valid
  instance of "the canonical overlay pattern" alongside a direct
  `SmokeCraftImageBoundsOverlay` import — do not revert that test to
  requiring the direct import only, since the shell's indirection is now
  the locked, intended pattern for these screens.

## Locked: Holistic Fix 2B — Golden Box family (16 routes) fully migrated

- All 13 Golden Box components (`GoldenBox.jsx`, `GoldenBoxStatus.jsx`,
  and 11 files under `src/pages/smokecraft/goldenBox/`) now import and
  render `SmokeCraftScreenShell` — none imports `SmokeCraftImageBoundsOverlay`
  directly. `scripts/validateSmokecraftShellAdoption.mjs` covers all 13
  (44 checks extended to include them).
- `GoldenBox.jsx`'s locked approved asset is `SC_ASSETS.goldenBox` — do
  not change it without a failing test requiring it.
- SC-D008 (the "Welcome has no approved asset" stale test assertion) is
  **fixed, not just suppressed** — `getManifestEntry('session-1').assetKey`
  is genuinely `'session1'` with `assetStatus: 'ok'`, so
  `verify-smokecraft-full-journey-sequence-and-assets.mjs` now correctly
  asserts `visualSource === 'user-approved'`. Do not revert this assertion
  back to expecting the no-asset state — that state has not been true
  since an earlier pass wired the real asset.

## Locked: Holistic Fix 2C — Origins/Curation/Leaf-Challenge/Cultivation module (9 routes)

- All 9 components now import and render `SmokeCraftScreenShell`.
  `scripts/validateSmokecraftShellAdoption.mjs` covers all 9 (extended to
  29 files total, 124 checks).
- **This module is confirmed orphaned/unreachable from the shipped app**
  (no `SmokeCraftSessionGuard`, no manifest entry, no entry-point link
  anywhere) and predates the 27-session spine. Do not assume it is
  reachable or tested by any spine-focused regression suite — it isn't,
  by design of those suites' own scope.
- `smokecraftNavigationRegistry.js` gained
  `SMOKECRAFT_PASSPORT_MODULE_DESTINATIONS.HOME` (`/passport`) and
  `SMOKECRAFT_EXTERNAL_DESTINATIONS.GRAND_LOUNGE_RANKING`
  (`/grand-lounge-ranking`, confirmed via source read to render the
  identical `Leaderboard` component as `/smokecraft/leaderboard`) — real,
  pre-existing destinations this module uses, not new inventions.

## Not yet locked / explicitly out of scope for this baseline

Everything not listed above (the remaining ~100 routes, all 27 sessions'
interaction/quiz/scoring internals, full four-viewport sweep beyond Venue
Selection, full static-vs-live classification beyond what's already
disclosed in existing code comments) is **not yet verified** and must not be
assumed correct — see `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` for what is
deferred to Prompts 2–6.
