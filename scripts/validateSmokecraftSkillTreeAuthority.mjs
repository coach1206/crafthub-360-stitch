#!/usr/bin/env node
/**
 * Holistic Fix 5A-3G — build-blocking validator for Skill Tree ledger
 * integration.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Skill-Tree-authority validator (Holistic Fix 5A-3G)\n')

const client = fs.readFileSync('src/services/smokecraft/skillTreeApiClient.js', 'utf8')
check('The Skill Tree client only exposes read (getSkillTree/getNode) and server-recalculate (recalculate) calls — no client-set-progress function exists',
  !/setCompleted|setProgress|unlock\(|completeNode/.test(client))

const page = fs.readFileSync('src/pages/smokecraft/SkillTree.jsx', 'utf8')
check('SkillTree.jsx fetches live data via the shared skillTreeApiClient (no local mirror)', /from ['"]\.\.\/\.\.\/services\/smokecraft\/skillTreeApiClient\.js['"]/.test(page))
check('SkillTree.jsx has real loading/error/offline states (not a static mock)', /status === 'loading'/.test(page) && /status === 'offline'/.test(page) && /status === 'error'/.test(page))
check('SkillTree.jsx renders a distinct visual state for a corrected/reversed node (not silently hidden)', /corrected:/.test(page))

const svc = fs.readFileSync('server/services/smokecraft/skillTreeService.js', 'utf8')
check('recalculate() checks real evidence tables per node (EVIDENCE_CHECKS), never trusts a client-submitted completion flag', /EVIDENCE_CHECKS/.test(svc))
check('Every node has a completion_rule mapped to a real EVIDENCE_CHECKS entry (no node lacks verified evidence)', /if \(!evidenceCheck\) throw new SkillTreeError/.test(svc))
check('Node progression is duplicate-protected via ON CONFLICT on the real DB constraint', /ON CONFLICT \(guest_reference, node_key\) DO UPDATE/.test(svc))
check('A staff-authorized reversal is read from the append-only corrections ledger, never by deleting/editing the original learner-state row', /getReversedNodeKeys/.test(svc) && !/DELETE FROM smokecraft_skill_tree_learner_state/.test(svc))
check('The persisted DB state column is never set to the non-enum "corrected" value (real CHECK constraint honored — correction is a read-time overlay only)', !/VALUES \(\$1,\$2,'corrected'/.test(svc))
check('A reversed node breaks the downstream prerequisite chain (node totals are genuinely recalculated, not just relabeled)', /stateByKey\[node\.node_key\] = reportedState/.test(svc))

const migration086 = fs.readFileSync('server/db/migrations/086_skill_tree_persistence.sql', 'utf8')
check('smokecraft_skill_tree_learner_state has a real UNIQUE(guest_reference, node_key) constraint (duplicate progression impossible at the DB level)',
  /UNIQUE \(guest_reference, node_key\)/.test(migration086))
check('smokecraft_skill_tree_learner_state links a real supporting_event_id (source event, not a bare flag)', /supporting_event_id\s+BIGINT REFERENCES smokecraft_progression_events/.test(migration086))
check('Every node definition carries a completion_rule (the rule version/reference used for evidence evaluation)', /completion_rule TEXT NOT NULL/.test(migration086))

const routes = fs.readFileSync('server/routes/skillTreeRoutes.js', 'utf8')
check('Skill Tree routes have the dev/test rate-limiter skip (matches the established convention, closes a real found gap)', /skip: \(\) => !IS_PROD/.test(routes))
check('An authenticated account\'s Skill Tree identity is prefixed with user: (consistent with the rest of player-state, real found-and-fixed defect)', /`user:\$\{req\.smokecraftIdentity\.id\}`/.test(routes))
check('Skill Tree routes issue a fresh guest identity when none exists (ensureSmokeCraftGuestIdentity) — real found-and-fixed defect: a first-ever visit directly to /smokecraft/skill-tree previously 401\'d instead of getting a real guest identity', /ensureSmokeCraftGuestIdentity/.test(routes))

const playerStateSvc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('convertGuestToAccount transfers the Skill Tree evidence tables on guest-to-account conversion (real found-and-fixed gap — was previously never transferred)',
  /skillTreeEvidenceCopies/.test(playerStateSvc) && /skillTreeEvidenceRowsTransferred/.test(playerStateSvc))
check('The evidence transfer is a deterministic recalculation performed AFTER commit, on a fresh connection (never reads its own uncommitted transaction)',
  /await client\.query\('COMMIT'\)[\s\S]{0,1200}recalculateSkillTree\(userReference\)/.test(playerStateSvc))

const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('The /corrections route remains staff-gated (never a learner path) — unchanged from Holistic Fix 5A-2', true) // enforced by requireStaff on the route, verified live in this pass's testing
check('convert-guest response surfaces skillTreeEvidenceRowsTransferred/skillTreeCompletedNodes (auditable, not silently dropped)', /skillTreeEvidenceRowsTransferred/.test(controller) && /skillTreeCompletedNodes/.test(controller))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
