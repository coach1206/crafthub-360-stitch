# 06 — Rollback Plan

This pass changed exactly two production files: `src/pages/smokecraft/VenueSelect.jsx` (header image prominence + corrected button label/route) and added one new test suite plus documentation/proof artifacts. `Enroll.jsx`, `Identity.jsx`, `Mentor.jsx`, `HumidorMatch.jsx`, and `WelcomeExperience.jsx` were audited but not modified.

To roll back: `git revert <this pass's commit>` restores `VenueSelect.jsx` to its prior 14vh-header/"Continue to Personal Dashboard" state. No data migration, schema change, or asset deletion occurred, so revert is a pure code operation with no side effects.
