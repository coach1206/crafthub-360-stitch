# SmokeCraft Image Integration — Rollback Plan

- **Branch fast-forward**: reversible by `git reset --hard aa0b9cf8` on this local branch only — but
  note the pulled commits (`54d678da`..`d09b63d7`) already exist on `origin`, so this would only affect
  the local working copy, not erase the user's uploads from GitHub.
- **File moves** (`git mv`, 9 files): fully reversible — `git mv` preserves history, and no other file
  referenced the old paths before this pass (verified via grep), so reverting is a straight
  `git checkout aa0b9cf8 -- public/assets/smokecraft/session-visuals public/assets/smokecraft` for the
  affected paths, or simply moving the 9 files back.
- **`SC_ASSETS` additions** (8 new keys, additive block at the end of the file): revertible by deleting
  the added block; no existing key was changed.
- **Component edits** (6 files: `JudgeDashboard.jsx`, `JudgeEntryReview.jsx`, `MentorReview.jsx`,
  `ResultsExperience.jsx`, `EntryWorkspace.jsx`, plus the new `MediaSlot` imports): each addition is a
  single `<MediaSlot>` line plus one import line, isolated and revertible per-file without touching
  surrounding logic.
- No migration, no database change, no commit made this session.
