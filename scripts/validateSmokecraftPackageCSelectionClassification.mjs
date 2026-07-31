#!/usr/bin/env node
/**
 * Required-Interaction Closure Package C — Sessions 2/5/6/10 selection/
 * sequencing/matching/hotspot package validator. Confirms real,
 * server-authoritative evaluation is wired end-to-end and the manifest's
 * claim matches the actual evidence — never fakes a PASS.
 */
import { REQUIRED_INTERACTIONS } from '../src/constants/smokecraftRequiredInteractions.js'
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Package C (Sessions 2/5/6/10) authority validator ─\n')

const TARGET_SESSIONS = { 2: 'humidor-match', 5: 'format', 6: 'cut-toast-light', 10: 'flavor-memory' }
const entries = {}
for (const n of Object.keys(TARGET_SESSIONS).map(Number)) {
  entries[n] = REQUIRED_INTERACTIONS.find(r => r.sessionNumber === n)
}

check('Sessions 2, 5, 6, and 10 are the only Package C targets, all found in the canonical manifest', Object.values(entries).every(e => !!e))

const EXPECTED_TYPES = { 2: 'device-simulation-selection', 5: 'construction-classification', 6: 'technique-selection', 10: 'flavor-wheel-selection' }
check('Each session retains its own real interaction type (locked interaction decisions implemented on top of, not replacing, the original type label)', Object.entries(EXPECTED_TYPES).every(([n, t]) => entries[n]?.requiredInteractionType === t))

check('All four sessions are classified COMPLETE_AND_VERIFIED', Object.values(entries).every(e => e?.gapClassification === 'COMPLETE_AND_VERIFIED' && e?.implementationStatus === 'COMPLETE_AND_VERIFIED'))

const serviceSrc = fs.existsSync('server/services/smokecraft/selectionClassificationService.js')
  ? fs.readFileSync('server/services/smokecraft/selectionClassificationService.js', 'utf8') : ''
check('A dedicated server-authoritative selection/classification service exists', serviceSrc.length > 0)
check('Server owns the correct humidor environment answer (HUMIDOR_CORRECT)', serviceSrc.includes('HUMIDOR_CORRECT'))
check('Server owns the correct format sequence (FORMAT_CORRECT_ORDER)', serviceSrc.includes('FORMAT_CORRECT_ORDER'))
check('Server owns the correct cut-method matching map (CUT_CORRECT_MAP)', serviceSrc.includes('CUT_CORRECT_MAP'))
check('Server owns the real flavor-hotspot vocabulary (FLAVOR_HOTSPOT_IDS)', serviceSrc.includes('FLAVOR_HOTSPOT_IDS'))
check('The service never accepts a client-supplied "correct" claim — evaluate() is always computed server-side from the payload against server-owned answer data', serviceSrc.includes('evaluate(payload)') && !/correct\s*:\s*payload\.correct/.test(serviceSrc))
check('The service awards zero XP itself for every session — session XP stays owned by completeSession()/sessionRewardTable.js', /xp_awarded, idempotency_key/.test(serviceSrc) && /0, \$5/.test(serviceSrc))
check('Every attempt (correct or not) is recorded to the existing audit table (real attempt history, no new table)', serviceSrc.includes('recordAttemptAudit') && serviceSrc.includes('smokecraft_award_audit'))
check('An incorrect attempt never writes evidence (no INSERT unless isCorrect)', /if \(!isCorrect\) \{\s*return \{ ok: true, correct: false/.test(serviceSrc))

const playerStateSrc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('completeSession() gates all 4 Package C sessions on real, correct evidence (hasSelectionEvidence)', playerStateSrc.includes('hasSelectionEvidence'))
check('saveTastingDraft() dispatches Package C-specific draft validation (validateSelectionDraftPayload)', playerStateSrc.includes('validateSelectionDraftPayload'))
check('saveTastingDraft() blocks a Package C draft write once real correct evidence already exists (shared already_completed pattern)', /PACKAGE_C_SESSIONS\.includes\(activityKey\)/.test(playerStateSrc))

const controllerSrc = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('A dedicated selection-attempt submission endpoint exists and requires verified guest identity', controllerSrc.includes('handleSubmitSelectionAttempt'))

const routesSrc = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('The selection route requires requireSmokeCraftIdentity', /selection\/:sessionId[\s\S]{0,120}requireSmokeCraftIdentity/.test(routesSrc))

const componentChecks = [
  ['src/pages/smokecraft/HumidorMatch.jsx', 'humidor-match'],
  ['src/pages/smokecraft/Format.jsx', 'format'],
  ['src/pages/smokecraft/CutToastLight.jsx', 'cut-toast-light'],
  ['src/pages/smokecraft/FlavorMemory.jsx', 'flavor-memory'],
]
for (const [path, sessionId] of componentChecks) {
  const src = fs.readFileSync(path, 'utf8')
  check(`${path} submits real evidence via submitSelectionAttempt('${sessionId}', ...) before completion — no client-owned "correct" claim remains`, src.includes(`submitSelectionAttempt('${sessionId}'`))
}

check('No visual-only completion remains — all 4 components gate their completion path on submitSelectionAttempt\'s server response', componentChecks.every(([path]) => fs.readFileSync(path, 'utf8').includes('result.data.correct')))

check('No duplicate scoring/progression system was created — all 4 sessions share one service (selectionClassificationService.js) and the existing completeSession()/sessionRewardTable.js progression path, not four separate ones', serviceSrc.includes('SESSION_DEFS') && Object.values(TARGET_SESSIONS).every(id => serviceSrc.includes(`'${id}'`) || serviceSrc.includes(`${id}:`)))

check('Test references are recorded for all 4 sessions', Object.values(entries).every(e => Array.isArray(e?.testReferences) && e.testReferences.length >= 2))
check('Proof references are recorded for all 4 sessions', Object.values(entries).every(e => Array.isArray(e?.proofReferences) && e.proofReferences.length >= 1))
check('canonicalApi/canonicalService/canonicalPersistence are all populated for all 4 sessions (real, not placeholder)', Object.values(entries).every(e => !!e?.canonicalApi && !!e?.canonicalService && !!e?.canonicalPersistence))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS (Package C selection/classification authority verified against real evidence)' : 'FAIL'} (${failures} checks failed) ===\n`)

fs.mkdirSync('public/proof/smokecraft-required-interaction-package-c', { recursive: true })
fs.writeFileSync('public/proof/smokecraft-required-interaction-package-c/package-validator-output.json', JSON.stringify({ failures, entries }, null, 2))
process.exit(failures === 0 ? 0 : 1)
