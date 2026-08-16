/**
 * Verification: SmokeCraft canonical flow order.
 *
 * Confirms the active app follows the current handoff:
 * - onboarding screens in the required fresh-user order, with Resume marked non-linear
 * - 27 numbered sessions across 6 phases
 * - 25 distinct canonical routes in the documented route order
 * - supporting modules remain gated side paths, not numbered sessions
 * - runtime completion overrides preserve approved detours without changing
 *   the numbered spine: Welcome -> Identity and Format -> Request/Purchase
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')

let passed = 0
let failed = 0

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  PASS ${label}`)
    passed++
  } else {
    console.log(`  FAIL ${label}${detail ? ' - ' + detail : ''}`)
    failed++
  }
}

function read(relPath) {
  const p = resolve(ROOT, relPath)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

function readJson(relPath) {
  const src = read(relPath)
  return src ? JSON.parse(src) : null
}

const EXPECTED_ENTRY_ROUTES = [
  '/smokecraft',
  '/smokecraft/welcome',
  '/smokecraft/identity',
  '/smokecraft/venue-select',
  '/smokecraft/golden-box',
  '/smokecraft/mentor-selection',
  '/smokecraft/enroll',
  '/smokecraft/resume',
]

const EXPECTED_ROUTE_ORDER = [
  '/smokecraft',
  '/smokecraft/welcome',
  '/smokecraft/identity',
  '/smokecraft/venue-select',
  '/smokecraft/golden-box',
  '/smokecraft/mentor-selection',
  '/smokecraft/humidor-match',
  '/smokecraft/meet-your-cigar',
  '/smokecraft/terroir',
  '/smokecraft/format',
  '/smokecraft/cut-toast-light',
  '/smokecraft/lighting-tutorial',
  '/smokecraft/first-third',
  '/smokecraft/flavor-memory',
  '/smokecraft/pairing-lab',
  '/smokecraft/second-third',
  '/smokecraft/mentor-commentary',
  '/smokecraft/knowledge-drop',
  '/smokecraft/final-third',
  '/smokecraft/scorecard',
  '/smokecraft/ai-summary',
  '/smokecraft/pairing-recommendations',
  '/smokecraft/passport-stamp',
  '/smokecraft/final-review',
  '/smokecraft/rewards',
  '/smokecraft/session-complete',
]

const EXPECTED_SUPPORTING = [
  { id: 'golden-box', route: '/smokecraft/golden-box', requires: 'venue' },
  { id: 'mentor', route: '/smokecraft/mentor-selection', requires: 'golden-box' },
  { id: 'seed-soil', route: '/smokecraft/seed-soil', requires: 'mentor' },
  { id: 'wrapper-strength', route: '/smokecraft/wrapper-strength', requires: 'format' },
  { id: 'request-purchase', route: '/smokecraft/request-purchase', requires: 'humidor-match' },
  { id: 'smokecraft-challenge', route: '/smokecraft/smokecraft-challenge', requires: 'scorecard' },
  { id: 'second-humidor-match', route: '/smokecraft/second-humidor-match', requires: 'scorecard' },
  { id: 'mini-tasting', route: '/smokecraft/mini-tasting', requires: 'scorecard' },
  { id: 'connections', route: '/smokecraft/connections', requires: 'passport-stamp' },
  { id: 'management-sync', route: '/smokecraft/management-sync', requires: 'passport-stamp' },
]

console.log('\nSmokeCraft Official Flow Order Verification\n')

const canonical = readJson('docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json')
const sessionJs = read('src/constants/session.js')
const appJsx = read('src/App.jsx')
const screenManifest = read('src/constants/smokecraftScreenManifest.js')
const registry = read('src/constants/smokecraftComponentRegistry.js')
const completionService = read('src/services/smokecraft/smokecraftCompletionService.js')

console.log('Gate 1 - canonical manifest shape')
check('canonical manifest exists', canonical !== null)
if (canonical) {
  check('total phases is 6', canonical.totalPhases === 6, `actual=${canonical.totalPhases}`)
  check('total sessions is 27', canonical.totalSessions === 27, `actual=${canonical.totalSessions}`)
  check('entry layer has required onboarding screens', canonical.entryLayer?.length === EXPECTED_ENTRY_ROUTES.length, `actual=${canonical.entryLayer?.length}`)
  check('spine has 27 sessions', canonical.spine?.length === 27, `actual=${canonical.spine?.length}`)
  check('supporting module count is 10', canonical.supportingModules?.length === 10, `actual=${canonical.supportingModules?.length}`)
  check('canonical route count matches required flow', canonical.canonicalRouteOrder?.length === EXPECTED_ROUTE_ORDER.length, `actual=${canonical.canonicalRouteOrder?.length}`)
}

console.log('\nGate 2 - entry layer order')
if (canonical) {
  EXPECTED_ENTRY_ROUTES.forEach((route, index) => {
    check(`entry route ${index + 1} is ${route}`, canonical.entryLayer[index]?.route === route, `actual=${canonical.entryLayer[index]?.route}`)
  })
  check('resume entry is non-linear', canonical.entryLayer.find(entry => entry.id === 'resume')?.nonLinear === true)
}
if (sessionJs) {
  const entryBlock = sessionJs.match(/export const ENTRY_LAYER_SCREENS\s*=\s*\[([\s\S]*?)\n\]/)?.[1] || ''
  EXPECTED_ENTRY_ROUTES.forEach((route, index) => {
    const positions = EXPECTED_ENTRY_ROUTES.map(r => entryBlock.indexOf(`route: '${r}'`))
    check(`session.js entry route ${index + 1} is ${route}`, positions[index] >= 0 && positions[index] === [...positions].sort((a, b) => a - b)[index])
  })
}

console.log('\nGate 3 - canonical route order')
if (canonical) {
  EXPECTED_ROUTE_ORDER.forEach((route, index) => {
    check(`route ${index + 1} is ${route}`, canonical.canonicalRouteOrder[index] === route, `actual=${canonical.canonicalRouteOrder[index]}`)
  })
}

console.log('\nGate 4 - session.js locked totals and route ids')
check('session.js exists', sessionJs !== null)
if (sessionJs) {
  check('TOTAL_PHASES aliases 6 visits', sessionJs.includes('TOTAL_PHASES = TOTAL_VISITS'))
  check('TOTAL_VISITS = 6', sessionJs.includes('TOTAL_VISITS = 6'))
  check('TOTAL_SESSIONS = 27', sessionJs.includes('TOTAL_SESSIONS = 27'))
  for (const step of canonical?.spine || []) {
    check(`VISIT_STRUCTURE has session ${step.session} ${step.id}`, sessionJs.includes(`session: ${step.session}`) && sessionJs.includes(`id: '${step.id}'`))
  }
}

console.log('\nGate 5 - supporting modules')
if (canonical) {
  for (const expected of EXPECTED_SUPPORTING) {
    const actual = canonical.supportingModules.find(module => module.id === expected.id)
    check(`supporting module ${expected.id} exists`, !!actual)
    check(`${expected.id} route is ${expected.route}`, actual?.route === expected.route, `actual=${actual?.route}`)
    check(`${expected.id} requires ${expected.requires}`, actual?.requires === expected.requires, `actual=${actual?.requires}`)
  }
}
if (sessionJs) {
  for (const expected of EXPECTED_SUPPORTING) {
    check(`session.js SUPPORTING_MODULES includes ${expected.id}`, sessionJs.includes(`id: '${expected.id}'`) && sessionJs.includes(`route: '${expected.route}'`))
  }
}

console.log('\nGate 6 - active App route guards')
check('App.jsx exists', appJsx !== null)
if (appJsx) {
  const requiredAppSnippets = [
    ['landing is public entry', '<Route index element={<SmokeCraftSessionGuard sessionNumber={1} enforceEntryReadiness={false}>'],
    ['welcome is first onboarding screen', 'path="welcome"          element={<SmokeCraftSessionGuard sessionNumber={1} enforceEntryReadiness={false} hideHeader>'],
    ['enroll remains legacy-accessible', 'path="enroll"           element={<Enroll />}'],
    ['identity requires welcome', 'path="identity"       element={<SmokeCraftSessionGuard requires="entry">'],
    ['venue-select requires identity', 'path="venue-select"     element={<SmokeCraftSessionGuard requires="identity">'],
    ['golden-box requires venue', 'element={<SmokeCraftSessionGuard requires="venue"><GoldenBox /></SmokeCraftSessionGuard>}'],
    ['mentor-selection requires golden-box', 'path="mentor-selection" element={<SmokeCraftSessionGuard requires="golden-box"><Mentor /></SmokeCraftSessionGuard>}'],
    ['humidor-match is session 2', 'path="humidor-match"    element={<SmokeCraftSessionGuard sessionNumber={2}>'],
    ['format is session 5', 'path="format"         element={<SmokeCraftSessionGuard sessionNumber={5}>'],
    ['scorecard is session 19', 'path="scorecard"        element={<SmokeCraftSessionGuard sessionNumber={19}>'],
    ['passport-stamp is session 23', 'path="passport-stamp"   element={<SmokeCraftSessionGuard sessionNumber={23}>'],
    ['rewards is session 25', 'path="rewards"          element={<SmokeCraftSessionGuard sessionNumber={25}>'],
    ['session-complete is session 27', 'path="session-complete" element={<SmokeCraftSessionGuard sessionNumber={27}>'],
    ['seed-soil requires mentor', 'path="seed-soil"        element={<SmokeCraftSessionGuard requires="mentor">'],
    ['request-purchase requires humidor-match', 'path="request-purchase" element={<SmokeCraftSessionGuard requires="humidor-match">'],
    ['connections requires passport-stamp', 'path="connections"      element={<SmokeCraftSessionGuard requires="passport-stamp">'],
    ['second-humidor-match requires scorecard', 'path="second-humidor-match"  element={<SmokeCraftSessionGuard requires="scorecard">'],
  ]
  for (const [label, snippet] of requiredAppSnippets) {
    check(label, appJsx.includes(snippet))
  }
}

console.log('\nGate 7 - renderer registry and completion service')
check('smokecraftScreenManifest exists', screenManifest !== null)
check('smokecraftComponentRegistry exists', registry !== null)
check('smokecraftCompletionService exists', completionService !== null)
if (screenManifest) {
  check('screen manifest derives from VISIT_STRUCTURE', screenManifest.includes('VISIT_STRUCTURE'))
  check('Welcome completion continues to Identity', screenManifest.includes("s.session === 1 ? '/smokecraft/identity'"))
  check('Format completion detours to Request/Purchase', screenManifest.includes("s.session === 5 ? '/smokecraft/request-purchase'"))
}
if (registry) {
  const componentKeys = ['session-1', 'session-2', 'session-3', 'session-4', 'session-5', 'session-6', 'session-7', 'session-8', 'session-10', 'session-11', 'session-12', 'session-14', 'session-15', 'session-16', 'session-19', 'session-21', 'session-22', 'session-23', 'session-24', 'session-25', 'session-27']
  for (const key of componentKeys) check(`component registry has ${key}`, registry.includes(`'${key}'`))
}
if (completionService) {
  check('completion service refuses unknown screen ids', completionService.includes('unknown screenId'))
  check('completion service checks prerequisites', completionService.includes('prerequisites'))
  check('completion service skips merged same-route self loops', completionService.includes('while (nextEntry') && completionService.includes('nextEntry.route === entry.route'))
}

console.log('\nGate 8 - known direct navigation hops')
const routeChecks = [
  ['WelcomeExperience.jsx', "/smokecraft/identity"],
  ['GoldenBox.jsx', 'NAV.MENTOR'],
  ['Mentor.jsx', '/smokecraft/humidor-match'],
  ['SeedSoil.jsx', '/smokecraft/humidor-match'],
  ['Format.jsx', '/smokecraft/request-purchase'],
  ['RequestPurchase.jsx', '/smokecraft/cut-toast-light'],
  ['CutToastLight.jsx', '/smokecraft/lighting-tutorial'],
  ['LightingTutorial.jsx', '/smokecraft/first-third'],
  ['Scorecard.jsx', '/smokecraft/ai-summary'],
  ['AISummary.jsx', '/smokecraft/pairing-recommendations'],
  ['PairingRecommendations.jsx', '/smokecraft/passport-stamp'],
  ['PassportStamp.jsx', '/smokecraft/final-review'],
  ['FinalReview.jsx', '/smokecraft/rewards'],
  ['Rewards.jsx', '/smokecraft/session-complete'],
  ['Connections.jsx', '/smokecraft/management-sync'],
  ['SecondHumidorMatch.jsx', '/smokecraft/mini-tasting'],
]
for (const [file, expected] of routeChecks) {
  const src = read(`src/pages/smokecraft/${file}`)
  check(`${file} exists`, src !== null)
  if (src) check(`${file} contains ${expected}`, src.includes(expected))
}

console.log('\nGate 9 - legacy hazards not active')
if (appJsx) {
  check('SessionComplete does not send guests to /pos3', !read('src/pages/smokecraft/SessionComplete.jsx')?.includes("navigate('/pos3')"))
  check('old /smokecraft/mentor alias redirects to mentor-selection', appJsx.includes('path="mentor"') && appJsx.includes('to="/smokecraft/mentor-selection"'))
  check('old /smokecraft/gold-box alias redirects to golden-box', appJsx.includes('path="gold-box"') && appJsx.includes('to="/smokecraft/golden-box"'))
}

console.log('\n─────────────────────────────────────────────────')
console.log(`SmokeCraft Flow Order: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\nPASS SmokeCraft canonical flow order verified.')
  process.exit(0)
}

console.log('\nFAIL SmokeCraft flow issues found.')
process.exit(1)
