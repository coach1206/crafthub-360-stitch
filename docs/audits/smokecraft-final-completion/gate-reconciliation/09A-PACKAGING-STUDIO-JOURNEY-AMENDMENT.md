# Phase 9A — Packaging Studio Journey Amendment

**This is an amendment, not a rewrite.** It does not change, retract, or
re-run any finding in `09-FULL-JOURNEY-FINAL-GATE.md`. That document's
6-vs-7-phase discrepancy finding stands exactly as written, and this
amendment does not resolve it. This amendment records what changed in the
Golden Box entry journey specifically to connect the already-completed
Golden Box Packaging Studio module into the visible flow.

**Starting commit:** `4ac5222620c2b86ab9e0314702518d2c9edce254` — local
`HEAD` and `origin/recovery/smokecraft-codex-final` both matched, working
tree clean (aside from this pass's own new files), before this pass began.

## What changed in the Golden Box journey

| Transition | Before | After |
|---|---|---|
| Build/Blend → Review | Reached `review` step once all 4 required components selected (`requiredMet`) | Unchanged — same gating condition, now the same signal that reveals the new Packaging Studio status card/CTA |
| Review → Packaging Studio | No link existed | Real CTA to `/smokecraft/golden-box/packaging-studio` (or the design's own editor route if one already exists), shown only once `requiredMet` is true |
| Packaging Studio → Presentation Preparation | N/A (module unreachable from the journey) | `EntryWorkspace.jsx`'s `presentation` step now reads the real, immutable submitted snapshot (`GET /entries/:entryId/final-submission`) when one exists, with an honest in-progress fallback when it doesn't |
| Presentation/Defense | Showed no packaging evidence | Shows the submitted snapshot as presentation evidence only — no new judging score weight added |
| Results/Awards | Unaffected | Unaffected — no packaging-derived award was fabricated; results generation source (`rewardsService`/results computation) was not modified this pass |

## Packaging readiness (server-derived)

`getPackagingReadinessForEntry(entryId, identity)` in
`packagingStudioService.js` computes one of the 5 active states
(`not_started`, `draft_in_progress`, `validation_required`,
`ready_to_submit`, `submitted`) live from `packaging_designs` /
`packaging_design_versions` / `packaging_final_submissions` — no new column
stores this redundantly. (`unavailable` and `error` are the two additional
states in the mandate's 8-state model, covering the "no entry/design
context" and "request failed" client-side cases — both are client
rendering states over the same 5 server-computed states plus network
failure, not additional backend enum values.)

## Resume behavior

- Reopening `/entries/:entryId/blend` with an incomplete packaging design
  routes back to the same in-progress design via the review-step CTA
  (readiness `not_started`/`draft_in_progress`/`validation_required` all
  resolve to "continue design").
- Reopening after a completed submission shows the submitted state and does
  not re-prompt the learner to redo packaging.

## Deep-link protection

Direct navigation to `/smokecraft/golden-box/packaging-studio/:designId` for
a design the caller does not own is rejected server-side (ownership check in
`requireOwnedDesign`), independent of how the link was reached. Direct
navigation to the presentation step cannot bypass packaging state because
the presentation step reads the same authorized route judges use
(`GET /entries/:entryId/final-submission`), not a client-only flag.

## Cross-learner isolation

Verified live: a second guest identity cannot read another learner's
packaging readiness, design, or submitted snapshot (403/404, not partial
data). Verified in `verify-phase9-packaging-studio-journey-amendment.mjs`.

## Submitted-snapshot visibility

Presentation, Defense, and judge/mentor review all read
`packaging_final_submissions.snapshot` — the same immutable record — never
the editable draft. `saveDraft()` already rejects edits once
`design.status === 'submitted'` (409 `design_locked_cannot_edit`), so the
snapshot cannot drift from what was actually submitted.

## Scope decision carried over from the discovery-audit doc

See `docs/audits/golden-box-packaging-studio/12-JOURNEY-INTEGRATION-AMENDMENT.md`
for the full disclosure: packaging completion is visibly required as a
distinct presented step but is **not** a hard server-side gate on
`entryService.submitEntry` — that protected, already-proven system was not
modified this pass, per the mandate's own instruction to preserve it.

## Result

Full regression battery (Golden Box Packaging Studio, Phase 9 full journey,
Phase 8, Phase 7 visual, Golden Box 7A, Phase 6 shared gamification,
Passport Security unified identity) plus the dedicated
`verify-phase9-packaging-studio-journey-amendment.mjs` (54/54) all pass.
The only failing checks across the battery are each suite's own hardcoded
"starting commit" assertions pinned to their own pass's starting commit —
expected to diverge once later commits land, not a functional regression.

**Status: PASS — Phase 9 Journey Amendment complete.**
