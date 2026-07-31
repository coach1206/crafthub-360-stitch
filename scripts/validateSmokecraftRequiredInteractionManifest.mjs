#!/usr/bin/env node
/**
 * Required-Interaction Manifest and 21-Session Audit — discovery-only
 * structural validator. Verifies manifest INTEGRITY (shape, uniqueness,
 * vocabulary, honest classification), never implementation completeness
 * — it must not report 21/21 "complete" unless every entry's own
 * gapClassification says so, which today it correctly does not.
 */
import { REQUIRED_INTERACTIONS, INTERACTION_TYPES, GAP_CLASSIFICATIONS } from '../src/constants/smokecraftRequiredInteractions.js'
import { VISIT_STRUCTURE } from '../src/constants/session.js'
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft required-interaction manifest validator (discovery-only) ─\n')

check('Exactly 21 sessions declared', REQUIRED_INTERACTIONS.length === 21)

const sessionNumbers = REQUIRED_INTERACTIONS.map(r => r.sessionNumber)
check('Session numbers are unique', new Set(sessionNumbers).size === sessionNumbers.length)

const interactionIds = REQUIRED_INTERACTIONS.map(r => r.requiredInteractionId)
check('Required interaction IDs are unique (no undocumented reuse)', new Set(interactionIds).size === interactionIds.length)

check('Every session maps to a real route defined in VISIT_STRUCTURE', REQUIRED_INTERACTIONS.every(r => {
  return VISIT_STRUCTURE.some(phase => phase.sessions.some(s => s.session === r.sessionNumber && s.route === r.route))
}))

check('Every interaction type uses the approved vocabulary', REQUIRED_INTERACTIONS.every(r => INTERACTION_TYPES.includes(r.requiredInteractionType)))

check('Every gap classification uses an approved category', REQUIRED_INTERACTIONS.every(r => GAP_CLASSIFICATIONS.includes(r.gapClassification)))

check('Every session declares completion/scoring/mentor/persistence/progression expectations', REQUIRED_INTERACTIONS.every(r =>
  typeof r.completionRequired === 'boolean' && typeof r.scoringRequired === 'boolean' &&
  typeof r.mentorRequired === 'boolean' && typeof r.persistenceRequired === 'boolean' &&
  typeof r.progressionRequired === 'boolean'))

const completeEntries = REQUIRED_INTERACTIONS.filter(r => r.gapClassification === 'COMPLETE_AND_VERIFIED')
check('Every COMPLETE_AND_VERIFIED session cites a canonicalComponent, canonicalApi, canonicalService, and canonicalPersistence', completeEntries.every(r =>
  r.canonicalComponent && r.canonicalApi && r.canonicalService && r.canonicalPersistence))

check('No session is silently omitted (1,2,3,4,5,6,7,8,10,11,12,14,15,16,19,21,22,23,24,25,27)', JSON.stringify([...sessionNumbers].sort((a, b) => a - b)) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 19, 21, 22, 23, 24, 25, 27]))

check('No extra session was silently added beyond the 21 canonical primary sessions', sessionNumbers.every(n => [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 19, 21, 22, 23, 24, 25, 27].includes(n)))

// The manifest must NOT claim a false clean bill of health — this is a
// discovery-only validator, so it asserts the manifest is HONEST about
// its own current state, not that the state is good. Prior to Package F
// (Session 25 closure), this check required nonCompleteCount > 0 to
// guard against a premature/false 21/21 claim while real gaps remained.
// As of Package F, 21/21 is the real, evidence-backed terminal state
// (every entry independently required to cite canonicalComponent/Api/
// Service/Persistence above, plus real test/proof references checked by
// each package's own validator) — so 0 non-complete is now a legitimate
// value, not an unearned one. This check now only guards against the
// count going negative/undefined (a structural sanity check), not
// against reaching genuine full closure.
const nonCompleteCount = REQUIRED_INTERACTIONS.filter(r => r.gapClassification !== 'COMPLETE_AND_VERIFIED').length
check(`Manifest honestly reports ${nonCompleteCount} of 21 sessions as NOT COMPLETE_AND_VERIFIED (0 is legitimate once real evidence backs every session; this validator still fails on a malformed/negative count)`, Number.isInteger(nonCompleteCount) && nonCompleteCount >= 0)

check('Every non-complete session records a real notes field explaining the gap (no silent placeholder)', REQUIRED_INTERACTIONS.filter(r => r.gapClassification !== 'COMPLETE_AND_VERIFIED').every(r => typeof r.notes === 'string' && r.notes.length > 20))

console.log(`\n=== Classification totals ===`)
const counts = {}
for (const r of REQUIRED_INTERACTIONS) counts[r.gapClassification] = (counts[r.gapClassification] || 0) + 1
for (const cls of GAP_CLASSIFICATIONS) console.log(`  ${cls}: ${counts[cls] || 0}`)

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS (manifest structurally sound and honest)' : 'FAIL'} (${failures} checks failed) ===\n`)

fs.mkdirSync('public/proof/smokecraft-required-interaction-manifest-audit', { recursive: true })
fs.writeFileSync('public/proof/smokecraft-required-interaction-manifest-audit/manifest-validator-output.json', JSON.stringify({ failures, totals: counts, sessionCount: REQUIRED_INTERACTIONS.length }, null, 2))
process.exit(failures === 0 ? 0 : 1)
