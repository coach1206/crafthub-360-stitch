# 13 — Manifest Update

`src/constants/smokecraftRequiredInteractions.js` updated for Sessions 8, 12, and 16 only, after
all verification passed:

- `implementationStatus`: `PARTIAL` → `COMPLETE_AND_VERIFIED`
- `gapClassification`: `PARTIAL` → `COMPLETE_AND_VERIFIED`
- `canonicalApi` / `canonicalService` / `canonicalPersistence`: updated to cite the new
  tasting-observation endpoint, service, and ledger row shape (previously only the generic
  `SHARED_COMPLETION` values).
- `testReferences`: now cites `verify-smokecraft-required-interaction-package-a-api.mjs (26/26)`
  and `verify-smokecraft-required-interaction-package-a-browser.mjs (14/14)`.
- `proofReferences`: now cites this proof directory.
- `notes`: rewritten to describe the real server-authoritative gate, replacing the prior
  local-only-persistence gap description.

No other session's manifest entry was touched.

## Validator result after the update

```
node scripts/validateSmokecraftRequiredInteractionManifest.mjs
=== Classification totals ===
  COMPLETE_AND_VERIFIED: 11
  COMPLETE_BUT_UNTESTED: 1
  PARTIAL: 5
  VISUAL_ONLY: 4
  WRONG_INTERACTION_TYPE: 0
  MISSING: 0
  BLOCKED: 0
  DUPLICATED_OR_CONFLICTING: 0
=== RESULT: PASS (manifest structurally sound and honest) (0 checks failed) ===
```

Matches the mandate's expected result: overall incomplete/unverified session count dropped from
13 to 10 (COMPLETE_BUT_UNTESTED(1) + PARTIAL(5) + VISUAL_ONLY(4) = 10).
