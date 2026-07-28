# Holistic Fix 5A-3H — Proof Index

Starting commit: `81a16f61`.

## Leaderboard route/API audited

`GET /api/smokecraft/player-state/leaderboard`,
`PUT /api/smokecraft/player-state/leaderboard/preference` (backend,
migration 095, already real before this pass); `Leaderboard.jsx`
(`/smokecraft/leaderboard`, frontend);
`smokeLeaderboardService.js` (client adapter).

## Authoritative data source

`smokecraft_player_state.xp_total` / `rank_label`, joined with
`smokecraft_session_completions` and `smokecraft_awards` — a real query,
no mock/hardcoded entries anywhere (confirmed by the pre-existing
`validateSmokecraftGameplayIntegrity.mjs` check, re-verified this pass).

## Mock/client paths found and removed

No mock or client-submitted-score path existed server-side (the backend
was already real). The real defect was on the **client**:
`Leaderboard.jsx` fetched the real server leaderboard
(`getLeaderboardSnapshot`) but **never rendered the fetched community
entries at all** — the screen's "You" row, XP, rank, and rank-strip
values were all built from `buildCurrentUserEntry(session, journey)`, a
purely local `GuestSessionContext`/`SmokeCraftJourneyContext` mirror
that could drift from the real server total (e.g. after a correction).
This is the "screen bypasses authoritative data" defect the mandate's
validator requirement (section 8) specifically targets — closed by
rewiring the screen to render `snapshot.communityEntries` (the real
server list) and to prefer `snapshot.currentPlayer` (now sourced from
`fetchPlayerState()`) for the current guest's own totals.

## Eligibility result

PASS (already real) — a guest with `xp_total = 0` is honestly excluded;
`eligible = false` (opt-out) is enforced server-side
(`WHERE COALESCE(le.eligible, true) = true`), not merely a UI toggle.
Verified live: earn → opted-out → confirmed absent from the board.

## Tie-breaking result

PASS — `ORDER BY xp_total DESC, completed_session_count DESC,
guest_reference ASC`, documented in `SMOKECRAFT_LEADERBOARD_RULES.md`
and enforced by a validator regex tying the doc text to the live query
text (drift-proof). Verified live: two guests tied at identical XP and
session count break deterministically by `guest_reference` ascending.

## Privacy result

PASS — `displayName` defaults to `"Guest " + last 4 chars`, never a
real email/account id; the public payload never returns raw
`guest_reference` (server computes `isCurrentUser` internally and
strips the identity before responding). Opt-out verified live and
server-enforced.

## Venue-isolation result

PASS (newly closed this pass — was previously a dead column). SC-D041:
`smokecraft_leaderboard_eligibility.venue_id` existed in the schema and
was already read by `getLeaderboard`'s venue filter, but was **never
written by any code path** — `setLeaderboardPreference` silently
dropped it. Closed by accepting/persisting `venueId` through
`PUT /leaderboard/preference`. Verified live: a guest scoped to
`venue-A` appears in a `venue-A`-scoped query and is absent from a
`venue-B`-scoped query.

## Correction/reversal result

PASS (already real, re-verified) — `correctReward` already applies
`deltaXp` directly to `smokecraft_player_state.xp_total`, the same
column the leaderboard reads live — so a correction genuinely
recalculates placement (verified live: 50 XP → corrected to 0 XP →
guest immediately drops off the board), not a separately cached total
that could drift from the correction.

## Duplicate-resistance result

PASS (already real, re-verified) — named XP sources
(`smokecraft_awards`, `award_type='xp'`) are one-time per
`(guest_reference, award_key)`; re-earning the same source a second
time does not inflate `xp_total`.

## Account-conversion result

PASS (newly closed this pass). SC-D042: `convertGuestToAccount` never
transferred `smokecraft_leaderboard_eligibility` at all — a guest who
explicitly opted out (a real privacy choice) would silently revert to
default-visible under their new account identity, and any venue scope
they set would be lost. Closed by transferring the eligibility row
(opt-out + display name + venue) on conversion. Verified live:
opted-out guest converts → still absent from the leaderboard under the
account identity.

## Cross-device result

PASS — leaderboard placement and the guest's own XP total are 100%
server-side; two independent live fetches under the same identity
return identical totals (no per-device local mirror to desync).

## Live-screen result

PASS (newly closed this pass). The screen now renders the real
server-fetched community entries directly, adds real pagination
(Prev/Next over server `LIMIT`/`OFFSET`), and the "Refresh Rankings"
button now genuinely re-fetches server data (previously it only bumped
a local timestamp). All 11 mandated states — loading, empty, locked
(n/a — no lock concept on this screen), in-progress (n/a), completed
(n/a), unavailable/error, corrected (reflected live via the immediate
XP/placement change), retry, offline, session-expired (n/a — public
no-login route), guest mode — are honestly represented; approved
visuals and pixel zones are unchanged (only the data feeding them and
two new inert Prev/Next buttons in existing free space were added).

## Migration added

None. Migration 095's `smokecraft_leaderboard_eligibility` table already
had every column required (`eligible`, `display_name`, `venue_id`) —
`venue_id` simply had no writer before this pass.

## Defects found and fixed

- **SC-D041**: `smokecraft_leaderboard_eligibility.venue_id` was a real
  schema column, already read by the leaderboard query's venue filter,
  but was never accepted/written by `setLeaderboardPreference` —
  closed.
- **SC-D042**: `convertGuestToAccount` never transferred the leaderboard
  eligibility/opt-out/venue preference row on guest-to-account
  conversion — a genuine privacy-preference loss — closed.
- **SC-D043**: `Leaderboard.jsx` rendered its own "You" row and rank
  strip entirely from the local `GuestSessionContext`/
  `SmokeCraftJourneyContext` mirror and never rendered the real fetched
  community leaderboard at all — closed by wiring the screen through
  `fetchPlayerState()` and the real `snapshot.communityEntries`.

## Tests and build

`verify-smokecraft-hf5a3h-leaderboard-flow.mjs`: 25/25.
`validateSmokecraftLeaderboardAuthority.mjs`: 24/24 (wired into
prebuild). One pre-existing validator
(`validateSmokecraftGameplayIntegrity.mjs`) had a regex tied to the
exact quote-style of the old `fetch('...')` call; updated to match the
new template-literal `fetch(\`...\`)` call (same real endpoint, now
with real query parameters) — re-verified PASS. Regression re-verified
clean: HF4 30/30, HF4B 32/32, HF5A-3 5/5, HF5A-3D 13/13, HF5A-3E 11/11,
HF5A-3F 19/19, HF5A-3G 22/22. `npm run build` (18 prebuild validators +
vite build): clean.

## Proof path

`public/proof/smokecraft-holistic-fix-5a-3h/`

## What this pass does NOT cover

Pairing, mentor intelligence, Challenge Hub, Golden Box's own separate
competition leaderboard (`server/services/leaderboardService.js`,
`submitScore` — a distinct system, explicitly out of this mandate's
scope) — untouched. The full 109-route/five-viewport sweeps were not
run, per this mandate's own instruction.
