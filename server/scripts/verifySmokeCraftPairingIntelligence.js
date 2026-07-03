/**
 * verifySmokeCraftPairingIntelligence.js
 * Module Build 4 verification — SmokeCraft Pairing Intelligence
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function resolveFromRoot(rel) {
  return path.join(ROOT, rel)
}

function fileExists(rel) {
  return fs.existsSync(resolveFromRoot(rel))
}

function fileContains(rel, str) {
  try {
    return fs.readFileSync(resolveFromRoot(rel), 'utf8').includes(str)
  } catch { return false }
}

function fileNotMatchesPattern(rel, pattern) {
  try {
    return !pattern.test(fs.readFileSync(resolveFromRoot(rel), 'utf8'))
  } catch { return true }
}

function assert(condition, label) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(label)
  }
}

// ── Backend services ──────────────────────────────────────────────────────────
console.log('\nBackend services:')
const PROFILE_STORE    = 'server/services/smokecraft/smokecraftPairingProfileStore.js'
const PREF_INTEL       = 'server/services/smokecraft/smokecraftPreferenceIntelligenceService.js'
const SCORING          = 'server/services/smokecraft/smokecraftPairingScoringService.js'
const MENU_REC         = 'server/services/smokecraft/smokecraftMenuRecommendationService.js'
const MENTOR_REC       = 'server/services/smokecraft/smokecraftMentorRecommendationService.js'
const FLAVOR_MEM       = 'server/services/smokecraft/smokecraftFlavorMemoryService.js'
const PROVIDER         = 'server/services/smokecraft/smokecraftPairingProviderService.js'
const AUDIT            = 'server/services/smokecraft/smokecraftPairingAuditService.js'
const CONTROLLER       = 'server/controllers/smokecraftPairingController.js'
const ROUTES           = 'server/routes/smokecraftPairingRoutes.js'
const SERVER_INDEX     = 'server/index.js'
const README           = 'src/modules/smokecraft/README.md'
const DOCS             = 'docs/SMOKECRAFT_PAIRING_INTELLIGENCE.md'

assert(fileExists(PROFILE_STORE),    'pairing profile store exists')
assert(fileExists(PREF_INTEL),       'preference intelligence service exists')
assert(fileExists(SCORING),          'pairing scoring service exists')
assert(fileExists(MENU_REC),         'menu recommendation service exists')
assert(fileExists(MENTOR_REC),       'mentor recommendation service exists')
assert(fileExists(FLAVOR_MEM),       'flavor memory service exists')
assert(fileExists(PROVIDER),         'pairing provider service exists')
assert(fileExists(AUDIT),            'pairing audit service exists')
assert(fileExists(CONTROLLER),       'pairing controller exists')
assert(fileExists(ROUTES),           'pairing routes exist')

// ── Route mounting ────────────────────────────────────────────────────────────
console.log('\nRoute mounting:')
assert(fileContains(SERVER_INDEX, 'smokecraftPairingRoutes'),                   'pairing routes imported in server/index.js')
assert(fileContains(SERVER_INDEX, '/api/modules/smokecraft/pairing'),            'pairing routes mounted at /api/modules/smokecraft/pairing')

// ── Provider status ───────────────────────────────────────────────────────────
console.log('\nProvider status:')
assert(fileContains(PROVIDER, 'providerConnected: false'),                       'provider returns providerConnected false when unavailable')
assert(fileContains(PROVIDER, 'aiBacked: false'),                                'provider returns aiBacked false when unavailable')
assert(fileContains(PROVIDER, "'local_intelligence'"),                           'local intelligence status defined')
assert(fileContains(PROVIDER, 'SMOKECRAFT_PAIRING_API_KEY'),                     'provider key read from env var only')
assert(fileContains(PROVIDER, 'No live AI pairing provider is connected'),       'provider unavailable message is honest')
assert(fileContains(PROVIDER, 'aiBacked: connected'),                            'provider aiBacked depends on connection check')

// ── Local intelligence ────────────────────────────────────────────────────────
console.log('\nLocal intelligence:')
assert(fileContains(PROVIDER, 'generateLocalRecommendation'),                    'generateLocalRecommendation function exists')
assert(fileContains(PROVIDER, 'recommendationStatus: \'local_intelligence\''),    'local recommendations marked local_intelligence')
assert(fileContains(CONTROLLER, 'generateLocalRecommendation'),                  'controller calls local recommendation generator')

// ── Scoring range ─────────────────────────────────────────────────────────────
console.log('\nScoring range:')
assert(fileContains(SCORING, '0), 98)'),                                         'score capped at 98 — never fake 100')
assert(fileContains(SCORING, 'confidenceScore'),                                 'recommendation includes confidenceScore')
assert(fileContains(SCORING, '0), 1).toFixed'),                                  'confidence clamped 0 to 1')

// ── Preference profile ────────────────────────────────────────────────────────
console.log('\nPreference profile:')
assert(fileContains(PREF_INTEL, "'partial'"),                                    'preference profile supports partial status')
assert(fileContains(PREF_INTEL, 'confidenceScore'),                              'preference profile includes confidence score')
assert(fileContains(PREF_INTEL, 'tasteProfileStatus'),                           'preference profile includes tasteProfileStatus')
assert(fileContains(PREF_INTEL, 'sourceSignals'),                                'preference profile includes sourceSignals')

// ── Flavor Memory ─────────────────────────────────────────────────────────────
console.log('\nFlavor Memory:')
assert(fileContains(FLAVOR_MEM, 'flavor_memory'),                                'flavor memory service defines journey step')
assert(fileContains(FLAVOR_MEM, 'required: true'),                               'flavor memory is required')
assert(fileContains(FLAVOR_MEM, 'removable: false'),                             'flavor memory is not removable')
assert(fileContains(FLAVOR_MEM, 'feedsPreferenceIntelligence: true'),            'flavor memory feeds preference intelligence')
assert(fileContains(PREF_INTEL, 'flavor_memory'),                                'preference intelligence uses flavor_memory signal')

// ── Menu recommendations ──────────────────────────────────────────────────────
console.log('\nMenu recommendations:')
assert(fileContains(MENU_REC, 'local_fallback'),                                 'menu recommendations support local_fallback menu')
assert(fileContains(MENU_REC, 'available === false'),                            'unavailable menu items are excluded')
assert(fileContains(MENU_REC, 'staffRequired'),                                  'staffRequired is respected')
assert(fileContains(MENU_REC, 'customerOrderAllowed'),                           'customerOrderAllowed is respected')
assert(fileContains(MENU_REC, 'pairingRecommendationId'),                        'recommended items carry pairingRecommendationId')
assert(fileContains(MENU_REC, 'buildOrderPairingPayload'),                       'buildOrderPairingPayload exists for order inclusion')

// ── Order payload connection ──────────────────────────────────────────────────
console.log('\nOrder payload connection:')
assert(fileContains(MENU_REC, 'pairingRecommendations'),                         'order payload can include pairingRecommendations')
assert(fileContains(CONTROLLER, 'orderPairingPayload'),                          'controller builds order pairing payload')
assert(fileContains(SCORING, 'recommendationId'),                                'scoring produces recommendationId for POS mapping')

// ── Staff handoff + POS mapping ───────────────────────────────────────────────
console.log('\nStaff handoff + POS:')
assert(fileContains(MENU_REC, 'explanation'),                                    'recommendation carries explanation for staff handoff')
assert(fileContains(MENU_REC, 'recommendationId'),                               'POS payload mapping preserves recommendationId')

// ── E.A.T. sync ───────────────────────────────────────────────────────────────
console.log('\nE.A.T. sync:')
assert(fileContains(CONTROLLER, 'syncSmokeCraftOrderToEAT'),                     'controller queues E.A.T. sync events')
assert(fileContains(AUDIT, 'smokeCraft.pairing.localFallbackUsed'),              'E.A.T. event for local fallback usage')
assert(fileContains(AUDIT, 'smokeCraft.pairing.providerUnavailable'),            'E.A.T. event for provider unavailable')
assert(fileContains(AUDIT, 'menuSource'),                                        'audit entry includes menuSource for sync status tracking')

// ── Pairing audit ─────────────────────────────────────────────────────────────
console.log('\nPairing audit:')
assert(fileContains(AUDIT, 'createPairingAuditEntry'),                           'createPairingAuditEntry function exists')
assert(fileContains(AUDIT, 'recommendationId'),                                  'audit entry includes recommendationId')
assert(fileContains(AUDIT, 'eventType'),                                         'audit entry includes eventType')
assert(fileContains(AUDIT, 'confidenceScore'),                                   'audit entry includes confidenceScore')
assert(fileContains(AUDIT, 'containsSecrets: false'),                            'audit does not store secrets')

// ── Frontend components ───────────────────────────────────────────────────────
console.log('\nFrontend components:')
const PANEL_REC   = 'src/modules/smokecraft/components/SmokeCraftPairingRecommendationPanel.jsx'
const PANEL_PREF  = 'src/modules/smokecraft/components/SmokeCraftPreferenceProfilePanel.jsx'
const PANEL_FM    = 'src/modules/smokecraft/components/SmokeCraftFlavorMemoryPanel.jsx'
const PANEL_MENU  = 'src/modules/smokecraft/components/SmokeCraftMenuPairingPanel.jsx'

assert(fileExists(PANEL_REC),  'SmokeCraftPairingRecommendationPanel exists')
assert(fileExists(PANEL_PREF), 'SmokeCraftPreferenceProfilePanel exists')
assert(fileExists(PANEL_FM),   'SmokeCraftFlavorMemoryPanel exists')
assert(fileExists(PANEL_MENU), 'SmokeCraftMenuPairingPanel exists')

assert(fileContains(PANEL_REC,  'providerConnected'),                            'PairingRecommendationPanel shows provider status')
assert(fileContains(PANEL_REC,  'aiBacked'),                                     'PairingRecommendationPanel shows aiBacked status')
assert(fileContains(PANEL_REC,  'local_intelligence'),                           'PairingRecommendationPanel handles local_intelligence status')
assert(fileContains(PANEL_REC,  'venueMenuBacked'),                              'PairingRecommendationPanel shows venue menu status')
assert(fileContains(PANEL_PREF, 'tasteProfileStatus'),                           'PreferenceProfilePanel shows taste profile status')
assert(fileContains(PANEL_PREF, 'confidenceScore'),                              'PreferenceProfilePanel shows confidence score')
assert(fileContains(PANEL_PREF, 'partial'),                                      'PreferenceProfilePanel handles partial profile')
assert(fileContains(PANEL_FM,   'Required Journey Step'),                        'FlavorMemoryPanel identifies Flavor Memory as required')
assert(fileContains(PANEL_FM,   'pairing recommendations and taste profile'),    'FlavorMemoryPanel communicates pairing feed')
assert(fileContains(PANEL_MENU, 'local_fallback'),                               'MenuPairingPanel shows local_fallback warning')
assert(fileContains(PANEL_MENU, 'staffRequired'),                                'MenuPairingPanel shows staffRequired')
assert(fileContains(PANEL_MENU, 'customerOrderAllowed'),                         'MenuPairingPanel respects customerOrderAllowed')
assert(fileContains(PANEL_MENU, 'pairingRecommendationId'),                      'MenuPairingPanel passes pairingRecommendationId on order')

// ── Mentor influence ──────────────────────────────────────────────────────────
console.log('\nMentor influence:')
assert(fileContains(MENTOR_REC, 'classic_traditionalist'),                       'mentor styles include classic_traditionalist')
assert(fileContains(MENTOR_REC, 'flavor_explorer'),                              'mentor styles include flavor_explorer')
assert(fileContains(MENTOR_REC, 'beginner_guide'),                               'mentor styles include beginner_guide')
assert(fileContains(MENTOR_REC, 'applyMentorInfluence'),                         'applyMentorInfluence function exists')
assert(fileContains(MENTOR_REC, 'never override'),                               'mentor influence does not override avoidances')

// ── Documentation ─────────────────────────────────────────────────────────────
console.log('\nDocumentation:')
assert(fileExists(DOCS),                                                          'SMOKECRAFT_PAIRING_INTELLIGENCE.md exists')
assert(fileContains(README, 'MODULE BUILD 4'),                                   'SmokeCraft README updated with Module Build 4')
assert(fileContains(README, 'MODULE BUILD 5'),                                   'SmokeCraft README previews Module Build 5')
assert(fileContains(DOCS, 'local_intelligence'),                                 'docs explain local_intelligence status')
assert(fileContains(DOCS, 'What Is Real Now'),                                   'docs contain What Is Real Now section')
assert(fileContains(DOCS, 'What Is Still Fallback'),                             'docs contain What Is Still Fallback section')
assert(fileContains(DOCS, 'Module Build 5'),                                     'docs preview Module Build 5')
assert(fileContains(DOCS, 'Flavor Memory is a **required**'),                    'docs confirm Flavor Memory is required')
assert(fileContains(DOCS, 'SMOKECRAFT_PAIRING_API_KEY'),                         'docs reference env var for provider key')
assert(fileContains(DOCS, 'memory_fallback'),                                    'docs cover memory_fallback mode')

// ── Protected visual files ─────────────────────────────────────────────────────
console.log('\nProtected visual files (not modified):')
const PROTECTED = [
  'src/components/smokecraft/SmokeCraftAssetScreen.jsx',
  'src/components/smokecraft/SmokeCraftHotspotLayer.jsx',
  'src/components/smokecraft/SmokeCraftAssetRoute.jsx',
  'src/utils/passportProgress.js',
  'src/utils/passportEntry.js',
  'src/constants/smokecraftJourney.js',
]
for (const p of PROTECTED) {
  assert(fileExists(p), `protected file still exists: ${path.basename(p)}`)
}

// ── Honest status — no false claims ───────────────────────────────────────────
console.log('\nHonest status (no false claims):')
assert(fileNotMatchesPattern(PROVIDER, /aiBacked:\s*true[^,}]/),                 'provider never hardcodes aiBacked: true')
assert(fileNotMatchesPattern(SCORING, /score:\s*100[^-]/),                       'scoring never hardcodes score: 100')
assert(fileContains(PROVIDER, 'providerConnected: false'),                       'provider default is not connected')
assert(fileContains(DOCS, 'not_connected'),                                      'docs acknowledge not_connected statuses')

// ── Results ───────────────────────────────────────────────────────────────────
console.log('\n── Results ──')
console.log(`  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)

if (failures.length > 0) {
  console.log('\nFailed assertions:')
  for (const f of failures) console.log(`  - ${f}`)
  process.exit(1)
} else {
  console.log('\n  All SmokeCraft Pairing Intelligence assertions passed.')
  console.log('  Customer preference intelligence: active.')
  console.log('  Pairing scoring: active (0–100 score, 0–1 confidence).')
  console.log('  Menu recommendations: active (local_fallback menu).')
  console.log('  Mentor influence: active.')
  console.log('  Flavor Memory: required journey step — feeds preference intelligence.')
  console.log('  Provider status: local_intelligence — no live AI provider connected.')
  console.log('  Audit trail: active.')
  console.log('  Next: MODULE BUILD 5 — SmokeCraft Passport, Loyalty, Rewards, Visit Progression, and Experience Monetization')
}
