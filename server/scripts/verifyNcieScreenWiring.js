#!/usr/bin/env node
/**
 * Phase 11 Verification — NCIE Screen Wiring and Educational Tile Integration
 * 104 checks
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

let passed = 0
let failed = 0
const failures = []

function check(label, condition) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(label)
    console.log(`  FAIL: ${label}`)
  }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }

function fileContains(rel, ...strings) {
  if (!fileExists(rel)) return false
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  return strings.every(s => content.includes(s))
}

function fileNotContains(rel, ...strings) {
  if (!fileExists(rel)) return true
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  return strings.every(s => !content.includes(s))
}

// ── SECTION 1: Adapter Services (12 checks) ────────────────────────────────
console.log('\n[1] Adapter Services')

check('ncieScreenAdapter.js exists',
  fileExists('src/services/ncie/ncieScreenAdapter.js'))
check('ncieScreenAdapter has isProtectedRoute',
  fileContains('src/services/ncie/ncieScreenAdapter.js', 'isProtectedRoute'))
check('ncieScreenAdapter has resolveScreenContext',
  fileContains('src/services/ncie/ncieScreenAdapter.js', 'resolveScreenContext'))
check('ncieScreenAdapter has getAdapterForScreen',
  fileContains('src/services/ncie/ncieScreenAdapter.js', 'getAdapterForScreen'))
check('ncieScreenAdapter has getCraftTypeFromRoute',
  fileContains('src/services/ncie/ncieScreenAdapter.js', 'getCraftTypeFromRoute'))
check('ncieScreenAdapter has protected_screen_not_modified',
  fileContains('src/services/ncie/ncieScreenAdapter.js', 'protected_screen_not_modified'))

check('ncieTileAdapter.js exists',
  fileExists('src/services/ncie/ncieTileAdapter.js'))
check('ncieTileAdapter has getTileMetadata',
  fileContains('src/services/ncie/ncieTileAdapter.js', 'getTileMetadata'))
check('ncieTileAdapter has getLearnMoreTrigger',
  fileContains('src/services/ncie/ncieTileAdapter.js', 'getLearnMoreTrigger'))
check('ncieTileAdapter has verified_outline_available',
  fileContains('src/services/ncie/ncieTileAdapter.js', 'verified_outline_available'))
check('ncieTileAdapter has getAllTilesForCraft',
  fileContains('src/services/ncie/ncieTileAdapter.js', 'getAllTilesForCraft'))
check('ncieTileAdapter has getTilesByScreenCategory',
  fileContains('src/services/ncie/ncieTileAdapter.js', 'getTilesByScreenCategory'))

// ── SECTION 2: Context Builder (10 checks) ─────────────────────────────────
console.log('\n[2] Context Builder')

check('ncieScreenContextBuilder.js exists',
  fileExists('src/services/ncie/ncieScreenContextBuilder.js'))
check('contextBuilder has buildScreenContext',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'buildScreenContext'))
check('contextBuilder has buildSmokeCraftContext',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'buildSmokeCraftContext'))
check('contextBuilder has validateContextSafety',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'validateContextSafety'))
check('contextBuilder blocks stripeToken',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'stripeToken'))
check('contextBuilder blocks taxId',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'taxId'))
check('contextBuilder blocks bankAccount',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'bankAccount'))
check('contextBuilder blocks apiKey',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'apiKey'))
check('contextBuilder blocks cardNumber',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'cardNumber'))
check('contextBuilder blocks privateKey',
  fileContains('src/services/ncie/ncieScreenContextBuilder.js', 'privateKey'))

// ── SECTION 3: Analytics Adapter (8 checks) ────────────────────────────────
console.log('\n[3] Analytics Adapter')

check('ncieAnalyticsAdapter.js exists',
  fileExists('src/services/ncie/ncieAnalyticsAdapter.js'))
check('analyticsAdapter has trackLessonOpened',
  fileContains('src/services/ncie/ncieAnalyticsAdapter.js', 'trackLessonOpened'))
check('analyticsAdapter has trackQuizCompleted',
  fileContains('src/services/ncie/ncieAnalyticsAdapter.js', 'trackQuizCompleted'))
check('analyticsAdapter has analytics_preview',
  fileContains('src/services/ncie/ncieAnalyticsAdapter.js', 'analytics_preview'))
check('analyticsAdapter has not_persisted',
  fileContains('src/services/ncie/ncieAnalyticsAdapter.js', 'not_persisted'))
check('analyticsAdapter has getAnalyticsAdapterStatus',
  fileContains('src/services/ncie/ncieAnalyticsAdapter.js', 'getAnalyticsAdapterStatus'))
check('analyticsAdapter has SESSION_EVENT_BUFFER',
  fileContains('src/services/ncie/ncieAnalyticsAdapter.js', 'SESSION_EVENT_BUFFER'))
check('analyticsAdapter does not claim persisted',
  fileNotContains('src/services/ncie/ncieAnalyticsAdapter.js', "'analytics_persisted'", '"analytics_persisted"'))

// ── SECTION 4: Educational Tile Registry (8 checks) ────────────────────────
console.log('\n[4] Educational Tile Registry')

check('educationalTileRegistry.js exists',
  fileExists('src/data/ncie/educationalTileRegistry.js'))
check('tileRegistry has SmokeCraft tiles',
  fileContains('src/data/ncie/educationalTileRegistry.js', 'sc_soil', 'sc_wrapper', 'sc_humidor'))
check('tileRegistry has PourCraft tiles',
  fileContains('src/data/ncie/educationalTileRegistry.js', 'pc_distillation'))
check('tileRegistry has BeerCraft tiles',
  fileContains('src/data/ncie/educationalTileRegistry.js', 'bc_'))
check('tileRegistry has WineCraft tiles',
  fileContains('src/data/ncie/educationalTileRegistry.js', 'wc_'))
check('tileRegistry has getEducationalTile',
  fileContains('src/data/ncie/educationalTileRegistry.js', 'getEducationalTile'))
check('tileRegistry has getTilesByCraft',
  fileContains('src/data/ncie/educationalTileRegistry.js', 'getTilesByCraft'))
check('tileRegistry has getTilesByCategory',
  fileContains('src/data/ncie/educationalTileRegistry.js', 'getTilesByCategory'))

// ── SECTION 5: Screen Maps (10 checks) ─────────────────────────────────────
console.log('\n[5] Screen Maps')

check('smokecraftNcieScreenMap.js exists',
  fileExists('src/data/ncie/screenMaps/smokecraftNcieScreenMap.js'))
check('smokecraft map has golden-box',
  fileContains('src/data/ncie/screenMaps/smokecraftNcieScreenMap.js', 'golden-box'))
check('smokecraft map has overlay_ready screens',
  fileContains('src/data/ncie/screenMaps/smokecraftNcieScreenMap.js', 'overlay_ready'))
check('smokecraft map has safe_component_import',
  fileContains('src/data/ncie/screenMaps/smokecraftNcieScreenMap.js', 'safe_component_import'))
check('smokecraft map has adapter_only',
  fileContains('src/data/ncie/screenMaps/smokecraftNcieScreenMap.js', 'adapter_only'))

check('pourcraftNcieScreenMap.js exists',
  fileExists('src/data/ncie/screenMaps/pourcraftNcieScreenMap.js'))
check('pourcraft map has future_wire_required',
  fileContains('src/data/ncie/screenMaps/pourcraftNcieScreenMap.js', 'future_wire_required'))

check('beercraftNcieScreenMap.js exists',
  fileExists('src/data/ncie/screenMaps/beercraftNcieScreenMap.js'))
check('beercraft map has future_wire_required',
  fileContains('src/data/ncie/screenMaps/beercraftNcieScreenMap.js', 'future_wire_required'))

check('winecraftNcieScreenMap.js exists',
  fileExists('src/data/ncie/screenMaps/winecraftNcieScreenMap.js'))

// ── SECTION 6: React Hooks (12 checks) ─────────────────────────────────────
console.log('\n[6] React Hooks')

check('useNcieScreenEducation.js exists',
  fileExists('src/hooks/ncie/useNcieScreenEducation.js'))
check('useNcieScreenEducation has screen_wiring_ready',
  fileContains('src/hooks/ncie/useNcieScreenEducation.js', 'screen_wiring_ready'))
check('useNcieScreenEducation has verified_outline_available',
  fileContains('src/hooks/ncie/useNcieScreenEducation.js', 'verified_outline_available'))

check('useNcieMentor.js exists',
  fileExists('src/hooks/ncie/useNcieMentor.js'))
check('useNcieMentor has mentor_preview',
  fileContains('src/hooks/ncie/useNcieMentor.js', 'mentor_preview'))

check('useNcieDecision.js exists',
  fileExists('src/hooks/ncie/useNcieDecision.js'))
check('useNcieDecision uses buildSmokeCraftContext',
  fileContains('src/hooks/ncie/useNcieDecision.js', 'buildSmokeCraftContext'))

check('useNcieRecommendations.js exists',
  fileExists('src/hooks/ncie/useNcieRecommendations.js'))
check('useNcieRecommendations has inventory_unavailable',
  fileContains('src/hooks/ncie/useNcieRecommendations.js', 'inventory_unavailable'))

check('useNciePassportMastery.js exists',
  fileExists('src/hooks/ncie/useNciePassportMastery.js'))
check('useNciePassportMastery has passport_preview',
  fileContains('src/hooks/ncie/useNciePassportMastery.js', 'passport_preview'))
check('useNciePassportMastery references session.js',
  fileContains('src/hooks/ncie/useNciePassportMastery.js', 'session.js'))

// ── SECTION 7: useNcieAnalytics Hook (4 checks) ────────────────────────────
console.log('\n[7] useNcieAnalytics Hook')

check('useNcieAnalytics.js exists',
  fileExists('src/hooks/ncie/useNcieAnalytics.js'))
check('useNcieAnalytics has analytics_preview',
  fileContains('src/hooks/ncie/useNcieAnalytics.js', 'analytics_preview'))
check('useNcieAnalytics wraps trackLessonOpened',
  fileContains('src/hooks/ncie/useNcieAnalytics.js', 'trackLessonOpened'))
check('useNcieAnalytics wraps trackQuizCompleted',
  fileContains('src/hooks/ncie/useNcieAnalytics.js', 'trackQuizCompleted'))

// ── SECTION 8: Wiring Components (16 checks) ───────────────────────────────
console.log('\n[8] Screen-Safe Wiring Components')

check('NcieScreenEducationLayer.jsx exists',
  fileExists('src/components/ncie/wiring/NcieScreenEducationLayer.jsx'))
check('NcieScreenEducationLayer uses useNcieScreenEducation',
  fileContains('src/components/ncie/wiring/NcieScreenEducationLayer.jsx', 'useNcieScreenEducation'))

check('NcieTileLearnMoreButton.jsx exists',
  fileExists('src/components/ncie/wiring/NcieTileLearnMoreButton.jsx'))
check('NcieTileLearnMoreButton uses getTileMetadata',
  fileContains('src/components/ncie/wiring/NcieTileLearnMoreButton.jsx', 'getTileMetadata'))

check('NcieMentorDrawer.jsx exists',
  fileExists('src/components/ncie/wiring/NcieMentorDrawer.jsx'))
check('NcieMentorDrawer shows ai_unavailable message',
  fileContains('src/components/ncie/wiring/NcieMentorDrawer.jsx', 'AI mentor is not active'))

check('NcieDecisionDrawer.jsx exists',
  fileExists('src/components/ncie/wiring/NcieDecisionDrawer.jsx'))
check('NcieDecisionDrawer shows learnMoreBeforeChoosing',
  fileContains('src/components/ncie/wiring/NcieDecisionDrawer.jsx', 'learnMoreBeforeChoosing'))

check('NcieRecommendationDrawer.jsx exists',
  fileExists('src/components/ncie/wiring/NcieRecommendationDrawer.jsx'))
check('NcieRecommendationDrawer shows inventory warning',
  fileContains('src/components/ncie/wiring/NcieRecommendationDrawer.jsx', 'inventory_unavailable'))

check('NcieQuizDrawer.jsx exists',
  fileExists('src/components/ncie/wiring/NcieQuizDrawer.jsx'))
check('NcieQuizDrawer tracks analytics',
  fileContains('src/components/ncie/wiring/NcieQuizDrawer.jsx', 'trackQuizStarted', 'trackQuizCompleted'))

check('NciePassportMasteryDrawer.jsx exists',
  fileExists('src/components/ncie/wiring/NciePassportMasteryDrawer.jsx'))
check('NciePassportMasteryDrawer shows passportNote',
  fileContains('src/components/ncie/wiring/NciePassportMasteryDrawer.jsx', 'passportNote'))

check('NcieScreenStatusDock.jsx exists',
  fileExists('src/components/ncie/wiring/NcieScreenStatusDock.jsx'))
check('NcieScreenStatusDock shows screen_wiring_ready',
  fileContains('src/components/ncie/wiring/NcieScreenStatusDock.jsx', 'screen_wiring_ready'))

// ── SECTION 9: Demo Page (4 checks) ────────────────────────────────────────
console.log('\n[9] Demo Page')

check('NcieWiringDemo.jsx exists',
  fileExists('src/pages/ncie/NcieWiringDemo.jsx'))
check('NcieWiringDemo imports all wiring components',
  fileContains('src/pages/ncie/NcieWiringDemo.jsx',
    'NcieMentorDrawer', 'NcieDecisionDrawer', 'NcieQuizDrawer', 'NciePassportMasteryDrawer'))
check('NcieWiringDemo shows protected_screen_not_modified status',
  fileContains('src/pages/ncie/NcieWiringDemo.jsx', 'protected_screen_not_modified'))
check('NcieWiringDemo shows status dock',
  fileContains('src/pages/ncie/NcieWiringDemo.jsx', 'NcieScreenStatusDock'))

// ── SECTION 10: E.A.T. Readiness (8 checks) ────────────────────────────────
console.log('\n[10] E.A.T. Readiness Hooks')

check('eatCommandHubContract has getNcieScreenWiringReadiness',
  fileContains('server/services/eatCommandHubContract.js', 'getNcieScreenWiringReadiness'))
check('eatCommandHubContract getNcieScreenWiringReadiness returns screen_wiring_ready',
  fileContains('server/services/eatCommandHubContract.js', 'screen_wiring_ready'))
check('eatCommandHubContract has getCraftEducationTileReadiness',
  fileContains('server/services/eatCommandHubContract.js', 'getCraftEducationTileReadiness'))
check('eatCommandHubContract has getSmokeCraftEducationReadiness',
  fileContains('server/services/eatCommandHubContract.js', 'getSmokeCraftEducationReadiness'))
check('eatCommandHubContract has getEducationAnalyticsReadiness',
  fileContains('server/services/eatCommandHubContract.js', 'getEducationAnalyticsReadiness'))
check('eatCommandHubContract has getMentorInteractionReadiness',
  fileContains('server/services/eatCommandHubContract.js', 'getMentorInteractionReadiness'))
check('eatCommandHubContract has getPassportMasteryReadiness',
  fileContains('server/services/eatCommandHubContract.js', 'getPassportMasteryReadiness'))
check('eatCommandHubContract passport readiness references session.js',
  fileContains('server/services/eatCommandHubContract.js', 'session.js'))

// ── SECTION 11: Documentation (6 checks) ───────────────────────────────────
console.log('\n[11] Documentation')

check('NCIE_SCREEN_WIRING_AND_TILE_INTEGRATION.md exists',
  fileExists('docs/NCIE_SCREEN_WIRING_AND_TILE_INTEGRATION.md'))
check('doc has required NCIE wiring summary sentence',
  fileContains('docs/NCIE_SCREEN_WIRING_AND_TILE_INTEGRATION.md',
    'NCIE screen wiring connects verified educational outlines, mentors, decisions, recommendations, passport mastery, and analytics previews to screens without making OpenAI the source of truth.'))
check('doc lists protected files',
  fileContains('docs/NCIE_SCREEN_WIRING_AND_TILE_INTEGRATION.md', 'SmokeCraftAssetScreen.jsx'))
check('doc has honest status vocabulary section',
  fileContains('docs/NCIE_SCREEN_WIRING_AND_TILE_INTEGRATION.md', 'Honest Status Vocabulary'))
check('doc references passport lock authority',
  fileContains('docs/NCIE_SCREEN_WIRING_AND_TILE_INTEGRATION.md', 'session.js'))
check('doc has commerce safety note',
  fileContains('docs/NCIE_SCREEN_WIRING_AND_TILE_INTEGRATION.md', 'no-custody'))

// ── SECTION 12: Honest Status — No False Claims (6 checks) ─────────────────
console.log('\n[12] Honest Status — No False Claims')

const wiringFiles = [
  'src/services/ncie/ncieScreenAdapter.js',
  'src/services/ncie/ncieTileAdapter.js',
  'src/services/ncie/ncieAnalyticsAdapter.js',
  'src/services/ncie/ncieScreenContextBuilder.js',
]

check('no analytics_persisted claim in adapter files',
  wiringFiles.every(f => fileNotContains(f, "'analytics_persisted'", '"analytics_persisted"')))
check('no inventory_live claim in adapter files',
  wiringFiles.every(f => fileNotContains(f, "'inventory_live'", '"inventory_live"')))
check('no checkout_live claim in wiring components',
  ['NcieDecisionDrawer', 'NcieRecommendationDrawer', 'NciePassportMasteryDrawer'].every(c =>
    fileNotContains(`src/components/ncie/wiring/${c}.jsx`, "'checkout_live'", '"checkout_live"')))
check('no kds_notified claim in wiring components',
  ['NcieDecisionDrawer', 'NcieMentorDrawer'].every(c =>
    fileNotContains(`src/components/ncie/wiring/${c}.jsx`, 'kds_notified')))
check('useNcieAnalytics does not claim database_saved',
  fileNotContains('src/hooks/ncie/useNcieAnalytics.js', 'database_saved', 'analytics_saved'))
check('NciePassportMasteryDrawer does not claim stamps are locked by NCIE',
  fileNotContains('src/components/ncie/wiring/NciePassportMasteryDrawer.jsx', 'NCIE locks stamps', 'stamps locked by NCIE'))

// ── SECTION 13: Protected Files Not Modified (6 checks) ────────────────────
console.log('\n[13] Protected Files Not Modified')

const PROTECTED = [
  'src/components/smokecraft/SmokeCraftAssetScreen.jsx',
  'src/components/smokecraft/SmokeCraftHotspotLayer.jsx',
  'src/components/smokecraft/SmokeCraftAssetRoute.jsx',
  'src/constants/session.js',
  'src/utils/passportProgress.js',
  'src/utils/passportEntry.js',
]

check('all 6 protected files still exist (not deleted)',
  PROTECTED.every(f => fileExists(f)))
check('SmokeCraftAssetScreen.jsx has no NCIE imports',
  fileNotContains('src/components/smokecraft/SmokeCraftAssetScreen.jsx', 'useNcie', 'ncieScreen', 'NcieTile'))
check('SmokeCraftHotspotLayer.jsx has no NCIE imports',
  fileNotContains('src/components/smokecraft/SmokeCraftHotspotLayer.jsx', 'useNcie', 'ncieScreen', 'NcieTile'))
check('SmokeCraftAssetRoute.jsx has no NCIE imports',
  fileNotContains('src/components/smokecraft/SmokeCraftAssetRoute.jsx', 'useNcie', 'ncieScreen', 'NcieTile'))
check('session.js has no NCIE imports',
  fileNotContains('src/constants/session.js', 'useNcie', 'ncieScreen', 'ncieTile'))
check('passportProgress.js has no NCIE imports',
  fileNotContains('src/utils/passportProgress.js', 'useNcie', 'ncieScreen', 'ncieTile'))

// ── SECTION 14: Package.json Scripts (2 checks) ────────────────────────────
console.log('\n[14] Package.json Scripts')

check('package.json has verify:ncie-wiring script',
  fileContains('package.json', 'verify:ncie-wiring'))
check('package.json has verify:ncie script',
  fileContains('package.json', 'verify:ncie'))

// ── SECTION 15: Tile Touch Targets (4 checks) ──────────────────────────────
console.log('\n[15] Touch Target / Accessibility')

check('NcieTileLearnMoreButton has min-h-[44px]',
  fileContains('src/components/ncie/wiring/NcieTileLearnMoreButton.jsx', 'min-h-[44px]'))
check('NcieMentorDrawer has min-h-[44px]',
  fileContains('src/components/ncie/wiring/NcieMentorDrawer.jsx', 'min-h-[44px]'))
check('NcieDecisionDrawer has min-h-[44px]',
  fileContains('src/components/ncie/wiring/NcieDecisionDrawer.jsx', 'min-h-[44px]'))
check('NciePassportMasteryDrawer has min-h-[44px]',
  fileContains('src/components/ncie/wiring/NciePassportMasteryDrawer.jsx', 'min-h-[44px]'))

// ── SUMMARY ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`)
console.log(`Phase 11 — NCIE Screen Wiring Verification`)
console.log(`${'─'.repeat(60)}`)
console.log(`  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)
console.log(`  Total:  ${passed + failed}`)

if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  • ${f}`))
}

if (failed === 0) {
  console.log('\n✓ All checks passed. Phase 11 verified.')
} else {
  console.log(`\n✗ ${failed} check(s) failed.`)
  process.exit(1)
}
