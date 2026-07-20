# Package 2 Baseline

- Branch: `recovery/smokecraft-codex-final` (unchanged) · Commit: `aa0b9cf8` (unchanged)
- Package 1: PACKAGE 2 CLEARED (see `package-1/12-PACKAGE-1-PRE-PACKAGE-2-GATE.md`)
- Migration state: 077 applied and unmodified; Package 2 adds **078**
  (`078_golden_box_leaderboard_constraint.sql`), the compensating CHECK
  constraint recommended in the Package 1 review — additive only, does
  not touch 077.
- Existing Golden Box routes before Package 2: `/smokecraft/golden-box`
  (index — static rules-acceptance screen, `GoldenBox.jsx`) and
  `/smokecraft/golden-box/status` (static image, `GoldenBoxStatus.jsx`).
  Both confirmed untouched this package (see doc `08` for diff evidence
  — same mtime-based method used in the Package 1 review).
- AI-analysis route hardening (Package 1 review follow-up): implemented
  first, before any frontend AI-analysis wiring, per the mandate's own
  ordering instruction.
