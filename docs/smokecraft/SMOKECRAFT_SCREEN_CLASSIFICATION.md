# SmokeCraft Screen Classification — Holistic Fix 2

Generated from `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json`
(`node scripts/generateSmokecraftGameManifest.mjs`). Do not hand-edit the
counts below — regenerate the manifest and re-derive them.

## IMPORTANT: classification ≠ migration ≠ interaction-verification

Holistic Fix 2 closed the **classification** gap: all 108 routes carry a
real, source-derived classification with an `auditedIn` evidence citation.
Holistic Fix 2A closed a first **migration** batch: 7 screens (Welcome,
Leaderboard, Passport, Venue Selection, CraftHub, Challenge Hub, Rewards)
now actually import and render `SmokeCraftScreenShell` and use
`smokecraftNavigationRegistry` for every registered destination they
expose, verified via real browser interaction tests and a 5-viewport
sweep. **101 of 108 routes remain classified-but-not-migrated** — see
`SMOKECRAFT_MIGRATION_QUEUE.md` for the exact remaining groups.

Classification taxonomy (five real values, all in active use):

- **full-live-react** — real component, real state, real backend or real
  local computation; no baked mockup image driving the layout.
- **clean-image-shell** — an approved image rendered via
  `SmokeCraftImageBoundsOverlay` (or the equivalent `SmokeCraftAssetRoute`
  hotspot pattern), with percentage-positioned live controls overlaid on
  top.
- **instructional-image** — an approved image used purely as reference
  material, or an honest auto-advancing transition screen, with no
  interactive hotspots.
- **alias-redirect** — a `<Navigate>` route with no screen of its own.
- **unsafe-full-mockup** — a baked image that visually implies interactive
  controls with no live control behind them. **0 found** — every instance
  this operation has found (SC-D001, SC-D010, SC-D011, SC-D012, SC-D013)
  was already fixed in earlier prompts.

## Current counts (108 total routes under `/smokecraft`)

| Classification | Count |
|---|---|
| full-live-react | 72 |
| clean-image-shell | 18 |
| alias-redirect | 14 |
| instructional-image | 4 |
| unsafe-full-mockup | 0 |
| **unclassified** | **0** |
| **fully migrated (SmokeCraftScreenShell + nav registry)** | **23** (7 Holistic Fix 2A + 16 Golden Box, Holistic Fix 2B) |

## How the 78 previously-unclassified routes got classified this pass

`scripts/generateSmokecraftGameManifest.mjs` now runs a real, source-derived
classifier for every route not already in the hand-curated `KNOWN_AUDITED`
table (the 33 routes this operation has actually put a real browser in
front of). For each remaining route it resolves the real component file via
`App.jsx`'s own import statement (including `lazy()` imports into
subdirectories like `src/pages/smokecraft/goldenBox/*.jsx`), then greps
that file for real signals:

- `SmokeCraftImageBoundsOverlay` or `SmokeCraftAssetRoute` + hotspot
  `onClick` → `clean-image-shell`
- `<button`, `onClick=`, `<input`, `<select`, `<textarea`,
  `SmokeCraftNavBar` with `onPrimary=`/`onSecondary=`, or `ComingSoon` →
  `full-live-react`
- `SmokeCraftAssetScreen` alone with none of the above → `instructional-image`
- no controls at all but calls `navigate(...)` unconditionally →
  `instructional-image` (auto-advancing transition screen)
- `<Navigate>` → `alias-redirect`

10 routes needed a manual read this pass because the automated heuristic's
first version had 2 real gaps, both fixed in the generator itself rather
than hand-patched in the output: (1) `lazy()`-imported components living in
a subdirectory under a different local alias than their own internal
function name were not being resolved at all — fixed by resolving through
the import statement instead of grepping for a matching function name; (2)
controls supplied via `onClick:` object-property syntax (the
`SmokeCraftAssetRoute` hotspot pattern) and via `SmokeCraftNavBar`'s
`onPrimary`/`onSecondary` props were invisible to the original
JSX-attribute-only regex — fixed by adding both patterns explicitly.

## What Holistic Fix 2 did NOT do (disclosed, not fabricated)

- Did not individually browser-interaction-test the ~70 supporting routes
  that were only source-classified this pass (Golden Box's 16 routes,
  Origins/Curation/Leaf-Challenge's 9, the Pairing-adjacent 5, etc.) — only
  the pre-existing 33 already-audited routes plus 3 newly-migrated screens
  (Welcome, Leaderboard, Passport) have real click-tested evidence.
- Did not migrate any screen other than Welcome/Leaderboard/Passport onto
  the shared navigation registry, and migrated **zero** screens onto
  `SmokeCraftScreenShell` (the shell contract exists but is still adopted
  by 0 real screens — building a screen and swapping its live/error/empty
  presentation is a real behavior change that needs individual visual
  regression proof per screen, not a batch find-and-replace).
- Did not resolve the Golden Box / Origins-Curation-module / Pairing-
  adjacent / remaining-standalone groups from the migration queue.

See `SMOKECRAFT_MIGRATION_QUEUE.md` for the exact remaining work, updated
this pass to reflect what's now classified vs. what's still unverified.
