# Package F — Manifest Update and Package Validator

## Manifest change (`src/constants/smokecraftRequiredInteractions.js`)

Session 25 (`rewards`):
- `implementationStatus`: `COMPLETE_BUT_UNTESTED` → `COMPLETE_AND_VERIFIED`
- `gapClassification`: `COMPLETE_BUT_UNTESTED` → `COMPLETE_AND_VERIFIED`
- `testReferences`: `[]` → `['verify-smokecraft-required-interaction-package-f-api.mjs', 'verify-smokecraft-required-interaction-package-f-browser.mjs']`
- `proofReferences`: `[]` → `['public/proof/smokecraft-required-interaction-package-f/']`
- `notes` updated to describe the confirmed real gap and the applied fix.

Overall manifest: 20/21 → **21/21** COMPLETE_AND_VERIFIED. 1 non-complete → **0** non-complete.

Also updated: `scripts/validateSmokecraftRequiredInteractionManifest.mjs` — its "manifest must honestly report at least one non-complete session" check was written under the assumption gaps still existed; now that 21/21 is a real, evidence-backed terminal state, that check was updated to accept `nonCompleteCount === 0` as legitimate (still fails on a malformed/negative count). `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json` and `public/proof/smokecraft-required-interaction-manifest-audit/manifest-validator-output.json` are auto-regenerated build artifacts, updated by re-running `npm run prebuild`.

## Package F validator (`scripts/validateSmokecraftPackageFRewardsAuthority.mjs`)

Confirms, against real source (not the manifest's own claims):
- Session 25 is the only Package F target.
- Exactly one canonical reward/XP source exists (`fetchPlayerState()` / `getSessionRewardXp()` / `SESSION_REWARDS`).
- Rewards.jsx now reads that canonical source, with an honest fallback, exposed source marker, retry re-fetch, and post-claim refresh.
- Completion remains server-authoritative and idempotent via the existing, unmodified `completeSession()`.
- No second reward/achievement system was created.
- Test/proof references and results files exist with 0 failures.
- 21/21 sessions are COMPLETE_AND_VERIFIED.

Result: **PASS (0 checks failed)** — see `package-validator-output.json`.
