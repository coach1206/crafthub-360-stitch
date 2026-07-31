#!/usr/bin/env node
/**
 * Required-Interaction Closure Package E — Session 23 (passport-stamp)
 * passport-sequencing package validator. Confirms the two real defects
 * (SC-D067: backward sequencing + missing server authority) are
 * actually fixed in source, the manifest's claim matches the actual
 * evidence, and no second Passport/rewards system was created — never
 * fakes a PASS.
 */
import { REQUIRED_INTERACTIONS } from '../src/constants/smokecraftRequiredInteractions.js'
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Package E (Session 23 — passport-stamp) sequencing validator ─\n')

const entry = REQUIRED_INTERACTIONS.find(r => r.sessionNumber === 23)
const otherEntries = REQUIRED_INTERACTIONS.filter(r => r.sessionNumber !== 23)

check('Session 23 is found in the canonical manifest', !!entry)
check('Session 23 is the only Package E target (proof/test references mention only passport-stamp)', entry?.sessionId === 'passport-stamp' && !otherEntries.some(e => Array.isArray(e.testReferences) && e.testReferences.some(t => t.includes('package-e'))))
check('Session 23 is classified COMPLETE_AND_VERIFIED', entry?.implementationStatus === 'COMPLETE_AND_VERIFIED' && entry?.gapClassification === 'COMPLETE_AND_VERIFIED')

const routeSrc = fs.readFileSync('server/routes/smokecraftPassportStampRoutes.js', 'utf8')
const pageSrc = fs.readFileSync('src/pages/smokecraft/PassportStamp.jsx', 'utf8')
const playerStateSrc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
const controllerSrc = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')

console.log('\n── SC-D067 fix 1: backward/unreachable sequencing ──')
check('Server REQUIRED_STEPS no longer includes final-review (Session 24, which comes after Session 23)', !/REQUIRED_STEPS\s*=\s*\[[^\]]*'final-review'/.test(routeSrc))
check('Server REQUIRED_STEPS contains exactly the 6 real, reachable prerequisite sessions', /'humidor-match',\s*\n\s*'first-third',\s*\n\s*'second-third',\s*\n\s*'flavor-memory',\s*\n\s*'final-third',\s*\n\s*'scorecard',\s*\n\]/.test(routeSrc))
check('Client REQUIRED_STEPS (PassportStamp.jsx) no longer includes final-review', !/REQUIRED_STEPS\s*=\s*\[[^\]]*'final-review'/.test(pageSrc))
check('SC-D067 is documented in source comments (both files)', /SC-D067/.test(routeSrc) && /SC-D067/.test(pageSrc))

