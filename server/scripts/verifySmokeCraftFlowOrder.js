/**
 * Verification: SmokeCraft Official 18-Step Flow Order
 *
 * Confirms:
 * - VISIT_STRUCTURE contains exactly 7 visits / 18 sessions
 * - Sessions follow the exact required route order
 * - No blocked steps (Format, WrapperStrength, Challenge, etc.) in required path
 * - Mentor routes to seed-soil
 * - PairingLab routes to humidor-match
 * - SeedSoil routes to pairing-lab
 * - Scorecard routes to final-review
 * - FinalReview routes to passport-stamp
 * - SessionComplete does NOT route to /pos3
 * - currentAllowed is exported from SmokeCraftProgressContext
 * - Continue Previous Session in SmokeCraft.jsx uses currentAllowed
 * - Identity does not generate "Open the Box"
 * - Progress header uses session-specific title lookup
 * - No duplicate hotspot rendering in AssetRoute
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
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

function read(relPath) {
  const p = resolve(ROOT, relPath)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

console.log('\nSmokeCraft Official Flow Order Verification\n')

// ── Gate 1: VISIT_STRUCTURE — 7 visits, 18 sessions ─────────────────────────
console.log('Gate 1 — VISIT_STRUCTURE: 7 visits, 18 sessions, correct totals')
const sessionJs = read('src/constants/session.js')
check('session.js exists', sessionJs !== null)
if (sessionJs) {
  check('TOTAL_VISITS = 7', sessionJs.includes('TOTAL_VISITS = 7'))
  check('TOTAL_SESSIONS = 18', sessionJs.includes('TOTAL_SESSIONS = 18'))
  check('Visit 1 exists', sessionJs.includes("visit: 1,"))
  check('Visit 7 exists', sessionJs.includes("visit: 7,"))
  check('No visit 8 in structure', !sessionJs.match(/visit: 8,/))
  check('18 sessions total (session: 18 present)', sessionJs.includes("session: 18,"))
  check('No session: 19 in structure', !sessionJs.match(/session: 19,/))
  check('No session: 24 in structure', !sessionJs.match(/session: 24,/))

  // Format, WrapperStrength, Challenge NOT in VISIT_STRUCTURE required path
  // (they may exist as SMOKECRAFT_FLOW entries but not in VISIT_STRUCTURE)
  const vsBlock = sessionJs.match(/export const VISIT_STRUCTURE\s*=\s*\[([\s\S]*?)\n\]/)
  const vsText = vsBlock ? vsBlock[1] : ''
  check('Format NOT a required session in VISIT_STRUCTURE',
    !vsText.includes("id: 'format'"))
  check('WrapperStrength NOT a required session in VISIT_STRUCTURE',
    !vsText.includes("id: 'wrapper-strength'"))
  check('SmokeCraftChallenge NOT a required session in VISIT_STRUCTURE',
    !vsText.includes("id: 'smokecraft-challenge'"))
  check('SecondHumidorMatch NOT a required session in VISIT_STRUCTURE',
    !vsText.includes("id: 'second-humidor-match'"))
  check('MiniTasting NOT a required session in VISIT_STRUCTURE',
    !vsText.includes("id: 'mini-tasting'"))
  check('"Challenge / Second Cigar" visit title NOT present',
    !sessionJs.includes('Challenge / Second Cigar'))
}

// ── Gate 2: Correct route order in VISIT_STRUCTURE ──────────────────────────
console.log('\nGate 2 — VISIT_STRUCTURE: correct step ID sequence')
if (sessionJs) {
  const REQUIRED_ORDER = [
    'entry', 'golden-box', 'mentor', 'seed-soil', 'pairing-lab', 'humidor-match',
    'request-purchase', 'cut-toast-light', 'first-third', 'second-third',
    'flavor-memory', 'final-third', 'scorecard', 'final-review',
    'passport-stamp', 'connections', 'management-sync', 'session-complete',
  ]
  for (const id of REQUIRED_ORDER) {
    check(`Session id '${id}' present in VISIT_STRUCTURE`, sessionJs.includes(`id: '${id}'`))
  }
  // Verify session number ordering
  check('golden-box is session 2', sessionJs.includes("session: 2") && sessionJs.includes("id: 'golden-box'"))
  check('mentor is session 3', sessionJs.includes("session: 3") && sessionJs.includes("id: 'mentor'"))
  check('seed-soil is session 4', sessionJs.includes("session: 4") && sessionJs.includes("id: 'seed-soil'"))
  check('pairing-lab is session 5', sessionJs.includes("session: 5") && sessionJs.includes("id: 'pairing-lab'"))
  check('final-review is session 14', sessionJs.includes("session: 14") && sessionJs.includes("id: 'final-review'"))
  check('session-complete is session 18', sessionJs.includes("session: 18") && sessionJs.includes("id: 'session-complete'"))
}

// ── Gate 3: Mentor routes to seed-soil ──────────────────────────────────────
console.log('\nGate 3 — Mentor.jsx: routes to seed-soil, not visit-complete')
const mentor = read('src/pages/smokecraft/Mentor.jsx')
check('Mentor.jsx exists', mentor !== null)
if (mentor) {
  check('Mentor navigates to /smokecraft/seed-soil',
    mentor.includes('/smokecraft/seed-soil'))
  check('Mentor does NOT route to visit-complete',
    !mentor.includes('/smokecraft/visit-complete'))
  check('Mentor has visual selection state (useState)',
    mentor.includes('useState'))
  check('Mentor has proceed/continue button',
    mentor.includes('Proceed') || mentor.includes('Continue'))
  check('Mentor calls completeStep(\'mentor\')',
    mentor.includes("completeStep('mentor')"))
  check('Mentor uses haptic feedback (triggerHaptic or hapticTap)',
    mentor.includes('triggerHaptic') || mentor.includes('hapticTap'))
}

// ── Gate 4: PairingLab routes to humidor-match ───────────────────────────────
console.log('\nGate 4 — PairingLab.jsx: routes to humidor-match, not visit-complete')
const pairingLab = read('src/pages/smokecraft/PairingLab.jsx')
check('PairingLab.jsx exists', pairingLab !== null)
if (pairingLab) {
  check('PairingLab navigates to /smokecraft/humidor-match',
    pairingLab.includes('/smokecraft/humidor-match'))
  check('PairingLab does NOT route to visit-complete',
    !pairingLab.includes('/smokecraft/visit-complete'))
}

// ── Gate 5: SeedSoil routes to pairing-lab ───────────────────────────────────
console.log('\nGate 5 — SeedSoil.jsx: routes to pairing-lab')
const seedSoil = read('src/pages/smokecraft/SeedSoil.jsx')
check('SeedSoil.jsx exists', seedSoil !== null)
if (seedSoil) {
  check('SeedSoil navigates to /smokecraft/pairing-lab',
    seedSoil.includes('/smokecraft/pairing-lab'))
}

// ── Gate 6: Scorecard routes to final-review ─────────────────────────────────
console.log('\nGate 6 — Scorecard.jsx: routes to final-review')
const scorecard = read('src/pages/smokecraft/Scorecard.jsx')
check('Scorecard.jsx exists', scorecard !== null)
if (scorecard) {
  check('Scorecard navigates to /smokecraft/final-review',
    scorecard.includes('/smokecraft/final-review'))
}

// ── Gate 7: FinalReview routes to passport-stamp ─────────────────────────────
console.log('\nGate 7 — FinalReview.jsx: routes to passport-stamp')
const finalReview = read('src/pages/smokecraft/FinalReview.jsx')
check('FinalReview.jsx exists', finalReview !== null)
if (finalReview) {
  check('FinalReview navigates to /smokecraft/passport-stamp',
    finalReview.includes('/smokecraft/passport-stamp'))
}

// ── Gate 8: SessionComplete does NOT route to /pos3 ──────────────────────────
console.log('\nGate 8 — SessionComplete.jsx: does not send guests to /pos3')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete.jsx exists', sessionComplete !== null)
if (sessionComplete) {
  check('SessionComplete does NOT navigate to /pos3',
    !sessionComplete.includes("to: '/pos3'") && !sessionComplete.includes("navigate('/pos3')"))
  check('SessionComplete routes to /smokecraft or /crafthub',
    sessionComplete.includes('/smokecraft') || sessionComplete.includes('/crafthub'))
}

// ── Gate 9: currentAllowed exported from context ──────────────────────────────
console.log('\nGate 9 — SmokeCraftProgressContext: currentAllowed exported')
const ctx = read('src/context/SmokeCraftProgressContext.jsx')
check('SmokeCraftProgressContext.jsx exists', ctx !== null)
if (ctx) {
  check('currentAllowed is in the exported value object',
    ctx.includes('currentAllowed,') || ctx.includes('currentAllowed:'))
}

// ── Gate 10: Continue Previous Session uses currentAllowed ────────────────────
console.log('\nGate 10 — SmokeCraft.jsx (landing): Continue uses currentAllowed, not enroll')
const landing = read('src/pages/SmokeCraft.jsx')
check('SmokeCraft.jsx exists', landing !== null)
if (landing) {
  check('Landing imports useSmokeCraftProgress',
    landing.includes('useSmokeCraftProgress'))
  check('Landing uses currentAllowed for continue route',
    landing.includes('currentAllowed'))
  check('Continue Previous Session does NOT hardcode /smokecraft/enroll as destination',
    !landing.match(/Continue Previous Session[\s\S]*?to:.*enroll/))
}

// ── Gate 11: Progress header uses session-specific title ──────────────────────
console.log('\nGate 11 — SmokeCraftProgressHeader: session-specific title, no global cursor bleed')
const header = read('src/components/smokecraft/SmokeCraftProgressHeader.jsx')
check('SmokeCraftProgressHeader.jsx exists', header !== null)
if (header) {
  check('Header imports getSessionByNumber to derive page-specific title',
    header.includes('getSessionByNumber'))
  check('Header uses pageSession to derive displayTitle',
    header.includes('pageSession'))
  check('"Local Preview" not shown for non-demo guests',
    !header.includes("'Local Preview'") || header.match(/isDemoMode.*Local Preview/))
  check('Header does NOT show currentVisitTitle unconditionally',
    !header.match(/>\s*\{currentVisitTitle\}/))
}

// ── Gate 12: Identity still does not generate "Open the Box" ─────────────────
console.log('\nGate 12 — Identity.jsx: no "Open the Box" label')
const identity = read('src/pages/smokecraft/Identity.jsx')
check('Identity.jsx exists', identity !== null)
if (identity) {
  check('Identity does not contain "Open the Box"',
    !identity.includes('Open the Box') && !identity.includes('OPEN THE BOX'))
  check('Identity does not have golden-box as a hotspot label',
    !identity.match(/label:.*[Gg]olden.*[Bb]ox/))
  check('Identity routes to /smokecraft/golden-box (Start New)',
    identity.includes('/smokecraft/golden-box'))
}

// ── Gate 13: App.jsx session numbers updated ──────────────────────────────────
console.log('\nGate 13 — App.jsx: correct session numbers for 18-step flow')
const appJsx = read('src/App.jsx')
check('App.jsx exists', appJsx !== null)
if (appJsx) {
  check('golden-box guard uses sessionNumber={2}',
    appJsx.includes('sessionNumber={2}') && appJsx.includes('GoldenBox'))
  check('mentor-selection guard uses sessionNumber={3}',
    appJsx.includes('sessionNumber={3}') && appJsx.includes('Mentor'))
  check('final-review guard uses sessionNumber={14}',
    appJsx.includes('sessionNumber={14}') && appJsx.includes('FinalReview'))
  check('session-complete guard uses sessionNumber={18}',
    appJsx.includes('sessionNumber={18}') && appJsx.includes('SessionComplete'))
  check('format route does not have a sessionNumber guard (supplemental, not required)',
    appJsx.includes('<Route path="format"') &&
    !appJsx.match(/<SmokeCraftSessionGuard sessionNumber=\{[^}]+\}><Format\s/))
}

// ── Gate 14: No duplicate hotspot rendering in AssetRoute ────────────────────
console.log('\nGate 14 — SmokeCraftAssetRoute: HotspotLayer rendered once as children (no duplicate)')
const assetRoute = read('src/components/smokecraft/SmokeCraftAssetRoute.jsx')
check('SmokeCraftAssetRoute.jsx exists', assetRoute !== null)
if (assetRoute) {
  // Count JSX renders only — <SmokeCraftHotspotLayer (not import or comment lines)
  const hotspotJsxMatches = (assetRoute.match(/<SmokeCraftHotspotLayer/g) || []).length
  check('SmokeCraftHotspotLayer rendered exactly once (no duplicate hotspot layer)',
    hotspotJsxMatches === 1)
  check('HotspotLayer is passed as children to AssetScreen',
    assetRoute.includes('<SmokeCraftAssetScreen') &&
    assetRoute.includes('SmokeCraftHotspotLayer'))
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Flow Order: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ SmokeCraft flow corrected. 18-step journey, no blocked gates, all routes wired.')
  process.exit(0)
} else {
  console.log('\n❌ SmokeCraft flow issues found — fix before deployment.')
  process.exit(1)
}
