# 13 — Manifest and Package Validator Results

## Required-interaction manifest validator

```
node scripts/validateSmokecraftRequiredInteractionManifest.mjs
=== Classification totals ===
  COMPLETE_AND_VERIFIED: 16
  COMPLETE_BUT_UNTESTED: 1
  PARTIAL: 4
  VISUAL_ONLY: 0
=== RESULT: PASS (manifest structurally sound and honest) (0 checks failed) ===
```

Overall complete count: 12/21 → 16/21. Non-complete count: 9 → 5. Exactly matching the mandate's expected result.

## Package C validator (new)

`scripts/validateSmokecraftPackageCSelectionClassification.mjs` — 26/26 structural checks passed, confirming: Sessions 2/5/6/10 are the only Package C targets; each retains its own locked interaction type; server evaluation exists and is never client-authoritative; persistence and completion gating exist; XP/progression use canonical ownership; tests and proof references exist; no visual-only completion remains; no duplicate scoring/progression system was created; manifest matches implementation evidence.

Full output: `package-validator-output.json` (this directory).
