# 08 — Rollback Plan

This pass changed three files, all comment/documentation-only (no behavior change): `src/constants/session.js` (deprecation banner above `SMOKECRAFT_FLOW`), `src/modules/smokecraft/data/smokecraftJourneyContract.js` (deprecation banner above the file's docstring), and `src/constants/smokecraftRewards.js` (corrected docstring). It added one new test suite and documentation/proof artifacts. No route, guard, asset wiring, or completion-calculation logic was changed — the audit found the live system already correct.

To roll back: `git revert <this pass's commit>` restores the three comment blocks to their prior (misleading) text. No functional regression is possible from a revert since no runtime code changed.
