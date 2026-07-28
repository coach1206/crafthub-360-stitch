#!/usr/bin/env node
/**
 * Holistic Fix 5A-3E — build-blocking validator for the cultivator
 * evidence/Passport-stamp flow.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft cultivator-authority validator (Holistic Fix 5A-3E)\n')

const cultivation = fs.readFileSync('src/pages/smokecraft/Cultivation.jsx', 'utf8')
// Scoped to handleSave (the Passport-stamp-granting action) — handleContinue's
// separate named-XP session-progression call (cultivation-water, already
// server-verified since Holistic Fix 5A-2) is a different, already-closed
// path and out of this mandate's cultivator-stamp-specific scope.
const handleSaveFn = cultivation.match(/function handleSave\(\)[\s\S]*?\n {2}\}\n/)
check('Cultivation.jsx no longer calls addXP()/awardStamp() directly inside handleSave (server-verified submit only)',
  !!handleSaveFn && !/addXP\(|awardStamp\(/.test(handleSaveFn[0]))
check('Cultivation.jsx submits evidence via the shared adapter (submitCultivatorEvidence)', /submitCultivatorEvidence\(/.test(cultivation))
check('Save is gated on all required stages being viewed (allStagesViewed used in the disabled condition)', /disabled=\{!allStagesViewed/.test(cultivation))
check('Cultivation.jsx sources the required-stage list from the shared, server-dual-imported data module', /from ['"]\.\.\/\.\.\/data\/cultivationStages\.js['"]/.test(cultivation))

const svc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('submitCultivatorEvidence verifies the submitted evidence covers every real required stage (CULTIVATION_STAGE_IDS.every), never trusting a bare completion claim',
  /CULTIVATION_STAGE_IDS\.every\(id => viewed\.has\(id\)\)/.test(svc))
check('submitCultivatorEvidence is idempotent via the existing smokecraft_activity_attempts UNIQUE constraint (activity_key=\'cultivator\')',
  /activity_key = 'cultivator'/.test(svc))
check('The cultivator Passport stamp insert uses ON CONFLICT DO NOTHING (duplicate-protected)',
  /award_key\)\s*\n?\s*VALUES \(\$1, 'passport_stamp', 'cultivator'/.test(svc) || /'passport_stamp', 'cultivator', 0, \$2/.test(svc))

const routes = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('The cultivator submit route requires a verified SmokeCraft identity', /cultivator\/submit['"], writeLimiter, requireSmokeCraftIdentity/.test(routes))

const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('handleSubmitCultivator requires a real idempotency key (requireIdempotencyKey)', /handleSubmitCultivator[\s\S]{0,200}requireIdempotencyKey/.test(controller))
check('handleSubmitCultivator requires viewedStageIds as a real array (rejects malformed input)', /Array\.isArray\(viewedStageIds\)/.test(controller))

check('Shared cultivation-stage-id data module exists (dual-imported by client and server)', fs.existsSync('src/data/cultivationStages.js'))
const stages = fs.readFileSync('src/data/cultivationStages.js', 'utf8')
check('The shared stage-id list has no browser-only imports (safe to import server-side)', !/^import /m.test(stages))
check('The shared stage-id list has exactly 7 real stage ids', (stages.match(/'[a-z]+'/g) || []).length === 7)

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
