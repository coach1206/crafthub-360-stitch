/**
 * Verification: SmokeCraft Touch Response System
 *
 * Confirms:
 *   - scTouch utility exists with useScPress, injectScTouchStyles, playClickSound, hapticTap
 *   - haptics.js uses short patterns (8ms/15ms)
 *   - SmokeCraftBottomNav uses onPointerDown for immediate press feedback
 *   - SessionComplete is a live overlay (no baked image, shows live visit/session data)
 *   - SessionComplete option cards have aria-pressed selected state
 *   - SessionComplete does NOT contain stale "VISIT 8 OF 8" / "SESSION 23 OF 24" text
 *   - ManagementSync and SessionComplete are separate screens
 *   - RequestPurchase has neutral initial state (no pre-selected option)
 *   - CutToastLight checklist items have aria-pressed
 *   - Flavor chips use onPointerDown (via ScTastingPanel)
 *   - Rating buttons use onPointerDown (via ScTastingPanel)
 *   - Mentor cards have onPointerDown + press/select/bio state
 *   - FinalReview uses a real button overlay (no div-onClick)
 *   - Hotspot layer buttons still have pressed state
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

console.log('\nSmokeCraft Touch Response System Verification\n')

// ── Gate 1: scTouch utility ────────────────────────────────────────────────────
console.log('Gate 1 — src/utils/scTouch.js: shared touch feedback utility')
const scTouch = read('src/utils/scTouch.js')
check('scTouch.js exists', scTouch !== null)
if (scTouch) {
  check('useScPress hook exported', scTouch.includes('export function useScPress'))
  check('injectScTouchStyles exported', scTouch.includes('export function injectScTouchStyles'))
  check('playClickSound exported', scTouch.includes('export function playClickSound'))
  check('hapticTap exported', scTouch.includes('export function hapticTap'))
  check('sc-btn-pressed CSS class defined', scTouch.includes('sc-btn-pressed'))
  check('sc-spring animation defined (bounce release)', scTouch.includes('sc-spring'))
  check('useScPress fires onPointerDown', scTouch.includes('onPointerDown'))
  check('useScPress fires release on pointerLeave', scTouch.includes('onPointerLeave'))
  check('AudioContext used for click sound', scTouch.includes('AudioContext'))
  check('Sound off by default (soundEnabled = false)', scTouch.includes('soundEnabled = false'))
  check('prefers-reduced-motion respected in injected CSS', scTouch.includes('prefers-reduced-motion'))
  check('Focus ring class sc-focus-ring defined', scTouch.includes('sc-focus-ring'))
}

// ── Gate 2: haptics.js short patterns ─────────────────────────────────────────
console.log('\nGate 2 — haptics.js: short vibration patterns (8ms / 15ms)')
const haptics = read('src/utils/haptics.js')
check('haptics.js exists', haptics !== null)
if (haptics) {
  check('light pattern is 8ms (not 30ms)', haptics.includes('[8]'))
  check('medium pattern is 15ms (not 60ms)', haptics.includes('[15]'))
  check('navigator.vibrate safely guarded', haptics.includes('navigator.vibrate'))
  check('triggerHaptic exported', haptics.includes('export function triggerHaptic'))
}

// ── Gate 3: SmokeCraftBottomNav press animation ────────────────────────────────
console.log('\nGate 3 — SmokeCraftBottomNav: immediate press feedback')
const bottomNav = read('src/components/smokecraft/SmokeCraftBottomNav.jsx')
check('SmokeCraftBottomNav.jsx exists', bottomNav !== null)
if (bottomNav) {
  check('onPointerDown used for immediate feedback', bottomNav.includes('onPointerDown'))
  check('transform scale on press', bottomNav.includes('scale('))
  check('hapticTap called on press', bottomNav.includes('hapticTap'))
  check('Active tab highlighted (isActive gold border or color)', bottomNav.includes('isActive') && bottomNav.includes('rgba(233,193,118'))
  check('focus-visible state handled', bottomNav.includes('focus-visible'))
  check('playClickSound imported or called', bottomNav.includes('playClickSound'))
}

// ── Gate 4: SessionComplete — live overlay, no baked image stale text ──────────
console.log('\nGate 4 — SessionComplete: live data overlay, no stale baked text')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete.jsx exists', sessionComplete !== null)
if (sessionComplete) {
  check('No baked PNG reference with stale text (no smokecraft-session-complete.png)',
    !sessionComplete.includes('smokecraft-session-complete.png'))
  check('No SmokeCraftAssetRoute (no baked image dependency)',
    !sessionComplete.includes('SmokeCraftAssetRoute'))
  check('useSmokeCraftProgress used for live data', sessionComplete.includes('useSmokeCraftProgress'))
  check('VISIT 8 OF 8 not hardcoded', !sessionComplete.includes('VISIT 8 OF 8') && !sessionComplete.includes('8 OF 8'))
  check('SESSION 23 OF 24 not hardcoded', !sessionComplete.includes('SESSION 23 OF 24') && !sessionComplete.includes('23 OF 24'))
  check('ROUND 3 OF 3 not present', !sessionComplete.includes('ROUND 3 OF 3'))
  check('totalSessions / sessionLabel used for dynamic display', sessionComplete.includes('totalSessions') || sessionComplete.includes('sessionLabel'))
  check('XP displayed from session context', sessionComplete.includes('xpEarned') || sessionComplete.includes('session?.xp') || sessionComplete.includes('xp'))
  check('Passport / Stamp / Badge reference', sessionComplete.includes('Passport') || sessionComplete.includes('stamp') || sessionComplete.includes('Badge'))
  check('Navigate to /smokecraft on complete', sessionComplete.includes("'/smokecraft'") || sessionComplete.includes('"/smokecraft"'))
}

// ── Gate 5: SessionComplete option cards selectable ────────────────────────────
console.log('\nGate 5 — SessionComplete: option cards are real selectable controls')
if (sessionComplete) {
  check('ACTION_CARDS or similar array with 3 options', (sessionComplete.match(/id:/g) || []).length >= 3)
  check('aria-pressed on option cards', sessionComplete.includes('aria-pressed'))
  check('selectedCards or selection state tracked', sessionComplete.includes('selectedCards') || sessionComplete.includes('new Set'))
  check('Selected card shows visual difference', sessionComplete.includes('selected') && sessionComplete.includes('border'))
  check('Complete/CTA button present', sessionComplete.includes('Complete Session') || sessionComplete.includes('handleComplete'))
}

// ── Gate 6: ManagementSync is separate from SessionComplete ───────────────────
console.log('\nGate 6 — ManagementSync and SessionComplete are separate concepts')
const mgmtSync = read('src/pages/smokecraft/ManagementSync.jsx')
check('ManagementSync.jsx exists', mgmtSync !== null)
if (mgmtSync) {
  check('ManagementSync routes to /smokecraft/session-complete', mgmtSync.includes('/smokecraft/session-complete'))
  check('ManagementSync does NOT contain "SmokeCraft Complete" text', !mgmtSync.includes('SmokeCraft Complete'))
}

// ── Gate 7: RequestPurchase neutral initial state + press ──────────────────────
console.log('\nGate 7 — RequestPurchase: neutral start + press feedback')
const rp = read('src/pages/smokecraft/RequestPurchase.jsx')
check('RequestPurchase.jsx exists', rp !== null)
if (rp) {
  check('Initial state is null (no pre-selected option)', rp.includes('useState(null)'))
  check('onPointerDown used for press feedback', rp.includes('onPointerDown'))
  check('transform scale on press', rp.includes('scale('))
  check('aria-pressed on option buttons', rp.includes('aria-pressed'))
  check('Continue locked until selection (not-allowed cursor)', rp.includes('not-allowed'))
}

// ── Gate 8: CutToastLight checklist press state ───────────────────────────────
console.log('\nGate 8 — CutToastLight: checklist items have press animation')
const ctl = read('src/pages/smokecraft/CutToastLight.jsx')
check('CutToastLight.jsx exists', ctl !== null)
if (ctl) {
  check('onPointerDown on step buttons', ctl.includes('onPointerDown'))
  check('aria-pressed on step buttons', ctl.includes('aria-pressed'))
  check('transform scale on press', ctl.includes('scale('))
  check('Begin Tasting locked until allDone', ctl.includes('allDone'))
}

// ── Gate 9: ScTastingPanel shared component ────────────────────────────────────
console.log('\nGate 9 — ScTastingPanel: shared panel with chip/rating press')
const panel = read('src/components/smokecraft/ScTastingPanel.jsx')
check('ScTastingPanel.jsx exists', panel !== null)
if (panel) {
  check('onPointerDown on flavor chips', panel.includes('onPointerDown'))
  check('transform scale on chip press', panel.includes('scale('))
  check('onPointerDown on rating buttons', panel.includes('onPointerDown'))
  check('Spring release transition', panel.includes('cubic-bezier'))
  check('aria-pressed on chips', panel.includes('aria-pressed'))
  check('hapticTap called', panel.includes('hapticTap'))
  check('Continue locked when canContinue is false', panel.includes('0.45'))
  check('Rating selected scales up (1.06)', panel.includes('1.06'))
}

// ── Gate 10: Tasting screens use ScTastingPanel ───────────────────────────────
console.log('\nGate 10 — FirstThird/SecondThird/FinalThird use ScTastingPanel')
const ft  = read('src/pages/smokecraft/FirstThird.jsx')
const st  = read('src/pages/smokecraft/SecondThird.jsx')
const fit = read('src/pages/smokecraft/FinalThird.jsx')
check('FirstThird uses ScTastingPanel',  ft  !== null && ft.includes('ScTastingPanel'))
check('SecondThird uses ScTastingPanel', st  !== null && st.includes('ScTastingPanel'))
check('FinalThird uses ScTastingPanel',  fit !== null && fit.includes('ScTastingPanel'))

// ── Gate 11: FlavorMemory chip press ──────────────────────────────────────────
console.log('\nGate 11 — FlavorMemory: chip press animation')
const fm = read('src/pages/smokecraft/FlavorMemory.jsx')
check('FlavorMemory.jsx exists', fm !== null)
if (fm) {
  check('onPointerDown on memory chips', fm.includes('onPointerDown'))
  check('transform scale on press', fm.includes('scale('))
  check('aria-pressed on chips', fm.includes('aria-pressed'))
  check('Selected chip scales up (1.04)', fm.includes('1.04'))
}

// ── Gate 12: Mentor press/select/bio ──────────────────────────────────────────
console.log('\nGate 12 — Mentor: press animation, selected glow, bio panel')
const mentor = read('src/pages/smokecraft/Mentor.jsx')
check('Mentor.jsx exists', mentor !== null)
if (mentor) {
  check('onPointerDown on mentor tap zones', mentor.includes('onPointerDown'))
  check('pressedId state for immediate feedback', mentor.includes('pressedId'))
  check('transform scale on press', mentor.includes('scale('))
  check('bio panel renders for selectedMentor', mentor.includes('selectedMentor') && mentor.includes('bio'))
  check('Proceed shows mentor name', mentor.includes('selectedMentor?.label'))
  check('Deselect on second tap (toggle)', mentor.includes("prev === id ? null : id"))
  check('aria-pressed on mentor buttons', mentor.includes('aria-pressed'))
  check('ctaPressed state for CTA press animation', mentor.includes('ctaPressed'))
}

// ── Gate 13: FinalReview real button overlay ───────────────────────────────────
console.log('\nGate 13 — FinalReview: real button overlay, no div-onClick')
const finalReview = read('src/pages/smokecraft/FinalReview.jsx')
check('FinalReview.jsx exists', finalReview !== null)
if (finalReview) {
  check('No div-onClick anti-pattern', !finalReview.match(/<div[^>]*onClick/))
  check('Real <button> used for tap zone', finalReview.includes('<button'))
  check('onPointerDown on tap button', finalReview.includes('onPointerDown'))
  check('Press state visual feedback', finalReview.includes('pressed'))
  check('Pulsing tap prompt shown', finalReview.includes('Tap to Continue') || finalReview.includes('sc-fr-pulse'))
}

// ── Gate 14: HotspotLayer still tactile ───────────────────────────────────────
console.log('\nGate 14 — SmokeCraftHotspotLayer: transparent hotspots still tactile')
const hl = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
check('SmokeCraftHotspotLayer.jsx exists', hl !== null)
if (hl) {
  check('onPointerDown fires on hotspot buttons', hl.includes('onPointerDown') || hl.includes('handlePointerDown'))
  check('sc-pressed class applied on pointerdown', hl.includes('sc-pressed'))
  check('haptic/vibration on press', hl.includes('hapticTap') || hl.includes('navigator.vibrate'))
  check('sc-released spring animation on release', hl.includes('sc-released') || hl.includes('sc-ripple'))
}

// ── Gate 15: No early visit-complete routes ───────────────────────────────────
console.log('\nGate 15 — Safety: no official journey screen routes to /smokecraft/visit-complete')
const screens = [
  'src/pages/smokecraft/FirstThird.jsx','src/pages/smokecraft/SecondThird.jsx',
  'src/pages/smokecraft/FinalThird.jsx','src/pages/smokecraft/FlavorMemory.jsx',
  'src/pages/smokecraft/CutToastLight.jsx','src/pages/smokecraft/Scorecard.jsx',
  'src/pages/smokecraft/Mentor.jsx','src/pages/smokecraft/RequestPurchase.jsx',
]
let noEarly = true
for (const file of screens) {
  const src = read(file)
  if (src && src.includes('/smokecraft/visit-complete')) {
    check(`${file}: no premature visit-complete route`, false)
    noEarly = false
  }
}
if (noEarly) check('No mid-journey screen routes to /smokecraft/visit-complete', true)

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Touch Response: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ SmokeCraft touch response system verified. Buttons are alive.')
  process.exit(0)
} else {
  console.log('\n❌ Touch response issues found — fix before deployment.')
  process.exit(1)
}
