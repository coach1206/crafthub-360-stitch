/**
 * SmokeCraft current live-interaction acceptance.
 *
 * Tests the current production architecture: live controls, server-backed
 * draft persistence, evidence submission, current 6-phase/27-session flow,
 * accessible touch controls, and explicit POS handoff state. It intentionally
 * rejects retired inline completeStep requirements and retired route order.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
let passed = 0
let failed = 0

function read(relPath) {
  const p = resolve(ROOT, relPath)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

function check(label, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${label}`); passed++ }
  else { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); failed++ }
}

console.log('\nSmokeCraft Current Live Interaction Verification\n')

const assetScreen = read('src/components/smokecraft/SmokeCraftAssetScreen.jsx')
const hotspotLayer = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
const requestPurchase = read('src/pages/smokecraft/RequestPurchase.jsx')
const cutToastLight = read('src/pages/smokecraft/CutToastLight.jsx')
const firstThird = read('src/pages/smokecraft/FirstThird.jsx')
const flavorMemory = read('src/pages/smokecraft/FlavorMemory.jsx')
const secondThird = read('src/pages/smokecraft/SecondThird.jsx')
const finalThird = read('src/pages/smokecraft/FinalThird.jsx')
const journey = read('src/constants/smokecraftJourney.js')
const session = read('src/constants/session.js')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
const assetRoute = read('src/components/smokecraft/SmokeCraftAssetRoute.jsx')

console.log('Gate 1 — Asset shell preserves responsive interaction space')
check('SmokeCraftAssetScreen exists', Boolean(assetScreen))
if (assetScreen) {
  check('Viewport shell is fixed', assetScreen.includes("position: 'fixed'"))
  check('Viewport uses dynamic viewport dimensions', assetScreen.includes("width: '100dvw'") && assetScreen.includes("height: '100dvh'"))
  check('Interactive children are rendered directly', assetScreen.includes('{children}'))
  check('No inline-block wrapper constrains controls', !assetScreen.includes("display: 'inline-block'"))
  check('Image fit is classification-aware', assetScreen.includes('FIT_STYLES') && assetScreen.includes('backgroundSize'))
  check('Portrait production shells preserve contain fit', assetScreen.includes("PORTRAIT_PRODUCTION_SHELL") && assetScreen.includes("backgroundSize: 'contain'"))
}

console.log('\nGate 2 — Hotspot layer is discoverable, accessible and tactile')
check('SmokeCraftHotspotLayer exists', Boolean(hotspotLayer))
if (hotspotLayer) {
  check('Hotspots render real buttons', hotspotLayer.includes('<button'))
  check('Hotspots expose aria-labels', hotspotLayer.includes('aria-label'))
  check('Hotspots restore pointer events', hotspotLayer.includes('pointerEvents'))
  check('Touch-action manipulation is enabled', hotspotLayer.includes('touchAction'))
  check('Keyboard focus-visible treatment exists', hotspotLayer.includes('focus-visible'))
  check('Visible CTA pill is part of current contract', hotspotLayer.includes('sc-cta-pill'))
  check('Pulse/press affordance exists', hotspotLayer.includes('sc-pulse') || hotspotLayer.includes('sc-pressed') || hotspotLayer.includes('sc-tap-flash'))
  check('Haptic feedback is wired', hotspotLayer.includes('triggerHaptic') || hotspotLayer.includes('hapticTap'))
  check('Debug mode remains explicit', hotspotLayer.includes('smokecraft_hotspot_debug'))
}

console.log('\nGate 3 — Request/Purchase handoff is real and failure-aware')
check('RequestPurchase exists', Boolean(requestPurchase))
if (requestPurchase) {
  check('Ordering paths are explicit', requestPurchase.includes('ORDERING_PATHS'))
  check('Order-path state is controlled', requestPurchase.includes('orderPath') && requestPurchase.includes('setOrderPath'))
  check('Selection buttons expose aria-pressed', requestPurchase.includes('aria-pressed'))
  check('Journey selection autosaves', requestPurchase.includes('setRequestPurchase'))
  check('POS order intent uses real bridge client', requestPurchase.includes('createOrderIntent'))
  check('POS handoff state is explicit', requestPurchase.includes('orderIntentStatus'))
  check('POS handoff distinguishes sending/sent/error', requestPurchase.includes("'sending'") && requestPurchase.includes("'sent'") && requestPurchase.includes("'error'"))
  check('Network failure is converted to explicit failure state', requestPurchase.includes("network_error") && requestPurchase.includes("setOrderIntentStatus('error')"))
  check('Successful order intent is persisted into journey state', requestPurchase.includes('orderIntent:') && requestPurchase.includes('orderIntentId'))
  check('Request/purchase rewards are awarded', requestPurchase.includes("awardSessionRewards('request-purchase'"))
  check('Next route is cut/toast/light', requestPurchase.includes("navigate('/smokecraft/cut-toast-light')"))
  check('Haptic feedback is wired', requestPurchase.includes('triggerHaptic'))
}

console.log('\nGate 4 — Cut/Toast/Light requires real user completion')
check('CutToastLight exists', Boolean(cutToastLight))
if (cutToastLight) {
  check('Cut choice has controlled state', cutToastLight.includes('cutMethod') && cutToastLight.includes('setCutMethod'))
  check('Matching activity has controlled state', cutToastLight.includes('matches') && cutToastLight.includes('setMatches'))
  check('Cut choices are real pressable controls', cutToastLight.includes('aria-pressed'))
  check('All three match items are required', cutToastLight.includes('const allMatched = MATCH_ITEMS.every'))
  check('Continue rejects missing cut method', cutToastLight.includes('if (done || !cutMethod) return'))
  check('Continue rejects incomplete matching activity', cutToastLight.includes('if (!allMatched)'))
  check('Server draft is loaded', cutToastLight.includes('loadTastingDraft(ACTIVITY_KEY)'))
  check('Server draft is autosaved', cutToastLight.includes('saveTastingDraft(ACTIVITY_KEY'))
  check('Draft conflicts/completed state are handled', cutToastLight.includes('result.conflict') && cutToastLight.includes('result.alreadyCompleted'))
  check('Competency evidence is submitted', cutToastLight.includes("submitSelectionAttempt('cut-toast-light'"))
  check('Cut method is persisted into journey state', cutToastLight.includes('setCutToastLight'))
  check('Cut/toast/light reward is awarded', cutToastLight.includes("awardSessionRewards('cut-toast-light'"))
  check('Next route is lighting tutorial', cutToastLight.includes("navigate('/smokecraft/lighting-tutorial')"))
}

console.log('\nGate 5 — First Third captures server-backed tasting evidence')
check('FirstThird exists', Boolean(firstThird))
if (firstThird) {
  check('Observation selection state exists', firstThird.includes('checked') && firstThird.includes('setChecked'))
  check('At least one observation is required before continue', firstThird.includes('if (checked.length === 0)'))
  check('Server draft is loaded', firstThird.includes('loadTastingDraft(ACTIVITY_KEY)'))
  check('Server draft is autosaved', firstThird.includes('saveTastingDraft(ACTIVITY_KEY'))
  check('Draft conflict/completed state is handled', firstThird.includes('result.conflict') && firstThird.includes('result.alreadyCompleted'))
  check('Local tasting context receives payload', firstThird.includes('setFirstThirdTasting(payload)'))
  check('Journey context receives payload', firstThird.includes('setFirstThird(payload)'))
  check('First-third evidence is submitted server-side', firstThird.includes("submitTastingObservation('first-third', checked, notes)"))
  check('Submission failure blocks progression', firstThird.includes('if (!result.ok)') && firstThird.includes('setSubmitError'))
  check('First-third rewards are awarded', firstThird.includes("awardSessionRewards('first-third'"))
  check('Next route is Flavor Memory', firstThird.includes("navigate('/smokecraft/flavor-memory')"))
}

console.log('\nGate 6 — Flavor Memory persists and syncs real selections')
check('FlavorMemory exists', Boolean(flavorMemory))
if (flavorMemory) {
  check('Eight flavor zones are defined', flavorMemory.includes('FLAVOR_ZONES') && flavorMemory.includes("id: 'earth'") && flavorMemory.includes("id: 'floral'"))
  check('Selected flavors are controlled state', flavorMemory.includes('selectedFlavors'))
  check('At least two flavors are required', flavorMemory.includes('if (fm.selectedFlavors.length < 2)'))
  check('Backend flavor-memory endpoint is used', flavorMemory.includes('/api/modules/smokecraft/pairing/flavor-memory'))
  check('Backend save failure is explicit', flavorMemory.includes('flavor-memory save failed'))
  check('Passport sync endpoint is identity-gated', flavorMemory.includes('/api/passport-360/sync/flavor-memory') && flavorMemory.includes("credentials: 'include'"))
  check('Passport sync failure is explicit', flavorMemory.includes('passport save failed'))
  check('Journey flavor memory is persisted', flavorMemory.includes('setFlavorMemory'))
  check('Competency evidence is submitted', flavorMemory.includes('submitSelectionAttempt'))
  check('Flavor-memory rewards are awarded', flavorMemory.includes("awardSessionRewards('flavor-memory'"))
  check('Next route is Pairing Lab', flavorMemory.includes("navigate('/smokecraft/pairing-lab')"))
}

console.log('\nGate 7 — Second Third follows canonical chronological route')
check('SecondThird exists', Boolean(secondThird))
if (secondThird) {
  check('Observation selection state exists', secondThird.includes('checked') && secondThird.includes('setChecked'))
  check('At least one observation is required', secondThird.includes('if (checked.length === 0)'))
  check('Server draft is loaded', secondThird.includes('loadTastingDraft(ACTIVITY_KEY)'))
  check('Server draft is autosaved', secondThird.includes('saveTastingDraft(ACTIVITY_KEY'))
  check('Draft conflicts/completed state are handled', secondThird.includes('result.conflict') && secondThird.includes('result.alreadyCompleted'))
  check('Local tasting context receives payload', secondThird.includes('setSecondThirdTasting(payload)'))
  check('Journey context receives payload', secondThird.includes('setSecondThird(payload)'))
  check('Second-third evidence is submitted server-side', secondThird.includes("submitTastingObservation('second-third', checked, notes)"))
  check('Submission failure blocks progression', secondThird.includes('if (!result.ok)') && secondThird.includes('setSubmitError'))
  check('Second-third rewards are awarded', secondThird.includes("awardSessionRewards('second-third'"))
  check('Next route is Mentor Commentary', secondThird.includes("navigate('/smokecraft/mentor-commentary')"))
}

console.log('\nGate 8 — Final Third completes evidence before scorecard')
check('FinalThird exists', Boolean(finalThird))
if (finalThird) {
  check('Flavor/focus state is controlled', finalThird.includes('selectedFlavors') && finalThird.includes('focusSelected'))
  check('Combined observation list is required before continue', finalThird.includes('if (combinedNotes.length === 0)'))
  check('Server draft is loaded', finalThird.includes('loadTastingDraft(ACTIVITY_KEY)'))
  check('Server draft is autosaved', finalThird.includes('saveTastingDraft(ACTIVITY_KEY'))
  check('Draft conflicts/completed state are handled', finalThird.includes('result.conflict') && finalThird.includes('result.alreadyCompleted'))
  check('Local tasting context receives payload', finalThird.includes('setFinalThirdTasting(payload)'))
  check('Journey context receives payload', finalThird.includes('setFinalThird(payload)'))
  check('Final-third evidence is submitted server-side', finalThird.includes("submitTastingObservation('final-third', combinedNotes, personalNotes)"))
  check('Submission failure blocks progression', finalThird.includes('if (!result.ok)') && finalThird.includes('setSubmitError'))
  check('Final-third rewards are awarded', finalThird.includes("awardSessionRewards('final-third'"))
  check('Next route is Scorecard', finalThird.includes("navigate('/smokecraft/scorecard')"))
}

console.log('\nGate 9 — Canonical journey semantics remain intact')
check('smokecraftJourney exists', Boolean(journey))
check('session constants exist', Boolean(session))
if (journey && session) {
  check('Current model has 6 phases', session.includes('TOTAL_VISITS = 6'))
  check('Current model has 27 sessions', session.includes('TOTAL_SESSIONS = 27'))
  check('Session 1 is the real entry session', session.includes("session: 1, id: 'entry'"))
  const isStepCompleteBody = journey.match(/function isStepComplete\([\s\S]*?\n\}/)?.[0] || ''
  check('Entry session is not silently auto-completed', !isStepCompleteBody.includes("session.id === 'entry'") && !isStepCompleteBody.includes("sessionId === 'entry'"))
  check('Unimplemented sessions are explicitly skippable', isStepCompleteBody.includes('session.implemented === false'))
  check('Current allowed session is computed from first incomplete session', journey.includes('getCurrentAllowedSession'))
}

console.log('\nGate 10 — Final shell and asset-route integration')
check('SessionComplete exists', Boolean(sessionComplete))
if (sessionComplete) {
  check('SessionComplete returns to SmokeCraft rather than POS', sessionComplete.includes('/smokecraft') && !sessionComplete.includes("'/pos3'"))
  check('SessionComplete does not jump to visit-complete', !sessionComplete.includes('/smokecraft/visit-complete'))
}
check('SmokeCraftAssetRoute exists', Boolean(assetRoute))
if (assetRoute) {
  check('AssetRoute renders HotspotLayer', assetRoute.includes('SmokeCraftHotspotLayer'))
  check('AssetRoute passes hotspots to HotspotLayer', assetRoute.includes('hotspots={hotspots}') || assetRoute.includes('hotspots='))
}

console.log('\nGate 11 — Safety: do not fabricate live commerce state')
const safetySurface = [requestPurchase, cutToastLight, firstThird, flavorMemory, secondThird, finalThird].filter(Boolean).join('\n')
check('No fake payment-live claim', !/payments?\s+(are\s+)?live/i.test(safetySurface))
check('No fake POS-connected claim', !/POS\s+(is\s+)?connected/i.test(safetySurface))
check('Purchase flow surfaces handoff status to the guest', Boolean(requestPurchase && requestPurchase.includes('Venue Handoff') && requestPurchase.includes('orderIntentStatus')))

console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Current Live Interactions: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ Live interaction contracts match the current chronological SmokeCraft architecture.')
  process.exit(0)
}
console.log('\n❌ Live interaction issues found — fix before deployment.')
process.exit(1)
