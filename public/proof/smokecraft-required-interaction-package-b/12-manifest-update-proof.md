# 12 — Manifest Update Proof

`src/constants/smokecraftRequiredInteractions.js`, Session 19 entry updated only after implementation, testing, and this proof were complete:

- `implementationStatus`: `PARTIAL` → `COMPLETE_AND_VERIFIED`
- `gapClassification`: `PARTIAL` → `COMPLETE_AND_VERIFIED`
- `canonicalApi`: now cites the new `/scorecard/submit` evidence endpoint, the completion endpoint, and the reused draft routes.
- `canonicalService`: `scorecardEvaluationService.js#submitScorecardCompletion` + `playerStateService.js#completeSession` (gated).
- `canonicalPersistence`: `smokecraft_activity_attempts` (new `activity_type='scorecard'`) + `smokecraft_tasting_drafts` (shared).
- `testReferences`: both new suites, with pass counts.
- `proofReferences`: this proof directory.
- `notes`: rewritten to describe the real server-authoritative evaluation, replacing the prior local-state-only gap description.

No other session's manifest entry was touched.

## Validator result after the update

```
node scripts/validateSmokecraftRequiredInteractionManifest.mjs
=== Classification totals ===
  COMPLETE_AND_VERIFIED: 12
  COMPLETE_BUT_UNTESTED: 1
  PARTIAL: 4
  VISUAL_ONLY: 4
=== RESULT: PASS (manifest structurally sound and honest) (0 checks failed) ===
```

Overall non-complete session count: 10 → 9 (Package A's draft-correction pass ended at 10 non-complete; Package B closes exactly one more, Session 19, bringing the total to 9).