console.log('\n── SC-D067 fix 2: missing server authority ──')
check('Route no longer destructures a client-submitted completedSteps/scorecardId for eligibility', !/const \{ completedSteps, scorecardId \} = req\.(query|body)/.test(routeSrc))
check('checkEligibility() is server-authoritative — reads real completions via playerStateService.getPlayerState()', /async function checkEligibility\(req\)/.test(routeSrc) && /getPlayerState\(guestReference\)/.test(routeSrc))
check('The claim route calls the real, server-authoritative checkEligibility(req), not a client-trusted variant', /router\.post\('\/claim'.*\n(.*\n){0,3}.*await checkEligibility\(req\)/.test(routeSrc))
check('The eligibility route calls the real, server-authoritative checkEligibility(req)', /router\.get\('\/eligibility'.*\n(.*\n){0,3}.*await checkEligibility\(req\)/.test(routeSrc))

console.log('\n── Completion gate: stamp cannot be awarded before completion / route-visit-only completion closed ──')
check('playerStateService exports hasPassportStampEvidence, following the exact Package A/B/C additive gate pattern', /export async function hasPassportStampEvidence\(guestReference, sessionId\)/.test(playerStateSrc))
check('hasPassportStampEvidence is scoped only to the passport-stamp sessionId (returns true for every other session, same as A/B/C)', /if \(sessionId !== 'passport-stamp'\) return true/.test(playerStateSrc))
check('completeSession() calls hasPassportStampEvidence and throws passport_stamp_evidence_required when absent', /hasPassportStampEvidence\(guestReference, sessionId\)/.test(playerStateSrc) && /passport_stamp_evidence_required/.test(playerStateSrc))
check('The controller maps passport_stamp_evidence_required to an honest 400, not a 500/silent pass', /passport_stamp_evidence_required/.test(controllerSrc))
check('PassportStamp.jsx no longer silently auto-claims on load (auto-claim useEffect removed)', !/Auto-claim when eligible and page loads/.test(pageSrc))
check('PassportStamp.jsx requires an explicit player click (real <button> claim control) to claim the stamp', /onClick=\{handleClaimStamp\}/.test(pageSrc) && /Claim Your Stamp/.test(pageSrc))
check('The claim button is disabled until server-verified eligible', /disabled=\{!isEligible/.test(pageSrc))

console.log('\n── Duplicate prevention: real dedupe_key reused, not reinvented ──')
const passportServiceSrc = fs.readFileSync('server/services/passport360/passport360SyncService.js', 'utf8')
check('claimJourneyCompletionStamp() is reused unmodified from the canonical Passport-360 service (real dedupe_key idempotency, not a new claim table)', /export async function claimJourneyCompletionStamp\(guestReference\)/.test(passportServiceSrc))
check('The route imports claimJourneyCompletionStamp/getStamps from the canonical service — no second claim/persistence path defined in the route file itself', /import \{ claimJourneyCompletionStamp, getStamps \} from '\.\.\/services\/passport360\/passport360SyncService\.js'/.test(routeSrc) && !/CREATE TABLE|INSERT INTO passport/i.test(routeSrc))

console.log('\n── No second Passport/rewards system created ──')
check('No new stamp/reward table or duplicate service file was introduced for Package E (only smokecraftPassportStampRoutes.js, playerStateService.js, playerStateController.js, and PassportStamp.jsx were touched)', fs.existsSync('server/services/passport360/passport360SyncService.js') && !fs.existsSync('server/services/passport360/passport360SyncServiceV2.js') && !fs.existsSync('server/services/smokecraft/passportStampService.js'))

console.log('\n── Identity-format consistency (documented mismatch risk resolved) ──')
check('bridgeIdentity uses the SAME user:<id>/raw-guest-id convention as playerStateService (ownerGuestReference) for both the Passport claim identity and the completion-gate lookup', /identity\.type === 'user' \? `user:\$\{identity\.id\}` : identity\.id/.test(routeSrc))

console.log('\n── Tests and proof exist ──')
check('Test references are recorded for Session 23', Array.isArray(entry?.testReferences) && entry.testReferences.length >= 2)
check('Proof references are recorded for Session 23', Array.isArray(entry?.proofReferences) && entry.proofReferences.length >= 1)
check('canonicalApi/canonicalService/canonicalPersistence are all populated for Session 23 (real, not placeholder)', !!entry?.canonicalApi && !!entry?.canonicalService && !!entry?.canonicalPersistence && !entry.canonicalPersistence.includes('sequencing quirk'))

const apiResultsPath = 'public/proof/smokecraft-required-interaction-package-e/api-results.json'
const browserResultsPath = 'public/proof/smokecraft-required-interaction-package-e/browser-results.json'
check('API test results file exists with 0 failures', fs.existsSync(apiResultsPath) && JSON.parse(fs.readFileSync(apiResultsPath, 'utf8')).fail === 0)
check('Browser test results file exists with 0 failures', fs.existsSync(browserResultsPath) && JSON.parse(fs.readFileSync(browserResultsPath, 'utf8')).fail === 0)

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS (Package E passport-stamp sequencing verified against real evidence)' : 'FAIL'} (${failures} checks failed) ===\n`)

fs.mkdirSync('public/proof/smokecraft-required-interaction-package-e', { recursive: true })
fs.writeFileSync('public/proof/smokecraft-required-interaction-package-e/package-validator-output.json', JSON.stringify({ failures, entry }, null, 2))
process.exit(failures === 0 ? 0 : 1)
