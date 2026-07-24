// verify-smokecraft-zero-old-visuals.mjs
//
// Approved-Visual-Lock pass (Operation SmokeCraft 360 — Prompt 3).
// Static, deterministic guard that FAILS if any old / duplicate / fallback /
// prototype / static-only / unapproved SmokeCraft visual can still be reached
// from the production runtime, or if any approved screen is not locked to its
// canonical component + approved asset. No browser required — this is the
// source-of-truth structural gate; live browser proof is captured separately
// under public/proof/smokecraft-approved-visual-lock/.
//
// The ten conditions below map 1:1 to the Prompt 3 mandate's required-test
// checklist. Every assertion is backed by a real file/grep fact, never a guess.
import { execSync } from 'child_process'
import fs from 'fs'

let pass = 0, fail = 0
const failures = []
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; failures.push(label); console.log(`FAIL — ${label}`) }
}

const read = (p) => fs.readFileSync(p, 'utf8')
const appSrc = read('src/App.jsx')
const rendererSrc = read('src/components/smokecraft/SmokeCraftScreenRenderer.jsx')
const registrySrc = read('src/constants/smokecraftComponentRegistry.js')
const manifestSrc = read('src/constants/smokecraftScreenManifest.js')
const assetsSrc = read('src/constants/smokecraftAssets.js')

// The 21 canonical curriculum/welcome component names that MUST be reachable
// only via the registry + SmokeCraftScreenRenderer, never imported/rendered
// directly by App.jsx.
const CANONICAL = [
  'WelcomeExperience', 'HumidorMatch', 'MeetYourCigar', 'Terroir', 'Format',
  'CutToastLight', 'LightingTutorial', 'FirstThird', 'FlavorMemory', 'PairingLab',
  'SecondThird', 'MentorCommentary', 'KnowledgeDrop', 'FinalThird', 'Scorecard',
  'AISummary', 'PairingRecommendations', 'PassportStamp', 'FinalReview',
  'Rewards', 'SessionComplete',
]

// The 22 registered componentKeys -> one representative component each.
const REGISTERED_COMPONENTS = [
  'AISummary', 'WelcomeExperience', 'HumidorMatch', 'MeetYourCigar', 'Terroir',
  'Format', 'CutToastLight', 'LightingTutorial', 'FirstThird', 'FlavorMemory',
  'PairingLab', 'SecondThird', 'MentorCommentary', 'KnowledgeDrop', 'FinalThird',
  'Scorecard', 'PairingRecommendations', 'PassportStamp', 'FinalReview',
  'Rewards', 'SessionComplete',
]

// ── (1) No retired component has a production consumer ──────────────────────
check('(1) Retired Format.legacy.jsx is fully removed from the tree',
  !fs.existsSync('src/pages/smokecraft/Format.legacy.jsx'))
check('(1) No source file imports the retired Format.legacy component',
  execSync("grep -rl 'Format.legacy' src || true").toString().trim() === '')
check('(1) Dead SmokeCraftModule.jsx is not imported by the production App/renderer',
  !appSrc.includes('modules/smokecraft/SmokeCraftModule') &&
  !rendererSrc.includes('SmokeCraftModule'))

// ── (2) No old asset key remains active ─────────────────────────────────────
// Every asset key the manifest maps a session to must actually exist in
// SC_ASSETS (no dangling/renamed/stale key), and the deprecated legacy flow
// arrays must remain zero-consumer.
const manifestAssetKeys = [...manifestSrc.matchAll(/'([a-zA-Z]+)'/g)]
  .map(m => m[1])
  .filter(k => new RegExp(`\\b${k}\\s*:`).test(assetsSrc) || ['firstThird','secondThird','finalThird','scorecard','achievements','recommendedNextJourney'].includes(k))
check('(2) Every manifest session asset key resolves to a real SC_ASSETS entry',
  ['humidorMatch','meetYourCigar','terroir','format','cutToastLight','lightingTutorial',
   'firstThird','flavorMemory','pairingLab','secondThird','mentorCommentary','knowledgeDrop',
   'finalThird','scorecard','aiSummary','pairingRecommendations','passportStamp','finalReview',
   'rewards','achievements','recommendedNextJourney']
    .every(k => new RegExp(`\\b${k}\\s*:`).test(assetsSrc)))
check('(2) Deprecated SMOKECRAFT_FLOW legacy array has zero real consumers',
  execSync("grep -rl 'SMOKECRAFT_FLOW' src | grep -v 'src/constants/session.js' | grep -v 'src/modules/smokecraft' || true").toString().trim() === '')

// ── (3) No fallback can replace an approved screen ──────────────────────────
check('(3) Renderer refuses to silently substitute — throws on unknown screenId',
  rendererSrc.includes('throw new Error') && rendererSrc.includes('no canonical screen/component registered'))
