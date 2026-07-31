# 02 — Session 3 (Meet Your Cigar) Result

- **Required checkpoints**: `brand`, `blend`, `wrapper` — the only 3 of the 7 sections that ever carry real, non-fallback content for the fixed 8-cigar catalog. Requiring Binder/Filler/Factory/Master Blender as checkpoints would demand engagement with content that structurally does not exist for any cigar in the catalog (`buildSections()` always returns `null` for those 4).
- **Required final synthesis**: after visiting all 3 real checkpoints, the player must select which of the 3 details most influenced their impression of the cigar — a real reflective judgment, not a re-click of an already-viewed panel. The UI only shows this picker once the checkpoints are satisfied.
- **Server evaluation**: `SESSION_DEFS['meet-your-cigar']` in `selectionClassificationService.js` — requires all 3 checkpoints `=== true` and a synthesis value that is one of the 3 checkpoint ids.
- **Completion gate**: `completeSession()` refuses to complete `'meet-your-cigar'` without this evidence (verified live — opening all panels alone never completes the session).
- **Draft/resume**: shared draft table, `activityKey='meet-your-cigar'`.
- A real, pre-existing defect was found and fixed for this session — see `08-completion-progression.md`.

Verified live: incomplete-checkpoint rejection, missing-synthesis rejection, unknown-checkpoint rejection, correct submission + completion, XP award, duplicate-completion safety, stale-draft-after-completion rejection, cross-player draft isolation (API + browser).
