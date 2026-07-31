# 09 — Progression, XP, and Rewards

- **Prerequisite enforcement**: unchanged, still owned by `SmokeCraftScreenRenderer`/`smokecraftCompletionService.js`.
- **Interaction completion gate**: new, additive — `hasSelectionEvidence()` inside `completeSession()`.
- **No completion on route open**: verified — draft load never writes evidence.
- **No completion on draft save**: verified live (API — XP unchanged after any number of draft saves).
- **No completion on incorrect attempt**: verified live for all 4 sessions (API + browser).
- **Correct next-step unlock**: verified live — each session navigates to its real next route only after a correct, server-confirmed completion.
- **Session completion / phase progress**: unchanged canonical path (`smokecraft_session_completions`).
- **Skill Tree synchronization**: unaffected — `scripts/validateSmokecraftSkillTreeAuthority.mjs` re-run clean.
- **XP exactly once**: verified live (duplicate + concurrent submission tests for all 4 sessions).
- **Existing badge/reward rules only**: no new reward rules added; `sessionRewardTable.js`/`smokecraftRewards.js` untouched.
- **No duplicate Passport/leaderboard effect**: unaffected, unchanged completion transaction.
- **Reload persistence**: verified live for Session 2 (genuine reload after completion confirms server-side `completedSessions`).
