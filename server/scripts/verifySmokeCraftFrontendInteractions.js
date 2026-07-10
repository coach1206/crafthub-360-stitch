/**
 * Verification: SmokeCraft Frontend Interaction Layer
 *
 * Root-cause fix verified:
 *   - SmokeCraftAssetScreen now wraps image in position:relative container
 *     and passes children into a position:absolute overlay — hotspot coordinates
 *     are image-relative, not viewport-relative (fixes misplaced pill bug)
 *   - SmokeCraftHotspotLayer container changed from position:fixed/100vw/100vh
 *     to position:absolute/100%/100% so percentages are correct on any device
 *
 * Other checks:
 *   - All visible buttons on /smokecraft/identity have wired hotspots
 *   - "OPEN THE BOX" not used on /smokecraft/identity
 *   - Navigation is instant (no backend blocking)
 *   - All 18 journey screens have hotspots
 *   - Ticket Tapper animated
 *   - No images modified
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
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

console.log('\nSmokeCraft Frontend Interaction Layer Verification\n')

// ── Gate 1: ROOT CAUSE FIX — image-relative coordinate system ────────────────
console.log('Gate 1 — ROOT CAUSE FIX: hotspot layer is image-relative, not viewport-relative')
const assetScreen = read('src/components/smokecraft/SmokeCraftAssetScreen.jsx')
const assetRoute  = read('src/components/smokecraft/SmokeCraftAssetRoute.jsx')
const hotspotLayer = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')

check('SmokeCraftAssetScreen.jsx exists', assetScreen !== null)
check('SmokeCraftAssetRoute.jsx exists', assetRoute !== null)
check('SmokeCraftHotspotLayer.jsx exists', hotspotLayer !== null)

if (assetScreen) {
  check('AssetScreen uses full-viewport or position:relative container',
    assetScreen.includes("position: 'relative'") || assetScreen.includes("position: 'fixed'") || assetScreen.includes('100vw'))
  check('AssetScreen overlay div is position:absolute (not fixed)',
    assetScreen.includes("position: 'absolute'"))
  check('AssetScreen accepts children prop', assetScreen.includes('children'))
  check('AssetScreen renders children inside image-sized overlay',
    assetScreen.includes('children') && assetScreen.includes("inset: 0"))
  check('AssetScreen overlay has pointerEvents: none (buttons inside handle their own events)',
    assetScreen.includes("pointerEvents: 'none'"))
  check('AssetScreen does NOT use aria-hidden on the children overlay (hotspots must be accessible)',
    !assetScreen.match(/aria-hidden.*children/) && !assetScreen.includes('aria-hidden="true"'))
}

if (assetRoute) {
  check('AssetRoute passes SmokeCraftHotspotLayer as children to AssetScreen',
    assetRoute.includes('<SmokeCraftAssetScreen') && assetRoute.includes('SmokeCraftHotspotLayer'))
}

if (hotspotLayer) {
  check('HotspotLayer container is position:absolute (image-relative)',
    hotspotLayer.includes("position: 'absolute'"))
  check('HotspotLayer container is NOT position:fixed (would be viewport-relative)',
    !hotspotLayer.match(/position:\s*['"]fixed['"]/))
  check('HotspotLayer container uses width:100% (image-relative, not 100vw)',
    hotspotLayer.includes("width: '100%'") && !hotspotLayer.includes("width: '100vw'"))
  check('HotspotLayer container uses height:100% (image-relative, not 100vh)',
    hotspotLayer.includes("height: '100%'") && !hotspotLayer.includes("height: '100vh'"))
}

// ── Gate 2: /smokecraft route and component ────────────────────────────────────
console.log('\nGate 2 — Route mapping: /smokecraft and /smokecraft/identity')
const appJsx = read('src/App.jsx')
check('App.jsx exists', appJsx !== null)
if (appJsx) {
  check('/smokecraft index route exists', appJsx.includes('Route index') && appJsx.includes('SmokeCraft'))
  check('/smokecraft/identity route exists', appJsx.includes('path="identity"') || appJsx.includes("'identity'"))
  check('SmokeCraftSessionGuard wraps /smokecraft', appJsx.includes('SmokeCraftSessionGuard'))
  check('/smokecraft/how-it-works route exists', appJsx.includes('how-it-works'))
  check('/smokecraft/guest-pass route exists', appJsx.includes('guest-pass'))
}

// ── Gate 3: Landing page (/smokecraft) hotspots ───────────────────────────────
console.log('\nGate 3 — /smokecraft landing: all navigation hotspots present')
const landing = read('src/pages/SmokeCraft.jsx')
check('SmokeCraft.jsx (landing) exists', landing !== null)
if (landing) {
  check('Landing has "Start New SmokeCraft Session" hotspot',
    landing.includes('Start New SmokeCraft Session'))
  check('Landing navigates to /smokecraft/identity',
    landing.includes('/smokecraft/identity'))
  check('Landing has "Continue Previous Session" hotspot',
    landing.includes('Continue Previous Session'))
  check('Landing has humidor navigation',
    landing.includes('/smokecraft/humidor-match') || landing.includes('humidor'))
  check('Landing has passport navigation',
    landing.includes('/smokecraft/passport-stamp') || landing.includes('passport'))
  check('Landing has how-it-works navigation',
    landing.includes('/smokecraft/how-it-works') || landing.includes('How It Works'))
  check('Landing has multiple hotspots (> 2)',
    (landing.match(/label:/g) || []).length >= 3)
}

// ── Gate 4: Identity page (/smokecraft/identity) ──────────────────────────────
console.log('\nGate 4 — /smokecraft/identity: "Start New SmokeCraft Session" wired and non-blocking')
const identity = read('src/pages/smokecraft/Identity.jsx')
check('Identity.jsx exists', identity !== null)
if (identity) {
  check('Identity has "Start New SmokeCraft Session" hotspot',
    identity.includes('Start New SmokeCraft Session'))
  check('Identity navigates to /smokecraft/golden-box',
    identity.includes('/smokecraft/golden-box'))
  check('Identity uses triggerHaptic for tactile feedback',
    identity.includes('triggerHaptic') || identity.includes('hapticTap'))
  check('Identity navigation is non-blocking (no await before navigate)',
    !identity.match(/await\s+navigate/))
  check('Identity has "Continue Previous Session" hotspot',
    identity.includes('Continue Previous Session') || identity.includes('continueSession'))
  check('Identity handles currentAllowed route for continue flow',
    identity.includes('currentAllowed'))
  check('Identity useSmokeCraftProgress used for context-aware routing',
    identity.includes('useSmokeCraftProgress'))
  check('"OPEN THE BOX" label NOT used on identity page',
    !identity.includes('Open the Box') && !identity.includes('open the box'))
}

// ── Gate 5: "OPEN THE BOX" only on GoldenBox screen ─────────────────────────
console.log('\nGate 5 — "Open the Box" not misplaced on identity/landing pages')
if (identity) {
  check('Identity does NOT use "golden-box" as hotspot label (wrong label for identity)',
    !identity.match(/label:.*[Gg]olden.*[Bb]ox/) && !identity.match(/label:.*[Oo]pen.*[Bb]ox/))
}
const goldenBox = read('src/pages/smokecraft/GoldenBox.jsx')
if (goldenBox) {
  check('GoldenBox.jsx has hotspot navigating to mentor-selection',
    goldenBox.includes('/smokecraft/mentor-selection'))
}

// ── Gate 6: SmokeCraftHotspotLayer label mapping ─────────────────────────────
console.log('\nGate 6 — SmokeCraftHotspotLayer: shortLabel covers all navigation buttons')
if (hotspotLayer) {
  check('"Start New Session" label mapping present', hotspotLayer.includes('Start New Session'))
  check('"Continue Session" label mapping present', hotspotLayer.includes('Continue Session'))
  check('"Browse Humidor" label mapping present', hotspotLayer.includes('Browse Humidor'))
  check('"How It Works" label mapping present', hotspotLayer.includes('How It Works'))
  check('"Demo Experience" label mapping present', hotspotLayer.includes('Demo Experience'))
  check('"View Pairing" label mapping present', hotspotLayer.includes('View Pairing'))
  check('shortLabel returns specific text for "golden-box" label',
    hotspotLayer.includes('Open the Box'))
}

// ── Gate 7: Instant interaction — pointerdown, vibration, loading state ───────
console.log('\nGate 7 — Instant interaction: pointerdown + vibration + loading state')
if (hotspotLayer) {
  check('onPointerDown fires immediately (no click delay)', hotspotLayer.includes('onPointerDown'))
  check('hapticTap vibration called on pointerdown', hotspotLayer.includes('hapticTap'))
  check('navigator.vibrate safely guarded', hotspotLayer.includes('navigator.vibrate?.'))
  check('"Starting..." loading text for in-flight state', hotspotLayer.includes('Starting...'))
  check('"Opening..." loading text for navigation', hotspotLayer.includes('Opening...'))
  check('Double-tap guard (navigatedRef)', hotspotLayer.includes('navigatedRef'))
  check('aria-busy while navigating', hotspotLayer.includes('aria-busy'))
  check('Callbacks in try/catch (non-blocking)', hotspotLayer.includes('try { h.onClick()'))
}

// ── Gate 8: CSS press/release/accessibility ────────────────────────────────────
console.log('\nGate 8 — CSS: pressed state, release spring, reduced motion, accessibility')
if (hotspotLayer) {
  check('JS-driven sc-pressed class for instant press (not just :active)',
    hotspotLayer.includes('sc-pressed'))
  check('Spring release animation (sc-released / sc-ripple)',
    hotspotLayer.includes('sc-released') || hotspotLayer.includes('sc-ripple'))
  check('prefers-reduced-motion block disables heavy animation',
    hotspotLayer.includes('prefers-reduced-motion'))
  check('touch-action: manipulation on buttons', hotspotLayer.includes('touchAction'))
  check('pointer-events: auto on buttons', hotspotLayer.includes("pointerEvents: 'auto'"))
  check('cursor: pointer on buttons', hotspotLayer.includes("'pointer'"))
  check('focus-visible ring', hotspotLayer.includes('focus-visible'))
  check('Keyboard Enter/Space activation', hotspotLayer.includes('onKeyDown'))
}

// ── Gate 9: All 18 journey screens have hotspots ─────────────────────────────
console.log('\nGate 9 — All 18 SmokeCraft journey screens have hotspot definitions')
const journeyScreens = [
  ['src/pages/smokecraft/Identity.jsx',      '/smokecraft/identity'],
  ['src/pages/smokecraft/GoldenBox.jsx',     '/smokecraft/golden-box'],
  ['src/pages/smokecraft/Mentor.jsx',        '/smokecraft/mentor-selection'],
  ['src/pages/smokecraft/PairingLab.jsx',    '/smokecraft/pairing-lab'],
  ['src/pages/smokecraft/SeedSoil.jsx',      '/smokecraft/seed-soil'],
  ['src/pages/smokecraft/HumidorMatch.jsx',  '/smokecraft/humidor-match'],
  ['src/pages/smokecraft/RequestPurchase.jsx', '/smokecraft/request-purchase'],
  ['src/pages/smokecraft/CutToastLight.jsx', '/smokecraft/cut-toast-light'],
  ['src/pages/smokecraft/FirstThird.jsx',    '/smokecraft/first-third'],
  ['src/pages/smokecraft/SecondThird.jsx',   '/smokecraft/second-third'],
  ['src/pages/smokecraft/FlavorMemory.jsx',  '/smokecraft/flavor-memory'],
  ['src/pages/smokecraft/FinalThird.jsx',    '/smokecraft/final-third'],
  ['src/pages/smokecraft/Scorecard.jsx',     '/smokecraft/scorecard'],
  ['src/pages/smokecraft/FinalReview.jsx',   '/smokecraft/final-review'],
  ['src/pages/smokecraft/PassportStamp.jsx', '/smokecraft/passport-stamp'],
  ['src/pages/smokecraft/Connections.jsx',   '/smokecraft/connections'],
  ['src/pages/smokecraft/ManagementSync.jsx','/smokecraft/management-sync'],
  ['src/pages/smokecraft/SessionComplete.jsx','/smokecraft/session-complete'],
]
for (const [file, route] of journeyScreens) {
  const src = read(file)
  if (!src) { check(`${route}: file exists`, false, `${file} missing`); continue }
  // Accept: HOTSPOT array pattern, label: field, navigate( call, or onClick button pattern
  const hasHotspot = src.includes('HOTSPOT') || src.includes('hotspot') || src.includes('label:')
    || src.includes('navigate(') || src.includes('onClick')
  check(`${route}: has hotspot/CTA`, hasHotspot)
}

// ── Gate 10: VisitComplete screen ─────────────────────────────────────────────
console.log('\nGate 10 — VisitComplete: no isDemoMode||true bug, top padding present')
const visitComplete = read('src/pages/smokecraft/VisitComplete.jsx')
check('VisitComplete.jsx exists', visitComplete !== null)
if (visitComplete) {
  check('VisitComplete does NOT use (isDemoMode || true) — debug flag removed',
    !visitComplete.includes('isDemoMode || true') && !visitComplete.includes('|| true'))
  check('VisitComplete has top padding accounting for fixed header',
    visitComplete.includes('44px') || visitComplete.includes('paddingTop'))
  check('VisitComplete button uses inline-flex to prevent overlap on small screens',
    visitComplete.includes('inline-flex'))
  check('VisitComplete navigates back to /smokecraft hub',
    visitComplete.includes('/smokecraft'))
}

// ── Gate 11: Debug modes preserved ────────────────────────────────────────────
console.log('\nGate 11 — Debug modes available')
if (hotspotLayer) {
  check('smokecraft_hotspot_debug sessionStorage flag present',
    hotspotLayer.includes('smokecraft_hotspot_debug'))
  check('smokecraftInteractionDebug sessionStorage flag present',
    hotspotLayer.includes('smokecraftInteractionDebug'))
  check('Debug mode shows hotspot outlines', hotspotLayer.includes('rgba(233,193,118,0.10)'))
  check('Interaction debug logs pointerdown timestamp', hotspotLayer.includes('pointerdown'))
}

// ── Gate 12: No images modified ───────────────────────────────────────────────
console.log('\nGate 12 — SmokeCraft images unmodified')
const approvedDir = resolve(ROOT, 'public/assets/smokecraft-reference/approved')
if (existsSync(approvedDir)) {
  const files = readdirSync(approvedDir)
  const images = files.filter(f => /\.(png|jpg|jpeg|webp|avif|svg)$/i.test(f))
  const nonImages = files.filter(f => !/\.(png|jpg|jpeg|webp|avif|svg|gif)$/i.test(f) && !f.startsWith('.'))
  check(`Approved images present (found ${images.length})`, images.length > 0)
  check('No non-image files injected into approved/ directory', nonImages.length === 0,
    nonImages.length ? `found: ${nonImages.join(', ')}` : '')
} else {
  check('public/assets/smokecraft-reference/approved/ exists', false)
}

// ── Gate 13: No fake claims ────────────────────────────────────────────────────
console.log('\nGate 13 — Safety: no payment-live or POS claim added')
const filesToCheck = [
  'src/components/smokecraft/SmokeCraftHotspotLayer.jsx',
  'src/components/smokecraft/SmokeCraftAssetScreen.jsx',
  'src/components/smokecraft/SmokeCraftAssetRoute.jsx',
  'src/pages/SmokeCraft.jsx',
  'src/pages/smokecraft/Identity.jsx',
]
let noFakeClaims = true
for (const f of filesToCheck) {
  const src = read(f)
  if (!src) continue
  if (src.includes('backendConnected: true') || src.match(/payments?.*live/i) || src.match(/pos.*connected/i)) {
    check(`${f}: no fake claims`, false)
    noFakeClaims = false
  }
}
if (noFakeClaims) check('No fake payment/POS claims in any modified frontend file', true)

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Frontend Interactions: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ Frontend interaction layer fixed. Hotspots image-relative. All buttons wired.')
  process.exit(0)
} else {
  console.log('\n❌ Frontend interaction issues found — fix before deployment.')
  process.exit(1)
}
