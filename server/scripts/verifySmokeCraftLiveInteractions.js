/**
 * SmokeCraft current live-interaction acceptance.
 *
 * This verifier intentionally tests the current production architecture:
 * live DOM controls, canonical journey persistence/reward calls, current
 * 6-phase / 27-session sequencing, accessible touch controls, and explicit
 * POS handoff state. It does not require retired inline completeStep calls,
 * retired route order, or debug-only hotspot labels.
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
  check('Shell reserves bottom navigation space', assetScreen.includes('NAV_HEIGHT') || assetScreen.includes('bottom: 64'))
  check('Interactive children are rendered directly', assetScreen.includes('{children}'))
  check('No inline-block wrapper constrains controls', !assetScreen.includes("display: 'inline-block'"))
  check('Image treatment supports contain/safe fit rather than forced crop', assetScreen.includes('contain') || assetScreen.includes('backgroundSize'))
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

console.log('\nGate 3 — Request/Purchase handoff is a real controlled interaction')
check('RequestPurchase exists', Boolean(requestPurchase))
if (requestPurchase) {
  check('Ordering paths are explicit', requestPurchase.includes('ORDERING_PATHS'))
  check('Selection state is controlled', requestPurchase.includes('orderPath') && requestPurchase.includes('useState'))
  check('Selection buttons expose aria-pressed', requestPurchase.includes('aria-pressed'))
  check('Journey selection is persisted', requestPurchase.includes('setRequestPurchase'))
  check('Venue/counter path creates an order intent', requestPurchase.includes('createOrderIntent'))
  check('POS bridge state is surfaced', requestPurchase.includes('bridgeState'))
  check('POS handoff has error handling', requestPurchase.includes('setError') || requestPurchase.includes("'failed'"))
  check('Request/purchase rewards are awarded', requestPurchase.includes("awardSessionRewards('request-purchase'"))
  check('Next route is cut/toast/light', requestPurchase.includes("'/smokecraft/cut-toast-light'"))
  check('Haptic feedback is wired', requestPurchase.includes('triggerHaptic') || requestPurchase.includes('hapticTap'))
}

console.log('\nGate 4 — Cut/Toast/Light requires real user completion')
check('CutToastLight exists', Boolean(cutToastLight))
if (cutToastLight) {
  check('Cut choice has controlled state', cutToastLight.includes('selectedCut'))
  check('Matching activity has controlled state', cutToastLight.includes('match'))
  check('Cut choices are real pressable controls', cutToastLight.includes('aria-pressed'))
  check('Continue readiness depends on both activities', /selectedCut[\s\S]{0,200}match|match[\s\S]{0,200}selectedCut/.test(cutToastLight))
  check('Draft state is persisted', cutToastLight.includes('serverDrafts.saveDraft'))
  check('Competency evidence is submitted', cutToastLight.includes('submitSelectionAttempt'))
  check('Cut method is persisted into journey state', cutToastLight.includes('setCutMethod'))
  check('Cut/toast/light reward is awarded', cutToastLight.includes("awardSessionRewards('cut-toast-light'"))
  check('Next route is lighting tutorial', cutToastLight.includes("'/smokecraft/lighting-tutorial'"))
  check('Haptic feedback is wired', cutToastLight.includes('triggerHaptic') || cutToastLight.includes('hapticTap'))
}

console.log('\nGate 5 — First Third captures and persists tasting evidence')
check('FirstThird exists', Boolean(firstThird))
if (firstThird) {
  check('Flavor selection state exists', firstThird.includes('flavors'))
  check('Flavor selection is required before continue', firstThird.includes('canContinue'))
  check('Draft state is persisted', firstThird.includes('serverDrafts.saveDraft'))
  check('First-third observation is submitted', firstThird.includes('submitTastingObservation') && firstThird.includes("third: 'first'"))
  check('First-third observation is persisted into journey state', firstThird.includes("setTasteObservation('first'"))
  check('First-third rewards are awarded', firstThird.includes("awardSessionRewards('first-third'"))
  check('Next route is Flavor Memory', firstThird.includes("'/smokecraft/flavor-memory'"))
  check('Flavor controls are accessible/touchable', firstThird.includes('aria-pressed') || firstThird.includes('<button'))
}

console.log('\nGate 6 — Flavor Memory is a real two-or-more selection exercise')
check('FlavorMemory exists', Boolean(flavorMemory))
if (flavorMemory) {
  check('Flavor zones are defined', flavorMemory.includes('earth') && flavorMemory.includes('sweet') && flavorMemory.includes('spice'))
  check('Selection state exists', flavorMemory.includes('selected'))
  check('At least two flavors are required', flavorMemory.includes('selected.length >= 2'))
  check('Flavor memory is saved to backend', flavorMemory.includes('saveFlavorMemory'))
  check('Flavor memory is synced to Passport', flavorMemory.includes('addUniqueValue'))
  check('Competency evidence is submitted', flavorMemory.includes('submitSelectionAttempt'))
  check('Journey flavor memory is persisted', flavorMemory.includes('setFlavorMemory'))
  check('Flavor-memory reward is awarded', flavorMemory.includes("awardSessionRewards('flavor-memory'"))
  check('Next route is Pairing Lab', flavorMemory.includes("'/smokecraft/pairing-lab'"))
}

console.log('\nGate 7 — Second Third follows the canonical chronological route')
check('SecondThird exists', Boolean(secondThird))
if (secondThird) {
  check('Flavor selection is required', secondThird.includes('canContinue'))
  check('Draft state is persisted', secondThird.includes('serverDrafts.saveDraft'))
  check('Second-third observation is submitted', secondThird.includes('submitTastingObservation') && secondThird.includes("third: 'second'"))
  check('Second-third observation is persisted', secondThird.includes("setTasteObservation('second'"))
  check('Second-third rewards are awarded', secondThird.includes("awardSessionRewards('second-third'"))
  check('Canonical next route is Mentor Commentary', secondThird.includes("NEXT_ROUTE = '/smokecraft/mentor-commentary'"))
  check('Controls are real/accessibly pressable', secondThird.includes('aria-pressed') || secondThird.includes('<button'))
}

console.log('\nGate 8 — Final Third completes tasting before scorecard')
check('FinalThird exists', Boolean(finalThird))
if (finalThird) {
  check('Flavor journey state exists', finalThird.includes('flavorJourney'))
  check('Flavor selection is required before continue', finalThird.includes('canContinue'))
  check('Draft state is persisted', finalThird.includes('serverDrafts.saveDraft'))
  check('Final-third observation is submitted', finalThird.includes('submitTastingObservation') && finalThird.includes("third: 'final'"))
  check('Final-third observation is persisted', finalThird.includes("setTasteObservation('final'"))
  check('Final-third rewards are awarded', finalThird.includes("awardSessionRewards('final-third'"))
  check('Next route is Scorecard', finalThird.includes("'/smokecraft/scorecard'"))
  check('Controls are real/accessibly pressable', finalThird.includes('aria-pressed') || finalThird.includes('<button'))
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
check('Error state is user-visible in purchase flow', Boolean(requestPurchase && (requestPurchase.includes('error') || requestPurchase.includes('bridgeState'))))

console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Current Live Interactions: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ Live interaction contracts match the current chronological SmokeCraft architecture.')
  process.exit(0)
}
console.log('\n❌ Live interaction issues found — fix before deployment.')
process.exit(1)