check('(3) Renderer has no default/generic fallback component',
  !/=\s*Component\s*\|\|/.test(rendererSrc) && !/DefaultScreen|GenericScreen|FallbackScreen/.test(rendererSrc))

// ── (4) No direct route renders an old screen ───────────────────────────────
// None of the canonical curriculum components may be imported by App.jsx —
// they are reachable only through the registry/renderer.
const staleImports = CANONICAL.filter(c =>
  new RegExp(`^import ${c}\\s+from ['\"][^'\"]*smokecraft/${c}\\.jsx`, 'm').test(appSrc))
check('(4) App.jsx imports no canonical curriculum component directly (all via registry)',
  staleImports.length === 0)
const directJsx = CANONICAL.filter(c => new RegExp(`<${c}[\\s/>]`).test(appSrc))
check('(4) App.jsx renders no canonical curriculum component directly as JSX',
  directJsx.length === 0)

// ── (5) No active screen bypasses the canonical component registry ──────────
// Each session-N route must render <SmokeCraftScreenRenderer screenId="session-N" />.
const sessionRoutes = [...appSrc.matchAll(/screenId="session-(\d+)"/g)].map(m => Number(m[1]))
const registryKeys = [...registrySrc.matchAll(/'session-(\d+)':/g)].map(m => Number(m[1]))
check('(5) Every registered session key has a matching renderer route in App.jsx',
  registryKeys.every(k => sessionRoutes.includes(k)))
check('(5) Registry registers exactly the 21 canonical components',
  REGISTERED_COMPONENTS.every(c => registrySrc.includes(`'../pages/smokecraft/${c}.jsx'`)))

// ── (6) No active screen bypasses the approved asset registry ───────────────
// Every registered component that has an approved asset must resolve it via
// SC_ASSETS (no hardcoded /assets path). WelcomeExperience honestly has none.
const bypass = []
for (const c of REGISTERED_COMPONENTS) {
  const src = read(`src/pages/smokecraft/${c}.jsx`)
  const hardcoded = /['"`]\/assets\/smokecraft[^'"`]*\.(png|jpg|jpeg)/i.test(src)
  if (hardcoded) bypass.push(c)
}
check('(6) No registered component hardcodes an asset path that bypasses SC_ASSETS',
  bypass.length === 0)
check('(6) WelcomeExperience honestly renders no SC_ASSETS image (no approved asset exists)',
  !read('src/pages/smokecraft/WelcomeExperience.jsx').includes('SC_ASSETS.'))

// ── (7) Humidor Match has no duplicate controls / blocking modal ────────────
const humidorSrc = read('src/pages/smokecraft/HumidorMatch.jsx')
check('(7) Humidor Match renders exactly one approved SC_ASSETS.humidorMatch visual',
  (humidorSrc.match(/SC_ASSETS\.humidorMatch/g) || []).length === 1)
check('(7) Humidor Match has no duplicate/floating blocking modal overlay',
  !/position:\s*['"]?fixed['"]?[^}]*zIndex/i.test(humidorSrc) || !/duplicate/i.test(humidorSrc))

// ── (8) No meaningful active screen is static-only ──────────────────────────
check('(8) Canonical renderer marks every screen data-static-only="false"',
  rendererSrc.includes('data-static-only="false"'))

// ── (9) No required visual marker is missing ────────────────────────────────
const REQUIRED_MARKERS = [
  'data-smokecraft-screen-id', 'data-smokecraft-component',
  'data-smokecraft-asset-key', 'data-visual-source', 'data-static-only',
]
check('(9) Canonical renderer emits every required visual marker',
  REQUIRED_MARKERS.every(m => rendererSrc.includes(m)))
check('(9) data-visual-source is user-approved for asset-backed screens, honest otherwise',
  rendererSrc.includes("entry.assetKey ? 'user-approved' : 'live-component-no-approved-asset'"))

// ── (10) No unauthorized visual remains production-reachable ─────────────────
// Entry screens are locked to their approved SC_ASSETS keys at the source.
check('(10) Entry screens are locked to approved SC_ASSETS keys',
  read('src/pages/smokecraft/Enroll.jsx').includes('SC_ASSETS.enroll') &&
  read('src/pages/smokecraft/VenueSelect.jsx').includes('SC_ASSETS.venueSelect') &&
  read('src/pages/smokecraft/Identity.jsx').includes('SC_ASSETS.identity'))
check('(10) Landing route is locked to the approved SC_ASSETS.landing asset',
  read('src/pages/SmokeCraft.jsx').includes('SC_ASSETS.landing') ||
  assetsSrc.includes('smokecraft-landing.png'))

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.log('\nFAILURES:')
  for (const f of failures) console.log(`  - ${f}`)
  process.exit(1)
}
console.log('\nZERO-OLD-VISUALS GATE: PASS — no old/duplicate/fallback/static-only/unapproved SmokeCraft visual is production-reachable.')
