# SmokeCraft Leaderboard Rules — Holistic Fix 5A

Generated: Holistic Fix 5A, starting commit `9ea19421`.

## Data source

`GET /api/smokecraft/player-state/leaderboard` — a real, server-
authoritative query against `smokecraft_player_state` (joined with
`smokecraft_session_completions` for activity count and
`smokecraft_awards` for badge count). **No mock, hardcoded, or sample
entries exist anywhere in this endpoint or its client consumer**
(`src/services/smokecraft/smokeLeaderboardService.js`) — confirmed by
the build-blocking `validateSmokecraftGameplayIntegrity.mjs` check that
greps for known placeholder names.

## Eligibility rule

A guest/account appears on the leaderboard when:
1. Their `smokecraft_player_state.xp_total > 0` (a guest with no real
   activity yet is honestly excluded, not shown as a zero-score entry
   cluttering the board), **and**
2. They have not explicitly opted out (`smokecraft_leaderboard_eligibility.eligible = false`).
   The default (no eligibility row at all) is `eligible = true`,
   matching the pre-existing product behavior (SmokeCraft's leaderboard
   has always shown all active guests by default — confirmed by reading
   the pre-existing `services/leaderboardService.js` before this pass).

A guest can set their own preference (display name and/or eligibility)
via `PUT /api/smokecraft/player-state/leaderboard/preference` —
self-service, own identity only (the endpoint derives the identity from
the server-verified cookie, exactly like every other player-state
mutation; there is no way to set another guest's preference).

## Ordering / tie-breaking rule

`ORDER BY xp_total DESC, completed_session_count DESC, guest_reference ASC`

1. Highest XP total first (the primary, real gameplay metric).
2. On an exact XP tie, the guest with more completed sessions ranks
   higher (reflects more genuine engagement for the same XP total —
   possible when different sessions award different XP amounts, e.g.
   two guests could reach the same total via a different mix of
   sessions).
3. On a full tie (identical XP and completed-session count — can happen
   for two guests who completed the exact same sessions), sort by
   `guest_reference` ascending — purely for deterministic, stable
   ordering across repeated identical queries; carries no ranking
   meaning.

## Privacy rule

- `displayName` defaults to `"Guest " + last 4 characters of guest_reference`
  when the guest has not set one — never their real email, account ID,
  or any other identifying information.
- The account's real email/profile fields are never included in the
  leaderboard response payload at all (confirmed: the SQL query
  `SELECT`s only `guest_reference`, `xp_total`, `rank_label`,
  `display_name`, plus the two derived counts — no join to
  `system_users`/`passport_member_profiles`).
- A guest can opt out entirely (`eligible: false`) — an honest, working
  privacy control, not merely a UI toggle with no server effect (the
  server-side `WHERE COALESCE(le.eligible, true) = true` clause is the
  actual enforcement).

## Scope rule

`venueId` query parameter, when supplied, filters to guests whose
recorded `venue_id` matches (or is unset — a guest who never selected a
venue is not silently excluded from a venue-scoped board). Global scope
(no `venueId` filter) is the default and requires no special
authorization — matches the pre-existing product's public, no-login-
required leaderboard access model (this has never been a privileged
surface in this codebase).

## Pagination / empty / error / loading states

- `limit` (max 100, default 50) and `offset` query parameters — real
  SQL `LIMIT`/`OFFSET`, not a client-side slice of an over-fetched array.
- Empty state: `communityStatus: 'empty'` with an honest message when
  zero guests currently qualify — never a fabricated "no data" table
  with sample rows.
- Error/offline states: `communityStatus: 'error'` / `'offline'` on a
  failed fetch — the client never substitutes fake data on failure (see
  `smokeLeaderboardService.js`'s `try/catch`, which explicitly returns
  an honest offline status rather than swallowing the error into an
  empty-looking success).
- Loading state: the `Leaderboard.jsx` screen shows
  `communityStatus: 'loading'` while the real fetch is in flight, before
  the actual result (ready/empty/error/offline) replaces it.

## What this pass does NOT include

A full pixel-positioned redesign of the approved `LEADERBOARD 111.png`
image's baked competitor-table rows to render the real entries returned
by this new endpoint — out of scope per the mandate's "no visual
redesign" instruction and the existing screen's own documented decision
to honestly disclose "shared rankings unavailable" rather than render a
mismatched table over the approved artwork. The boundary message now
reflects the real leaderboard status (ready with a real count / loading
/ error / offline) instead of always saying "unavailable" — a real,
scoped improvement without touching the approved visual.

## Holistic Fix 5A-3H update

- **Venue scoping is now a real, writable preference.**
  `PUT /api/smokecraft/player-state/leaderboard/preference` now accepts
  an optional `venueId` string and persists it to
  `smokecraft_leaderboard_eligibility.venue_id` (previously accepted by
  the schema and read by `getLeaderboard`'s filter, but never actually
  writable — a dead feature).
- **Account conversion now preserves the leaderboard preference.**
  `convertGuestToAccount` transfers the eligibility row (opt-out flag +
  display name + venue) to the new account identity — previously never
  transferred at all.
- **The response never includes the raw `guest_reference`.** Each entry
  instead carries a server-computed `isCurrentUser: boolean`, derived by
  comparing the row's internal identity to the requester's own
  server-verified identity — the client never receives another guest's
  identity string, and never has to submit its own for this comparison
  to work.
- **The client screen (`Leaderboard.jsx`) now actually renders the real
  fetched entries.** Before this pass, `getLeaderboardSnapshot` fetched
  the real server list but the screen discarded it except for a summary
  message, rendering only a synthetic single "You" row built from a
  local client-side mirror. The screen now renders
  `snapshot.communityEntries` directly and prefers
  `snapshot.currentPlayer` (sourced from the real `fetchPlayerState()`
  endpoint) for the current guest's own totals.
- **Real pagination controls** (Prev/Next) were added over the existing
  `limit`/`offset` query parameters — no new endpoint, no client-side
  slicing.
