# 06 — Navigation and Completion

`completeSmokeCraftScreen(screenId, { awardSessionRewards, session })` (`src/services/smokecraft/smokecraftCompletionService.js`) is the one function `SmokeCraftScreenRenderer` calls on `onComplete`. It: (1) rejects an unknown `screenId` rather than guessing, (2) rejects completion when prerequisites (derived from the manifest, not hardcoded) aren't met, (3) delegates XP-award idempotency to the existing, unchanged `awardSessionRewards` no-op-if-already-completed guard, (4) resolves the next route from the manifest's `nextScreenId`, never a hardcoded string.

`AISummary.jsx` was migrated to accept optional `onBack`/`onComplete` props, falling back to its original internal `navigate()`/`awardSessionRewards()` calls when rendered without them (backward compatible — the component still works correctly if ever rendered outside the canonical runtime). Live-verified: the manifest-driven next route (`/smokecraft/pairing-recommendations`) is reached correctly after clicking Continue.

## Honest finding, disclosed

Live-testing this migration surfaced a genuine, **pre-existing** defect unrelated to this pass's changes: `awardSessionRewards('ai-summary')` has always silently no-op'd, because `smokecraftRewards.js`'s `SESSION_REWARDS` map (already documented as stale/dead 8-visit numbering metadata in the Session-Sequence Reconciliation pass) has no entry for the id `'ai-summary'`. `completeSmokeCraftScreen` correctly reproduces this exact pre-existing behavior — confirmed not a regression this pass introduced, but a real, separate, out-of-scope gap worth a future pass's attention (populate `SESSION_REWARDS` with entries for every one of the 27 real session ids).
