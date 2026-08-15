/**
 * SmokeCraft current touch-response verification.
 *
 * Tests shared interaction primitives and active critical screens. It does not
 * require retired components such as SmokeCraftBottomNav or ScTastingPanel.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
let passed = 0
let failed = 0

function read(rel) {
  const p = resolve(ROOT, rel)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}
function check(label, ok) {
  console.log(`  ${ok ? '✅' : '❌'} ${label}`)
  ok ? passed++ : failed++
}

console.log('\nSmokeCraft Current Touch Response Verification\n')

const scTouch = read('src/utils/scTouch.js')
const haptics = read('src/utils/haptics.js')
const nav = read('src/components/smokecraft/SmokeCraftNavBar.jsx')
const hotspot = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
const landing = read('src/pages/SmokeCraft.jsx')
const identity = read('src/pages/smokecraft/Identity.jsx')
const visitComplete = read('src/pages/smokecraft/VisitComplete.jsx')
const finalReview = read('src/pages/smokecraft/FinalReview.jsx')

console.log('Gate 1 — Shared touch utility')
check('scTouch.js exists', Boolean(scTouch))
if (scTouch) {
  check('useScPress exported', scTouch.includes('export function useScPress'))
  check('Pointer-down feedback supported', scTouch.includes('onPointerDown'))
  check('Pointer-leave release supported', scTouch.includes('onPointerLeave'))
  check('Pressed CSS state defined', scTouch.includes('sc-btn-pressed'))
  check('Spring release state defined', scTouch.includes('sc-spring'))
  check('Reduced-motion preference respected', scTouch.includes('prefers-reduced-motion'))
  check('Keyboard/focus treatment exists', scTouch.includes('sc-focus-ring'))
  check('Optional click sound defaults off', scTouch.includes('soundEnabled = false'))
}

console.log('\nGate 2 — Haptic safety')
check('haptics.js exists', Boolean(haptics))
if (haptics) {
  check('Light haptic is short', haptics.includes('[8]'))
  check('Medium haptic is short', haptics.includes('[15]'))
  check('Vibration API is guarded', haptics.includes('navigator.vibrate'))
  check('triggerHaptic exported', haptics.includes('export function triggerHaptic'))
}

console.log('\nGate 3 — Shared SmokeCraft navigation')
check('SmokeCraftNavBar exists', Boolean(nav))
if (nav) {
  check('Navigation uses real buttons', nav.includes('<button'))
  check('Buttons are at least 48px high', nav.includes('minHeight: 48'))
  check('Touch-action manipulation enabled', nav.includes("touchAction: 'manipulation'"))
  check('Primary action uses medium haptic', nav.includes("triggerHaptic('medium')"))
  check('Secondary action uses light haptic', nav.includes("triggerHaptic('light')"))
  check('Disabled primary action is enforced', nav.includes('disabled={!!primaryDisabled}'))
  check('Disabled primary action cannot invoke callback', nav.includes('if (!primaryDisabled)'))
  check('Interactive child buttons restore pointer events', nav.includes("pointerEvents: 'auto'"))
  check('Safe-area bottom padding exists', nav.includes('safe-area-inset-bottom'))
}

console.log('\nGate 4 — Transparent hotspot controls')
check('SmokeCraftHotspotLayer exists', Boolean(hotspot))
if (hotspot) {
  check('Hotspots use button controls', hotspot.includes('<button'))
  check('Hotspots support pointer down', hotspot.includes('onPointerDown') || hotspot.includes('handlePointerDown'))
  check('Hotspots restore pointer events', hotspot.includes("pointerEvents: 'auto'"))
  check('Pressed state exists', hotspot.includes('sc-pressed'))
  check('Release/ripple state exists', hotspot.includes('sc-released') || hotspot.includes('sc-ripple'))
  check('Haptic feedback exists', hotspot.includes('hapticTap') || hotspot.includes('navigator.vibrate'))
}

console.log('\nGate 5 — Landing and Identity critical actions')
check('SmokeCraft landing exists', Boolean(landing))
if (landing) {
  check('Landing uses real button controls', landing.includes('<button'))
  check('Landing action resolution is centralized', landing.includes('resolveSmokeCraftLandingAction'))
  check('Landing haptic feedback exists', landing.includes('triggerHaptic'))
}
check('Identity exists', Boolean(identity))
if (identity) {
  check('Identity primary action goes through shared NavBar', identity.includes('onPrimary={handleBegin}'))
  check('Identity uses haptic feedback', identity.includes('triggerHaptic'))
  check('Identity prevents double submission', identity.includes('if (submitting) return'))
  check('Identity validation uses aria-invalid', identity.includes('aria-invalid'))
}

console.log('\nGate 6 — Completion and review controls')
check('VisitComplete exists', Boolean(visitComplete))
if (visitComplete) {
  check('Completion CTA is interactive', visitComplete.includes("pointerEvents: 'auto'"))
  check('Completion screen accounts for safe area', visitComplete.includes('safe-area-inset-bottom'))
  check('Completion returns to SmokeCraft hub', visitComplete.includes("navigate('/smokecraft')"))
}
check('FinalReview exists', Boolean(finalReview))
if (finalReview) {
  check('FinalReview avoids div-onClick anti-pattern', !finalReview.match(/<div[^>]*onClick/))
  check('FinalReview uses a real button', finalReview.includes('<button'))
  check('FinalReview has a press visual state', finalReview.includes('pressed'))
}

console.log('\nGate 7 — Safety')
const critical = [landing, identity, visitComplete, finalReview].filter(Boolean).join('\n')
check('No fake payment-live claim in critical controls', !critical.match(/payments?.*live/i))
check('No fake POS-connected claim in critical controls', !critical.match(/pos.*connected/i))

console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Current Touch Response: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed) {
  console.log('\n❌ Current touch-response acceptance failed.')
  process.exit(1)
}
console.log('\n✅ Current touch-response acceptance passed.')
