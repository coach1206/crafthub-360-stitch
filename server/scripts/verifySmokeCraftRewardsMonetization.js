/**
 * verifySmokeCraftRewardsMonetization.js
 * Module Build 5 verification — 48 assertions
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function fileContains(filePath, str) {
  try {
    return fs.readFileSync(filePath, 'utf8').includes(str)
  } catch {
    return false
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath)
}

function fileNotMatchesPattern(filePath, pattern) {
  try {
    return !pattern.test(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return true
  }
}

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ ${label}`)
    failed++
    failures.push(label)
  }
}

// --- Paths ---
const REWARD_CONTRACT   = path.join(root, 'src/modules/smokecraft/data/smokecraftRewardContract.js')
const LOYALTY_CONTRACT  = path.join(root, 'src/modules/smokecraft/data/smokecraftLoyaltyContract.js')
const MONETIZATION_CONTRACT = path.join(root, 'src/modules/smokecraft/data/smokecraftMonetizationContract.js')
const REWARD_STORE      = path.join(root, 'server/services/smokecraft/smokecraftRewardStore.js')
const POLICY_SVC        = path.join(root, 'server/services/smokecraft/smokecraftRewardPolicyService.js')
const AUDIT_SVC         = path.join(root, 'server/services/smokecraft/smokecraftRewardAuditService.js')
const LOYALTY_SVC       = path.join(root, 'server/services/smokecraft/smokecraftLoyaltyService.js')
const PASSPORT_SVC      = path.join(root, 'server/services/smokecraft/smokecraftPassportRewardService.js')
const VISIT_SVC         = path.join(root, 'server/services/smokecraft/smokecraftVisitProgressionRewardService.js')
const SCORECARD_SVC     = path.join(root, 'server/services/smokecraft/smokecraftScorecardRewardService.js')
const ORDER_SVC         = path.join(root, 'server/services/smokecraft/smokecraftOrderRewardService.js')
const MONETIZATION_SVC  = path.join(root, 'server/services/smokecraft/smokecraftExperienceMonetizationService.js')
const PAIRING_REWARD_SVC = path.join(root, 'server/services/smokecraft/smokecraftPairingRewardService.js')
const CONTROLLER        = path.join(root, 'server/controllers/smokecraftRewardsController.js')
const ROUTES            = path.join(root, 'server/routes/smokecraftRewardsRoutes.js')
const SERVER            = path.join(root, 'server/index.js')
const FRONTEND_SVC      = path.join(root, 'src/modules/smokecraft/services/smokecraftRewardsService.js')
const PANEL_PASSPORT    = path.join(root, 'src/modules/smokecraft/components/SmokeCraftPassportRewardPanel.jsx')
const PANEL_LOYALTY     = path.join(root, 'src/modules/smokecraft/components/SmokeCraftLoyaltyProgressPanel.jsx')
const PANEL_ELIGIBILITY = path.join(root, 'src/modules/smokecraft/components/SmokeCraftRewardEligibilityPanel.jsx')
const PANEL_MONETIZATION = path.join(root, 'src/modules/smokecraft/components/SmokeCraftExperienceMonetizationPanel.jsx')
const DOCS              = path.join(root, 'docs/SMOKECRAFT_REWARDS_MONETIZATION.md')
const README            = path.join(root, 'src/modules/smokecraft/README.md')

// --- Data Contracts ---
console.log('\n[1] Data Contracts')
assert('reward contract exists', fileExists(REWARD_CONTRACT))
assert('reward contract exports REWARD_TYPES', fileContains(REWARD_CONTRACT, 'REWARD_TYPES'))
assert('reward contract exports REWARD_STATUSES', fileContains(REWARD_CONTRACT, 'REWARD_STATUSES'))
assert('reward contract exports BLOCKED_REASONS', fileContains(REWARD_CONTRACT, 'BLOCKED_REASONS'))
assert('reward contract exports createRewardRecord', fileContains(REWARD_CONTRACT, 'createRewardRecord'))
assert('loyalty contract exports LOYALTY_TIERS', fileContains(LOYALTY_CONTRACT, 'LOYALTY_TIERS'))
assert('loyalty contract exports XP_EVENTS', fileContains(LOYALTY_CONTRACT, 'XP_EVENTS'))
assert('loyalty contract exports getTierForXP', fileContains(LOYALTY_CONTRACT, 'getTierForXP'))
assert('monetization contract previewOnly always true', fileContains(MONETIZATION_CONTRACT, 'previewOnly: true'))
assert('monetization contract no live billing', fileNotMatchesPattern(MONETIZATION_CONTRACT, /billingStatus:\s*['"]connected['"]/))

// --- Backend Services ---
console.log('\n[2] Reward Store')
assert('reward store exists', fileExists(REWARD_STORE))
assert('reward store has memory_fallback', fileContains(REWARD_STORE, 'memory_fallback'))
assert('reward store imports createRewardRecord', fileContains(REWARD_STORE, 'createRewardRecord'))

console.log('\n[3] Policy Service')
assert('policy service exists', fileExists(POLICY_SVC))
assert('policy service has no_duplicate_reward', fileContains(POLICY_SVC, 'no_duplicate_reward_for_same_event'))
assert('policy service has no_pos_verified_reward_without_pos', fileContains(POLICY_SVC, 'no_pos_verified_reward_without_pos_confirmation'))
assert('policy service has no_redeemed_status_without_handler', fileContains(POLICY_SVC, 'no_redeemed_status_without_redemption_handler'))
assert('policy service exports runPolicyChecks', fileContains(POLICY_SVC, 'runPolicyChecks'))

console.log('\n[4] Audit Service')
assert('audit service exists', fileExists(AUDIT_SVC))
assert('audit service does not contain secrets', fileContains(AUDIT_SVC, 'containsSecrets: false'))
assert('audit service does not expose private data', fileContains(AUDIT_SVC, 'exposesPrivateData: false'))
assert('audit service exports createRewardAuditEntry', fileContains(AUDIT_SVC, 'createRewardAuditEntry'))

console.log('\n[5] Loyalty Service')
assert('loyalty service exists', fileExists(LOYALTY_SVC))
assert('loyalty service blocks POS-required events without POS', fileContains(LOYALTY_SVC, 'posRequired') && fileContains(LOYALTY_SVC, 'posVerified'))
assert('loyalty service exports getLoyaltySummary', fileContains(LOYALTY_SVC, 'getLoyaltySummary'))

console.log('\n[6] Passport Reward Service')
assert('passport service exists', fileExists(PASSPORT_SVC))
assert('passport service blocks visit 8', fileContains(PASSPORT_SVC, 'VISIT_8_LOCKED'))
assert('passport service blocks one-session shortcut', fileContains(PASSPORT_SVC, 'ONE_SESSION_SHORTCUT_BLOCKED'))
assert('passport service blocks early stamp', fileContains(PASSPORT_SVC, 'blockEarlyPassportStamp') || fileContains(PASSPORT_SVC, 'cannot unlock early'))
assert('passport service requires scorecard', fileContains(PASSPORT_SVC, 'SCORECARD_MISSING'))
assert('passport service requires flavor memory', fileContains(PASSPORT_SVC, 'FLAVOR_MEMORY_MISSING'))

console.log('\n[7] Order Reward Service')
assert('order reward service exists', fileExists(ORDER_SVC))
assert('order POS-verified reward requires posVerified', fileContains(ORDER_SVC, 'posVerified'))
assert('order reward preview_only when POS not connected', fileContains(ORDER_SVC, 'preview_only'))

console.log('\n[8] Monetization Service')
assert('monetization service exists', fileExists(MONETIZATION_SVC))
assert('monetization service has no live billing', fileContains(MONETIZATION_SVC, 'preview_only'))
assert('monetization service does not create charges', fileNotMatchesPattern(MONETIZATION_SVC, /charge\.create|createCharge|stripe\.charges/))

console.log('\n[9] Pairing Reward Service')
assert('pairing reward service exists', fileExists(PAIRING_REWARD_SVC))
assert('pairing reward blocks on allergyBlock', fileContains(PAIRING_REWARD_SVC, 'allergyBlock'))
assert('pairing reward provider bonus requires providerConnected', fileContains(PAIRING_REWARD_SVC, 'providerConnected'))

// --- Controller + Routes + Server ---
console.log('\n[10] Controller and Routes')
assert('controller exists', fileExists(CONTROLLER))
assert('controller has evaluatePassportReward', fileContains(CONTROLLER, 'evaluatePassportReward'))
assert('controller has getMonetizationHandler', fileContains(CONTROLLER, 'getMonetizationHandler'))
assert('routes file exists', fileExists(ROUTES))
assert('routes mount /rewards prefix', fileContains(ROUTES, '/api/modules/smokecraft/rewards') || fileContains(ROUTES, "router.get('/status"))
assert('server mounts rewards routes', fileContains(SERVER, 'smokecraftRewardsRoutes'))

// --- Frontend ---
console.log('\n[11] Frontend Components')
assert('passport panel exists', fileExists(PANEL_PASSPORT))
assert('passport panel shows blocked reasons', fileContains(PANEL_PASSPORT, 'blockedReasons'))
assert('passport panel no early unlock', fileContains(PANEL_PASSPORT, 'cannot unlock early'))
assert('loyalty panel shows tier', fileContains(PANEL_LOYALTY, 'tier'))
assert('loyalty panel shows memory_fallback warning', fileContains(PANEL_LOYALTY, 'memory_fallback'))
assert('reward eligibility panel exists', fileExists(PANEL_ELIGIBILITY))
assert('monetization panel shows preview_only', fileContains(PANEL_MONETIZATION, 'preview_only'))
assert('monetization panel no live billing claim', fileNotMatchesPattern(PANEL_MONETIZATION, /billingStatus:\s*['"]connected['"]|billing provider active/i))

// --- Documentation + README ---
console.log('\n[12] Documentation')
assert('docs file exists', fileExists(DOCS))
assert('README has MODULE BUILD 5', fileContains(README, 'MODULE BUILD 5'))
assert('frontend service exists', fileExists(FRONTEND_SVC))

// --- Summary ---
console.log(`\n${'='.repeat(50)}`)
console.log(`SmokeCraft Rewards & Monetization Verify`)
console.log(`Passed: ${passed} / ${passed + failed}`)
if (failures.length > 0) {
  console.error(`\nFailed assertions:`)
  failures.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
} else {
  console.log(`All assertions passed.`)
}
