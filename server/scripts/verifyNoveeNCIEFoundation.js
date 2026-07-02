/**
 * Verification: NOVEE OS Parent Authority + NCIE Foundation
 * 88 checks across platform, data, services, components, docs, and security
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const ROOT       = resolve(__dirname, '../../')

let passed = 0
let failed = 0
const failures = []

function check(label, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) {
      process.stdout.write(`  ✓ ${label}\n`)
      passed++
    } else {
      process.stdout.write(`  ✗ ${label}: ${result}\n`)
      failed++
      failures.push(label)
    }
  } catch (e) {
    process.stdout.write(`  ✗ ${label}: ${e.message}\n`)
    failed++
    failures.push(label)
  }
}

function fileExists(relPath) {
  return existsSync(resolve(ROOT, relPath))
}

function fileContains(relPath, ...strings) {
  if (!fileExists(relPath)) return `file not found: ${relPath}`
  const content = readFileSync(resolve(ROOT, relPath), 'utf8')
  for (const s of strings) {
    if (!content.includes(s)) return `missing: ${s}`
  }
  return true
}

function fileNotContains(relPath, ...strings) {
  if (!fileExists(relPath)) return `file not found: ${relPath}`
  const content = readFileSync(resolve(ROOT, relPath), 'utf8')
  for (const s of strings) {
    if (content.includes(s)) return `forbidden string found: ${s}`
  }
  return true
}

console.log('\n=== NOVEE OS + NCIE Foundation Verification ===\n')

// ─── SECTION 1: NOVEE OS Data Files ──────────────────────────────────────────
console.log('--- Section 1: NOVEE OS Data Files ---')

check('noveePlatformModules.js exists', () => fileExists('src/data/novee/noveePlatformModules.js'))
check('NOVEE_PLATFORM exported', () => fileContains('src/data/novee/noveePlatformModules.js', 'export const NOVEE_PLATFORM'))
check('NOVEE_PLATFORM role is novee_parent_platform', () => fileContains('src/data/novee/noveePlatformModules.js', 'novee_parent_platform'))
check('CRAFT_MODULES array exported', () => fileContains('src/data/novee/noveePlatformModules.js', 'export const CRAFT_MODULES'))
check('smokecraft module registered', () => fileContains('src/data/novee/noveePlatformModules.js', "moduleId: 'smokecraft'"))
check('14 modules registered', () => {
  const content = readFileSync(resolve(ROOT, 'src/data/novee/noveePlatformModules.js'), 'utf8')
  const count = (content.match(/moduleId:/g) ?? []).length
  return count >= 14 ? true : `only ${count} modules`
})
check('getCraftModule exported', () => fileContains('src/data/novee/noveePlatformModules.js', 'export function getCraftModule'))
check('getRegisteredModules exported', () => fileContains('src/data/novee/noveePlatformModules.js', 'export function getRegisteredModules'))

check('noveeVerticalRegistry.js exists', () => fileExists('src/data/novee/noveeVerticalRegistry.js'))
check('VERTICAL_REGISTRY exported', () => fileContains('src/data/novee/noveeVerticalRegistry.js', 'export const VERTICAL_REGISTRY'))
check('smokecraft kdsStationDefault humidor', () => fileContains('src/data/novee/noveeVerticalRegistry.js', 'humidor'))
check('getVerticalRegistration exported', () => fileContains('src/data/novee/noveeVerticalRegistry.js', 'export function getVerticalRegistration'))
check('getVerticalCapabilities exported', () => fileContains('src/data/novee/noveeVerticalRegistry.js', 'export function getVerticalCapabilities'))

// ─── SECTION 2: NOVEE OS Services ────────────────────────────────────────────
console.log('\n--- Section 2: NOVEE OS Services ---')

check('noveePlatformAuthority.js exists', () => fileExists('src/services/novee/noveePlatformAuthority.js'))
check('getNoveeOSIdentity exported', () => fileContains('src/services/novee/noveePlatformAuthority.js', 'export function getNoveeOSIdentity'))
check('getPlatformReadiness exported', () => fileContains('src/services/novee/noveePlatformAuthority.js', 'export function getPlatformReadiness'))
check('resolveVerticalAuthority exported', () => fileContains('src/services/novee/noveePlatformAuthority.js', 'export function resolveVerticalAuthority'))
check('getModuleManifest exported', () => fileContains('src/services/novee/noveePlatformAuthority.js', 'export function getModuleManifest'))
check('platform_preview in authority', () => fileContains('src/services/novee/noveePlatformAuthority.js', 'platform_preview'))
check('novee_os_authority in authority', () => fileContains('src/services/novee/noveePlatformAuthority.js', 'novee_os_authority'))

check('noveePaymentAuthority.js exists', () => fileExists('src/services/novee/noveePaymentAuthority.js'))
check('no_custody model present', () => fileContains('src/services/novee/noveePaymentAuthority.js', 'no_custody'))
check('direct_charge model present', () => fileContains('src/services/novee/noveePaymentAuthority.js', 'direct_charge'))
check('buildFeePreview exported', () => fileContains('src/services/novee/noveePaymentAuthority.js', 'export function buildFeePreview'))
check('getVenuePaymentReadiness exported', () => fileContains('src/services/novee/noveePaymentAuthority.js', 'export function getVenuePaymentReadiness'))
check('disbursement_preview in payment authority', () => fileContains('src/services/novee/noveePaymentAuthority.js', 'disbursement_preview'))
check('payout = subtotal - commission - referral (integer math)', () => fileContains('src/services/novee/noveePaymentAuthority.js', 'subtotalCents - commissionCents - referralCents'))

check('noveeReadinessHooks.js exists', () => fileExists('src/services/novee/noveeReadinessHooks.js'))
check('getNoveeReadinessHooks exported', () => fileContains('src/services/novee/noveeReadinessHooks.js', 'export function getNoveeReadinessHooks'))
check('getVerticalReadinessScore exported', () => fileContains('src/services/novee/noveeReadinessHooks.js', 'export function getVerticalReadinessScore'))
check('novee_readiness_preview in hooks', () => fileContains('src/services/novee/noveeReadinessHooks.js', 'novee_readiness_preview'))

// ─── SECTION 3: NCIE Data Files ──────────────────────────────────────────────
console.log('\n--- Section 3: NCIE Data Files ---')

check('craftCatalog.js exists', () => fileExists('src/data/ncie/craftCatalog.js'))
check('CRAFT_CATALOG exported', () => fileContains('src/data/ncie/craftCatalog.js', 'export const CRAFT_CATALOG'))
check('14 catalog entries', () => {
  const content = readFileSync(resolve(ROOT, 'src/data/ncie/craftCatalog.js'), 'utf8')
  const count = (content.match(/moduleId:/g) ?? []).length
  return count >= 14 ? true : `only ${count} entries`
})
check('getCraftEntry exported', () => fileContains('src/data/ncie/craftCatalog.js', 'export function getCraftEntry'))
check('knowledgeDomains in catalog', () => fileContains('src/data/ncie/craftCatalog.js', 'knowledgeDomains'))
check('mentorArchetypes in catalog', () => fileContains('src/data/ncie/craftCatalog.js', 'mentorArchetypes'))

check('knowledgeTaxonomy.js exists', () => fileExists('src/data/ncie/knowledgeTaxonomy.js'))
check('SMOKECRAFT_TAXONOMY exported', () => fileContains('src/data/ncie/knowledgeTaxonomy.js', 'SMOKECRAFT_TAXONOMY'))
check('getTaxonomyForCraft exported', () => fileContains('src/data/ncie/knowledgeTaxonomy.js', 'export function getTaxonomyForCraft'))
check('getTopicsForDomain exported', () => fileContains('src/data/ncie/knowledgeTaxonomy.js', 'export function getTopicsForDomain'))

check('mentorProfiles.js exists', () => fileExists('src/data/ncie/mentorProfiles.js'))
check('SMOKECRAFT_MENTORS exported', () => fileContains('src/data/ncie/mentorProfiles.js', 'export const SMOKECRAFT_MENTORS'))
check('master_blender mentor present', () => fileContains('src/data/ncie/mentorProfiles.js', 'master_blender'))
check('tobacconist mentor present', () => fileContains('src/data/ncie/mentorProfiles.js', 'tobacconist'))
check('lounge_owner mentor present', () => fileContains('src/data/ncie/mentorProfiles.js', 'lounge_owner'))
check('grower mentor present', () => fileContains('src/data/ncie/mentorProfiles.js', 'grower'))
check('wrapper_specialist mentor present', () => fileContains('src/data/ncie/mentorProfiles.js', 'wrapper_specialist'))
check('POURCRAFT_MENTORS exported', () => fileContains('src/data/ncie/mentorProfiles.js', 'POURCRAFT_MENTORS'))
check('getMentorsForCraft exported', () => fileContains('src/data/ncie/mentorProfiles.js', 'export function getMentorsForCraft'))
check('aiPersonaHint in mentor profiles', () => fileContains('src/data/ncie/mentorProfiles.js', 'aiPersonaHint'))

check('decisionRules.js exists', () => fileExists('src/data/ncie/decisionRules.js'))
check('SMOKECRAFT_DECISION_RULES exported', () => fileContains('src/data/ncie/decisionRules.js', 'SMOKECRAFT_DECISION_RULES'))
check('getApplicableRules exported', () => fileContains('src/data/ncie/decisionRules.js', 'export function getApplicableRules'))

check('recommendationRules.js exists', () => fileExists('src/data/ncie/recommendationRules.js'))
check('inventory_unavailable in recommendation rules', () => fileContains('src/data/ncie/recommendationRules.js', 'inventory_unavailable'))
check('cross_craft_recommendation type present', () => fileContains('src/data/ncie/recommendationRules.js', 'cross_craft_recommendation'))
check('getApplicableRecommendations exported', () => fileContains('src/data/ncie/recommendationRules.js', 'export function getApplicableRecommendations'))

check('certificationPaths.js exists', () => fileExists('src/data/ncie/certificationPaths.js'))
check('SMOKECRAFT_CERTIFICATION_PATHS exported', () => fileContains('src/data/ncie/certificationPaths.js', 'SMOKECRAFT_CERTIFICATION_PATHS'))
check('grand_master level in smokecraft', () => fileContains('src/data/ncie/certificationPaths.js', 'grand_master'))
check('getLevelForXP exported', () => fileContains('src/data/ncie/certificationPaths.js', 'export function getLevelForXP'))

check('analyticsEvents.js exists', () => fileExists('src/data/ncie/analyticsEvents.js'))
check('ANALYTICS_EVENT_TYPES exported', () => fileContains('src/data/ncie/analyticsEvents.js', 'export const ANALYTICS_EVENT_TYPES'))
check('buildAnalyticsEvent exported', () => fileContains('src/data/ncie/analyticsEvents.js', 'export function buildAnalyticsEvent'))
check('analytics not_persisted without database', () => fileContains('src/data/ncie/analyticsEvents.js', 'not_persisted'))

check('passportMasteryRules.js exists', () => fileExists('src/data/ncie/passportMasteryRules.js'))
check('XP_AWARD_VALUES exported', () => fileContains('src/data/ncie/passportMasteryRules.js', 'export const XP_AWARD_VALUES'))
check('CRAFT_XP_THRESHOLDS exported', () => fileContains('src/data/ncie/passportMasteryRules.js', 'export const CRAFT_XP_THRESHOLDS'))
check('calculateMasteryPercent exported', () => fileContains('src/data/ncie/passportMasteryRules.js', 'export function calculateMasteryPercent'))
check('passport lock rule note in mastery rules', () => fileContains('src/data/ncie/passportMasteryRules.js', 'session.js'))

// ─── SECTION 4: NCIE Engine Services ─────────────────────────────────────────
console.log('\n--- Section 4: NCIE Engine Services ---')

check('knowledgeEngine.js exists', () => fileExists('src/services/ncie/knowledgeEngine.js'))
check('getCraftKnowledgeMap exported', () => fileContains('src/services/ncie/knowledgeEngine.js', 'export function getCraftKnowledgeMap'))
check('internal_outline in knowledge engine', () => fileContains('src/services/ncie/knowledgeEngine.js', 'internal_outline'))
check('markTopicCompleted exported', () => fileContains('src/services/ncie/knowledgeEngine.js', 'export function markTopicCompleted'))

check('mentorEngine.js exists', () => fileExists('src/services/ncie/mentorEngine.js'))
check('openMentorSession exported', () => fileContains('src/services/ncie/mentorEngine.js', 'export function openMentorSession'))
check('buildMentorPromptContext exported', () => fileContains('src/services/ncie/mentorEngine.js', 'export function buildMentorPromptContext'))
check('safety guard in mentor engine', () => fileContains('src/services/ncie/mentorEngine.js', 'safetyGuard'))

check('decisionEngine.js exists', () => fileExists('src/services/ncie/decisionEngine.js'))
check('runDecision exported', () => fileContains('src/services/ncie/decisionEngine.js', 'export function runDecision'))
check('whyThisFits in decision engine', () => fileContains('src/services/ncie/decisionEngine.js', 'whyThisFits'))
check('lessonInfluences in decision engine', () => fileContains('src/services/ncie/decisionEngine.js', 'lessonInfluences'))
check('mentorExplanation in decision engine', () => fileContains('src/services/ncie/decisionEngine.js', 'mentorExplanation'))
check('confidenceScore in decision engine', () => fileContains('src/services/ncie/decisionEngine.js', 'confidenceScore'))
check('alternativeChoices in decision engine', () => fileContains('src/services/ncie/decisionEngine.js', 'alternativeChoices'))
check('learnMoreBeforeChoosing in decision engine', () => fileContains('src/services/ncie/decisionEngine.js', 'learnMoreBeforeChoosing'))

check('recommendationEngine.js exists', () => fileExists('src/services/ncie/recommendationEngine.js'))
check('inventory_unavailable in rec engine', () => fileContains('src/services/ncie/recommendationEngine.js', 'inventory_unavailable'))
check('getCrossCraftRecommendations exported', () => fileContains('src/services/ncie/recommendationEngine.js', 'export function getCrossCraftRecommendations'))

check('commerceIntelligenceEngine.js exists', () => fileExists('src/services/ncie/commerceIntelligenceEngine.js'))
check('commerce_preview in commerce engine', () => fileContains('src/services/ncie/commerceIntelligenceEngine.js', 'commerce_preview'))
check('no_custody in commerce engine', () => fileContains('src/services/ncie/commerceIntelligenceEngine.js', 'no_custody'))
check('getCommerceIntelligence exported', () => fileContains('src/services/ncie/commerceIntelligenceEngine.js', 'export function getCommerceIntelligence'))

check('analyticsIntelligenceEngine.js exists', () => fileExists('src/services/ncie/analyticsIntelligenceEngine.js'))
check('analytics_preview in analytics engine', () => fileContains('src/services/ncie/analyticsIntelligenceEngine.js', 'analytics_preview'))
check('not_persisted in analytics engine', () => fileContains('src/services/ncie/analyticsIntelligenceEngine.js', 'not_persisted'))
check('trackEvent exported', () => fileContains('src/services/ncie/analyticsIntelligenceEngine.js', 'export function trackEvent'))

check('passportMasteryEngine.js exists', () => fileExists('src/services/ncie/passportMasteryEngine.js'))
check('awardXP exported', () => fileContains('src/services/ncie/passportMasteryEngine.js', 'export function awardXP'))
check('getPassportMasteryProfile exported', () => fileContains('src/services/ncie/passportMasteryEngine.js', 'export function getPassportMasteryProfile'))
check('passport lock note in mastery engine', () => fileContains('src/services/ncie/passportMasteryEngine.js', 'session.js'))

check('openAiEducationClient.js exists', () => fileExists('src/services/ncie/openAiEducationClient.js'))
check('ai_unavailable when no key', () => fileContains('src/services/ncie/openAiEducationClient.js', 'ai_unavailable'))
check('AI safety blocked fields defined', () => fileContains('src/services/ncie/openAiEducationClient.js', 'AI_SAFETY_BLOCKED_FIELDS'))
check('stripeToken blocked from AI', () => fileContains('src/services/ncie/openAiEducationClient.js', 'stripeToken'))
check('taxId blocked from AI', () => fileContains('src/services/ncie/openAiEducationClient.js', 'taxId'))
check('getAIStatus exported', () => fileContains('src/services/ncie/openAiEducationClient.js', 'export function getAIStatus'))
check('source of truth note in AI client', () => fileContains('src/services/ncie/openAiEducationClient.js', 'source of truth'))

// ─── SECTION 5: NCIE Components ──────────────────────────────────────────────
console.log('\n--- Section 5: NCIE Components ---')

const COMPONENTS = [
  'NCIEKnowledgePanel', 'NCIEMentorCard', 'NCIEDecisionWidget',
  'NCIERecommendationFeed', 'NCIEPassportProgress', 'NCIEVerticalBadge',
  'NCIEMasteryMeter', 'NCIECraftSelector', 'NCIEAIStatusBadge',
  'NCIECommerceInsightPanel', 'NCIEPlatformStatusBar',
]

for (const comp of COMPONENTS) {
  check(`${comp}.jsx exists`, () => fileExists(`src/components/ncie/${comp}.jsx`))
}

// ─── SECTION 6: Documentation ────────────────────────────────────────────────
console.log('\n--- Section 6: Documentation ---')

check('NOVEE_OS_PLATFORM.md exists', () => fileExists('docs/NOVEE_OS_PLATFORM.md'))
check('NOVEE OS is parent OS notice in platform doc', () => fileContains('docs/NOVEE_OS_PLATFORM.md', 'parent operating system'))
check('no_custody in platform doc', () => fileContains('docs/NOVEE_OS_PLATFORM.md', 'does not hold'))

check('NCIE_FOUNDATION.md exists', () => fileExists('docs/NCIE_FOUNDATION.md'))
check('preview notice in NCIE doc', () => fileContains('docs/NCIE_FOUNDATION.md', 'preview-only'))
check('SmokeCraft Passport lock rule protection in NCIE doc', () => fileContains('docs/NCIE_FOUNDATION.md', 'session.js'))
check('AI never overrides internal outlines in doc', () => fileContains('docs/NCIE_FOUNDATION.md', 'source of truth'))

check('NCIE_COMPONENTS.md exists', () => fileExists('docs/NCIE_COMPONENTS.md'))
check('inventory_unavailable referenced in components doc', () => fileContains('docs/NCIE_COMPONENTS.md', 'inventory_unavailable'))

// ─── SECTION 7: Security and Forbidden Language ───────────────────────────────
console.log('\n--- Section 7: Security and Forbidden Language ---')

const NOVEE_FILES = [
  'src/services/novee/noveePlatformAuthority.js',
  'src/services/novee/noveePaymentAuthority.js',
  'src/services/novee/noveeReadinessHooks.js',
  'src/services/ncie/openAiEducationClient.js',
  'src/services/ncie/commerceIntelligenceEngine.js',
]

check('no "ai verified facts" in services', () => {
  for (const f of NOVEE_FILES) {
    const r = fileNotContains(f, 'ai verified facts', 'AI verified facts')
    if (r !== true) return r
  }
  return true
})
check('no "venue funds controlled" in payment authority', () => fileNotContains('src/services/novee/noveePaymentAuthority.js', 'venue funds controlled'))
check('no "payout complete" in payment authority', () => fileNotContains('src/services/novee/noveePaymentAuthority.js', 'payout complete'))
check('no "AI live" forbidden claim in openAi client', () => fileNotContains('src/services/ncie/openAiEducationClient.js', 'aiStatus: \'ai_live\'', 'AI is live', 'AI verified facts'))

// ─── SECTION 8: Package Scripts ──────────────────────────────────────────────
console.log('\n--- Section 8: Package Scripts ---')

check('verify:ncie script in package.json', () => fileContains('package.json', '"verify:ncie"'))
check('verify:ncie points to correct script', () => fileContains('package.json', 'verifyNoveeNCIEFoundation.js'))

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n=== Summary ===')
console.log(`  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)
console.log(`  Total:  ${passed + failed}`)

if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  - ${f}`))
  process.exit(1)
} else {
  console.log('\n✓ All checks passed. NOVEE OS + NCIE Foundation verified.\n')
}
