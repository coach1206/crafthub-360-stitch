# Holistic Fix 5C-2A — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: d571add8

## Goal

Close only the Golden Box judge-assignment and scorecard-scoring
foundation. No final awards, no competition leaderboard, no Venue
Humidor, no full-route/five-viewport sweeps.

## Judge routes audited

`server/routes/goldenBoxRoutes.js` judge-facing routes and their
controller/service: `judgingService.js` (assignment, rubric,
draft/final scorecard handling, amend/void/lock), the judge-facing
screens `JudgeDashboard.jsx` and `JudgeEntryReview.jsx`, and the
shared `goldenBoxApiClient.js` adapter. Non-judging Golden Box routes
(guest entry/draft/submit) were audited only for their existing
regression suite, unchanged this pass.

## Rubric result

Formalized the already-approved 12-category rubric
(`JudgeEntryReview.jsx`'s `CATEGORIES` / `judgingService.js`'s old
`VALID_CATEGORIES`) into a real, versioned table
(`golden_box_rubric_criteria`, migration 103) — equal weight (1),
range 0–10, no invented or conflicting criteria. See
`SMOKECRAFT_GOLDEN_BOX_JUDGING_RULES.md`.

## Judge-assignment result

Server-authoritative: only `requireRole('admin')` may assign; entry
must be `submitted`/`locked`/`under_review` (never a draft); duplicate
assignment is a real DB no-op; judge self-assignment is rejected using
the real server-resolved `entry.user_id`; venue-scoped competitions
require a real active `venue_memberships` row. Every assignment
records `assigned_by`. All verified live in
`verify-smokecraft-hf5c2a-judge-assignment-api.mjs` (11/11), including
a REAL authenticated self-assignment attempt and a REAL venue
membership fixture (not fabricated identifiers).

## Authorization result

Route-level role gate plus service-level eligibility/self-assignment/
venue-scope checks, all verified live with real denial responses
(403/409), never a client-asserted permission.

## Scorecard draft result

New `saveScorecardDraft()` (previously did not exist — the only path
was straight to final submission): accepts partial scores, never
transitions status, `expectedVersion` optimistic concurrency with a
real `409 stale_version`, `idempotencyKey` dedupe. Verified live: save
→ reload rehydrates the real saved score.

## Server-scoring result

`submitScorecard()` requires every rubric criterion present (422
otherwise) and computes the weighted total server-side —
`sum(score*weight)/sum(maxScore*weight)*100`. Verified live: 8/10
across all 12 equal-weight criteria persisted as exactly `80.00`, with
a fabricated client `weightedTotal:1, totalScore:999` in the request
body proven completely ignored.

## Final-lock result

Once submitted, a scorecard cannot be edited: a draft-save attempt
returns `409 scorecard_already_submitted`, and a resubmission with
different scores never changes the immutable persisted result —
verified live.

## Duplicate-race result

Rapid double-click (idempotency key) and two-tab race (concurrent
first-ever draft saves for the same judge+entry, no row yet to lock)
both verified live: exactly one 200 + one 409, exactly one real
database row. The two-tab race exposed and fixed a genuine defect
(SC-D060, see below).

## Stale-write result

A draft save carrying an outdated `expectedVersion` is rejected with a
real `409 stale_version` — verified live.

## Browser result

`verify-smokecraft-hf5c2a-judge-browser.mjs`: 17/17, real Playwright
session against the live dev server covering no-assignments, assigned,
draft-saved, incomplete (Submit disabled), reload-rehydration,
submitted, locked (inputs disabled), unauthorized (cross-user denial),
and non-existent-entry states, plus keyboard navigation, no horizontal
layout cutoff, and no unexpected console errors. Approved visuals
preserved (additive-only changes, see `SMOKECRAFT_LOCKED_BASELINE.md`).

## Defects found and fixed

- **SC-D060**: `golden_box_scorecards`' pre-existing
  `UNIQUE(entry_id, judge_id, amended_from)` never actually enforced
  one-original-scorecard-per-judge-per-entry (NULL-uniqueness bug).
  Reproduced live via two concurrent first-ever draft saves (both
  returned 200, two rows created). Fixed with a partial unique index
  plus a SAVEPOINT-based graceful `UNIQUE_VIOLATION` catch in
  `getOrCreateDraftScorecard()`.
- Structural: no draft/final-submission separation existed at all —
  closed by splitting `saveScorecardDraft()` from a rewritten
  `submitScorecard()`.
- Structural: no server-computed weighted total existed for individual
  scorecards — closed inside `submitScorecard()`.
- `goldenBoxRoutes.js`'s rate limiters lacked the established
  dev/test bypass (`skip: () => !IS_PROD`), causing real 429s during
  this pass's own testing — closed by adding it, matching the pattern
  already used in `mentorVoiceRoutes.js`/`challengeHubRoutes.js`.

Full detail in `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`.

## Tests and build

- `verify-smokecraft-hf5c2a-judge-assignment-api.mjs`: 11/11
- `verify-smokecraft-hf5c2a-scorecard-api.mjs`: 18/18
- `verify-smokecraft-hf5c2a-judge-browser.mjs`: 17/17
- `scripts/validateSmokecraftGoldenBoxJudgingAuthority.mjs`: 27/27
- `verify-smokecraft-hf5c1b-golden-box-api.mjs` (Golden Box submission
  regression): 26/26
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5c-2a/`

## What this pass does NOT cover

Final awards, competition leaderboard, Venue Humidor, full-route/
five-viewport sweeps — explicitly out of scope per mandate.

## Handoff

Holistic Fix 5C-2B: Golden Box final awards and competition
leaderboard — aggregate cross-judge results computation, award
issuance, and the public/venue leaderboard views, built on the
server-authoritative rubric, assignment, and scorecard foundation
closed here.
