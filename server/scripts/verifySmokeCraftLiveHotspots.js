/**
 * Verification: SmokeCraft Live Hotspot / CTA UX
 *
 * Supports the current mixed architecture:
 * - approved image-shell screens using SmokeCraftHotspotLayer
 * - migrated live-DOM screens using real button controls
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
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

console.log('\nSmokeCraft Live CTA Verification\n')

console.log('Gate 1 — SmokeCraftHotspotLayer: visible affordance & accessibility')
const hotspotLayer = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
check('SmokeCraftHotspotLayer.jsx exists', hotspotLayer !== null)
if (hotspotLayer) {
  check('pointerEvents auto on hotspot buttons', hotspotLayer.includes("pointerEvents: 'auto'"))
  check('cursor pointer on hotspot buttons', hotspotLayer.includes("cursor: 'pointer'") || hotspotLayer.includes("'pointer'"))
  check('aria-label applied to hotspot buttons', hotspotLayer.includes('aria-label={h.label}'))
  check('hotspot container remains above image', hotspotLayer.includes('zIndex: 10'))
  check('visible CTA pill rendered', hotspotLayer.includes('sc-cta-pill'))
  check('pulse affordance defined', hotspotLayer.includes('sc-pulse'))
  check('hover state defined', hotspotLayer.includes(':hover .sc-cta-pill'))
  check('active/press state defined', hotspotLayer.includes(':active .sc-cta-pill'))
  check('focus-visible outline present', hotspotLayer.includes('focus-visible'))
  check('touchAction manipulation set', hotspotLayer.includes("touchAction: 'manipulation'"))
  check('debug mode flag retained', hotspotLayer.includes('smokecraft_hotspot_debug'))
  check('backdrop blur retained for label legibility', hotspotLayer.includes('backdrop-filter'))
}

console.log('\nGate 2 — SmokeCraftAssetRoute wires image-shell hotspots')
const assetRoute = read('src/components/smokecraft/SmokeCraftAssetRoute.jsx')
check('SmokeCraftAssetRoute.jsx exists', assetRoute !== null)
if (assetRoute) {
  check('AssetRoute renders SmokeCraftHotspotLayer', assetRoute.includes('SmokeCraftHotspotLayer'))
  check('AssetRoute passes hotspots prop', assetRoute.includes('hotspots={hotspots}'))
}

console.log('\nGate 3 — All 18 journey screens expose a real CTA/control')
const screens = [
  ['src/pages/smokecraft/Identity.jsx', '/smokecraft/identity'],
  ['src/pages/smokecraft/GoldenBox.jsx', '/smokecraft/golden-box'],
  ['src/pages/smokecraft/Mentor.jsx', '/smokecraft/mentor-selection'],
  ['src/pages/smokecraft/PairingLab.jsx', '/smokecraft/pairing-lab'],
  ['src/pages/smokecraft/SeedSoil.jsx', '/smokecraft/seed-soil'],
  ['src/pages/smokecraft/HumidorMatch.jsx', '/smokecraft/humidor-match'],
  ['src/pages/smokecraft/RequestPurchase.jsx', '/smokecraft/request-purchase'],
  ['src/pages/smokecraft/CutToastLight.jsx', '/smokecraft/cut-toast-light'],
  ['src/pages/smokecraft/FirstThird.jsx', '/smokecraft/first-third'],
  ['src/pages/smokecraft/SecondThird.jsx', '/smokecraft/second-third'],
  ['src/pages/smokecraft/FlavorMemory.jsx', '/smokecraft/flavor-memory'],
  ['src/pages/smokecraft/FinalThird.jsx', '/smokecraft/final-third'],
  ['src/pages/smokecraft/Scorecard.jsx', '/smokecraft/scorecard'],
  ['src/pages/smokecraft/FinalReview.jsx', '/smokecraft/final-review'],
  ['src/pages/smokecraft/PassportStamp.jsx', '/smokecraft/passport-stamp'],
  ['src/pages/smokecraft/Connections.jsx', '/smokecraft/connections'],
  ['src/pages/smokecraft/ManagementSync.jsx', '/smokecraft/management-sync'],
  ['src/pages/smokecraft/SessionComplete.jsx', '/smokecraft/session-complete'],
]
for (const [file, route] of screens) {
  const src = read(file)
  if (!src) { check(`${route}: file exists`, false, `${file} not found`); continue }
  const hasControl = src.includes('SmokeCraftHotspotLayer') || src.includes('SmokeCraftAssetRoute') || src.includes('<button') || src.includes('SmokeCraftNavBar') || src.includes('navigate(')
  check(`${route}: has real CTA/control`, hasControl)
}

console.log('\nGate 4 — Golden Box migrated live-DOM progression')
const goldenBox = read('src/pages/smokecraft/GoldenBox.jsx')
check('GoldenBox exists', Boolean(goldenBox))
if (goldenBox) {
  check('GoldenBox is a live-DOM screen', goldenBox.includes('<SmokeCraftScreenShell mode="live"'))
  check('GoldenBox uses a real acknowledgement checkbox', goldenBox.includes('type="checkbox"') && goldenBox.includes('checked={acknowledged}'))
  check('GoldenBox persists acknowledgement into journey state', goldenBox.includes('setGoldenBox({ acknowledged })'))
  check('GoldenBox Continue is gated by acknowledgement', goldenBox.includes('disabled={!acknowledged}') && goldenBox.includes('if (!acknowledged) return'))
  check('GoldenBox Continue has accessible mentor label', goldenBox.includes('aria-label="Continue to Mentor Selection"'))
  check('GoldenBox navigates through canonical mentor registry destination', goldenBox.includes('navigate(NAV.MENTOR)'))
  check('GoldenBox uses haptic feedback', goldenBox.includes("triggerHaptic('medium')") && goldenBox.includes("triggerHaptic('light')"))
  check('GoldenBox awards journey rewards before progression', goldenBox.includes("awardSessionRewards('golden-box')"))
  check('GoldenBox does not depend on obsolete HOTSPOTS array', !goldenBox.includes('const HOTSPOTS'))
}

console.log('\nGate 5 — Key screens expose named controls')
const pairingLab = read('src/pages/smokecraft/PairingLab.jsx')
check('PairingLab has a CTA/control', Boolean(pairingLab && (pairingLab.includes('label:') || pairingLab.includes('navigate(') || pairingLab.includes('onClick') || pairingLab.includes('<button'))))
const finalReview = read('src/pages/smokecraft/FinalReview.jsx')
check('FinalReview has a CTA/control', Boolean(finalReview && (finalReview.includes('label:') || finalReview.includes('navigate(') || finalReview.includes('onClick') || finalReview.includes('<button'))))
const requestPurchase = read('src/pages/smokecraft/RequestPurchase.jsx')
check('RequestPurchase has a CTA/control', Boolean(requestPurchase && (requestPurchase.includes('label:') || requestPurchase.includes('navigate(') || requestPurchase.includes('onClick') || requestPurchase.includes('<button'))))

console.log('\nGate 6 — SmokeCraft approved assets remain intact')
const approvedDir = resolve(ROOT, 'public/assets/smokecraft-reference/approved')
const refDir = resolve(ROOT, 'public/assets/smokecraft-reference')
if (existsSync(approvedDir)) {
  const approvedFiles = readdirSync(approvedDir).filter(f => /\.(png|jpg|jpeg|webp|avif|svg)$/i.test(f))
  check(`Approved SmokeCraft images present (found ${approvedFiles.length})`, approvedFiles.length > 0)
  const nonImages = readdirSync(approvedDir).filter(f => {
    if (f.startsWith('.')) return false
    const full = resolve(approvedDir, f)
    try { if (statSync(full).isDirectory()) return false } catch { return false }
    return !/\.(png|jpg|jpeg|webp|avif|svg|gif|md)$/i.test(f)
  })
  check('No executable/code files injected into approved asset root', nonImages.length === 0, nonImages.length ? `found: ${nonImages.join(', ')}` : '')
} else {
  check('public/assets/smokecraft-reference/approved exists', false)
}
if (existsSync(refDir)) check('smokecraft-reference directory intact', readdirSync(refDir).length > 0)

console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Live CTA: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ SmokeCraft CTA/hotspot UX matches the current mixed live-DOM + image-shell architecture.')
  process.exit(0)
}
console.log('\n❌ SmokeCraft CTA issues found — fix before deployment.')
process.exit(1)
