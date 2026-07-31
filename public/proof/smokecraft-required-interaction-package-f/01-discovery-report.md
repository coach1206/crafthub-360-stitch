# Package F — Discovery Report (Session 25)

**Title**: Rewards and XP (serves Session 26 Achievements)
**Route**: `/smokecraft/rewards`
**Learning objective**: Review earned XP, rank milestones, and achievement criteria tied to real completed actions.
**Canonical component**: `src/pages/smokecraft/Rewards.jsx`
**Required interaction**: S25-REWARD-REVIEW (type: `reward-display`) — a review/claim session by design, matching the already-verified Session 27 pattern (Continue-only is the appropriate interaction for a recap/claim role, not new gameplay evidence).

## Prior classification
COMPLETE_BUT_UNTESTED. Notes at the time: "Claim buttons and tab switching are real, but this pass did not independently verify that displayed totals are read from the live server player-state (vs. locally-computed constants via smokecraftRewards.js) — flagged for the next audit rather than asserted either way."

## Discovery findings

- **Existing interaction**: Real — "Claim" buttons on rank-milestone rewards and achievements, tab switching between Rewards/Achievements, and "Continue to Achievements →" / "Continue to Recommended Next Journey →" buttons.
- **Existing completion behavior**: `awardSessionRewards('rewards')` / `awardSessionRewards('achievements')` (`src/context/GuestSessionContext.jsx`) — local optimistic update + fire-and-forget `completeSessionOnServer()` call to the real canonical `POST /api/smokecraft/player-state/sessions/:sessionId/complete` endpoint (`server/services/smokecraft/playerStateService.js#completeSession`). Confirmed real and already server-authoritative for the completion/XP-award write path.
- **Existing reward/achievement presentation**: Rank-milestone cards, XP breakdown, earned badges, and an achievement catalog computed live from `session.completedSteps` / `journey` state (`buildAchievements()` in Rewards.jsx) — genuinely evidence-based, not fabricated.
- **Existing canonical data source — THE ACTUAL GAP**: The screen's displayed `totalXP` (and everything derived from it — rank, progress bar, milestone "available"/"claimable" state) was read *only* from `session.xp`, the local optimistic cache populated by `GuestSessionContext` (`loadSession() || createNewSession()`, pure localStorage — never hydrated from the server). The canonical server ledger, `GET /api/smokecraft/player-state` (returning `xpTotal` from `smokecraft_player_state`), already existed and was already proven server-authoritative (used by `smokeLeaderboardService.js` for the leaderboard) — but Rewards.jsx never called it. This is exactly the "stale localStorage source" gap category named in the task mandate.
- **Existing persistence**: Completion (`smokecraft_session_completions`) and XP (`smokecraft_player_state.xp_total`) were already persisted correctly server-side on award. The gap was strictly on the *read/display* side, not the write side.
- **Existing progression/XP rule**: `SESSION_REWARDS.rewards` / `SESSION_REWARDS.achievements` (`src/constants/smokecraftRewards.js`) each award 50 XP — real, already-approved entries added specifically so these two sessions are completable (documented in-file). Server-side `getSessionRewardXp()` reuses this same table — no second XP table exists.
- **Existing tests**: None (`testReferences: []`).

## Root cause classification

**Stale localStorage source** — the displayed reward/XP totals were read from a local-only cache that is never reconciled against the server on load, distinct from (and less authoritative than) the real canonical ledger that already existed and was already used elsewhere in the app (leaderboard). This was NOT a missing-evidence-gate problem (Session 25 is a review/claim session by design, same category as the already-verified Session 27), NOT a duplicated reward source (only one server ledger exists), and NOT a client-trusted eligibility problem (completion/XP award was already server-validated) — narrowly, the *display* layer skipped the one already-existing canonical read.

## Canonical sources agreement

No conflict found. Exactly one canonical reward/XP/completion ledger exists: `smokecraft_player_state` + `smokecraft_session_completions` + `smokecraft_awards`, read via `GET /api/smokecraft/player-state` (`playerStateService.js#getPlayerState`) and written via `POST /api/smokecraft/player-state/sessions/:sessionId/complete` (`playerStateService.js#completeSession`). No STOP condition triggered.
