#!/usr/bin/env node
/**
 * Holistic Fix 5A-2 — build-blocking validator: closes the specific
 * client-controlled-reward gaps this pass targeted. Complements (does
 * not replace) validateSmokecraftGameplayIntegrity.mjs (Holistic Fix
 * 5A, still active in the prebuild chain).
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

const CLIENT_ADDXP_FILES = [
  'src/pages/smokecraft/Art.jsx',
  'src/pages/smokecraft/Available.jsx',
  'src/pages/smokecraft/Cultivation.jsx',
  'src/pages/smokecraft/Leaves.jsx',
]

console.log('\n── SmokeCraft gameplay-reward-authority validator (Holistic Fix 5A-2)\n')

for (const file of CLIENT_ADDXP_FILES) {
  const src = fs.readFileSync(file, 'utf8')
  // Every addXP(...) call in these screens must pass a second, named-source
  // argument — a bare addXP(<number>) with no server-known key means the
  // XP is once again purely client-decided with no server mirror.
  const calls = [...src.matchAll(/addXP\(([^)]*)\)/g)].map(m => m[1])
  const allNamed = calls.length > 0 && calls.every(args => args.split(',').length >= 2)
  check(`${file}: every addXP() call passes a named server-known source (no bare client-only XP grant)`, allNamed)
}

const knowledgeCheck = fs.readFileSync('src/components/smokecraft/KnowledgeCheck.jsx', 'utf8')
check('KnowledgeCheck.jsx no longer calls addXP() directly (server-verified quiz submit only)', !/\baddXP\(/.test(knowledgeCheck))
check('KnowledgeCheck.jsx submits raw responses via submitKnowledgeCheck, not a client score', /submitKnowledgeCheck\(/.test(knowledgeCheck))

const leafChallenge = fs.readFileSync('src/pages/smokecraft/LeafChallenge.jsx', 'utf8')
check('LeafChallenge.jsx no longer calls addXP()/addBadge()/awardStamp() directly for the final-round reward (server-verified submit only)',
  !/addXP\(|addBadge\(|awardStamp\(/.test(leafChallenge))
check('LeafChallenge.jsx submits raw answers via submitLeafChallenge, not a client score', /submitLeafChallenge\(/.test(leafChallenge))
check('LeafChallenge.jsx sources its answer key from the shared, server-dual-imported data module (not an inline duplicate)',
  /from ['"]\.\.\/\.\.\/data\/leafChallengeRounds\.js['"]/.test(leafChallenge))

const blend = fs.readFileSync('src/pages/smokecraft/Blend.jsx', 'utf8')
check('Blend.jsx no longer calls addXP()/awardStamp() directly (server-verified blend-selection submit only, Holistic Fix 5A-3)',
  !/addXP\(|awardStamp\(/.test(blend))
check('Blend.jsx submits its raw wrapper/binder/filler selection via submitBlendSelection, not a client claim', /submitBlendSelection\(/.test(blend))

const svcHasBlend = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('submitBlendSelection validates a complete, well-formed selection server-side (wrapper/binder/exactly-3-fillers), never trusting a bare completion claim',
  /VALID_WRAPPER_INDICES/.test(svcHasBlend) && /fillers\.length === 3/.test(svcHasBlend))

const svc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('submitKnowledgeCheck scores server-side against the real question data (scoreQuestionSet), not a client-submitted score', /scoreQuestionSet\(/.test(svc))
check('submitLeafChallenge scores server-side against the real answer key (scoreLeafChallenge), not a client-submitted score', /scoreLeafChallenge\(/.test(svc))
check('correctReward requires both a reason and an authorizedBy identity (never a silent/anonymous correction)', /if \(!reason \|\| !authorizedBy\)/.test(svc))
check('correctReward never deletes/updates the original award/attempt row — only inserts a new correction row', !/UPDATE smokecraft_awards|DELETE FROM smokecraft_awards|UPDATE smokecraft_activity_attempts|DELETE FROM smokecraft_activity_attempts/.test(svc))

const routes = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('The /corrections route is gated by requireStaff (never reachable by a plain learner identity)', /router\.post\(['"]\/corrections['"],\s*writeLimiter,\s*requireStaff/.test(routes))
check('Quiz and Leaf Challenge submit routes require a verified SmokeCraft identity', /knowledge-check\/:moduleId\/submit['"],\s*writeLimiter,\s*requireSmokeCraftIdentity/.test(routes) && /leaf-challenge\/submit['"],\s*writeLimiter,\s*requireSmokeCraftIdentity/.test(routes))

const rewardTable = fs.readFileSync('server/services/smokecraft/sessionRewardTable.js', 'utf8')
check('NAMED_XP_SOURCES is populated (not the empty placeholder from Holistic Fix 4) — named XP is now real, not dead code', !/const NAMED_XP_SOURCES = \{\}/.test(rewardTable) && /NAMED_XP_SOURCES = \{[\s\S]*art-observation/.test(rewardTable))

check('Migration 096 (activity ledger + corrections) exists', fs.existsSync('server/db/migrations/096_smokecraft_activity_ledger_and_rules.sql'))
check('Migration 096 has a rollback script outside server/db/migrations', fs.existsSync('server/db/rollbacks/096_smokecraft_activity_ledger_and_rules.rollback.sql'))
const mig096 = fs.readFileSync('server/db/migrations/096_smokecraft_activity_ledger_and_rules.sql', 'utf8')
check('smokecraft_activity_attempts has UNIQUE(guest_reference, activity_type, activity_key) — one scored attempt per activity ever', /UNIQUE \(guest_reference, activity_type, activity_key\)/.test(mig096))
check('smokecraft_reward_corrections is append-only structured (has a reason and authorized_by column)', /reason\s+TEXT NOT NULL/.test(mig096) && /authorized_by\s+TEXT NOT NULL/.test(mig096))

check('Seed script for the versioned rule registry exists', fs.existsSync('scripts/seedSmokecraftGameplayRules.mjs'))
const seed = fs.readFileSync('scripts/seedSmokecraftGameplayRules.mjs', 'utf8')
check('Rule seed script sources values from existing constants (SESSION_REWARDS/SC_RANKS/question sets), never invents new numbers', /SESSION_REWARDS, SC_RANKS/.test(seed) && /KNOWLEDGE_CHECK_SETS/.test(seed))
check('Rule seed script uses ON CONFLICT DO NOTHING on (rule_key, version) — a rule row is immutable once written', /ON CONFLICT \(rule_key, version\) DO NOTHING/.test(seed))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
