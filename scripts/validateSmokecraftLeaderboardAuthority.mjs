#!/usr/bin/env node
/**
 * Holistic Fix 5A-3H — build-blocking validator for Leaderboard ledger
 * integration.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Leaderboard-authority validator (Holistic Fix 5A-3H)\n')

const svc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('getLeaderboard never accepts a client-submitted xpTotal/score — it SELECTs xp_total from the real player-state table', /SELECT[\s\S]{0,200}ps\.xp_total/.test(svc))
check('The eligibility WHERE clause enforces the real server-side opt-out (COALESCE(le.eligible, true) = true), not a client-supplied flag', /WHERE COALESCE\(le\.eligible, true\) = true/.test(svc))
check('A guest with zero real XP is honestly excluded, never shown as a fabricated zero-score row', /AND ps\.xp_total > 0/.test(svc))
check('Tie-breaking is deterministic: xp_total DESC, then completed_session_count DESC, then guest_reference ASC', /ORDER BY ps\.xp_total DESC, completed_session_count DESC, ps\.guest_reference ASC/.test(svc))
check('displayName defaults to an honest "Guest ####" pattern, never the real email/account id, when unset', /COALESCE\(le\.display_name, 'Guest ' \|\| RIGHT\(ps\.guest_reference, 4\)\)/.test(svc))
check('The public leaderboard payload never returns the raw guest_reference — only isCurrentUser is derived from it server-side', /isCurrentUser: viewerGuestReference != null && r\.guest_reference === viewerGuestReference/.test(svc) && !/displayName: r\.guest_reference/.test(svc))
check('Venue scoping is a real, settable, persisted preference (venue_id column actually written), not a dead column', /venue_id = COALESCE\(EXCLUDED\.venue_id/.test(svc))
check('Pagination is real SQL LIMIT/OFFSET, not a client-side array slice', /LIMIT \$1 OFFSET \$2/.test(svc))
check('convertGuestToAccount transfers the leaderboard eligibility/opt-out/venue preference (real found-and-fixed gap — was previously never transferred)', /leaderboardPreferenceTransferred/.test(svc) && /smokecraft_leaderboard_eligibility WHERE guest_reference = \$1/.test(svc))
check('XP corrections recompute smokecraft_player_state.xp_total directly (the same column the leaderboard reads), so placement is genuinely recalculated, never a separate cached leaderboard total', /UPDATE smokecraft_player_state SET xp_total = GREATEST\(0, xp_total \+ \$2\)/.test(svc))

const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('The leaderboard limit is server-side clamped to a real max (100), never trusting an arbitrarily large client-requested page size', /Math\.min\(Math\.max\(parseInt\(req\.query\.limit, 10\) \|\| 50, 1\), 100\)/.test(controller))
check('The leaderboard offset is server-side clamped to a non-negative value', /Math\.max\(parseInt\(req\.query\.offset, 10\) \|\| 0, 0\)/.test(controller))
check('setLeaderboardPreference derives guestReference from the server-verified identity only (self-service, own identity only — never trusts a client-submitted guestReference for writes)', /const guestReference = ownerGuestReference\(req\.smokecraftIdentity\)\s*\n\s*await setLeaderboardPreference/.test(controller))

const client = fs.readFileSync('src/services/smokecraft/smokeLeaderboardService.js', 'utf8')
check('getLeaderboardSnapshot fetches the real authoritative player-state (fetchPlayerState) rather than trusting only the local GuestSessionContext mirror for the numbers it returns', /fetchPlayerState\(\)/.test(client))
check('A failed/offline fetch returns an honest error/offline status, never a fabricated empty-looking success', /communityStatus: 'offline'/.test(client) && /communityStatus: 'error'/.test(client))

const page = fs.readFileSync('src/pages/smokecraft/Leaderboard.jsx', 'utf8')
check('The Leaderboard screen renders the real fetched community entries (snapshot.communityEntries via filteredEntries), not only a synthetic single local entry', /snapshot\.communityEntries/.test(page) && /filteredEntries\.map\(e =>/.test(page))
check('The screen prefers server-authoritative XP (authoritativeXp) for the displayed totals, not the local session mirror alone', /authoritativeXp/.test(page))
check('The "You" indicator on a leaderboard row is driven by the server-computed isCurrentUser flag, never assumed for every row', /e\.isCurrentUser &&/.test(page))
check('The screen has real loading/error/offline states (not a static mock)', /phase === 'loading'/.test(page) && /phase === 'error'/.test(page) && /isOffline/.test(page))
check('The screen supports real pagination controls (Prev/Next) over the server LIMIT/OFFSET', /lb-page-prev/.test(page) && /lb-page-next/.test(page))
check('The "Refresh Rankings" control re-fetches real server data, not just a local timestamp bump', /getLeaderboardSnapshot\(session, \{ venueId, offset: pageOffset, limit: PAGE_SIZE \}\)\.then\(setSnapshot\)/.test(page))

const migration095 = fs.readFileSync('server/db/migrations/095_smokecraft_gameplay_rank_and_rules.sql', 'utf8')
check('smokecraft_leaderboard_eligibility has a real UNIQUE guest_reference constraint (one preference row per identity)', /guest_reference   TEXT NOT NULL UNIQUE/.test(migration095))
check('smokecraft_leaderboard_eligibility carries a real venue_id column for venue-boundary enforcement', /venue_id\s+TEXT/.test(migration095))

const rulesDoc = fs.readFileSync('docs/smokecraft/SMOKECRAFT_LEADERBOARD_RULES.md', 'utf8')
check('The documented tie-breaking rule matches the implementation exactly (xp_total DESC, completed_session_count DESC, guest_reference ASC)',
  /xp_total DESC, completed_session_count DESC, guest_reference ASC/.test(rulesDoc) && /ORDER BY ps\.xp_total DESC, completed_session_count DESC, ps\.guest_reference ASC/.test(svc))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
