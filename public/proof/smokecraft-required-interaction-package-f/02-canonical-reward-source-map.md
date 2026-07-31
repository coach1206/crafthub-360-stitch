# Package F — Canonical Reward Source Map

**Canonical service**: `server/services/smokecraft/playerStateService.js`
 - `getPlayerState(guestReference)` — reads `smokecraft_player_state` (root: `xp_total`, `rank_label`), `smokecraft_session_completions` (per-session completion + XP), `smokecraft_awards` (badge/xp/passport-stamp awards).
 - `completeSession(...)` — the ONE completion write path for every curriculum session, Session 25/26 included. Idempotent per `(guest_reference, session_id)` via a real DB UNIQUE constraint.

**Canonical table/ledger**:
 - `smokecraft_player_state` — one row per guest, `xp_total` is the single running XP total.
 - `smokecraft_session_completions` — one row per `(guest_reference, session_id)`, UNIQUE-constrained.
 - `smokecraft_awards` — badge/xp/passport-stamp award audit trail.
 - `smokecraft_award_audit` — mutation audit log (applied/duplicate_replay outcomes).

**Canonical API**:
 - `GET /api/smokecraft/player-state` — canonical read (`fetchPlayerState()` client, `src/services/smokecraft/playerStateApiClient.js`).
 - `POST /api/smokecraft/player-state/sessions/:sessionId/complete` — canonical write (`completeSessionOnServer()` client).

**Dedupe rule**: `INSERT ... ON CONFLICT` / explicit `UNIQUE_VIOLATION` catch on `(guest_reference, session_id)` — a duplicate or concurrent completion attempt always resolves to the single already-existing row (`alreadyCompleted: true`), never a second XP/completion record.

**Ownership rule**: `guestReference` is always derived server-side from the verified identity cookie (`req.smokecraftIdentity`), never trusted from the request body — enforced identically for Session 25/26 as for every other session.

**Replay protection**: idempotency key + the `(guest_reference, session_id)` UNIQUE constraint together — a retried/replayed completion request is a safe no-op.

## Candidates considered and ruled out as NOT canonical

- `smokecraftRewards.js` (`getSessionRewards`, `getSmokeCraftXP`, `getEarnedBadges`) — pure client-side constants/derivation used for XP-breakdown-by-category display and badge lookup by id. **Not a second source of truth**: it derives entirely from `session.completedSteps`/`session.badges`, which are themselves populated by the same `awardSessionRewards()` call that also drives the real server write. No independent XP number is invented here — it is presentation logic over already-real data, kept as-is (still used for the category breakdown rows, which are out of this package's flagged scope).
- `journey.rewards` / `journey.achievements` (SmokeCraftJourneyContext) — local UI state (claimed-tier list, active tab, earned-achievement timestamps). Real and correctly scoped to *presentation state* (which tab is open, which milestone the player already clicked Claim on) — not a competing XP/completion ledger. Left unchanged.
- No second/competing player-state store, reward table, or achievement ledger was found anywhere in the codebase. **No conflict — one canonical source, confirmed.**
