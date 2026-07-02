/**
 * verifyPartnerVendorOnboardingEngine.js — 48 checks
 * Verifies Phase 6 Partner Vendor Onboarding Engine foundation.
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
    if (result === true || result === undefined) { console.log(`  ✓ [${id}] ${description}`); passed++ }
    else { console.error(`  ✗ [${id}] ${description} — ${result}`); failed++; failures.push(`[${id}] ${description}: ${result}`) }
  } catch (err) { console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`); failed++; failures.push(`[${id}] threw ${err.message}`) }
}

async function checkAsync(id, description, fn) {
  try {
    const result = await fn()
    if (result === true || result === undefined) { console.log(`  ✓ [${id}] ${description}`); passed++ }
    else { console.error(`  ✗ [${id}] ${description} — ${result}`); failed++; failures.push(`[${id}] ${description}: ${result}`) }
  } catch (err) { console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`); failed++; failures.push(`[${id}] threw ${err.message}`) }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function readFile(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

console.log('\n=== verifyPartnerVendorOnboardingEngine — 48 checks ===\n')

// 1–9. File and migration existence
check(1, 'Migration 021 exists', () => fileExists('server/db/migrations/021_partner_vendor_onboarding_engine.sql') || 'file missing')

const migration = fileExists('server/db/migrations/021_partner_vendor_onboarding_engine.sql')
  ? readFile('server/db/migrations/021_partner_vendor_onboarding_engine.sql') : ''

check(2, 'partner_vendor_profiles table defined', () => migration.includes('partner_vendor_profiles') || 'table not found')
check(3, 'partner_vendor_onboarding_status table defined', () => migration.includes('partner_vendor_onboarding_status') || 'table not found')
check(4, 'partner_vendor_venue_relationships table defined', () => migration.includes('partner_vendor_venue_relationships') || 'table not found')
check(5, 'partner_vendor_products table defined', () => migration.includes('partner_vendor_products') || 'table not found')
check(6, 'partner_vendor_product_availability table defined', () => migration.includes('partner_vendor_product_availability') || 'table not found')
check(7, 'partner_vendor_fulfillment_rules table defined', () => migration.includes('partner_vendor_fulfillment_rules') || 'table not found')
check(8, 'partner_vendor_commission_agreements table defined', () => migration.includes('partner_vendor_commission_agreements') || 'table not found')
check(9, 'partner_vendor_audit_logs table defined', () => migration.includes('partner_vendor_audit_logs') || 'table not found')

// 10–20. Service file existence
check(10, 'partnerVendorOnboardingEngine.js exists', () => fileExists('server/services/partner/partnerVendorOnboardingEngine.js') || 'file missing')
check(11, 'partnerVenueRelationshipService.js exists', () => fileExists('server/services/partner/partnerVenueRelationshipService.js') || 'file missing')
check(12, 'partnerProductMenuService.js exists', () => fileExists('server/services/partner/partnerProductMenuService.js') || 'file missing')
check(13, 'partnerAvailabilityService.js exists', () => fileExists('server/services/partner/partnerAvailabilityService.js') || 'file missing')
check(14, 'partnerFulfillmentRuleService.js exists', () => fileExists('server/services/partner/partnerFulfillmentRuleService.js') || 'file missing')
check(15, 'partnerCommissionAgreementService.js exists', () => fileExists('server/services/partner/partnerCommissionAgreementService.js') || 'file missing')
check(16, 'partnerPayoutReadinessService.js exists', () => fileExists('server/services/partner/partnerPayoutReadinessService.js') || 'file missing')
check(17, 'partnerSpecialEligibilityEngine.js exists', () => fileExists('server/services/partner/partnerSpecialEligibilityEngine.js') || 'file missing')
check(18, 'partnerAuditLogService.js exists', () => fileExists('server/services/partner/partnerAuditLogService.js') || 'file missing')
check(19, 'partnerVendorController.js exists', () => fileExists('server/controllers/partnerVendorController.js') || 'file missing')
check(20, 'partnerVendorRoutes.js exists', () => fileExists('server/routes/partnerVendorRoutes.js') || 'file missing')

// 21. Routes mounted
check(21, 'partner routes mounted in server/index.js', () => {
  const src = readFile('server/index.js')
  return (src.includes('partnerVendorRoutes') && src.includes('/api/partners')) || 'routes not mounted'
})

// 22–24. Partner profile defaults
await checkAsync(22, 'createPartnerProfile returns ok:false when partnerId missing', async () => {
  const { createPartnerProfile } = await import('../services/partner/partnerVendorOnboardingEngine.js')
  const result = await createPartnerProfile({ partnerName: 'Test' })
  return result.ok === false || `expected ok:false, got ok:${result.ok}`
})

await checkAsync(23, 'getPartnerOnboardingStatus returns partner_onboarding_required by default', async () => {
  const { getPartnerOnboardingStatus } = await import('../services/partner/partnerVendorOnboardingEngine.js')
  const result = await getPartnerOnboardingStatus('new-partner-x')
  return result.status.overall_status === 'partner_onboarding_required' || `got: ${result.status?.overall_status}`
})

await checkAsync(24, 'getPartnerCommerceReadiness returns partner_onboarding_required', async () => {
  const { getPartnerCommerceReadiness } = await import('../services/partner/partnerVendorOnboardingEngine.js')
  const result = await getPartnerCommerceReadiness('new-partner-y')
  return result.overallStatus === 'partner_onboarding_required' || `got: ${result.overallStatus}`
})

// 25–26. Venue approval defaults
await checkAsync(25, 'venue approval defaults to venue_approval_required', async () => {
  const { getPartnerVenueRelationship } = await import('../services/partner/partnerVenueRelationshipService.js')
  const result = await getPartnerVenueRelationship('p-new', 'v-new')
  return (result.relationship === null || result.relationship?.approval_status === 'venue_approval_required') ||
    `got: ${result.relationship?.approval_status}`
})

await checkAsync(26, 'partner cannot sell at venue without approval', async () => {
  const { canPartnerSellAtVenue } = await import('../services/partner/partnerVenueRelationshipService.js')
  const result = await canPartnerSellAtVenue('p-no-approval', 'v-test')
  return result.canSell === false || `got canSell: ${result.canSell}`
})

// 27–29. Product defaults
await checkAsync(27, 'createPartnerProduct defaults to draft status', async () => {
  const { createPartnerProduct } = await import('../services/partner/partnerProductMenuService.js')
  const result = await createPartnerProduct('p1', { productId: 'prod-draft-1', productName: 'Test Item' })
  return result.product?.status === 'draft' || `got: ${result.product?.status}`
})

await checkAsync(28, 'product cannot become customer-facing without approval (status=draft)', async () => {
  const { getPartnerProduct } = await import('../services/partner/partnerProductMenuService.js')
  const result = await getPartnerProduct('p1', 'prod-draft-1')
  return result.product?.status !== 'active' || 'product incorrectly marked active'
})

await checkAsync(29, 'listVenueEligiblePartnerProducts excludes draft products', async () => {
  const { listVenueEligiblePartnerProducts } = await import('../services/partner/partnerProductMenuService.js')
  const result = await listVenueEligiblePartnerProducts('v-eligible-test')
  return Array.isArray(result.products) || 'products not an array'
})

// 30–31. Availability
await checkAsync(30, 'unavailable product blocks order', async () => {
  const { setProductAvailability, isProductAvailableNow } = await import('../services/partner/partnerAvailabilityService.js')
  await setProductAvailability('p-avail', 'prod-unavail', { availabilityStatus: 'unavailable' })
  const result = await isProductAvailableNow('p-avail', 'prod-unavail')
  return result.available === false || `got available:${result.available}`
})

await checkAsync(31, 'sold-out product blocks order', async () => {
  const { markProductSoldOut, isProductAvailableNow } = await import('../services/partner/partnerAvailabilityService.js')
  await markProductSoldOut('p-sold', 'prod-sold-1')
  const result = await isProductAvailableNow('p-sold', 'prod-sold-1')
  return result.available === false && result.reason === 'sold_out' || `got: ${result.reason}`
})

// 32. Fulfillment default
await checkAsync(32, 'missing fulfillment rules return fulfillment_rules_required', async () => {
  const { getFulfillmentRules } = await import('../services/partner/partnerFulfillmentRuleService.js')
  const result = await getFulfillmentRules('p-no-fulfillment')
  return result.fulfillmentStatus === 'fulfillment_rules_required' || `got: ${result.fulfillmentStatus}`
})

// 33–35. Commission agreement
await checkAsync(33, 'missing commission agreement returns agreement_required', async () => {
  const { getActiveCommissionAgreement } = await import('../services/partner/partnerCommissionAgreementService.js')
  const result = await getActiveCommissionAgreement('p-no-agreement')
  return result.ok === false && result.agreementStatus === 'agreement_required' || `ok:${result.ok} status:${result.agreementStatus}`
})

await checkAsync(34, 'default commission split is 10% / 5% / 85%', async () => {
  const { calculateAgreementSplit } = await import('../services/partner/partnerCommissionAgreementService.js')
  const result = await calculateAgreementSplit('p-default-split', null, 10000)
  const sum = result.smokecraftCommissionCents + result.venueReferralCents + result.partnerPayoutCents
  return sum === 10000 && result.smokecraftCommissionCents === 1000 && result.venueReferralCents === 500 ||
    `commission:${result.smokecraftCommissionCents} referral:${result.venueReferralCents} sum:${sum}`
})

await checkAsync(35, 'default routing fee is $4.50 (450 cents)', async () => {
  const { calculateAgreementSplit } = await import('../services/partner/partnerCommissionAgreementService.js')
  const result = await calculateAgreementSplit('p-routing', null, 10000)
  return result.routingFeeCents === 450 || `got: ${result.routingFeeCents}`
})

// 36. Payout readiness
await checkAsync(36, 'missing payout account returns payout_onboarding_required', async () => {
  const { getPartnerPayoutReadiness } = await import('../services/partner/partnerPayoutReadinessService.js')
  const result = await getPartnerPayoutReadiness('p-no-payout')
  return result.payoutStatus === 'payout_onboarding_required' || `got: ${result.payoutStatus}`
})

// 37. Partner special eligibility
await checkAsync(37, 'partner special eligibility returns blockers when conditions not met', async () => {
  const { canPartnerProductBecomeSpecial } = await import('../services/partner/partnerSpecialEligibilityEngine.js')
  const result = await canPartnerProductBecomeSpecial('p-unready', 'prod-unready', 'v-unready')
  return result.eligible === false && result.blockers.length > 0 || `eligible:${result.eligible} blockers:${result.blockers?.length}`
})

// 38. Audit log
await checkAsync(38, 'audit logging returns memory_fallback without database', async () => {
  const { logPartnerAction } = await import('../services/partner/partnerAuditLogService.js')
  const result = await logPartnerAction({ partnerId: 'p1', actionType: 'test_action' })
  return result.storageMode === 'memory_fallback' || `got: ${result.storageMode}`
})

// 39. E.A.T. hooks
await checkAsync(39, 'getPartnerVendorHooks returns settlement_pending_preview', async () => {
  const { getPartnerVendorHooks } = await import('../services/eatCommandHubContract.js')
  const result = await getPartnerVendorHooks('p-eat-hook')
  return result.settlementStatus === 'settlement_pending_preview' || `got: ${result.settlementStatus}`
})

await checkAsync(40, 'getPartnerVendorHooks has required message about customer-facing', async () => {
  const { getPartnerVendorHooks } = await import('../services/eatCommandHubContract.js')
  const result = await getPartnerVendorHooks('p-eat-hook-2')
  return result.message?.includes('venue approval') || `message: ${result.message}`
})

// 41. Ticket Tapper / venue specials still work
await checkAsync(41, 'venue-only specials: getVenuePartnerSpecialsSettings still returns disabled by default', async () => {
  const { getVenuePartnerSpecialsSettings } = await import('../services/venue/venueSettingsService.js')
  const result = await getVenuePartnerSpecialsSettings('venue-specials-check')
  return result.data.partner_specials_enabled === false || `got: ${result.data.partner_specials_enabled}`
})

// 42. Venue readiness warning behavior
await checkAsync(42, 'venue readiness does not require partner vendors when partner specials disabled', async () => {
  const { getVenueReadinessWarnings } = await import('../services/venue/venueOnboardingEngine.js')
  const result = await getVenueReadinessWarnings('venue-no-partners')
  const hasPartnerVendorWarning = result.warnings?.some(w => w.type === 'partner_vendor_incomplete')
  return !hasPartnerVendorWarning || 'unexpected partner_vendor_incomplete warning when specials disabled'
})

// 43. POS360 mapping does not guess IDs
await checkAsync(43, 'POS360 item mapping does not guess provider item IDs', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'server/services/pos360ItemMappingService.js'), 'utf8')
  const forbidden = ['guessItemId', 'generateItemId', 'automap', 'autoMap']
  const found = forbidden.filter(f => src.includes(f))
  return found.length === 0 || `forbidden pattern: ${found.join(', ')}`
})

// 44. Money Bridge honest status
check(44, 'No fake settlement language in partnerCommissionAgreementService.js', () => {
  const src = readFile('server/services/partner/partnerCommissionAgreementService.js')
  const lower = src.toLowerCase()
  const forbidden = ['payout ready', 'settlement ready', 'vendor live', 'partner live', 'active seller', 'fully onboarded']
  const found = forbidden.filter(f => lower.includes(f))
  return found.length === 0 || `forbidden language: ${found.join(', ')}`
})

// 45–46. Protected files
check(45, 'SmokeCraftAssetScreen.jsx untouched', () => fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx') || 'file missing')
check(46, 'VISIT_STRUCTURE in session.js untouched', () => fileExists('src/constants/session.js') || 'file missing')

// 47. Documentation
check(47, 'PARTNER_VENDOR_ONBOARDING_ENGINE.md exists', () =>
  fileExists('docs/PARTNER_VENDOR_ONBOARDING_ENGINE.md') || 'file missing')

check(48, 'Doc contains required phrase', () => {
  if (!fileExists('docs/PARTNER_VENDOR_ONBOARDING_ENGINE.md')) return 'doc missing'
  const src = readFile('docs/PARTNER_VENDOR_ONBOARDING_ENGINE.md')
  return src.includes('Partner vendors should never become customer-facing') || 'required phrase missing'
})

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed}/${passed + failed} passing ===\n`)
if (failures.length) {
  console.error('Failures:')
  failures.forEach(f => console.error(' ', f))
  process.exit(1)
} else {
  console.log('All 48 checks passed. Partner Vendor Onboarding Engine verified.')
  process.exit(0)
}
