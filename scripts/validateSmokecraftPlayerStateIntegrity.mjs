// Holistic Fix 4 — build-blocking validator for the new server-
// authoritative player-state layer. Static/source checks only (no live
// DB/browser dependency, so it can run in prebuild like the other
// validators) — verifies the idempotency/security contract holds in the
// code as written, and that the state ownership map exists and stays
// roughly in sync with the real migration/route files.
import fs from 'node:fs'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) { console.log(`  OK    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft player-state integrity validator (Holistic Fix 4)\n')

// 1. The state ownership map exists.
check('docs/smokecraft/SMOKECRAFT_STATE_OWNERSHIP_MAP.md exists', fs.existsSync('docs/smokecraft/SMOKECRAFT_STATE_OWNERSHIP_MAP.md'))

// 2. The canonical migration + its rollback both exist.
check('migration 092 (canonical player state) exists', fs.existsSync('server/db/migrations/092_smokecraft_canonical_player_state.sql'))
check('migration 092 has a rollback script', fs.existsSync('server/db/rollbacks/092_smokecraft_canonical_player_state.rollback.sql'))
check('migration 093 (idempotency-key guest-scope fix) exists', fs.existsSync('server/db/migrations/093_smokecraft_player_state_idempotency_key_guest_scope.sql'))
check('rollback file does NOT live inside server/db/migrations (would be picked up and auto-run as a forward migration)',
  !fs.existsSync('server/db/migrations/092_smokecraft_canonical_player_state.rollback.sql'))

// 3. Migration 092 declares the required UNIQUE constraints (idempotency
//    is a real database constraint, not merely an application check).
const migration092 = fs.readFileSync('server/db/migrations/092_smokecraft_canonical_player_state.sql', 'utf8')
check('smokecraft_session_completions has a UNIQUE constraint on (guest_reference, session_id)', /UNIQUE\s*\(guest_reference,\s*session_id\)/.test(migration092))
check('smokecraft_awards has a UNIQUE index on (guest_reference, award_type, award_key)', /uniq_sa_guest_type_key/.test(migration092))

// 4. Migration 093 scopes idempotency_key per-guest (not globally unique)
//    — regression lock for the real cross-guest collision bug found and
//    fixed during this pass's live testing.
const migration093 = fs.readFileSync('server/db/migrations/093_smokecraft_player_state_idempotency_key_guest_scope.sql', 'utf8')
check('migration 093 drops the global UNIQUE constraint on smokecraft_session_completions.idempotency_key', /DROP CONSTRAINT.*smokecraft_session_completions_idempotency_key_key/.test(migration093))
check('migration 093 adds a guest-scoped UNIQUE index instead', /uniq_ssc_guest_idempotency_key/.test(migration093))
check('migration 093 does the same fix for smokecraft_awards', /uniq_sa_guest_idempotency_key/.test(migration093))

// 5. The service layer never trusts a client-supplied guest_reference —
//    controller only derives it from req.smokecraftIdentity (server-
//    verified cookie), never req.body.
const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('controller derives guestReference only from req.smokecraftIdentity, never req.body', /ownerGuestReference\(req\.smokecraftIdentity\)/.test(controller) && !/req\.body\.guestReference/.test(controller) && !/req\.body\.guest_reference/.test(controller))
check('XP amount for session completion comes from the server-owned reward table, not the request body', /getSessionRewardXp\(sessionId\)/.test(controller) && !/xpAwarded:\s*req\.body/.test(controller))
check('XP award endpoint validates the award key against a server-known table (getNamedXpAmount), never trusts a client amount directly', /getNamedXpAmount\(req\.body\?\.awardKey\)/.test(controller) && !/amount:\s*req\.body\.amount/.test(controller))
check('every mutation requires a client-supplied idempotencyKey (validated, not optional)', /requireIdempotencyKey\(req, res\)/.test(controller))

// 6. The service layer wraps every mutation in an explicit transaction
//    with COMMIT/ROLLBACK, and records an audit row on every outcome.
const service = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('completeSession uses BEGIN/COMMIT/ROLLBACK (real transaction, not fire-and-forget writes)', /await client\.query\('BEGIN'\)/.test(service) && /await client\.query\('COMMIT'\)/.test(service) && /ROLLBACK/.test(service))
check('every mutation path records an audit row (applied or duplicate_replay)', (service.match(/recordAudit\(|award_audit/g) || []).length >= 4)
check('client.release() is called (no connection leak) via a finally block', /finally\s*\{\s*client\.release\(\)/.test(service))

// 7. Routes are protected by the real, existing guest-identity middleware
//    (not a new, unproven identity scheme).
const routes = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('player-state routes require requireSmokeCraftIdentity (server-verified cookie) on every state-touching route', /requireSmokeCraftIdentity/.test(routes))
check('player-state routes are rate-limited', /rateLimit\(/.test(routes))
check('mutation routes reuse ensureSmokeCraftGuestIdentity (the existing, proven JWT-cookie identity system) rather than inventing a new one', /ensureSmokeCraftGuestIdentity/.test(routes))

// 8. Route is actually mounted in server/index.js (not orphaned).
const serverIndex = fs.readFileSync('server/index.js', 'utf8')
check('smokecraftPlayerStateRoutes is imported in server/index.js', /import smokecraftPlayerStateRoutes/.test(serverIndex))
check("smokecraftPlayerStateRoutes is mounted at '/api/smokecraft/player-state'", /app\.use\('\/api\/smokecraft\/player-state', smokecraftPlayerStateRoutes\)/.test(serverIndex))

// 9. The client no longer treats localStorage as sole authority for the
//    session-completion/Passport-stamp award path — it must call the
//    new server API as well.
const guestSessionContext = fs.readFileSync('src/context/GuestSessionContext.jsx', 'utf8')
check('awardSessionRewards calls the new server-authoritative completeSessionOnServer', /completeSessionOnServer\(/.test(guestSessionContext))
check('awardStamp calls the new server-authoritative awardPassportStampOnServer', /awardPassportStampOnServer\(/.test(guestSessionContext))

// 10. The client adapter never invents a fake-success response — network
//     failure must resolve to { ok: false }, never be swallowed as success.
const apiClient = fs.readFileSync('src/services/smokecraft/playerStateApiClient.js', 'utf8')
check('client adapter returns { ok: false } on network failure, never a fabricated success', /return \{ ok: false, status: 0, error: 'network_unavailable'/.test(apiClient))
check('client adapter checks data.success === true before treating a response as ok (no fake-success on a malformed 200)', /data\.success !== true/.test(apiClient))

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
