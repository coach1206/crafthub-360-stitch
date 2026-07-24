# 09 — Rollback Plan

## Files changed this pass

`src/utils/haptics.js` (extended, backward-compatible — call signature unchanged, all 51 existing consumers unaffected), `src/components/smokecraft/SmokeCraftTactileCard.jsx` (new, zero consumers yet, so its removal is a pure no-op for the rest of the app).

## Risk profile

Very low. No existing screen was modified. The one behavior change (`triggerHaptic` now suppressing under reduced-motion or a disabled preference) is strictly more conservative than before — it can only suppress a vibration that previously fired, never add one that wasn't already there, and never blocks the underlying click/action itself (confirmed: no call site branches on `triggerHaptic`'s return value).

## Rollback

`git revert <this pass's commit>` cleanly removes both. No data migration, no persisted-state shape change (the `hapticsEnabled` field it now reads already existed and was already written by prior passes).
