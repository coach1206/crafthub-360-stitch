# Package 7A — Baseline, Backend Audit, and Build Map

**Consolidation notice**: the mandate's Step 19 lists 11 separate files (00–11). As in every prior
package this session, this pass consolidates that into 3 files, explicitly disclosed here:
- `00-PACKAGE-7A-BASELINE-AND-AUDIT.md` (this file) — baseline, backend audit, route/component map,
  mentor-review map, judge-workflow map, scorecard map, results-visibility map, image-future map
- `08-TEST-EVIDENCE.md` — test evidence + proof screenshot index
- `11-PACKAGE-7A-COMPLETION-REPORT.md` — rollback plan + final completion report

## Baseline (start of Package 7A)

- Branch: `recovery/smokecraft-codex-final`
- Commit at branch start: `aa0b9cf8` (no commits made this session — still true at time of this report)
- Prior status: `PACKAGE 7 BLOCKED — PACKAGE 8 NOT CLEARED`, user re-scoped remaining Package 7 work
  into 7A/7B/7C/7D; this document covers 7A only.

## Backend audit (Package 1, reused not rebuilt)

- **Competition states**: `draft, open, judging, results_pending, completed, cancelled` (existing).
- **Entry states**: existing lifecycle including `draft, submitted, finalist, winner, not_selected,
  disqualified`.
- **Judges**: `golden_box_judges` (user_id), `golden_box_judge_assignments` (competition_id, judge_id,
  entry_id) — no separate "judge" role; authorization is per-assignment (`isAssignedJudge`).
- **Scorecard states**: `draft → submitted → locked → amended`, `submitted/locked → voided`
  (`lifecycleService.js`, unmodified, `SCORECARD_TRANSITIONS` map).
- **Score categories** (real, unmodified): `construction, draw, burn, aroma, flavor, balance,
  complexity, progression, finish, creativity, rule_compliance, overall_impression`. Package 7A's
  judge-facing scorecard UI maps mandate category names (Blend, Construction, Draw, Burn, Flavor
  progression, Balance, Complexity, Pairing, Creativity, Presentation) onto these 12 real backend
  categories — no new score table, no duplicate category system.
- **Score validation**: `0 <= score <= maxScore` (default max 10), category must be in the valid set.
- **Aggregation**: `computeAggregateResult()` — read-side average from submitted/locked scorecards,
  written into `golden_box_results` (real shape: `aggregate_score`, `placement`,
  `disqualification_reason`, etc. — not `normalized_avg`/`scorecard_count`, a mismatch caught and
  fixed during this pass's own component authoring, before any test ran against it).
- **AI analysis**: `golden_box_ai_analyses` — structurally separate table, `scorer_type` in
  `golden_box_scores` restricted to `human_judge/administrative_adjustment/tie_break/disqualification`
  — AI has no code path into official scores.
- **Recipe/result visibility**: `visibilityService.getVisibility()` (existing, reused by both the
  entrant `getEntry` handler and the new judge-facing `getEntryForJudge` handler).
- **Disqualification**: `disqualifyEntry()` — existing, unmodified.

## Gaps found (what Package 7A actually had to build)

1. No mentor-review persistence at all — `golden_box_feedback` existed as a schema but had no service
   or route. Built `golden_box_mentor_reviews` (migration 084) + `mentorReviewService.js` instead of
   reusing `golden_box_feedback`, because the mandate's 10 named mentor-review fields (readiness,
   strengths, component/construction/flavor/pairing/presentation feedback, common mistakes,
   improvement areas, questions, final guidance) don't map cleanly onto the generic free-text
   `golden_box_feedback` row, and reusing it would have meant overloading a differently-shaped table.
2. No judge-facing dashboard query — judges could not see their own assignment list. Added
   `getJudgeAssignments()`.
3. No judge-facing entry-review endpoint — judges had no route to fetch an entry's submitted
   components/presentation. Added `getEntryForJudge` controller, reusing the existing
   `visibilityService`.
