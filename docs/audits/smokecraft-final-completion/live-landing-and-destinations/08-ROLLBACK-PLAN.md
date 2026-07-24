# 08 — Rollback Plan

All changes are additive/localized; revert is a single-commit `git revert <hash>`.

Per-file rollback:
- `src/pages/smokecraft/RewardsCenter.jsx` — delete file.
- `src/App.jsx` — remove the `rewards-center` route + import.
- `src/pages/SmokeCraft.jsx` — restore Rewards card `onClick` to `/smokecraft/humidor-match` and label "Browse Humidor".
- `src/constants/smokecraftAssets.js` — remove the `rewardCenter` key.
- `src/components/smokecraft/LockedSmokeCraftScreen.jsx` — restore from prior commit to re-enable the baked lock-image variant (NOT recommended; reintroduces old visuals).
- `verify-smokecraft-live-landing-and-destinations.mjs` — delete file.

No schema, runtime-architecture, canonical-manifest, or 27-session changes were made, so rollback carries no data/migration risk. Approved assets on disk are untouched.
