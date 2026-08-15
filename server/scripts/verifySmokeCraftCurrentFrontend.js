/**
 * SmokeCraft current-generation frontend acceptance.
 *
 * The product intentionally uses two rendering modes:
 *   1) migrated live-DOM screens for forms/workflows (for example Identity)
 *   2) approved image-shell screens with real accessible hotspot controls
 *
 * This verifier tests the current contracts without requiring one architecture
 * to masquerade as the other.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, extname } from 'path'
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

const landing = read('src/pages/SmokeCraft.jsx')
const identity = read('src/pages/smokecraft/Identity.jsx')
const assetScreen = read('src/components/smokecraft/SmokeCraftAssetScreen.jsx')
const hotspot = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
const visitComplete = read('src/pages/smokecraft/VisitComplete.jsx')
const app = read('src/App.jsx')
const assetRegistry = read('src/constants/smokecraftAssets.js')

console.log('\nSmokeCraft Current Frontend Acceptance\n')

console.log('Gate 1 — Landing control plane')
check('Landing exists', Boolean(landing))
if (landing) {
  check('Landing uses canonical action resolver', landing.includes('resolveSmokeCraftLandingAction'))
  check('Landing reads journey state once', landing.includes('getSmokeCraftLandingJourneyState'))
  check('Landing has primary action', landing.includes('<PrimaryHotspot'))
  check('Landing has accessible static controls', landing.includes('<StaticHotspot'))
  check('Landing includes Passport action', landing.includes('ACTIONS.PASSPORT'))
  check('Landing includes How It Works action', landing.includes('ACTIONS.HOW_IT_WORKS'))
  check('Landing supports explicit clean start', landing.includes('ACTIONS.START_NEW'))
  check('Landing uses canonical clean-start hook', landing.includes('useStartNewSmokeCraftJourney'))
  check('Landing controls use real button elements', landing.includes('<button'))
  check('Landing controls use haptics', landing.includes('triggerHaptic'))
}

console.log('\nGate 2 — Migrated live-DOM Identity')
if (identity) {
  check('Identity uses live screen shell', identity.includes('<SmokeCraftScreenShell'))
  check('Identity uses semantic form inputs', identity.includes('<input') && identity.includes('<select'))
  check('Identity autosaves journey state', identity.includes('setIdentity(form)'))
  check('Identity uses one shared primary NavBar control', identity.includes('onPrimary={handleBegin}'))
  check('Identity no longer renders legacy asset route', !identity.includes('<SmokeCraftAssetRoute'))
  check('Identity continue route is venue selection', identity.includes("navigate('/smokecraft/venue-select')"))
}

console.log('\nGate 3 — Legacy image-shell architecture remains valid where used')
check('Asset screen exists', Boolean(assetScreen))
check('Hotspot layer exists', Boolean(hotspot))
if (assetScreen) {
  check('Asset screen owns the viewport', assetScreen.includes("position: 'fixed'") && assetScreen.includes("width: '100dvw'") && assetScreen.includes("height: '100dvh'"))
  check('Asset screen renders children directly', assetScreen.includes('{children}'))
  check('Asset screen does not hide interactive children from accessibility', !assetScreen.includes('aria-hidden'))
}
if (hotspot) {
  check('Hotspot layer uses image-relative absolute positioning', hotspot.includes("position: 'absolute'"))
  check('Hotspot layer uses percent-sized container', hotspot.includes("width: '100%'") && hotspot.includes("height: '100%'"))
  check('Hotspot buttons restore pointer events', hotspot.includes("pointerEvents: 'auto'"))
  check('Hotspot controls support immediate pointer interaction', hotspot.includes('onPointerDown'))
  check('Hotspot controls support keyboard interaction', hotspot.includes('onKeyDown') || hotspot.includes('onClick'))
}

console.log('\nGate 4 — Visit completion responsiveness')
check('VisitComplete exists', Boolean(visitComplete))
if (visitComplete) {
  check('VisitComplete uses full dynamic viewport', visitComplete.includes("width: '100dvw'") && visitComplete.includes("height: '100dvh'"))
  check('VisitComplete accounts for bottom safe area', visitComplete.includes('safe-area-inset-bottom'))
  check('VisitComplete content is flex-positioned instead of absolute text overlays', visitComplete.includes("display: 'flex'") && visitComplete.includes("justifyContent: 'flex-end'"))
  check('VisitComplete CTA remains interactive', visitComplete.includes("pointerEvents: 'auto'"))
  check('VisitComplete returns to SmokeCraft hub', visitComplete.includes("navigate('/smokecraft')"))
  check('Debug always-true completion bypass is absent', !visitComplete.includes('isDemoMode || true'))
}

console.log('\nGate 5 — Route coverage')
check('App.jsx exists', Boolean(app))
if (app) {
  for (const route of ['identity', 'golden-box', 'session-complete']) {
    check(`SmokeCraft route ${route} registered`, app.includes(`path=\"${route}\"`) || app.includes(`path='${route}'`))
  }
  check('SmokeCraft session guards remain present', app.includes('SmokeCraftSessionGuard'))
}

console.log('\nGate 6 — Approved asset hygiene')
const approvedDir = resolve(ROOT, 'public/assets/smokecraft-reference/approved')
check('Central SmokeCraft asset registry exists', Boolean(assetRegistry))
if (assetRegistry) {
  check('Asset registry points approved references at smokecraft-reference/approved', assetRegistry.includes("const REF = '/assets/smokecraft-reference/approved'"))
  check('Asset registry separates raw and owner-rebuild sources', assetRegistry.includes("const RAW = '/assets/smokecraft'") && assetRegistry.includes("const OWNER = '/assets/smokecraft/owner-rebuild'"))
}
if (!existsSync(approvedDir)) {
  check('Canonical approved reference asset directory exists', false)
} else {
  check('Canonical approved reference asset directory exists', true)
  const allowedImageExt = new Set(['.png','.jpg','.jpeg','.webp','.avif'])
  const badFiles = []
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const p = resolve(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (!allowedImageExt.has(extname(name).toLowerCase())) badFiles.push(p)
    }
  }
  walk(approvedDir)
  check('Approved reference directory contains images only (subdirectories allowed)', badFiles.length === 0)
}

console.log('\nGate 7 — Safety')
const sources = [landing, identity, visitComplete].filter(Boolean).join('\n')
check('No fake payment-live claim', !sources.match(/payments?.*live/i))
check('No fake POS-connected claim', !sources.match(/pos.*connected/i))

console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Current Frontend: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed) {
  console.log('\n❌ Current frontend acceptance failed.')
  process.exit(1)
}
console.log('\n✅ Current frontend architecture acceptance passed.')
