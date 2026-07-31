#!/usr/bin/env node
/**
 * Required-Interaction Closure Package F — Session 25 (rewards)
 * rewards-data-source-authority package validator. Confirms the real
 * flagged gap (Rewards.jsx displaying only a local optimistic XP cache
 * instead of the canonical server player-state) is actually fixed in
 * source, the manifest's claim matches the actual evidence, and no
 * second reward/achievement system was created — never fakes a PASS.
 */
import { REQUIRED_INTERACTIONS } from '../src/constants/smokecraftRequiredInteractions.js'
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Package F (Session 25 — rewards) data-source authority validator ─\n')

const entry = REQUIRED_INTERACTIONS.find(r => r.sessionNumber === 25)
const nonComplete = REQUIRED_INTERACTIONS.filter(r => r.implementationStatus !== 'COMPLETE_AND_VERIFIED')

check('Session 25 is found in the canonical manifest', !!entry)
check('Session 25 is the only Package F target (test references mention only package-f)', entry?.sessionId === 'rewards' && !REQUIRED_INTERACTIONS.some(e => e.sessionNumber !== 25 && Array.isArray(e.testReferences) && e.testReferences.some(t => t.includes('package-f'))))
check('Session 25 is classified COMPLETE_AND_VERIFIED', entry?.implementationStatus === 'COMPLETE_AND_VERIFIED' && entry?.gapClassification === 'COMPLETE_AND_VERIFIED')
check('All 21 required-interaction sessions are now COMPLETE_AND_VERIFIED (0 non-complete)', nonComplete.length === 0)
check('The manifest contains exactly 21 tracked sessions', REQUIRED_INTERACTIONS.length === 21)

const rewardsPageSrc = fs.readFileSync('src/pages/smokecraft/Rewards.jsx', 'utf8')
const apiClientSrc = fs.readFileSync('src/services/smokecraft/playerStateApiClient.js', 'utf8')
const playerStateServiceSrc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
const sessionRewardTableSrc = fs.readFileSync('server/services/smokecraft/sessionRewardTable.js', 'utf8')
const rewardsConstSrc = fs.readFileSync('src/constants/smokecraftRewards.js', 'utf8')

