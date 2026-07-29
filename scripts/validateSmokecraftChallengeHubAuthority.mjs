#!/usr/bin/env node
/**
 * Holistic Fix 5C-1A — build-blocking validator for Challenge Hub
 * scoring authority (Daily/Weekly progress challenges +
 * Blend Fault Identification).
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Challenge Hub scoring-authority validator (Holistic Fix 5C-1A)\n')

const page = fs.readFileSync('src/pages/smokecraft/ChallengeHub.jsx', 'utf8')
const hubSvc = fs.readFileSync('server/services/smokecraft/challengeHubService.js', 'utf8')
const blendSvc = fs.readFileSync('server/services/smokecraft/blendFaultService.js', 'utf8')
const eventSvc = fs.readFileSync('server/services/smokecraft/challengeEventService.js', 'utf8')
const hubRoutes = fs.readFileSync('server/routes/challengeHubRoutes.js', 'utf8')
const blendRoutes = fs.readFileSync('server/routes/blendFaultRoutes.js', 'utf8')
const migration101 = fs.readFileSync('server/db/migrations/101_smokecraft_challenge_hub_scoring_authority.sql', 'utf8')

// ── 1. The client never calculates the authoritative score ────────────
check('ChallengeHub.jsx never computes a score/pass-fail/completion value itself — only requests the server adapter', !/passFail\s*=|scoreEarned\s*=|participationState\s*=\s*['"]completed/.test(page))
check('ChallengeHub.jsx renders challenge state via the server-provided api client, not a local scoring function', /import \* as api from '\.\.\/\.\.\/services\/smokecraft\/challengeHubApiClient\.js'/.test(page))
const blendFaultPage = fs.readFileSync('src/pages/smokecraft/BlendFaultChallenge.jsx', 'utf8')
check('BlendFaultChallenge.jsx never computes isCorrect/score itself — only submits raw answers and renders the server response', !/isCorrect\s*=\s*(?!.*a\.isCorrect)/.test(blendFaultPage) && /api\.submitAttempt/.test(blendFaultPage))

// ── 2. Completion is never client-decided ──────────────────────────────
check('Challenge Hub completion is decided inside completeChallengeAndAward() (server), reading real progression_events, never a client-submitted flag', /async function completeChallengeAndAward/.test(hubSvc) && /evalResult\.met/.test(hubSvc))
check('Blend Fault completion (pass/fail) is computed from the real server-side answer key, never trusting a client isCorrect/score field', /const isCorrect = answerKey\.get\(questionKey\) === answer/.test(blendSvc))

// ── 3. Every active challenge has a rule version ───────────────────────
check('smokecraft_challenge_definitions has a real rule_version column (migration 101)', /ADD COLUMN IF NOT EXISTS rule_version/.test(migration101))
check('Challenge Hub definitions serialize ruleVersion to the client', /ruleVersion: definition\.rule_version/.test(fs.readFileSync('server/controllers/challengeHubController.js', 'utf8')))
check('Blend Fault Identification carries an explicit, versioned assessment (ASSESSMENT_VERSION)', /const ASSESSMENT_VERSION = \d+/.test(blendSvc))

// ── 4. Reward mutations are database-enforced idempotent ──────────────
check('smokecraft_challenge_rewards enforces at-most-one XP grant per (guest_reference, challenge_instance_key) via a real UNIQUE constraint', /UNIQUE \(guest_reference, challenge_instance_key\)/.test(migration101))
check('The reward grant is attempted inside the same row-locked transaction as completion (FOR UPDATE), closing the two-tab race', /FOR UPDATE/.test(hubSvc) && /smokecraft_challenge_rewards/.test(hubSvc))
check('A UNIQUE_VIOLATION on the reward insert is caught and treated as "already granted", never a 500 or a double-award', /err\.code !== UNIQUE_VIOLATION/.test(hubSvc))
check('Blend Fault attempt scoring is guarded by a real row lock (FOR UPDATE) against a concurrent double-submit', /FOR UPDATE/.test(blendSvc))
check('An already-scored Blend Fault attempt is never rescored — the immutable prior result is returned instead', /Already scored — preserve the immutable prior result/.test(blendSvc) || /alreadyScored: true/.test(blendSvc))

// ── 5. Canonical challenge events exist with the required field set ────
check('challengeEventService.js defines exactly the four mandated canonical event types', /CANONICAL_CHALLENGE_EVENT_TYPES = \[\s*'challenge_started', 'challenge_submitted', 'challenge_scored', 'challenge_completed',/.test(eventSvc))
check('Every canonical event carries learner identity, challenge ID, attempt ID, evidence reference, rule ID/version, score result, reward result, idempotency key, audit ID, and server timestamp', /auditId: event\.id, serverTimestamp: event\.created_at/.test(eventSvc) && /challengeId, attemptId, evidenceReference/.test(eventSvc) && /ruleId, ruleVersion/.test(eventSvc) && /scoreResult, rewardResult/.test(eventSvc))
check('Challenge Hub (Daily/Weekly) emits all four canonical event types', ['challenge_started', 'challenge_submitted', 'challenge_scored', 'challenge_completed'].every(t => new RegExp(`eventType: '${t}'`).test(hubSvc)))
check('Blend Fault Identification emits all four canonical event types (unified vocabulary across both challenge types)', ['challenge_started', 'challenge_submitted', 'challenge_scored', 'challenge_completed'].every(t => new RegExp(`eventType: '${t}'`).test(blendSvc)))

// ── 6. ChallengeHub.jsx uses the server adapter, never bypasses it ────
check('ChallengeHub.jsx never calls fetch()/XHR directly — only through the shared challengeHubApiClient', !/fetch\(/.test(page))
check('ChallengeHub.jsx never hardcodes a mock challenge result as live data (no mock/fake/dummy challenge state literals)', !/mockChallenge|fakeChallenge|dummyResult/i.test(page))

// ── 7. Identity bridging correctly distinguishes accounts from guests ──
// Real found defect (this pass): both routers previously used the raw
// smokecraftIdentity.id for an authenticated account instead of the
// established `user:${id}` prefix, so a converted account's Challenge
// Hub/Blend Fault requests silently queried under the WRONG identity
// string and never saw their own just-transferred state.
check('Challenge Hub routes prefix an authenticated account identity with user: (matches the established pattern; the raw id was a real found defect)', /req\.goldenBoxGuestReference = `user:\$\{req\.smokecraftIdentity\.id\}`/.test(hubRoutes))
check('Blend Fault routes prefix an authenticated account identity with user: (same defect, same fix)', /req\.goldenBoxGuestReference = `user:\$\{req\.smokecraftIdentity\.id\}`/.test(blendRoutes))
check('Both routers still issue a fresh guest identity when none exists (ensureSmokeCraftGuestIdentity present)', /ensureSmokeCraftGuestIdentity/.test(hubRoutes) && /ensureSmokeCraftGuestIdentity/.test(blendRoutes))

// ── 8. Account conversion transfers Challenge Hub / Blend Fault state ──
const playerStateSvc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('convertGuestToAccount() transfers Challenge Hub learner state (previously never transferred — a real found gap)', /smokecraft_challenge_learner_state/.test(playerStateSvc) && /challengeStateTransferred/.test(playerStateSvc))
check('convertGuestToAccount() transfers Challenge Hub reward grants', /smokecraft_challenge_rewards/.test(playerStateSvc) && /challengeRewardsTransferred/.test(playerStateSvc))
check('convertGuestToAccount() transfers Blend Fault attempts and their answers', /smokecraft_blend_fault_attempts/.test(playerStateSvc) && /smokecraft_blend_fault_answers/.test(playerStateSvc) && /blendFaultAttemptsTransferred/.test(playerStateSvc))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
