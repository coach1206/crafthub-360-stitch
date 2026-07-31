# Test Results

## New suites (this correction)

- `verify-smokecraft-package-a-draft-correction-api.mjs` — 30/30 passed. Covers: create/read/update draft round trips for all 3 sessions; reload/resume via a fresh read; malformed payloads (non-object draftData, missing expectedVersion, unknown field, out-of-vocabulary id, over-length personal notes); cross-player denial; cross-session isolation and cross-session vocabulary rejection; stale-version rejection with real current-state return; genuine concurrent-save race (exactly one winner); completed-state protection (draft write denied after completion, draft itself unchanged); no XP/no progression from draft saves alone; Session 12 and 16 full round trips; a regression check confirming Mini Tasting's own unrelated draft (`activityKey='mini-tasting'`) still saves exactly as before.
- `verify-smokecraft-package-a-draft-correction-browser.mjs` — 14/14 passed, real Chromium via Playwright. Covers: entering partial observations, saving, leaving the route and returning, a genuine hard reload, completing, a stale draft write attempt post-completion (denied), no duplicate XP, and full round trips for Sessions 12 and 16.

## Regression (unchanged systems, re-run against this correction's final code)

| Suite | Result |
|---|---|
| `verify-smokecraft-required-interaction-package-a-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-browser.mjs` | 14/14 |
| `scripts/validateSmokecraftRequiredInteractionManifest.mjs` | PASS |
| `verify-smokecraft-hf5a3d-tasting-flow.mjs` (Mini Tasting's own draft/completion, the closest existing regression to this change) | 13/13 |
| `verify-smokecraft-hf5a-gameplay-engine.mjs` | 22/22 |
| `verify-smokecraft-hf5a2-reward-authority.mjs` | 19/19 |
| `verify-smokecraft-venue-humidor-1a-api.mjs` | 32/32 |
| `verify-smokecraft-hf5c1b-golden-box-api.mjs` | 26/26 |

Full output: `regression.log` in this directory.

## Known pre-existing condition, out of scope

`verify-smokecraft-mini-tasting.mjs` (a real-browser Mini Tasting UI test, not touched by this pass) fails from Suite 1 onward, using the same localStorage-seeding-before-navigation pattern this pass's own browser tests were found to race against and fixed (see the original Package A proof, doc 10). This file was not modified by this pass and its underlying backend logic is independently confirmed correct by `verify-smokecraft-hf5a3d-tasting-flow.mjs` (13/13, API-level, exercising the same `smokecraft_tasting_drafts`/`saveTastingDraft`/`getTastingDraft` code this correction extends). Flagged, not fixed — out of this pass's Session 8/12/16 scope.