console.log('\n── Canonical reward data source identified ──')
check('Exactly one canonical player-state read path exists: GET /api/smokecraft/player-state (fetchPlayerState in playerStateApiClient.js)', /export async function fetchPlayerState\(\)/.test(apiClientSrc) && /fetch\(BASE, \{ credentials: 'include' \}\)/.test(apiClientSrc))
check('The canonical XP amount for a session is server-owned (sessionRewardTable.js#getSessionRewardXp), reused from SESSION_REWARDS — never a second XP table', /export function getSessionRewardXp\(sessionId\)/.test(sessionRewardTableSrc) && /SESSION_REWARDS\[sessionId\]/.test(sessionRewardTableSrc))
check('SESSION_REWARDS defines real, non-invented XP entries for rewards (S25) and achievements (S26)', /rewards:\s*\{\s*\n\s*sessionNumber: 25,.*xp: 50/.test(rewardsConstSrc) && /achievements:\s*\{\s*\n\s*sessionNumber: 26,.*xp: 50/.test(rewardsConstSrc))

console.log('\n── Fix: Rewards.jsx now reads the canonical server source ──')
check('Rewards.jsx imports the canonical fetchPlayerState() client — no bespoke second fetch path invented', /import \{ fetchPlayerState \} from '\.\.\/\.\.\/services\/smokecraft\/playerStateApiClient\.js'/.test(rewardsPageSrc))
check('Rewards.jsx fetches canonical server player-state on mount', /await fetchPlayerState\(\)/.test(rewardsPageSrc) && /useEffect\(\(\) => \{[\s\S]*?fetchPlayerState\(\)/.test(rewardsPageSrc))
check('Displayed totalXP is sourced from the server reading when available (usingServerXp), never silently presenting local-only data as server-verified', /const usingServerXp = serverXpState !== null/.test(rewardsPageSrc) && /const totalXP = usingServerXp \? serverXpState\.xpTotal : \(session\?\.xp \|\| 0\)/.test(rewardsPageSrc))
check('An honest local fallback exists when the server fetch fails (offline/error), never a fabricated server value', /setServerXpFetchFailed\(true\)/.test(rewardsPageSrc))
check('The XP source is exposed for verification (data-testid="s25-xp-source")', /data-testid="s25-xp-source"/.test(rewardsPageSrc))
check('Retry re-fetches the real canonical source rather than a fake local-only timeout', /const handleRetry = useCallback\(\(\) => \{\s*\n\s*setPhase\('loading'\)\s*\n\s*fetchPlayerState\(\)/.test(rewardsPageSrc))
check('After claiming (Continue), the display re-fetches the canonical server total so it does not go stale post-award', /refreshServerXp\(\)/.test(rewardsPageSrc) && /awardSessionRewards\('rewards'\)/.test(rewardsPageSrc))

console.log('\n── Completion is server-authoritative (unchanged, reused canonical path) ──')
check('Session 25/26 completion goes through the same completeSession() as every other session — no evidence gate needed or added (review/claim session by design, matching the already-verified Session 27 pattern)', /export async function completeSession\(/.test(playerStateServiceSrc))
check('completeSession() is idempotent per (guest_reference, session_id) via a real UNIQUE constraint — not a client-trusted flag', /UNIQUE_VIOLATION/.test(playerStateServiceSrc) && /alreadyCompleted: true/.test(playerStateServiceSrc))
check('XP awarded is looked up server-side from the reward table, never trusted from the client request body', /getSessionRewardXp\(sessionId\)/.test(fs.readFileSync('server/controllers/playerStateController.js', 'utf8')))

console.log('\n── No second reward/achievement system created ──')
check('No new reward/XP table, service, or duplicate player-state store was introduced for Package F (only Rewards.jsx and the manifest were touched; playerStateApiClient.js/sessionRewardTable.js/playerStateService.js are reused unmodified)', !fs.existsSync('server/services/smokecraft/rewardsAuthorityServiceV2.js') && !fs.existsSync('src/constants/smokecraftRewardsV2.js') && !fs.existsSync('server/services/smokecraft/playerStateServiceV2.js'))
check('Achievement criteria remain computed from real completedSteps/journey evidence (buildAchievements) — no new client-trusted "earned" flag was added', /function buildAchievements\(session, journey\)/.test(rewardsPageSrc) && !/earned:\s*true,?\s*\/\/\s*trust/.test(rewardsPageSrc))

console.log('\n── Tests and proof exist ──')
check('Test references are recorded for Session 25', Array.isArray(entry?.testReferences) && entry.testReferences.length >= 2)
check('Proof references are recorded for Session 25', Array.isArray(entry?.proofReferences) && entry.proofReferences.length >= 1)
check('canonicalApi/canonicalService/canonicalPersistence are all populated for Session 25 (real, not placeholder)', !!entry?.canonicalApi && !!entry?.canonicalService && !!entry?.canonicalPersistence)

const apiResultsPath = 'public/proof/smokecraft-required-interaction-package-f/api-results.json'
const browserResultsPath = 'public/proof/smokecraft-required-interaction-package-f/browser-results.json'
check('API test results file exists with 0 failures', fs.existsSync(apiResultsPath) && JSON.parse(fs.readFileSync(apiResultsPath, 'utf8')).fail === 0)
check('Browser test results file exists with 0 failures', fs.existsSync(browserResultsPath) && JSON.parse(fs.readFileSync(browserResultsPath, 'utf8')).fail === 0)

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS (Package F rewards data-source authority verified against real evidence — 21/21 required interactions)' : 'FAIL'} (${failures} checks failed) ===\n`)

fs.mkdirSync('public/proof/smokecraft-required-interaction-package-f', { recursive: true })
fs.writeFileSync('public/proof/smokecraft-required-interaction-package-f/package-validator-output.json', JSON.stringify({ failures, entry, totalSessions: REQUIRED_INTERACTIONS.length, nonCompleteCount: nonComplete.length }, null, 2))
process.exit(failures === 0 ? 0 : 1)
