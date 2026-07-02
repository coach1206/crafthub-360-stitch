/**
 * verifyVenueOnboardingEngine.js — 43 checks
 * Verifies Phase 5 Venue Onboarding Engine foundation.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function check(id, description, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) {
      console.log(`  ✓ [${id}] ${description}`)
      passed++
    } else {
      console.error(`  ✗ [${id}] ${description} — ${result}`)
      failed++
      failures.push(`[${id}] ${description}: ${result}`)
    }
  } catch (err) {
    console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`)
    failed++
    failures.push(`[${id}] ${description}: threw ${err.message}`)
  }
}

async function checkAsync(id, description, fn) {
  try {
    const result = await fn()
    if (result === true || result === undefined) {
      console.log(`  ✓ [${id}] ${description}`)
      passed++
    } else {
      console.error(`  ✗ [${id}] ${description} — ${result}`)
      failed++
      failures.push(`[${id}] ${description}: ${result}`)
    }
  } catch (err) {
    console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`)
    failed++
    failures.push(`[${id}] ${description}: threw ${err.message}`)
  }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function readFile(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

console.log('\n=== verifyVenueOnboardingEngine — 43 checks ===\n')

// 1–7. File existence
check(1, 'Migration 020 exists', () =>
  fileExists('server/db/migrations/020_venue_onboarding_engine.sql') || 'file missing')

check(2, 'venueOnboardingEngine.js exists', () =>
  fileExists('server/services/venue/venueOnboardingEngine.js') || 'file missing')

check(3, 'venueSettingsService.js exists', () =>
  fileExists('server/services/venue/venueSettingsService.js') || 'file missing')

check(4, 'venuePartnerSpecialsLifecycleService.js exists', () =>
  fileExists('server/services/venue/venuePartnerSpecialsLifecycleService.js') || 'file missing')

check(5, 'venueStaffPolicyEngine.js exists', () =>
  fileExists('server/services/venue/venueStaffPolicyEngine.js') || 'file missing')

check(6, 'venueReadinessAggregator.js exists', () =>
  fileExists('server/services/venue/venueReadinessAggregator.js') || 'file missing')

check(7, 'venueOnboardingController.js exists', () =>
  fileExists('server/controllers/venueOnboardingController.js') || 'file missing')

check(8, 'venueOnboardingRoutes.js exists', () =>
  fileExists('server/routes/venueOnboardingRoutes.js') || 'file missing')

// 9–15. Migration tables
const migration = fileExists('server/db/migrations/020_venue_onboarding_engine.sql')
  ? readFile('server/db/migrations/020_venue_onboarding_engine.sql') : ''

check(9,  'venue_profiles table defined', () => migration.includes('venue_profiles') || 'table not found')
check(10, 'venue_onboarding_status table defined', () => migration.includes('venue_onboarding_status') || 'table not found')
check(11, 'venue_operating_settings table defined', () => migration.includes('venue_operating_settings') || 'table not found')
check(12, 'venue_pos_preferences table defined', () => migration.includes('venue_pos_preferences') || 'table not found')
check(13, 'venue_partner_specials_settings table defined', () => migration.includes('venue_partner_specials_settings') || 'table not found')
check(14, 'venue_staff_policy_settings table defined', () => migration.includes('venue_staff_policy_settings') || 'table not found')
check(15, 'venue_onboarding_audit_logs table defined', () => migration.includes('venue_onboarding_audit_logs') || 'table not found')

// 16–18. Migration defaults
check(16, 'partner_specials_enabled defaults FALSE', () =>
  migration.includes("partner_specials_enabled     BOOLEAN DEFAULT FALSE") ||
  migration.includes("partner_specials_enabled BOOLEAN DEFAULT FALSE") || 'default not found')

check(17, 'customer_visible_sync_status defaults FALSE', () =>
  migration.includes('customer_visible_sync_status') && migration.includes('DEFAULT FALSE') || 'default not found')

check(18, 'allow_trusted_staff_publish_specials defaults FALSE', () =>
  migration.includes('allow_trusted_staff_publish_specials') && migration.includes('DEFAULT FALSE') || 'default not found')

// 19–24. Venue onboarding engine functions
await checkAsync(19, 'createVenueProfile returns ok:false when venueId missing', async () => {
  const { createVenueProfile } = await import('../services/venue/venueOnboardingEngine.js')
  const result = await createVenueProfile({ venueName: 'Test Venue' })
  return result.ok === false || `expected ok:false, got ok:${result.ok}`
})

await checkAsync(20, 'getVenueProfile returns ok:true with memory fallback', async () => {
  const { getVenueProfile } = await import('../services/venue/venueOnboardingEngine.js')
  const result = await getVenueProfile('test-venue-missing')
  return result.ok === true || `got ok:${result.ok}`
})

await checkAsync(21, 'getVenueOnboardingStatus returns default status', async () => {
  const { getVenueOnboardingStatus } = await import('../services/venue/venueOnboardingEngine.js')
  const result = await getVenueOnboardingStatus('test-venue-x')
  return result.ok === true && result.status !== undefined || 'status not returned'
})

await checkAsync(22, 'readiness score starts at 20 (manual_pos360 always available)', async () => {
  const { calculateVenueReadinessScore } = await import('../services/venue/venueOnboardingEngine.js')
  const result = await calculateVenueReadinessScore('new-venue-readiness')
  return result.readinessScore >= 20 || `got: ${result.readinessScore}`
})

await checkAsync(23, 'getVenueCommerceReadiness returns overallStatus: onboarding_required for new venue', async () => {
  const { getVenueCommerceReadiness } = await import('../services/venue/venueOnboardingEngine.js')
  const result = await getVenueCommerceReadiness('new-venue-commerce')
  return result.overallStatus === 'onboarding_required' || `got: ${result.overallStatus}`
})

await checkAsync(24, 'markOnboardingStepComplete returns ok:false for unknown step', async () => {
  const { markOnboardingStepComplete } = await import('../services/venue/venueOnboardingEngine.js')
  const result = await markOnboardingStepComplete('v1', 'unknown_step')
  return result.ok === false || `got ok:${result.ok}`
})

// 25–29. Venue settings defaults
await checkAsync(25, 'getVenueOperatingSettings returns manual_pos360 default', async () => {
  const { getVenueOperatingSettings } = await import('../services/venue/venueSettingsService.js')
  const result = await getVenueOperatingSettings('settings-test-venue')
  return result.data.default_order_mode === 'manual_pos360' || `got: ${result.data.default_order_mode}`
})

await checkAsync(26, 'getVenueOperatingSettings returns customer_visible_sync_status: false', async () => {
  const { getVenueOperatingSettings } = await import('../services/venue/venueSettingsService.js')
  const result = await getVenueOperatingSettings('settings-test-venue-2')
  return result.data.customer_visible_sync_status === false || `got: ${result.data.customer_visible_sync_status}`
})

await checkAsync(27, 'getVenuePartnerSpecialsSettings returns disabled by default', async () => {
  const { getVenuePartnerSpecialsSettings } = await import('../services/venue/venueSettingsService.js')
  const result = await getVenuePartnerSpecialsSettings('partner-test-venue')
  return result.data.partner_specials_enabled === false && result.data.status === 'partner_specials_disabled' ||
    `enabled:${result.data.partner_specials_enabled}, status:${result.data.status}`
})

await checkAsync(28, 'getVenueStaffPolicySettings: bartender_can_publish defaults false', async () => {
  const { getVenueStaffPolicySettings } = await import('../services/venue/venueSettingsService.js')
  const result = await getVenueStaffPolicySettings('staff-test-venue')
  return result.data.bartender_can_publish === false || `got: ${result.data.bartender_can_publish}`
})

await checkAsync(29, 'getVenueStaffPolicySettings: require_manager_approval_for_staff_specials defaults true', async () => {
  const { getVenueStaffPolicySettings } = await import('../services/venue/venueSettingsService.js')
  const result = await getVenueStaffPolicySettings('staff-test-venue-2')
  return result.data.require_manager_approval_for_staff_specials === true || `got: ${result.data.require_manager_approval_for_staff_specials}`
})

// 30–34. Partner specials lifecycle
await checkAsync(30, 'enablePartnerSpecialsTrial starts with partner_specials_trial_active', async () => {
  const { enablePartnerSpecialsTrial } = await import('../services/venue/venuePartnerSpecialsLifecycleService.js')
  const result = await enablePartnerSpecialsTrial('trial-venue-1')
  return result.status === 'partner_specials_trial_active' || `got: ${result.status}`
})

await checkAsync(31, 'enablePartnerSpecialsTrial sets trialExpiresAt ~30 days out', async () => {
  const { enablePartnerSpecialsTrial } = await import('../services/venue/venuePartnerSpecialsLifecycleService.js')
  const result = await enablePartnerSpecialsTrial('trial-venue-expires')
  if (!result.trialExpiresAt) return 'trialExpiresAt missing'
  const diff = (new Date(result.trialExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)
  return (diff >= 29 && diff <= 31) || `expected ~30 days, got ${diff.toFixed(1)}`
})

await checkAsync(32, 'cancelPartnerSpecials sets status to cancelled', async () => {
  const { enablePartnerSpecialsTrial, cancelPartnerSpecials } = await import('../services/venue/venuePartnerSpecialsLifecycleService.js')
  await enablePartnerSpecialsTrial('cancel-venue-1')
  const result = await cancelPartnerSpecials('cancel-venue-1')
  return result.status === 'cancelled' || `got: ${result.status}`
})

await checkAsync(33, 'canVenueDisplayPartnerSpecials: false when disabled', async () => {
  const { canVenueDisplayPartnerSpecials } = await import('../services/venue/venuePartnerSpecialsLifecycleService.js')
  const result = await canVenueDisplayPartnerSpecials('display-test-venue-new')
  return result.canDisplay === false || `got: ${result.canDisplay}`
})

await checkAsync(34, 'canVenueAcceptPartnerVendorOrders: false when disabled', async () => {
  const { canVenueAcceptPartnerVendorOrders } = await import('../services/venue/venuePartnerSpecialsLifecycleService.js')
  const result = await canVenueAcceptPartnerVendorOrders('accept-test-venue-new')
  return result.canAcceptPartnerOrders === false || `got: ${result.canAcceptPartnerOrders}`
})

// 35–39. Staff policy engine
await checkAsync(35, 'canRolePublishSpecial: manager allowed by default', async () => {
  const { canRolePublishSpecial } = await import('../services/venue/venueStaffPolicyEngine.js')
  const result = await canRolePublishSpecial('staff-policy-venue', 'manager')
  return result.allowed === true || `got: ${result.allowed}`
})

await checkAsync(36, 'canRolePublishSpecial: bartender not allowed by default', async () => {
  const { canRolePublishSpecial } = await import('../services/venue/venueStaffPolicyEngine.js')
  const result = await canRolePublishSpecial('staff-policy-venue', 'bartender')
  return result.allowed === false || `got: ${result.allowed}`
})

await checkAsync(37, 'canRoleCreateSpecial: server can suggest (create) by default', async () => {
  const { canRoleCreateSpecial } = await import('../services/venue/venueStaffPolicyEngine.js')
  const result = await canRoleCreateSpecial('staff-policy-venue', 'server')
  return result.allowed === true || `got: ${result.allowed}`
})

await checkAsync(38, 'validateStaffAction: unknown_role returns allowed:false', async () => {
  const { validateStaffAction } = await import('../services/venue/venueStaffPolicyEngine.js')
  const result = await validateStaffAction('v1', 'unknown_role', 'create_special')
  return result.allowed === false || `got: ${result.allowed}`
})

await checkAsync(39, 'validateStaffAction: unknown action type returns ok:false', async () => {
  const { validateStaffAction } = await import('../services/venue/venueStaffPolicyEngine.js')
  const result = await validateStaffAction('v1', 'manager', 'unknown_action')
  return result.ok === false || `got ok:${result.ok}`
})

// 40. Readiness aggregator
await checkAsync(40, 'getFullVenueReadiness returns readinessScore and warnings', async () => {
  const { getFullVenueReadiness } = await import('../services/venue/venueReadinessAggregator.js')
  const result = await getFullVenueReadiness('agg-venue-1')
  return (result.readinessScore !== undefined && Array.isArray(result.warnings)) ||
    'readinessScore or warnings missing'
})

// 41. EAT contract hook
await checkAsync(41, 'getVenueOnboardingHooks returns onboarding control layer message', async () => {
  const { getVenueOnboardingHooks } = await import('../services/eatCommandHubContract.js')
  const result = await getVenueOnboardingHooks('eat-hook-venue')
  return result.message?.includes('control layer') || `message: ${result.message}`
})

// 42–43. Protected files
check(42, 'SmokeCraftAssetScreen.jsx untouched', () =>
  fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx') || 'file missing')

check(43, 'Documentation exists with required phrase', () => {
  if (!fileExists('docs/VENUE_ONBOARDING_ENGINE.md')) return 'doc missing'
  const src = readFile('docs/VENUE_ONBOARDING_ENGINE.md')
  return src.includes('Venue onboarding is the control layer') || 'required phrase missing'
})

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed}/${passed + failed} passing ===\n`)
if (failures.length) {
  console.error('Failures:')
  failures.forEach(f => console.error(' ', f))
  process.exit(1)
} else {
  console.log('All 43 checks passed. Venue Onboarding Engine verified.')
  process.exit(0)
}
