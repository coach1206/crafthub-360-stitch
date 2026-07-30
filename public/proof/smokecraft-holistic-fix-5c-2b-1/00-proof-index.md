# Holistic Fix 5C-2B-1 — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 839b1b63

## Goal

Build only the server-authoritative Golden Box results aggregation and
final ranking system. No awards, no Passport/badge/Collection/XP
rewards, no Venue Humidor, no full sweeps.

## Result routes audited

`server/routes/goldenBoxRoutes.js`'s existing
`GET /competitions/:competitionId/entries/:entryId/results` (now
delegating to the new `resultsService.getEntryResult()`), the
pre-existing but never-populated `golden_box_results` table
(migration 077), and the naive `computeAggregateResult()` in
`judgingService.js` (kept for backward compatibility, superseded by
`resultsService.js` for all real ranking/finalization work). No
awards/rewards-issuance code was touched.

## Eligibility result

An entry enters ranking only when it has a real submission, was never
withdrawn or disqualified, has at least one judge assignment, every
assigned judge completed their scorecard, and every counted scorecard
was scored under the active rubric version. Missing scorecards are
never treated as zero — see `05-incomplete-judging-proof.md`.

## Aggregation result

Real server-side per-entry average weighted score, criterion-level
averages, min/max, and variance, computed from each judge's LATEST
scorecard. See `03-aggregation-proof.md`.

## Tie-breaking result

Deterministic 7-step order (score → construction → blend/aroma →
presentation/rule_compliance → variance → submission time → entry ID),
rule version 1, verified for the first three real tie scenarios live.
See `04-tie-break-proof.md`.

## Finalization result

Authorized-staff-only, atomic, immutable once written, and the sole
source of truth for every caller once it exists (a real defect found
and fixed this pass — SC-D061). See `06-finalization-proof.md`.

## Duplicate-race result

Both duplicate-finalize-call and two-tab concurrent-finalize race
verified live: exactly one real finalization row in every case. See
`07-duplicate-race-proof.md`.

## Authorization result

Route-level admin-only gate verified live with a real 403 denial; role-
aware response shaping (admin vs non-admin) confirmed both via API and
browser. See `08-authorization-proof.md`.

## Venue/competition isolation result

Both verified live with real, separately-scored competitions/venues —
no cross-contamination in any finalized ranking. See
`09-venue-isolation-proof.md`.

## Browser result

`verify-smokecraft-hf5c2b1-results-browser.mjs`: 13/13, real
Playwright session — ready-to-finalize live preview, real finalize
action, immutable finalized view after reload, non-admin published-
only view, honest no-entries state, keyboard/layout/no console errors
all verified against the live dev server. Approved visuals preserved
(additive-only "Competition Rankings" section).

## Defects found and fixed

- **SC-D061**: `handleGetCompetitionResults()` always recomputed a
  live view for admins even after a real finalization existed — an
  administrator could never actually see the immutable finalized
  ranking through this endpoint. Found via the browser test's own
  reload-after-finalize assertion, fixed by checking for an existing
  finalization first for every caller.
- Structural: `golden_box_results` existed since migration 077 but
  nothing ever populated placement/is_winner/tie_break_reason or
  computed a real eligibility-aware, tie-broken ranking. Closed by
  building the full `resultsService.js` engine.

Full detail in `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`.

## Tests and build

- `verify-smokecraft-hf5c2b1-results-api.mjs`: 33/33
- `verify-smokecraft-hf5c2b1-results-browser.mjs`: 13/13
- `scripts/validateSmokecraftGoldenBoxResultsAuthority.mjs`: 27/27
- `verify-smokecraft-hf5c2a-judge-assignment-api.mjs` (judging
  regression): 11/11
- `verify-smokecraft-hf5c2a-scorecard-api.mjs` (judging regression): 18/18
- `verify-smokecraft-hf5c1b-golden-box-api.mjs` (submission
  regression): 26/26
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5c-2b-1/`

## What this pass does NOT cover

Final awards, badge/Passport/XP reward issuance, Venue Humidor, full-
route/five-viewport sweeps — explicitly out of scope per mandate.

## Handoff

Holistic Fix 5C-2B-2: Golden Box awards and rewards issuance — badge/
Passport stamp/XP reward issuance tied to the immutable finalized
ranking closed here (`golden_box_rewards` table already exists,
unused), built on the same server-authoritative, idempotent,
canonical-event pattern established throughout this operation.
