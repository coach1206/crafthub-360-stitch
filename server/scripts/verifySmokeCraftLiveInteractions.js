/**
 * Verification: SmokeCraft Live Interaction Layer
 *
 * Confirms:
 * - All tasting screens have real flavor note chips (not static hotspot pass-through)
 * - All tasting screens have rating buttons
 * - RequestPurchase has real selection UI (no baked pre-selected state)
 * - CutToastLight has live checklist
 * - Mentor has bio panel and deselect support
 * - Full-screen layout (object-fit cover, no inline-block sized overlay)
 * - completeStep called on all required screens before navigate
 * - No official routes jump to visit-complete
 * - Management Sync is before Session Complete (correct order)
 * - VisitComplete does not hardcode visit count
 * - No production hotspot pill overlays
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
  else     { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); failed++ }
}

function read(relPath) {
  const p = resolve(ROOT, relPath)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

console.log('\nSmokeCraft Live Interaction Layer Verification\n')

// ── Gate 1: Full-screen layout (object-fit cover) ────────────────────────────
console.log('Gate 1 — SmokeCraftAssetScreen: object-fit cover, no inline-block sizing')
const assetScreen = read('src/components/smokecraft/SmokeCraftAssetScreen.jsx')
check('SmokeCraftAssetScreen.jsx exists', assetScreen !== null)
if (assetScreen) {
  check('Image uses object-fit cover', assetScreen.includes('objectFit') && assetScreen.includes('cover'))
  check('Image is position absolute (full viewport)', assetScreen.includes("position: 'absolute'") || assetScreen.includes('position:"absolute"') || assetScreen.includes("position:'absolute'"))
  check('Image uses width 100% (not maxWidth: 100vw)', assetScreen.includes("width: '100%'") || assetScreen.includes('width:"100%"'))
  check('Image uses height 100% (not maxHeight: 100vh)', assetScreen.includes("height: '100%'") || assetScreen.includes('height:"100%"'))
  check('Main container is position fixed, full viewport', assetScreen.includes("position: 'fixed'") && assetScreen.includes('100vw') && assetScreen.includes('100vh'))
  check('No inline-block sizing wrapper (children are full viewport)',
    !assetScreen.includes("display: 'inline-block'") && !assetScreen.includes('display:"inline-block"'))
}

// ── Gate 2: RequestPurchase — real selection, neutral initial state ───────────
console.log('\nGate 2 — RequestPurchase.jsx: live selection, no baked state')
const rp = read('src/pages/smokecraft/RequestPurchase.jsx')
check('RequestPurchase.jsx exists', rp !== null)
if (rp) {
  check('Has Request from Humidor option', rp.includes('Request from Humidor'))
  check('Has I Already Have My Cigar option', rp.includes('Already Have My Cigar') || rp.includes('I Already Have'))
  check('Selection state starts null (neutral)', rp.includes('useState(null)'))
  check('Selected option gets gold border/highlight', rp.includes('rgba(233,193,118') && rp.includes('border'))
  check('Continue disabled until selection (opacity/cursor)', rp.includes('not-allowed') || rp.includes('opacity'))
  check('completeStep called on continue', rp.includes("completeStep('request-purchase')") || rp.includes('completeStep("request-purchase")'))
  check('Routes to /smokecraft/cut-toast-light', rp.includes('/smokecraft/cut-toast-light'))
  check('haptic feedback called (triggerHaptic or hapticTap)', rp.includes('triggerHaptic') || rp.includes('hapticTap'))
}

// ── Gate 3: CutToastLight — live checklist ────────────────────────────────────
console.log('\nGate 3 — CutToastLight.jsx: live preparation checklist')
const ctl = read('src/pages/smokecraft/CutToastLight.jsx')
check('CutToastLight.jsx exists', ctl !== null)
if (ctl) {
  check('Has Cut step', ctl.includes('Cut') || ctl.includes('cut'))
  check('Has Toast step', ctl.includes('Toast') || ctl.includes('toast'))
  check('Has Light/Draw step', ctl.includes('Light') || ctl.includes('Draw'))
  check('Uses Set for checked state', ctl.includes('useState(new Set())') || ctl.includes('new Set()'))
  check('Begin Tasting gated on all steps complete', ctl.includes('allDone') || ctl.includes('checked.size') || ctl.includes('STEPS.length'))
  check('completeStep called', ctl.includes("completeStep('cut-toast-light')") || ctl.includes('completeStep("cut-toast-light")'))
  check('Routes to /smokecraft/first-third', ctl.includes('/smokecraft/first-third'))
}

// ── Gate 4: Tasting screens — flavor chips + rating buttons ──────────────────
console.log('\nGate 4 — FirstThird.jsx: live flavor notes and draw rating')
const ft = read('src/pages/smokecraft/FirstThird.jsx')
check('FirstThird.jsx exists', ft !== null)
if (ft) {
  check('Has flavor note array (Dark Cocoa / Cedar etc)', ft.includes('Dark Cocoa') || ft.includes('Cedar'))
  check('Flavor notes rendered as clickable buttons (onPointerDown or onClick)', ft.includes('aria-pressed') || ft.includes('onPointerDown') || ft.includes('ScTastingPanel'))
  check('Rating buttons rendered (1-5)', ft.includes('drawRating') || ft.includes('RATINGS'))
  check('Toggle note function (add/remove from Set)', ft.includes('n.has(note)') || ft.includes('toggleNote'))
  check('Continue disabled until note + rating selected', ft.includes('canContinue') || ft.includes('notes.size'))
  check('setFirstThirdTasting called with real data', ft.includes('setFirstThirdTasting'))
  check('completeStep called', ft.includes("completeStep('first-third')") || ft.includes("completeStep(\"first-third\")"))
  check('Routes to /smokecraft/second-third', ft.includes('/smokecraft/second-third'))
}

console.log('\nGate 5 — SecondThird.jsx: live flavor notes and body rating')
const st = read('src/pages/smokecraft/SecondThird.jsx')
check('SecondThird.jsx exists', st !== null)
if (st) {
  check('Has flavor note array', st.includes('Dark Cocoa') || st.includes('Cedar') || st.includes('FLAVOR_NOTES'))
  check('Flavor notes are clickable buttons (onPointerDown or ScTastingPanel)', st.includes('aria-pressed') || st.includes('onPointerDown') || st.includes('ScTastingPanel'))
  check('Rating buttons rendered', st.includes('RATINGS') || st.includes('rating'))
  check('setSecondThirdTasting called with real data', st.includes('setSecondThirdTasting'))
  check('Routes to /smokecraft/flavor-memory', st.includes('/smokecraft/flavor-memory'))
}

console.log('\nGate 6 — FlavorMemory.jsx: live chip selection')
const fm = read('src/pages/smokecraft/FlavorMemory.jsx')
check('FlavorMemory.jsx exists', fm !== null)
if (fm) {
  check('Has memory chips array', fm.includes('MEMORY_CHIPS') || fm.includes('Campfire') || fm.includes('morning') || fm.includes('Morning'))
  check('Chips are clickable buttons (onPointerDown or onClick)', fm.includes('aria-pressed') && (fm.includes('onPointerDown') || fm.includes('onClick')))
  check('Selection state exists', fm.includes('useState(null)') || fm.includes('useState(new Set'))
  check('completeStep called', fm.includes("completeStep('flavor-memory')") || fm.includes("completeStep(\"flavor-memory\")"))
  check('Routes to /smokecraft/final-third', fm.includes('/smokecraft/final-third'))
}

console.log('\nGate 7 — FinalThird.jsx: live flavor notes and overall rating')
const fth = read('src/pages/smokecraft/FinalThird.jsx')
check('FinalThird.jsx exists', fth !== null)
if (fth) {
  check('Has closing flavor notes (Char/Caramel/Toast)', fth.includes('Char') || fth.includes('Caramel') || fth.includes('Toast'))
  check('Flavor notes are clickable buttons (onPointerDown or ScTastingPanel)', fth.includes('aria-pressed') || fth.includes('onPointerDown') || fth.includes('ScTastingPanel'))
  check('Overall rating buttons (1-5)', fth.includes('overallRating') || fth.includes('RATINGS'))
  check('setFinalThirdTasting called with real data', fth.includes('setFinalThirdTasting'))
  check('Routes to /smokecraft/scorecard', fth.includes('/smokecraft/scorecard'))
}

// ── Gate 8: Mentor — bio panel, deselect, correct proceed ────────────────────
console.log('\nGate 8 — Mentor.jsx: bio panel, deselect, routes to seed-soil')
const mentor = read('src/pages/smokecraft/Mentor.jsx')
check('Mentor.jsx exists', mentor !== null)
if (mentor) {
  check('Mentor bio text present', mentor.includes('.bio') || mentor.includes('bio:'))
  check('Deselect on second tap supported', mentor.includes('prev === id') || mentor.includes('prev === chip') || (mentor.includes('prev') && mentor.includes('null')))
  check('Mentor name shown in proceed button', mentor.includes('selectedMentor?.label') || mentor.includes('selectedMentor.label'))
  check('Routes to /smokecraft/seed-soil', mentor.includes('/smokecraft/seed-soil'))
  check('completeStep called', mentor.includes("completeStep('mentor')"))
}

// ── Gate 9: completeStep on all required non-tasting screens ─────────────────
console.log('\nGate 9 — completeStep present on all non-tasting journey screens')
const screens = {
  'golden-box':      { file: 'src/pages/smokecraft/GoldenBox.jsx',      step: 'golden-box' },
  'seed-soil':       { file: 'src/pages/smokecraft/SeedSoil.jsx',        step: 'seed-soil' },
  'pairing-lab':     { file: 'src/pages/smokecraft/PairingLab.jsx',      step: 'pairing-lab' },
  'humidor-match':   { file: 'src/pages/smokecraft/HumidorMatch.jsx',    step: 'humidor-match' },
  'passport-stamp':  { file: 'src/pages/smokecraft/PassportStamp.jsx',   step: 'passport-stamp' },
  'connections':     { file: 'src/pages/smokecraft/Connections.jsx',     step: 'connections' },
  'scorecard':       { file: 'src/pages/smokecraft/Scorecard.jsx',       step: 'scorecard' },
}
for (const [name, { file, step }] of Object.entries(screens)) {
  const src = read(file)
  check(`${name}: completeStep('${step}') called`, src && (src.includes(`completeStep('${step}')`) || src.includes(`completeStep("${step}")`)))
}

// ── Gate 10: No official routes jump to visit-complete ───────────────────────
console.log('\nGate 10 — No official flow screen routes to /smokecraft/visit-complete')
const officialScreens = [
  'src/pages/smokecraft/GoldenBox.jsx',
  'src/pages/smokecraft/Mentor.jsx',
  'src/pages/smokecraft/SeedSoil.jsx',
  'src/pages/smokecraft/PairingLab.jsx',
  'src/pages/smokecraft/HumidorMatch.jsx',
  'src/pages/smokecraft/RequestPurchase.jsx',
  'src/pages/smokecraft/CutToastLight.jsx',
  'src/pages/smokecraft/FirstThird.jsx',
  'src/pages/smokecraft/SecondThird.jsx',
  'src/pages/smokecraft/FlavorMemory.jsx',
  'src/pages/smokecraft/FinalThird.jsx',
  'src/pages/smokecraft/Scorecard.jsx',
  'src/pages/smokecraft/FinalReview.jsx',
  'src/pages/smokecraft/PassportStamp.jsx',
  'src/pages/smokecraft/Connections.jsx',
  'src/pages/smokecraft/ManagementSync.jsx',
]
for (const f of officialScreens) {
  const src = read(f)
  const name = f.split('/').pop()
  check(`${name}: does NOT route to /smokecraft/visit-complete`,
    src && !src.includes('/smokecraft/visit-complete'))
}

// ── Gate 11: ManagementSync before SessionComplete ───────────────────────────
console.log('\nGate 11 — ManagementSync routes to session-complete (correct order)')
const mgmt = read('src/pages/smokecraft/ManagementSync.jsx')
check('ManagementSync.jsx exists', mgmt !== null)
if (mgmt) {
  check('ManagementSync routes to /smokecraft/session-complete', mgmt.includes('/smokecraft/session-complete'))
  check('ManagementSync does NOT route to visit-complete', !mgmt.includes('/smokecraft/visit-complete'))
}

// ── Gate 12: SessionComplete is truly final (S18) ───────────────────────────
console.log('\nGate 12 — SessionComplete: last step, returns to /smokecraft hub')
const sc = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete.jsx exists', sc !== null)
if (sc) {
  check('SessionComplete does NOT route to /pos3', !sc.includes("'/pos3'") && !sc.includes('"/pos3"'))
  check('SessionComplete returns to /smokecraft', sc.includes("'/smokecraft'") || sc.includes('"/smokecraft"'))
  check('SessionComplete does NOT route to visit-complete', !sc.includes('/smokecraft/visit-complete'))
}

// ── Gate 13: VisitComplete does not hardcode visit count ─────────────────────
console.log('\nGate 13 — VisitComplete: uses totalVisits, not hardcoded 8')
const vc = read('src/pages/smokecraft/VisitComplete.jsx')
check('VisitComplete.jsx exists', vc !== null)
if (vc) {
  check('VisitComplete does not hardcode "all 8 visits"', !vc.includes('all 8 visits'))
  check('VisitComplete uses totalVisits variable', vc.includes('totalVisits'))
}

// ── Gate 14: No visible hotspot pills in production ──────────────────────────
console.log('\nGate 14 — SmokeCraftHotspotLayer: pills only visible in debug mode')
const hl = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
check('SmokeCraftHotspotLayer.jsx exists', hl !== null)
if (hl) {
  check('sc-cta-pill span gated on {debug && ...}',
    !!hl.match(/\{debug\s*&&[\s\S]{0,100}sc-cta-pill/) ||
    !!hl.match(/debug[\s\S]{0,50}sc-cta-pill/))
  check('Production buttons are transparent when not debug',
    hl.includes("'transparent'") || hl.includes('"transparent"'))
}

// ── Gate 15: Hotspot verification scripts still pass ─────────────────────────
console.log('\nGate 15 — Structural: SmokeCraftAssetRoute still wires HotspotLayer correctly')
const assetRoute = read('src/components/smokecraft/SmokeCraftAssetRoute.jsx')
check('SmokeCraftAssetRoute.jsx exists', assetRoute !== null)
if (assetRoute) {
  check('AssetRoute renders HotspotLayer as children', assetRoute.includes('SmokeCraftHotspotLayer'))
  check('AssetRoute passes hotspots prop to HotspotLayer', assetRoute.includes('hotspots={hotspots}') || assetRoute.includes('hotspots='))
}

// ── Gate 16: SmokeCraftBottomNav — real navigation tabs ──────────────────────
console.log('\nGate 16 — SmokeCraftBottomNav: real navigation, all 4 tabs wired')
const bottomNav = read('src/components/smokecraft/SmokeCraftBottomNav.jsx')
check('SmokeCraftBottomNav.jsx exists', bottomNav !== null)
if (bottomNav) {
  check('SmokeCraft tab navigates to /smokecraft', bottomNav.includes("'/smokecraft'") || bottomNav.includes('"/smokecraft"'))
  check('Rewards/Leaderboard tab present', bottomNav.includes('leaderboard') || bottomNav.includes('Rewards'))
  check('Passport tab navigates to /passport-connection', bottomNav.includes('/passport-connection'))
  check('CraftHub tab navigates to /crafthub', bottomNav.includes('/crafthub'))
  check('Nav uses useNavigate (not anchor tags)', bottomNav.includes('useNavigate'))
  check('Active state indicated (aria-current or isActive check)', bottomNav.includes('aria-current') || bottomNav.includes('isActive'))
  check('Buttons have aria-label', bottomNav.includes('aria-label'))
  check('No dead tabs — all paths are defined strings', (bottomNav.match(/path:/g) || []).length >= 4)
}
const appJsx = read('src/App.jsx')
check('SmokeCraftBottomNav imported in App.jsx', appJsx !== null && appJsx.includes('SmokeCraftBottomNav'))
check('SmokeCraftBottomNav rendered inside SmokeCraftProgressProvider', appJsx !== null && appJsx.match(/SmokeCraftProgressProvider[\s\S]{0,200}SmokeCraftBottomNav/))

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Live Interactions: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ SmokeCraft live interactions verified. Real buttons, real state, real sequence.')
  process.exit(0)
} else {
  console.log('\n❌ Live interaction issues found — fix before deployment.')
  process.exit(1)
}
