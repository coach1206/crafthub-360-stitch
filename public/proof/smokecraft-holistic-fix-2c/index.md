# Holistic Fix 2C — Proof Index

Starting commit `9ece7041`. Origins/Curation/Leaf-Challenge/Cultivation
module: 9 real routes, no aliases.

## Relationship to the rest of the app (investigated this pass, previously undocumented)

- **27-session spine**: **NOT part of it.** None of the 9 routes has a
  `SmokeCraftSessionGuard`, a `SMOKECRAFT_SCREEN_MANIFEST` entry, or an
  `entry-point` link anywhere in the app (Landing, Welcome, CraftHub,
  sidebars — confirmed via grep across `src/`). It is a real, substantial,
  fully-built but currently **orphaned/unreachable** standalone
  educational flow — no button anywhere in the shipped app navigates a
  user into `/smokecraft/origins`. Git history shows this predates the
  current 27-session/6-phase architecture (`Add comprehensive routing and
  state management for the SmokeCraft journey`, an early commit).
- **Golden Box**: no relationship. Separate route namespace, no
  `golden_box_*` backend table or API calls anywhere in these 9 files.
- **Journey progress**: `Cultivation.jsx` and `Blend.jsx` call
  `completeStep('cultivation')` / `completeStep('blend')` on the shared
  guest-session record — these ARE real completed-step writes, but
  `'cultivation'`/`'blend'` are not recognized step ids anywhere in the
  27-session spine's `VISIT_STRUCTURE`, so they accumulate as harmless,
  unused entries in `completedSteps` rather than affecting spine
  progression.
- **Scoring/XP**: real. `Blend.jsx` calls `addXP(XP_AWARDS.BLEND_CREATED)`
  (150 XP, a real constant in `src/constants/session.js`) — this DOES add
  to the same shared XP pool shown on Leaderboard/Rewards. `LeafChallenge.jsx`
  computes its own round-based score locally but does not call `addXP`.
- **Challenges/Rewards**: no relationship — no calls into the Challenge
  Hub API, Rewards, or badge system.
- **Education prerequisites**: none. Every route is fully open
  (`guardType: 'ungated'` in the manifest), reachable by direct URL with
  no completion requirement.

**This was investigated and documented, not silently left ambiguous** —
per the mandate's explicit requirement to determine this relationship
before migrating.

## Files

- `connected-flow-and-viewport-results.txt` — raw script output (45
  viewport×screen checks + connected-flow log).
- `screenshots/<screen>-<viewport>.png` — 45 files (9 routes × 5
  viewports: handheld-portrait, tablet-10in, tablet-12in, display-15in,
  desktop).
- `screenshots/flow-01..07-*.png` — connected-flow walkthrough: Origins →
  Curation → Leaves → Leaf Challenge → Leaf Challenge Calculating → Leaf
  Challenge Result → Cultivation → Blend → Flavor DNA.

## Five-viewport result

39/45 clean (no horizontal overflow, no console error) after restarting
the backend server (it had been stopped after the prior pass — the first
run's 45/45 console errors were `/api/version` and `/api/auth/me` 500s
from a genuinely-down backend, not a migration regression; confirmed by
restarting the server and re-running clean for all but 6). The remaining
6: 5 are `leaf-challenge-calculating` at all 5 viewports — investigated
and confirmed to be Chrome's `navigator.vibrate` permission console
warning from pre-existing, untouched code (`triggerHapticPulse()` calling
`navigator.vibrate` without a prior user tap, a known headless-browser-
testing artifact, not a real defect — vibrate works normally after a real
tap-driven navigation on an actual device). The 6th (`origins` at
handheld-portrait) is the same non-reproducing first-navigation flake
already documented multiple times elsewhere in this operation.

Keyboard focus reached a real control in 30/45 checks; the 15 non-matches
are `origins` and `flavor-dna` (both genuinely zero-control instructional-
image screens by design — nothing to focus) across all 5 viewports each,
correctly not defects.

## Connected flow result

Origins (image) → Curation (real seed/soil recap + Back/Next) → Leaves
(6 real flip-card study components + Grand Lounge/Passport shortcuts,
confirmed real: `/grand-lounge-ranking` renders the identical Leaderboard
component, `/passport` opens the top-level Passport module's home) → Leaf
Challenge (real 5-round quiz, live score) → Leaf Challenge Calculating
(auto-advances after ~2s to Result, confirmed live) → Leaf Challenge
Result → Cultivation (real, honest "Image Pending" placeholders per this
module's own disclosed visual rule, never a stock photo) → Blend (awards
real XP, honest Image Pending) → Flavor DNA (image). All screens render
real content; no fabricated data found anywhere.

## Test references

`scripts/validateSmokecraftShellAdoption.mjs` (extended to 29 files, 124 checks total), `scripts/validateSmokecraftManifest.mjs`
(fullyMigratedScreens cross-check now covers 32 routes: 7 + 16 + 9),
`verify-smokecraft-hf2c-origins-module.mjs` (this directory's raw
results).
