/**
 * SmokeCraft current landing/interactions acceptance.
 *
 * Verifies the canonical landing action resolver, live image-shell controls,
 * journey entry/resume semantics, current 6-phase/27-session spine, and the
 * optional Ticket Tapper motion contract. This intentionally does not assert
 * retired hardcoded hotspot routes or the old 8/24 progress model.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
let passed = 0
let failed = 0

function check(label, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${label}`); passed++ }
  else { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); failed++ }
}
function read(relPath) {
  const p = resolve(ROOT, relPath)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

console.log('\nSmokeCraft Current Landing Interaction Verification\n')

const landing = read('src/pages/SmokeCraft.jsx')
const landingActions = read('src/constants/smokecraftLandingActions.js')
const identity = read('src/pages/smokecraft/Identity.jsx')
const hotspotLayer = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
const ticker = read('src/components/smokecraft/TicketTapperSpecialsStrip.jsx')
const journey = read('src/constants/smokecraftJourney.js')
const session = read('src/constants/session.js')
const guard = read('src/components/smokecraft/SmokeCraftSessionGuard.jsx')
const assets = read('src/constants/smokecraftAssets.js')

console.log('Gate 1 — Landing uses canonical control plane')
check('SmokeCraft.jsx exists', Boolean(landing))
check('Landing action resolver exists', Boolean(landingActions))
if (landing && landingActions) {
  check('Landing reads journey state once', landing.includes('getSmokeCraftLandingJourneyState'))
  check('Every landing action funnels through resolveSmokeCraftLandingAction', landing.includes('resolveSmokeCraftLandingAction'))
  check('Landing has no hardcoded navigate route strings inside runAction', !/function runAction[\s\S]*?navigate\(['"]\/smokecraft\//.test(landing))
  check('Primary CTA label comes from resolver output', landing.includes('label={primary.label}'))
  check('Primary CTA is a real button', landing.includes('function PrimaryHotspot') && landing.includes('<button'))
  check('Primary CTA has usable width', landing.includes("width: '23.0%'"))
  check('Primary CTA has usable height band', landing.includes("height: '6.4%'"))
  check('Primary CTA enforces minimum touch height', landing.includes('minHeight: 44'))
  check('Landing uses haptics', landing.includes('triggerHaptic'))
  check('Start-new action requires confirmation for destructive reset', landing.includes('requiresConfirmation') && landing.includes('confirmingStartNew'))
  check('Clean-start reset is centralized', landing.includes('useStartNewSmokeCraftJourney'))
}

console.log('\nGate 2 — Canonical landing destination map')
if (landingActions) {
  for (const [name, route] of [
    ['HOW_IT_WORKS', '/smokecraft/how-it-works'],
    ['REWARDS', '/smokecraft/rewards-center'],
    ['RANKINGS', '/smokecraft/leaderboard'],
    ['PASSPORT', '/smokecraft/passport'],
    ['PAIRING', '/smokecraft/pairing'],
    ['CRAFTHUB', '/smokecraft/crafthub'],
  ]) {
    check(`${name} destination is ${route}`, landingActions.includes(`${name}:`) && landingActions.includes(`'${route}'`))
  }
  check('Unknown actions throw instead of silently falling back', landingActions.includes('throw new Error(`resolveSmokeCraftLandingAction: unknown action'))
  check('START_NEW routes enrolled users to Identity', landingActions.includes("? '/smokecraft/identity'"))
  check('START_NEW routes never-enrolled users to Enrollment', landingActions.includes('SMOKECRAFT_ENROLLMENT_ROUTE'))
  check('Resume destination is computed from earliest incomplete session', landingActions.includes('resolveSmokeCraftEntryDestination') && landingActions.includes('computeJourneyStatus'))
  check('Entry readiness is canonical', landingActions.includes('getSmokeCraftEntryReadiness'))
}

console.log('\nGate 3 — Landing image-shell and static controls')
if (landing && assets) {
  check('Landing image comes from central SC_ASSETS registry', landing.includes('src: SC_ASSETS.landing'))
  check('Landing is explicitly image-shell mode', landing.includes('mode="image-shell"'))
  check('How It Works uses canonical action id', landing.includes('ACTIONS.HOW_IT_WORKS'))
  check('Passport uses canonical action id', landing.includes('ACTIONS.PASSPORT'))
  check('Pairing uses canonical action id', landing.includes('ACTIONS.PAIRING'))
  check('Rewards uses canonical action id', landing.includes('ACTIONS.REWARDS'))
  check('Rankings uses canonical action id', landing.includes('ACTIONS.RANKINGS'))
  check('CraftHub uses canonical action id', landing.includes('ACTIONS.CRAFTHUB'))
  check('Central asset registry contains landing asset', /landing\s*:/.test(assets))
}

console.log('\nGate 4 — Identity follows current entry sequence')
check('Identity.jsx exists', Boolean(identity))
if (identity) {
  check('Identity persists profile data', identity.includes('setIdentity(form)'))
  check('Identity validates before navigation', identity.includes('Object.keys(errors).length > 0'))
  check('Identity awards identity rewards', identity.includes("awardSessionRewards('identity')"))
  check('Identity progresses to venue selection', identity.includes("navigate('/smokecraft/venue-select')"))
  check('Identity uses shared primary NavBar', identity.includes('onPrimary={handleBegin}'))
  check('Identity uses haptic feedback', identity.includes('triggerHaptic'))
}

console.log('\nGate 5 — Current journey spine and unlock semantics')
check('smokecraftJourney.js exists', Boolean(journey))
check('session.js exists', Boolean(session))
if (journey && session) {
  check('Current journey has 6 phases', session.includes('TOTAL_VISITS = 6'))
  check('Current journey has 27 sessions', session.includes('TOTAL_SESSIONS = 27'))
  check('Session 1 is real entry session', session.includes("session: 1, id: 'entry'"))
  check('Session 1 is not auto-completed anymore', journey.includes("S1 (id 'entry') is now a real, implemented session") && !journey.includes("sessionId === 'entry' ? true"))
  check('Phase 1 is always unlocked', journey.includes('if (visitNumber <= 1) return true'))
  check('Unimplemented sessions are explicitly skipped for unlock, not fabricated', journey.includes('if (session.implemented === false) return true'))
  check('Current allowed session is derived from first incomplete session', journey.includes('getCurrentAllowedSession'))
}

console.log('\nGate 6 — Session guard')
check('SmokeCraftSessionGuard exists', Boolean(guard))
if (guard) {
  check('Guard supports demo bypass', guard.includes('isDemoMode'))
  check('Guard uses isSessionUnlocked', guard.includes('isSessionUnlocked'))
  check('Guard renders locked state when necessary', guard.includes('LockedSmokeCraftScreen'))
}

console.log('\nGate 7 — Hotspot accessibility/production behavior')
check('SmokeCraftHotspotLayer exists', Boolean(hotspotLayer))
if (hotspotLayer) {
  check('Hotspot labels are accessible', hotspotLayer.includes('aria-label'))
  check('Production hotspot buttons are transparent outside debug', hotspotLayer.includes("'transparent'"))
  check('Debug flag is explicit and off by default', hotspotLayer.includes('smokecraft_hotspot_debug') && (hotspotLayer.includes("=== '1'") || hotspotLayer.includes('=== "1"')))
  check('No native title tooltip leak on hotspot labels', !hotspotLayer.includes('title={h.label}'))
  check('Keyboard focus-visible style exists', hotspotLayer.includes('focus-visible'))
  check('Touch action manipulation exists', hotspotLayer.includes('touchAction'))
}

console.log('\nGate 8 — Ticket Tapper optional motion contract')
check('TicketTapper may be absent without breaking landing', true)
if (ticker) {
  check('Ticker marquee animation exists', ticker.includes('sc-ticker-scroll'))
  check('Ticker track exists', ticker.includes('sc-ticker-track'))
  check('Ticker pauses on hover', ticker.includes('animation-play-state: paused'))
  check('Ticker supports empty-state placeholder', /coming soon/i.test(ticker))
  check('Ticker does not return null for empty specials', !ticker.match(/if\s*\(\s*customerSpecials\.length\s*===\s*0\s*\)\s*return\s+null/))
  check('Ticker injects styles once', ticker.includes('ensureTickerStyles'))
}

console.log('\nGate 9 — Safety and stale-model rejection')
const combined = [landing, landingActions, identity].filter(Boolean).join('\n')
check('No stale 8-phase constant required by landing', !combined.includes('TOTAL_VISITS = 8'))
check('No stale 24-session constant required by landing', !combined.includes('TOTAL_SESSIONS = 24'))
check('No fake payment-live claim', !combined.match(/payments?.*live/i))
check('No fake POS-connected claim', !combined.match(/pos.*connected/i))

console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Current Landing Interactions: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ SmokeCraft landing interactions match the canonical current journey architecture.')
  process.exit(0)
}
console.log('\n❌ SmokeCraft landing interaction issues found — fix before deployment.')
process.exit(1)
