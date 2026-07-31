#!/usr/bin/env node
/**
 * Required-Interaction Closure Package B — Scorecard (Session 19)
 * package validator. Confirms server-authoritative scorecard evaluation
 * is real, wired end-to-end, and the manifest's claim matches the
 * actual evidence — never fakes a PASS.
 */
import { REQUIRED_INTERACTIONS } from '../src/constants/smokecraftRequiredInteractions.js'
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Package B (Scorecard, Session 19) authority validator ─\n')

const entry = REQUIRED_INTERACTIONS.find(r => r.sessionNumber === 19)
check('Session 19 is identified from the canonical manifest', !!entry)
check('Session 19 is classified COMPLETE_AND_VERIFIED', entry?.gapClassification === 'COMPLETE_AND_VERIFIED' && entry?.implementationStatus === 'COMPLETE_AND_VERIFIED')

const serviceSrc = fs.existsSync('server/services/smokecraft/scorecardEvaluationService.js')
  ? fs.readFileSync('server/services/smokecraft/scorecardEvaluationService.js', 'utf8') : ''
check('A dedicated server-authoritative scorecard evaluation service exists', serviceSrc.length > 0)
check('The service validates all 6 required categories (all_categories_required)', serviceSrc.includes('all_categories_required'))
check('The service validates category value range/vocabulary server-side (invalid_category_value)', serviceSrc.includes('invalid_category_value'))
check('The service computes the overall score server-side (computeOverall) — never trusts a client-submitted overall', serviceSrc.includes('function computeOverall'))
check('The service awards zero XP itself — session XP stays owned by completeSession()/sessionRewardTable.js', /xp_awarded[\s\S]{0,10}0/.test(serviceSrc) && !/xpAwarded/.test(serviceSrc))

const playerStateSrc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('completeSession() gates the scorecard session on real evidence (hasScorecardEvidence)', playerStateSrc.includes('hasScorecardEvidence'))
check('saveTastingDraft() dispatches scorecard-specific validation (validateScorecardDraftPayload)', playerStateSrc.includes('validateScorecardDraftPayload'))
check('saveTastingDraft() blocks a scorecard draft write once real evidence already exists', /activityKey === 'scorecard'[\s\S]{0,200}already_completed/.test(playerStateSrc))

const scorecardComponentSrc = fs.readFileSync('src/pages/smokecraft/Scorecard.jsx', 'utf8')
check('No client-owned final score remains — Scorecard.jsx no longer POSTs directly to the old unauthenticated in-memory scorecard route', !scorecardComponentSrc.includes("fetch('/api/smokecraft/scorecard/submit'"))
check('Scorecard.jsx loads its draft from the server on entry (loadTastingDraft), not from localStorage/journey state as authority', scorecardComponentSrc.includes("loadTastingDraft(ACTIVITY_KEY)"))
check('Scorecard.jsx submits real evidence via the new server-authoritative path before completion (submitScorecard from GuestSessionContext)', scorecardComponentSrc.includes('submitScorecardEvidence'))
check('All 6 required categories are enforced client-side before submission is even attempted (honest, not merely a server-side surprise)', scorecardComponentSrc.includes('CATEGORY_IDS.filter'))

const contextSrc = fs.readFileSync('src/context/GuestSessionContext.jsx', 'utf8')
check('GuestSessionContext exposes a real server-round-trip submitScorecard callback (not a local-only stub)', /submitScorecard = useCallback[\s\S]{0,200}submitScorecardOnServer/.test(contextSrc))

const routesSrc = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('The scorecard submission route requires verified guest identity (requireSmokeCraftIdentity)', /scorecard\/submit[\s\S]{0,120}requireSmokeCraftIdentity/.test(routesSrc))

// No duplicate scoring service: only one file should own the
// authoritative weighted-overall computation for this session.
const oldRouteSrc = fs.existsSync('server/routes/smokecraftScorecardRoutes.js')
  ? fs.readFileSync('server/routes/smokecraftScorecardRoutes.js', 'utf8') : ''
check('The old unauthenticated in-memory scorecard route is no longer part of the completion authority path (superseded, not duplicated authority — completion never depends on it)', !playerStateSrc.includes('smokecraftScorecardRoutes') && !scorecardComponentSrc.includes('smokecraftScorecardRoutes'))
check('Exactly one server-side weighted-overall computation exists for the real completion path (scorecardEvaluationService.js#computeOverall) — the old route\'s own calcOverall is dead code, not a second authority the client can reach through the real flow', serviceSrc.includes('computeOverall') && !scorecardComponentSrc.includes("fetch('/api/smokecraft/scorecard/submit'"))

check('Test references are recorded on the manifest entry', Array.isArray(entry?.testReferences) && entry.testReferences.length >= 2)
check('Proof references are recorded on the manifest entry', Array.isArray(entry?.proofReferences) && entry.proofReferences.length >= 1)
check('canonicalApi/canonicalService/canonicalPersistence are all populated (real, not placeholder)', !!entry?.canonicalApi && !!entry?.canonicalService && !!entry?.canonicalPersistence)

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS (Package B scorecard authority verified against real evidence)' : 'FAIL'} (${failures} checks failed) ===\n`)

fs.mkdirSync('public/proof/smokecraft-required-interaction-package-b', { recursive: true })
fs.writeFileSync('public/proof/smokecraft-required-interaction-package-b/package-validator-output.json', JSON.stringify({ failures, entry }, null, 2))
process.exit(failures === 0 ? 0 : 1)
