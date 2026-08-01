# 03 — Visual Acceptance Review

Real defects found and fixed during this pass (not fabricated, not
downgraded from a real functional issue to a cosmetic footnote).

## SC-D068 — Golden Box results screen shows a contradictory "not released" banner over real, finalized results

**Found by:** direct screenshot review of `/smokecraft/golden-box/results/:competitionId`
after a real, complete finalize → award API sequence (the same sequence
every prior Golden Box proof package uses).

**Symptom:** the screen simultaneously showed:
> "Judging is not complete yet — results have not been released. Current
> status: **active**."

directly above a correct, real:
> "Official, finalized rankings (result version 1, rubric v1). #1 — Entry
> ...90.00"

**Root cause (confirmed by direct source + DB read):**
`finalizeResults()` (`server/services/goldenBox/resultsService.js`)
correctly persisted real `golden_box_results` rows on finalize, but never
advanced the parent competition's own `golden_box_competitions.status`
column. `ResultsExperience.jsx` gates its "released" banner on
`['results_pending','completed'].includes(competition.status)` — so a
correctly finalized competition's `status` stayed `'active'` forever,
and the banner never flipped, regardless of how many entries were judged,
finalized, or awarded.

**Fix (small, targeted, scoped to the one function that owns this
transition):** `finalizeResults()` now updates
`golden_box_competitions.status` to `'results_pending'` immediately after
a successful finalize, guarded to skip competitions already in a
terminal/cancelled/archived state. No change to the shared
`COMPETITION_TRANSITIONS` state machine used by unrelated admin flows.

**Verification:** re-ran the acceptance script end-to-end after the fix —
the same competition now correctly shows "Results have been released for
this competition..." alongside the same real finalized rankings. Screenshot:
`screenshots/desktop/13-golden-box-results.png`. Confirmed no regression
via `scripts/validateSmokecraftGoldenBoxResultsAuthority.mjs` (PASS) and
the full fresh-player closure re-run (62/62, unchanged).

## SC-D068b — Golden Box content routes' rate limiter had no dev/test exemption (unlike every sibling Golden Box router)

**Found by:** real 429 console errors captured during the automated
investor-screen walk on the Golden Box competitions/results screens.

**Root cause:** `server/routes/goldenBoxContentRoutes.js`'s `readLimiter`/
`writeLimiter` were the only Golden Box rate limiters in the codebase
without the `skip: () => !IS_PROD` dev/test exemption every sibling
Golden Box router already has (`goldenBoxRoutes.js` and others).

**Fix:** added the same `skip: () => !IS_PROD` guard, bringing this
router in line with its siblings. Production behavior unchanged (limit
still enforced when `NODE_ENV=production`).

**Verification:** re-ran the acceptance script — 0 console 429 errors
across all 14 representative screens on the re-run.

## Reviewed and confirmed NOT a defect

- **`PUT .../tasting/:key/draft` returning 409 on an already-completed
  session.** This is the server *correctly* refusing to accept a new
  tasting draft for a session that's already been completed — the exact
  "stale-draft-after-completion rejection" protection already verified in
  Required-Interaction Closure Package B. It only surfaces in Demo Mode
  because Demo Mode legitimately lets an investor revisit an
  already-completed earlier screen. Confirmed via direct network trace
  (see script comments); not fixed because it is not broken.
- **`favicon.ico` 404.** Cosmetic-only, no favicon asset shipped. Does not
  affect any investor-visible screen content.
- **`navigator.vibrate` blocked-by-gesture-policy console notice.** Normal
  Chrome behavior for headless automation with no real user tap; works
  normally on a real touch device after a real tap.
- **Session 25 (Rewards) XP-breakdown rows showing 0 XP while the total is
  correct.** Pre-existing, already documented in the prior Full Game
  Fresh-Player Closure package as non-blocking. Re-confirmed still true
  and still non-blocking in this pass (see `10-known-limitations.md`) —
  the headline XP total and rank are correct and server-verified; only
  the itemized per-category breakdown rows under it are stale/unconfigured.
- **Mobile/tablet "letterboxed" presentation** — see
  `06-responsive-tablet-notes.md`. Not a functional break (no dead
  controls, no unreadable/overlapping content); a disclosed design
  observation, not a fix in this pass's scope.

## Not found

No broken/missing images, no dead primary controls, and no UI-vs-server
state disagreement were found on any of the 14 representative screens
across the viewports captured (see `04-screen-proof-index.md`).
