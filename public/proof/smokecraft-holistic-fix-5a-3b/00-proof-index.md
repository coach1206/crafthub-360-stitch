# Holistic Fix 5A-3B — Proof Index

Starting commit: `23fb1301`.

## Root cause (exact)

`src/components/system/BuildDiagnosticFooter.jsx`'s version-mismatch
banner: `role="alert"`, `position: fixed; top:0; left:0; right:0;
zIndex: 9999` — mounted once globally (`App.jsx` line 289), rendered on
every route whenever the frontend bundle's baked-in commit differs from
`/api/version`'s `backendCommit`. It had no `pointerEvents` override, so
its **entire bounding box** — a full-viewport-width strip at the top of
every screen, including the empty flex-gutter space around its centered
text, not just the visible text/button — intercepted pointer events on
any real control that happened to render underneath that strip.

This is a **shared component defect**, not a per-route issue: grep
confirmed every other `role="alert"` usage in the codebase (8 other
files) is inline/page-scoped, not a global `position:fixed` overlay — so
no route-specific z-index patch was applied; the fix targets the one
actual shared cause.

## Fix

`03-before-after-diff.txt` (component diff): the outer alert wrapper
gained `pointerEvents: 'none'`; the Refresh button gained `pointerEvents:
'auto'`. `role="alert"`, visible styling, and position are unchanged —
no visual redesign.

## Affected routes (confirmed via the failing logs)

Every route was theoretically affected whenever the banner was showing
(it's a global overlay), but the concretely observed symptoms were:
Session 1 (Welcome), 3, 4, 5, 6, 7, 8, 10, 12, 14, 15, 21, 22, 23, 24
(interaction sweep, "blocked by an overlay") and the Rewards Center
"← Back to Rewards" button (full-journey suite).

## Verification method

A controlled before/after via `git stash`: reverted this pass's fix,
rebuilt, restarted preview fresh, and ran the new deterministic
regression test (`verify-smokecraft-hf5a3b-alert-pointer-regression.mjs`,
which forces the mismatch state via `/api/version` network interception
rather than depending on real build drift) — it **FAILED** (6/7) on the
unfixed code with exactly the predicted symptom (`elementFromPoint`
resolving to the alert div itself in its empty gutter). Restored the
fix, rebuilt — the same test **PASSES** (7/7). This proves the test is a
real, meaningful regression guard, not a tautology, and that the fix is
the actual cause of the resolution.

## Contents

- `00-proof-index.md` — this file.
- `02-alert-pointer-regression-results.json` — 7/7 from the new
  deterministic regression test, run against the FIXED code.
- `03-before-after-diff.txt` — the exact component diff.
- `04-alert-pointer-safety-validator-output.txt` — 7/7 from the new
  build-blocking static validator.

## Interaction results (mouse / keyboard / pointer)

- Real mouse click on a control near the top of the viewport: PASS (was
  blocked pre-fix, confirmed via the before/after).
- The alert's own Refresh action: PASS, clickable via a real click at its
  exact center point.
- Keyboard Tab navigation reaches the Refresh button: PASS.
- `role="alert"` still present and announced on mount: PASS (unchanged).
- No new console error introduced: PASS.

## Regression suites re-run (targeted, not the full 109-route/viewport sweep)

- Interaction sweep: 88/88 (was 73/88 before this fix — the exact 15
  previously-failing sessions are now clean).
- Full journey: 106/107 (was 86/88 before this fix — the Rewards Center
  Back-button failure, the SC-D027 symptom, is gone). One separate,
  unrelated failure remains ("S4 asset fetch" — a network-timing issue,
  not a pointer-blocking symptom, reproduced consistently across 2 runs,
  disclosed as out of this pass's SC-D027-only scope, not fixed here).
- `npm run build` (all 13 prebuild validators including the new
  `validateSmokecraftAlertPointerSafety.mjs`, 7/7): clean.

## What this pass does NOT cover

- The separate "S4 asset fetch" full-journey failure (different symptom
  class — network timing, not pointer-blocking — out of SC-D027's scope).
- The full 109-route/five-viewport sweep (explicitly excluded by this
  mandate's own scope).
- Any of the other Holistic Fix 5A-3 gaps (tasting, Collections, Skill
  Tree, Leaderboard, reward-screen reconnection) — untouched, unchanged.
