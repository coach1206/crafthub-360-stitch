# 03 — Session 4 (Terroir) Result

- **Required checkpoints**: `country`, `region`, `soil`, `climate`, `growing` — the 5 real shaping factors. `why` (the 6th section) is meta-commentary about terroir itself, not a factor to weigh, and is deliberately excluded from the checkpoint set (a documented, non-guessed decision).
- **Required final synthesis**: after visiting all 5 factors, the player must select which one they judge most shapes a cigar's character.
- **Server evaluation**: `SESSION_DEFS.terroir` — requires all 5 checkpoints `=== true` and a synthesis value from the 5-factor set (an invalid value like `'why'` is rejected).
- **Completion gate**: same additive `completeSession()` gate.
- **Draft/resume**: verified live — leaving the route mid-exploration and returning restores partial checkpoint progress from the server draft (not localStorage-only).
- Same pre-existing missing-reward-table-entry defect as Session 3 was found and fixed here — see `08-completion-progression.md`.

Verified live: incomplete-checkpoint rejection, invalid-synthesis rejection, leave-and-return draft resume, correct submission + completion, direct API bypass denial (fabricated `allVisited`/`completed`/`passed`/`xpEarned` fields ignored), genuine 3-way concurrent-submission race resolving to exactly one completion.
