# Holistic Fix 5C-1B — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: f8687dd7

## Goal

Audit and close only the Golden Box scoring, persistence, identity,
and duplicate-submission foundation. No judge workflow, no final
awards/results, no full sweeps.

## Golden Box routes audited

`server/routes/goldenBoxRoutes.js` (guest-facing entry/draft/submit
routes) and their controllers/services: `entryService.js`
(build flow, drafts, versioning, submission), `visibilityService.js`
(recipe privacy), `lifecycleService.js` (status transitions),
`eligibilityService.js` (advisory eligibility signal), and
`playerStateService.convertGuestToAccount()` (account conversion).
Judge/mentor-review/rewards-issuance routes were audited only to
confirm they were out of scope and untouched.

## Client-authority paths found and removed

None existed for scoring/eligibility — `validateSubmission()` was
already fully server-side. The real gaps were structural: draft saves
had no optimistic-concurrency protection or idempotency, account
conversion silently broke Golden Box entry continuity, and identity
bridging had the same class of bug found in two prior 5C passes.

## Draft persistence result

Save → reload → revision history all verified live and via API:
`golden_box_entry_versions` is append-only (a save never mutates a
prior version), `current_version` always reflects the real latest
save, reload rehydrates the real saved payload and components.

## Versioning result

`saveDraft()` now accepts `expectedVersion`; a stale write is rejected
with a real `409 stale_version` (never silently overwritten). The
check happens under a row lock (`FOR UPDATE`) so a genuine two-tab
race resolves to exactly one winner and one honest loser — verified
live (both via direct concurrent API calls and in the browser via a
rapid double-click that produced a bounded, not per-click, number of
version rows).

## Submission eligibility result

Server decides required-field completeness, evidence validity, and
accept/reject — verified live: an incomplete submission is rejected
(422) with the real missing-component list; a complete submission is
accepted (200) with `validationPassed: true`.

## Duplicate-race result

Rapid double-click and two-tab race on both draft save and final
submit all verified: exactly one real database row results in every
case (idempotency-key dedupe for saves; the existing
`UNIQUE(entry_id)` constraint plus a new graceful catch for submits).

## Cross-device result

Two independent fetches under the same identity return identical
entry state — verified live.

## Account-conversion result

Found and fixed two real, compounding defects (SC-D058, SC-D059): the
identity-prefix bug meant a converted account's Golden Box requests
queried under the wrong identity, and the generic transfer-copy
mechanism silently orphaned every version/component/submission row by
letting `entry_id` regenerate. Verified end-to-end: guest builds a
complete draft, submits it, converts to a real account, and the same
account identity sees the transferred, already-submitted entry with
its full 4-component draft history intact.

## Authorization result

Cross-user denial verified live: a stranger's request for another
guest's entry resolves `visibility.canViewRecipe: false` and never
receives the real presentation payload or components.

## Defects found and fixed

- **SC-D057**: missing `ensureSmokeCraftGuestIdentity`.
- **SC-D058**: missing `user:` identity prefix (worse than the
  Challenge Hub instance — broke post-conversion entry lookup).
- **SC-D059**: `convertGuestToAccount()` silently orphaned Golden Box
  draft/submission history via entry_id regeneration.
- Structural: no optimistic concurrency, no draft idempotency, no
  graceful two-tab-race handling on submit — all closed.

## Tests and build

- `verify-smokecraft-hf5c1b-golden-box-api.mjs`: 26/26
- `verify-smokecraft-hf5c1b-golden-box-browser.mjs`: 12/12
- `scripts/validateSmokecraftGoldenBoxAuthority.mjs`: 27/27
- `verify-smokecraft-hf5a3g-skill-tree-flow.mjs` (account-conversion
  regression): 22/22
- `verify-smokecraft-hf5c1a-challenge-hub-api.mjs` (account-conversion
  regression): 29/29
- `npm run build`: succeeded

## Proof path

`public/proof/smokecraft-holistic-fix-5c-1b/`

## What this pass does NOT cover

Judge workflow, final awards/results, Packaging Studio, full-route/
five-viewport sweeps — explicitly out of scope per mandate.

## Handoff

Holistic Fix 5C-2A: Golden Box judge workflow and results —
scorecard scoring authority, judge assignment integrity, and results
computation, using the same server-authoritative, canonical-event,
database-enforced-idempotency pattern established here.
