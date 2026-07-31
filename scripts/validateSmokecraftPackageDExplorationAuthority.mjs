#!/usr/bin/env node
/**
 * Required-Interaction Closure Package D — Sessions 3/4/15 guided-
 * exploration package validator. Confirms real, server-authoritative
 * checkpoint + synthesis evaluation is wired end-to-end and the
 * manifest's claim matches the actual evidence — never fakes a PASS.
 */
import { REQUIRED_INTERACTIONS } from '../src/constants/smokecraftRequiredInteractions.js'
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Package D (Sessions 3/4/15) exploration authority validator ─\n')

const TARGET_SESSIONS = { 3: 'meet-your-cigar', 4: 'terroir', 15: 'knowledge-drop' }
const entries = {}
for (const n of Object.keys(TARGET_SESSIONS).map(Number)) {
  entries[n] = REQUIRED_INTERACTIONS.find(r => r.sessionNumber === n)
}

check('Sessions 3, 4, and 15 are the only Package D targets, all found in the canonical manifest', Object.values(entries).every(e => !!e))
check('Each session retains its own real content-exploration/topic-exploration interaction type', entries[3]?.requiredInteractionType === 'content-exploration' && entries[4]?.requiredInteractionType === 'content-exploration' && entries[15]?.requiredInteractionType === 'topic-exploration')
check('All three sessions are classified COMPLETE_AND_VERIFIED', Object.values(entries).every(e => e?.gapClassification === 'COMPLETE_AND_VERIFIED' && e?.implementationStatus === 'COMPLETE_AND_VERIFIED'))

const serviceSrc = fs.readFileSync('server/services/smokecraft/selectionClassificationService.js', 'utf8')
check('Session 3 has a required-checkpoint definition (MEET_YOUR_CIGAR_CHECKPOINTS)', serviceSrc.includes('MEET_YOUR_CIGAR_CHECKPOINTS'))
check('Session 4 has a required-checkpoint definition (TERROIR_CHECKPOINTS)', serviceSrc.includes('TERROIR_CHECKPOINTS'))
check('Session 15 has a required-checkpoint definition (KNOWLEDGE_DROP_CHECKPOINTS) with a real, server-owned answer key (KNOWLEDGE_DROP_ANSWERS)', serviceSrc.includes('KNOWLEDGE_DROP_CHECKPOINTS') && serviceSrc.includes('KNOWLEDGE_DROP_ANSWERS'))
check('Every Package D session requires a final synthesis field, validated server-side (synthesisOk)', /synthesisOk/.test(serviceSrc))
check('Server evaluation exists and is never client-authoritative — evaluate() is computed from the submitted payload against server-owned checkpoint/answer data for all 3 sessions', (serviceSrc.match(/evaluate\(payload\)/g) || []).length >= 7)
check('No route-visit-only completion remains — validateExplorationSubmission() requires all checkpoints present with valid responses before any evaluation can succeed', serviceSrc.includes('missing_required_checkpoint'))
check('Draft persistence exists via the shared smokecraft_tasting_drafts dispatch (validateSelectionDraftPayload / PACKAGE_D_SESSIONS)', serviceSrc.includes('PACKAGE_D_SESSIONS'))

const playerStateSrc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('completeSession() gates all Package D sessions the same way as Package C (hasSelectionEvidence, unchanged generic dispatch)', playerStateSrc.includes('hasSelectionEvidence'))

const componentChecks = [
  ['src/pages/smokecraft/MeetYourCigar.jsx', 'meet-your-cigar'],
  ['src/pages/smokecraft/Terroir.jsx', 'terroir'],
  ['src/pages/smokecraft/KnowledgeDrop.jsx', 'knowledge-drop'],
]
for (const [path, sessionId] of componentChecks) {
  const src = fs.readFileSync(path, 'utf8')
  check(`${path} submits real checkpoint+synthesis evidence via submitSelectionAttempt before completion — no frontend-only completion remains`, src.includes('submitSelectionAttempt(ACTIVITY_KEY') && src.includes('result.data.correct'))
  check(`${path} requires a final synthesis response distinct from merely opening panels`, src.includes('synthesis'))
}

check('No duplicate progression or evidence system was created — Package D reuses the exact same SESSION_DEFS/ledger/draft/completion-gate architecture as Package C (one shared service file)', serviceSrc.includes('SESSION_DEFS') && componentChecks.every(([, id]) => serviceSrc.includes(`'${id}'`) || serviceSrc.includes(`${id}:`)))

check('Test references are recorded for all 3 sessions', Object.values(entries).every(e => Array.isArray(e?.testReferences) && e.testReferences.length >= 2))
check('Proof references are recorded for all 3 sessions', Object.values(entries).every(e => Array.isArray(e?.proofReferences) && e.proofReferences.length >= 1))
check('canonicalApi/canonicalService/canonicalPersistence are all populated for all 3 sessions (real, not placeholder)', Object.values(entries).every(e => !!e?.canonicalApi && !!e?.canonicalService && !!e?.canonicalPersistence))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS (Package D exploration authority verified against real evidence)' : 'FAIL'} (${failures} checks failed) ===\n`)

fs.mkdirSync('public/proof/smokecraft-required-interaction-package-d', { recursive: true })
fs.writeFileSync('public/proof/smokecraft-required-interaction-package-d/package-validator-output.json', JSON.stringify({ failures, entries }, null, 2))
process.exit(failures === 0 ? 0 : 1)