4. `lockScorecard`/`voidScorecard`/`amendScorecard` existed in name only in the original Package 1
   scope note but had no route exposure and (once written) had a real ownership gap — see
   `08-TEST-EVIDENCE.md` for the three bugs this pass's own tests caught and fixed.
5. No frontend at all for: judge dashboard, judge entry review/scorecard, mentor review, or a real
   results experience beyond a placeholder.

## Route and component map (created this pass)

Backend routes added to `server/routes/goldenBoxRoutes.js`:
```
GET  /api/smokecraft/golden-box/judges/me/assignments
GET  /api/smokecraft/golden-box/judges/me/entries/:entryId
POST /api/smokecraft/golden-box/scorecards/:scorecardId/lock
POST /api/smokecraft/golden-box/scorecards/:scorecardId/void
POST /api/smokecraft/golden-box/scorecards/:scorecardId/amend
POST /api/smokecraft/golden-box/entries/:entryId/mentor-review/draft
POST /api/smokecraft/golden-box/entries/:entryId/mentor-review/submit
GET  /api/smokecraft/golden-box/entries/:entryId/mentor-review/draft
GET  /api/smokecraft/golden-box/entries/:entryId/mentor-reviews
```
(`scorecards/:scorecardId/submit` already existed from Package 1 and is reused unmodified.)

Frontend routes added to `src/App.jsx` under the existing `golden-box` block:
```
/smokecraft/golden-box/judge                       → JudgeDashboard.jsx
/smokecraft/golden-box/judge/entries/:entryId       → JudgeEntryReview.jsx
/smokecraft/golden-box/mentor/entries/:entryId      → MentorReview.jsx
```
`ResultsExperience.jsx` (existing route, rewritten this pass) now reads `?entryId=` and shows real
entrant status/score/mentor feedback instead of a placeholder.

## Mentor-review map

- Table: `golden_box_mentor_reviews` (migration 084) — `draft/submitted/amended` status,
  `amended_from` self-FK for audit history, `visibility` column (`entrant/judges/administrators`,
  currently only `entrant` is surfaced by the entrant-facing GET route).
- Authorization: `requireMentor` middleware (pre-existing, checks
  `role === 'human_mentor' || role === 'founder_level_0'`) gates all mentor-write routes.
- Entrant-facing GET only ever returns `submitted`/`amended` rows — a mentor's draft is never visible
  to the entrant.

## Judge-workflow / scorecard map

- Judge dashboard → judge entry review → scorecard (submit/lock/amend/void) — all gated by
  `isAssignedJudge`/`assertOwnsScorecard`, both reused/added in `judgingService.js`.
- No new "judge" role was invented — a judge is anyone `requireAuth`'d who is listed in
  `golden_box_judge_assignments` for that entry, matching Package 1's existing design.

## Results-visibility map

- `ResultsExperience.jsx` only renders release-gated content: `resultsReleased` derives from
  `competition.status in (results_pending, completed)`.
- Individual score/placement values come only from `golden_box_results` via the existing
  `/results` endpoint (unmodified), never recomputed in the browser.
- Mentor feedback shown only from the same entrant-scoped `mentor-reviews` GET used elsewhere —
  no separate/duplicate visibility path.

## Image-future integration map

No new images were generated or substituted. All Package 7A screens (Judge Dashboard, Judge Entry
Review, Mentor Review, Results Experience, and the Presentation/Defense step in EntryWorkspace) are
text/data-only layouts with no image slots filled — future visuals remain tracked as
`AWAITING_USER_ASSET` for:
- Golden Box Blend Review / Blend Defense
- Golden Box Judge Dashboard / Judging Scorecard
- Golden Box Technical / Flavor / Pairing Review
- Golden Box Finalist Card / Winner Card
- Golden Box Results
- Golden Box Mentor Review

No `SC_ASSETS` keys or GitHub asset paths were invented this pass since none of these screens
currently reference an image slot at all (a future pass adding the slots should mark them
`AWAITING_USER_ASSET` at that time, per the permanent image rule).
