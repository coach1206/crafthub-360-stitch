# Package 7A — Test Evidence and Proof Screenshot Index

## Bugs found and fixed by this pass's own tests (before final green run)

1. **Stale scorecard after amendment** — `getOwnScorecard` originally filtered
   `WHERE sc.amended_from IS NULL`, which is backwards: the amendment row is the one *with*
   `amended_from` set. Fixed to `ORDER BY sc.created_at DESC LIMIT 1` with no such filter. Caught by
   a UI check expecting the judge's real amended score (8) but seeing the stale original (7).
2. **Missing ownership check** — `lockScorecard`/`voidScorecard`/`amendScorecard` had no check that
   the caller owns the scorecard; any authenticated user could act on any judge's scorecard by id.
   Fixed with a new `assertOwnsScorecard()` helper called first in all three functions. Caught by a
   test where judge B successfully locked judge C's scorecard (should have been denied).
3. **Missing `entryId` in lock/void audit log calls** — broke entry-scoped audit queries. Fixed by
   passing `scorecard.entry_id` from `transitionScorecard`'s return value.
4. **Test-methodology fix (not a code bug)**: an early test tried an invalid `locked → voided`
   transition; `SCORECARD_TRANSITIONS.locked` only allows `['amended']`. Fixed the *test* to void a
   genuinely `submitted`-state scorecard from a third judge instead.
5. **Result-shape mismatch caught in review, not by a failing test**: `ResultsExperience.jsx` was
   drafted assuming `normalized_avg`/`scorecard_count` fields; the real `golden_box_results` row only
   has `aggregate_score`/`placement`. Fixed before shipping.

## Package 7A suite — `verify-golden-box-package-7a.mjs`

**33/33 passed** (re-confirmed against `crafthub_pkg7a_probe`, migrations through 084, real
Express + Vite + Playwright/Chromium):

```
PASS — Setup: entry created
PASS — Setup: draft with presentation/defense saved
PASS — Setup: entry submitted
PASS — API: non-mentor denied mentor-review write (403)
PASS — API: mentor can save a review draft
PASS — API: mentor can submit the review
PASS — API: entrant can see the submitted mentor review
PASS — API: assigned judge sees their assignment
PASS — API: unassigned judge does not see this entry
PASS — API: assigned judge can view entry components + presentation
PASS — API: unassigned judge denied entry view (403)
PASS — API: judge submits real scorecard (DB status confirmed submitted)
PASS — API: scorecard lock succeeds
PASS — API: amendment without a reason rejected
PASS — API: amendment with a reason succeeds, creates a NEW scorecard row
PASS — DB: original scorecard preserved (not overwritten), now status=amended
PASS — DB: original scores untouched (still 7, not overwritten to 8)
PASS — API: void with a reason succeeds (from submitted state)
PASS — API: a different judge cannot lock judge C's scorecard (ownership enforced)
PASS — DB: lock/amend/void all produced real audit log rows
PASS — API: results computation runs without error after full lifecycle
PASS — UI: Judge Dashboard loads
PASS — UI: Judge Entry Review shows real submitted components
PASS — UI: Judge Entry Review shows the real blend defense text
PASS — UI: judge A's inputs correctly show their REAL previously-amended scores (8, not fabricated)
PASS — UI: a fresh, never-scored judge sees no default/prefilled score
PASS — UI: Mentor Review screen loads for an authorized mentor
PASS — UI: non-mentor sees an honest not-authorized message
PASS — UI: Results Experience shows entrant status
PASS — UI: Results Experience shows mentor feedback
PASS — UI: Results Experience has a real continue action to Leaderboard/Rewards
PASS — Handheld 390x844: Judge Entry Review no horizontal overflow
PASS — Test data removed
```

## Full regression (re-run this pass, `crafthub_pkg7a_probe`)

| Suite | Result |
|---|---|
| verify-golden-box-package-1.mjs | 36/36 |
| verify-golden-box-package-2.mjs | 22/22 |
| verify-golden-box-package-3.mjs | 24/24 |
| verify-golden-box-package-3-closure.mjs | 30/30 |
| verify-golden-box-package-4-rehydration.mjs | 14/14 |
| verify-golden-box-package-4-seed-soil.mjs | 17/17 |
| verify-golden-box-package-5-leaf-construction.mjs | 27/27 |
| verify-golden-box-package-5-closure.mjs | 30/30 functional (known chained rate-limiter artifact on one keyboard-focus check, previously proven clean in isolation many times this session) |
| verify-golden-box-package-6.mjs | 34/34 |
| verify-golden-box-package-6-closure.mjs | 32/32 |
| verify-golden-box-package-7a.mjs | 33/33 |
| verify-venue-management-command-hub-package-6b.mjs | 33/33 |

## Build

`npm run build` — **PASS** (1951 modules transformed, `dist/` produced). One pre-existing esbuild
warning ("Duplicate key 'border' in object literal") traced to `src/components/pos3/TouchCard.jsx` —
unrelated to Package 7A, not a build failure, not modified this pass.

## Proof screenshots — `public/proof/smokecraft-package-7a/`

| File | Route | Viewport | State | Data source | Pass/fail |
|---|---|---|---|---|---|
| 01-judge-dashboard.png | /smokecraft/golden-box/judge | 1280x900 | Judge A's real assignment list | Live DB via API | PASS |
| 02-judge-entry-review.png | /smokecraft/golden-box/judge/entries/:id | 1280x900 | Real submitted components + blend defense text | Live DB via API | PASS |
| 03-mentor-review.png | /smokecraft/golden-box/mentor/entries/:id | 1280x900 | Authorized mentor's review form | Live DB via API | PASS |
| 04-results-experience.png | /smokecraft/golden-box/results/:id?entryId=... | 1280x900 | Released results + mentor feedback | Live DB via API | PASS |
| 05-judge-review-handheld.png | /smokecraft/golden-box/judge/entries/:id | 390x844 | No horizontal overflow | Live DB via API | PASS |

No fabricated/placeholder states were captured — every screenshot reflects live server/DB output from
the same run that produced the 33/33 result.
