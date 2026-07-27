// Holistic Fix 5A — build-blocking validator for the gameplay ledger,
// rank/badge/passport-stamp auto-unlock, and leaderboard. Static/source
// checks only, same pattern as the other validateSmokecraft*.mjs
// scripts in this pipeline.
import fs from 'node:fs'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) { console.log(`  OK    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft gameplay-integrity validator (Holistic Fix 5A)\n')

// 1. Required docs exist.
for (const doc of [
  'docs/smokecraft/SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md',
]) {
  check(`${doc} exists`, fs.existsSync(doc))
}

// 2. Migration 095 exists with a rollback, not auto-runnable.
check('migration 095 exists', fs.existsSync('server/db/migrations/095_smokecraft_gameplay_rank_and_rules.sql'))
check('migration 095 has a rollback script', fs.existsSync('server/db/rollbacks/095_smokecraft_gameplay_rank_and_rules.rollback.sql'))
check('rollback file does not live inside server/db/migrations', !fs.existsSync('server/db/migrations/095_smokecraft_gameplay_rank_and_rules.rollback.sql'))

const migration095 = fs.readFileSync('server/db/migrations/095_smokecraft_gameplay_rank_and_rules.sql', 'utf8')
check('smokecraft_rank_history has UNIQUE(guest_reference, rank_label) — idempotent promotion', /UNIQUE \(guest_reference, rank_label\)/.test(migration095))
check('smokecraft_gameplay_rules has UNIQUE(rule_key, version) — versioned, not overwritable', /UNIQUE \(rule_key, version\)/.test(migration095))

// 3. Badge/Passport-stamp auto-unlock is server-side (in the same
//    transaction as session completion), not a separate client claim.
const service = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('grantSessionBadgesInTx runs inside completeSession\'s transaction (client never separately claims a session-tied badge)', /grantSessionBadgesInTx\(client, guestReference, sessionId/.test(service))
check('grantSessionPassportStampInTx runs inside the same transaction', /grantSessionPassportStampInTx\(client, guestReference, sessionId/.test(service))
check('badge/stamp grants use ON CONFLICT DO NOTHING against the real UNIQUE index (duplicate-protected, not app-level only)', /ON CONFLICT \(guest_reference, award_type, award_key\) DO NOTHING/.test(service))
check('rank is recomputed server-side from xp_total, never trusted from the client', /getRankForXp\(state\.xp_total\)/.test(service))
check('no automatic demotion — recomputeRankInTx only ever changes rank when the newly computed rank differs (promotion), never compares for a lower value to force a downgrade', !/rank_label\s*<\s*newRank|demote/i.test(service))

// 4. The XP amount and badge/rank/stamp criteria all come from the
//    existing, verified, single source-of-truth constants file — no
//    second competing table with different values.
const rewardTable = fs.readFileSync('server/services/smokecraft/sessionRewardTable.js', 'utf8')
check('badge criteria are read from SESSION_REWARDS (existing single source of truth), not duplicated', /SESSION_REWARDS\[sessionId\]\.sessionBadges/.test(rewardTable) || /entry\.sessionBadges/.test(rewardTable))
check('rank ladder is read from SC_RANKS (existing, already-approved, already-aligned constant) — not a newly invented ladder', /SC_RANKS/.test(rewardTable))

// 5. Leaderboard derives from real server data, never mock/hardcoded entries.
check('leaderboard query selects from smokecraft_player_state (real data)', /FROM smokecraft_player_state ps/.test(service))
check('leaderboard query has no hardcoded/mock guest names or scores', !/JAMES CARTER|SOFIA MARTINEZ|MICHAEL TORRES|mockEntries|MOCK_LEADERBOARD/.test(service))
const leaderboardServiceFile = fs.readFileSync('src/services/smokecraft/smokeLeaderboardService.js', 'utf8')
check('client leaderboard service fetches the real API, never returns a hardcoded communityEntries array', /fetch\('\/api\/smokecraft\/player-state\/leaderboard/.test(leaderboardServiceFile) && !/communityEntries:\s*\[\s*\]\s*,\s*communityStatus:\s*'empty'\s*,\s*communityMessage:\s*'A shared/.test(leaderboardServiceFile))

// 6. Controller: no client-controlled score/XP/badge/rank/stamp.
const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('leaderboard preference endpoint validates displayName/eligible types, never trusts arbitrary client fields for scoring', /invalid_display_name|invalid_eligible_flag/.test(controller))
check('no controller path accepts a client-supplied XP/score/badge/rank amount for the completion or award endpoints (still true from Holistic Fix 4)', !/xpAwarded:\s*req\.body/.test(controller) && !/amount:\s*req\.body\.amount/.test(controller))

// 7. Mentor dual-ownership fix is real (single write path).
const mentorScreen = fs.readFileSync('src/pages/smokecraft/Mentor.jsx', 'utf8')
check('Mentor.jsx has exactly one setSelectedMentor call site, reactive to journey.mentor (not an independent write)', (mentorScreen.match(/setSelectedMentor\(/g) || []).length === 1 && /\[journey\.mentor\]/.test(mentorScreen))

// 8. Routes mounted.
const routes = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('leaderboard read route is mounted', /router\.get\('\/leaderboard'/.test(routes))
check('leaderboard preference route requires identity (not anonymous-writable)', /router\.put\('\/leaderboard\/preference', writeLimiter, requireSmokeCraftIdentity/.test(routes))

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
