/**
 * Verification: SmokeCraft canonical sequence + owner-rebuild assets.
 *
 * This verifier intentionally follows the current handoff source of truth:
 * docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json and the live
 * React route/component registry. It replaces older checks that expected
 * pre-owner-rebuild static screenshot constants.
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
  const full = resolve(ROOT, relPath)
  if (!existsSync(full)) return null
  return readFileSync(full, 'utf8')
}

function readJson(relPath) {
  const src = read(relPath)
  return src ? JSON.parse(src) : null
}

const SOURCE_FILES = [
  'docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json',
  'docs/smokecraft/handoff/02-CANONICAL_JOURNEY.md',
  'docs/smokecraft/handoff/03-ROUTE_MAP.md',
  'docs/smokecraft/handoff/04-SCREEN_TO_STAGE_MAP.md',
  'src/App.jsx',
  'src/constants/session.js',
  'src/constants/smokecraftAssets.js',
  'src/constants/smokecraftScreenManifest.js',
  'src/constants/smokecraftComponentRegistry.js',
  'src/services/smokecraft/smokecraftCompletionService.js',
  'src/components/smokecraft/SmokeCraftOwnerHeroBackground.jsx',
]

const EXPECTED_ENTRY_ORDER = [
  '/smokecraft',
  '/smokecraft/welcome',
  '/smokecraft/identity',
  '/smokecraft/venue-select',
  '/smokecraft/golden-box',
  '/smokecraft/mentor-selection',
  '/smokecraft/enroll',
  '/smokecraft/resume',
]

const EXPECTED_CANONICAL_ROUTE_ORDER = [
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

const OWNER_IMAGE_SCREENS = [
  { n: 1, name: 'Identity', route: '/smokecraft/identity', component: 'Identity.jsx', assetKey: 'ownerIdentityHero', assetPath: 'public/assets/smokecraft/owner-rebuild/01-identity-hero-crop.jpg' },
  { n: 2, name: 'Seed & Soil', route: '/smokecraft/seed-soil', component: 'SeedSoil.jsx', assetKey: 'ownerSeedSoilHero', assetPath: 'public/assets/smokecraft/owner-rebuild/02-seed-soil-hero-crop.jpg' },
  { n: 3, name: 'Format', route: '/smokecraft/format', component: 'Format.jsx', assetKey: 'ownerFormatHero', assetPath: 'public/assets/smokecraft/owner-rebuild/03-format-hero.jpg' },
  { n: 4, name: 'Cut / Toast / Light', route: '/smokecraft/cut-toast-light', component: 'CutToastLight.jsx', assetKey: 'ownerCutToastLightHero', assetPath: 'public/assets/smokecraft/owner-rebuild/04-cut-toast-light-hero.jpg' },
  { n: 5, name: 'First Third', route: '/smokecraft/first-third', component: 'FirstThird.jsx', assetKey: 'ownerFirstThirdHero', assetPath: 'public/assets/smokecraft/owner-rebuild/05-first-third-hero-crop.jpg' },
  { n: 6, name: 'Second Third', route: '/smokecraft/second-third', component: 'SecondThird.jsx', assetKey: 'ownerSecondThirdHero', assetPath: 'public/assets/smokecraft/owner-rebuild/06-second-third-hero-crop.jpg' },
  { n: 7, name: 'Final Third', route: '/smokecraft/final-third', component: 'FinalThird.jsx', assetKey: 'ownerFinalThirdHero', assetPath: 'public/assets/smokecraft/owner-rebuild/07-final-third-hero-crop.jpg' },
  { n: 8, name: 'Scorecard', route: '/smokecraft/scorecard', component: 'Scorecard.jsx', assetKey: 'ownerScorecardHero', assetPath: 'public/assets/smokecraft/owner-rebuild/08-scorecard-hero-crop.jpg' },
  { n: 9, name: 'Request / Purchase', route: '/smokecraft/request-purchase', component: 'RequestPurchase.jsx', assetKey: 'ownerRequestPurchaseHero', assetPath: 'public/assets/smokecraft/owner-rebuild/09-request-purchase-hero-crop.jpg' },
  { n: 10, name: 'Pairing Recommendations', route: '/smokecraft/pairing-recommendations', component: 'PairingRecommendations.jsx', assetKey: 'ownerPairingRecommendationsHero', assetPath: 'public/assets/smokecraft/owner-rebuild/10-pairing-recommendations-hero-crop.jpg' },
  { n: 11, name: 'Passport Stamp', route: '/smokecraft/passport-stamp', component: 'PassportStamp.jsx', assetKey: 'ownerPassportStampHero', assetPath: 'public/assets/smokecraft/owner-rebuild/11-passport-stamp-hero-crop.jpg' },
  { n: 12, name: 'Connections', route: '/smokecraft/connections', component: 'Connections.jsx', assetKey: 'ownerConnectionsHero', assetPath: 'public/assets/smokecraft/owner-rebuild/12-connections-hero-crop.jpg' },
  { n: 13, name: 'Rewards', route: '/smokecraft/rewards', component: 'Rewards.jsx', assetKey: 'ownerRewardsHero', assetPath: 'public/assets/smokecraft/owner-rebuild/13-rewards-hero-crop.jpg' },
  { n: 14, name: 'Second Humidor Match', route: '/smokecraft/second-humidor-match', component: 'SecondHumidorMatch.jsx', assetKey: 'ownerSecondHumidorMatchHero', assetPath: 'public/assets/smokecraft/owner-rebuild/14-second-humidor-match-hero-crop.jpg' },
]

console.log('\nSmokeCraft Canonical Asset + Sequence Verification\n')

console.log('Gate 1 - source files exist')
for (const file of SOURCE_FILES) {
  check(`${file} exists`, existsSync(resolve(ROOT, file)))
}

const docsManifest = readJson('docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json')
const sessionSrc = read('src/constants/session.js')
const screenManifestSrc = read('src/constants/smokecraftScreenManifest.js')
const registrySrc = read('src/constants/smokecraftComponentRegistry.js')
const assetsSrc = read('src/constants/smokecraftAssets.js')
const appSrc = read('src/App.jsx')
const completionSrc = read('src/services/smokecraft/smokecraftCompletionService.js')
const moduleConfigSrc = read('src/modules/smokecraft/smokeCraftModule.config.js')
const moduleManifestSrc = read('src/modules/smokecraft/module.manifest.js')

console.log('\nGate 2 - entry layer order matches canonical handoff')
const docsEntryRoutes = docsManifest?.entryLayer?.map(entry => entry.route) || []
EXPECTED_ENTRY_ORDER.forEach((route, index) => {
  check(`docs entry ${index + 1} is ${route}`, docsEntryRoutes[index] === route, `actual=${docsEntryRoutes[index]}`)
})
if (sessionSrc) {
  const found = [...sessionSrc.matchAll(/route:\s*'([^']+)'/g)].map(match => match[1])
  const start = found.indexOf('/smokecraft')
  const sessionEntryRoutes = start >= 0 ? found.slice(start, start + EXPECTED_ENTRY_ORDER.length) : []
  EXPECTED_ENTRY_ORDER.forEach((route, index) => {
    check(`session.js entry ${index + 1} is ${route}`, sessionEntryRoutes[index] === route, `actual=${sessionEntryRoutes[index]}`)
  })
}

console.log('\nGate 3 - canonical route order matches manifest')
const docsCanonicalRoutes = docsManifest?.canonicalRouteOrder || []
check('canonical route count is stable', docsCanonicalRoutes.length === EXPECTED_CANONICAL_ROUTE_ORDER.length, `actual=${docsCanonicalRoutes.length}`)
EXPECTED_CANONICAL_ROUTE_ORDER.forEach((route, index) => {
  check(`canonical route ${index + 1} is ${route}`, docsCanonicalRoutes[index] === route, `actual=${docsCanonicalRoutes[index]}`)
})
if (screenManifestSrc) {
  check('screen manifest overrides Welcome to Identity', screenManifestSrc.includes("s.session === 1 ? '/smokecraft/identity'"))
  check('screen manifest overrides Format to Request/Purchase', screenManifestSrc.includes("s.session === 5 ? '/smokecraft/request-purchase'"))
}
if (completionSrc) {
  check('completion service honors nextRouteOverride before linear routing', completionSrc.includes('entry.nextRouteOverride') && completionSrc.indexOf('entry.nextRouteOverride') < completionSrc.indexOf('let nextEntry'))
}

console.log('\nGate 4 - owner-rebuild image files exist')
for (const screen of OWNER_IMAGE_SCREENS) {
  check(`${screen.n}. ${screen.name} approved asset exists`, existsSync(resolve(ROOT, screen.assetPath)), screen.assetPath)
}

console.log('\nGate 5 - asset registry maps owner keys to approved files')
for (const screen of OWNER_IMAGE_SCREENS) {
  const expectedFile = screen.assetPath.split('/').pop()
  check(`${screen.assetKey} registry key exists`, assetsSrc?.includes(screen.assetKey))
  check(`${screen.assetKey} registry path ends with ${expectedFile}`, assetsSrc?.includes(`${screen.assetKey}:`) && assetsSrc.includes(expectedFile), expectedFile)
}

console.log('\nGate 6 - active components render the expected owner hero key')
for (const screen of OWNER_IMAGE_SCREENS) {
  const componentPath = `src/pages/smokecraft/${screen.component}`
  const componentSrc = read(componentPath)
  check(`${screen.component} exists`, componentSrc !== null)
  if (componentSrc) {
    check(`${screen.component} uses SmokeCraftOwnerHeroBackground`, componentSrc.includes('SmokeCraftOwnerHeroBackground'))
    check(`${screen.component} uses ${screen.assetKey}`, componentSrc.includes(`assetKey="${screen.assetKey}"`))
    check(`${screen.component} does not use image-hotspot shell`, !componentSrc.includes('SmokeCraftHotspotLayer'))
  }
}

console.log('\nGate 7 - App route tree contains the live routes')
for (const route of EXPECTED_CANONICAL_ROUTE_ORDER) {
  const subpath = route === '/smokecraft' ? 'index element' : `path="${route.replace('/smokecraft/', '')}"`
  check(`App.jsx registers ${route}`, appSrc?.includes(subpath), subpath)
}
for (const screen of OWNER_IMAGE_SCREENS) {
  const subpath = screen.route.replace('/smokecraft/', '')
  check(`App.jsx registers owner screen ${screen.route}`, appSrc?.includes(`path="${subpath}"`), subpath)
}

console.log('\nGate 8 - CraftHub/module metadata no longer uses deprecated route order')
if (moduleConfigSrc) {
  check('module config imports VISIT_STRUCTURE', moduleConfigSrc.includes('VISIT_STRUCTURE'))
  check('module config does not import SMOKECRAFT_FLOW', !moduleConfigSrc.includes('import { SMOKECRAFT_FLOW'))
  check('module config exposes supportingModules metadata', moduleConfigSrc.includes('supportingModules'))
}
if (moduleManifestSrc) {
  for (const route of EXPECTED_CANONICAL_ROUTE_ORDER) {
    check(`module manifest includes ${route}`, moduleManifestSrc.includes(`'${route}'`))
  }
}

console.log('\n─────────────────────────────────────────────────')
console.log(`SmokeCraft Asset Manifest: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\nPASS Asset manifest verified against canonical sequence and owner-rebuild image mapping.')
  process.exit(0)
}

console.log('\nFAIL Asset manifest issues found.')
process.exit(1)
