# 04 — Rollback Plan

## Files changed

Modified: `src/pages/smokecraft/Leaderboard.jsx`, `src/pages/smokecraft/Identity.jsx`, `src/pages/smokecraft/Pairing.jsx`, `src/pages/smokecraft/PairingRecommendations.jsx`, `verify-smokecraft-tactile-haptic-interactions.mjs`.

New: `verify-smokecraft-final-approved-shells.mjs`, `public/proof/smokecraft-final-approved-shells/**`, this documentation set.

Not modified: `src/pages/smokecraft/Rewards.jsx`, `src/pages/smokecraft/ResumeJourney.jsx` (genuine asset-content blockers, see `00-FINAL-REPORT.md`).

## Risk profile

Low. Each conversion is a visual-shell swap on an already-working screen — routing, persistence, and real interactive logic (choose/reject, form fields, etc.) were carried forward unchanged, only the rendering approach changed from a hand-built layout to `SmokeCraftImageBoundsOverlay`.

## Rollback

`git revert <this pass's commit>` restores the prior hand-built layouts on all 4 screens with no data-shape or routing impact.
