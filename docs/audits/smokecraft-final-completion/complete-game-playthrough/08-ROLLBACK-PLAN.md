# 08 — Rollback Plan

## Files changed

New only, no source modification: `verify-smokecraft-complete-game-playthrough.mjs`, `verify-smokecraft-viewport-matrix.mjs`, `public/proof/smokecraft-complete-game-playthrough/**` (including `viewport-matrix/`), this documentation set (10 files under `docs/audits/smokecraft-final-completion/complete-game-playthrough/`), plus updates to `docs/audits/smokecraft-final-completion/gate-reconciliation/CHECKLIST.md` and `docs/crafthub-mvp2-replication-blueprint.md`.

## Risk profile

None. This pass is proof-only — it played the existing, already-locked-and-migrated game through a live browser and found no defect requiring a source fix. No `src/` file changed.

## Rollback

`git revert <this pass's commit>` removes the two new test files, the proof directory, and the documentation additions with zero functional impact — nothing in `src/` depends on any file this pass added.
