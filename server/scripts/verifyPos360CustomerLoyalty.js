/**
 * verifyPos360CustomerLoyalty.js — Phase B.8 verification (38 checks)
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, fn) {
  try {
    const ok = fn()
    if (ok) { console.log(`  ✓  ${label}`); passed++ }
    else    { console.error(`  ✗  ${label}`); failed++ }
  } catch (e) {
    console.error(`  ✗  ${label} — ${e.message}`)
    failed++
  }
}

function read(rel) { return readFileSync(join(root, rel), 'utf8') }
function exists(rel) { return existsSync(join(root, rel)) }

function noDropTable(rel) {
  const lines = read(rel).split('\n')
  return !lines.some(l => !l.trimStart().startsWith('--') && /DROP\s+TABLE/i.test(l))
}

console.log('\n── Phase B.8 Customer, Loyalty, Rewards & Guest Intelligence — 38 Checks ────────\n')

// ── Migration ──────────────────────────────────────────────────────────────────
check('Migration file exists',
  () => exists('server/db/migrations/038_pos360_customer_loyalty.sql'))

check('Migration: no DROP TABLE (non-comment lines only)',
  () => noDropTable('server/db/migrations/038_pos360_customer_loyalty.sql'))

check('Migration: pos360_customers table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_customers'))

check('Migration: pos360_guest_profiles table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_profiles'))

check('Migration: pos360_guest_identities table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_identities'))

check('Migration: pos360_guest_consents table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_consents'))

check('Migration: pos360_guest_activity_timeline table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_activity_timeline'))

check('Migration: pos360_guest_duplicate_candidates table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_duplicate_candidates'))

check('Migration: pos360_guest_merge_requests table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_merge_requests'))

check('Migration: pos360_loyalty_profiles table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_loyalty_profiles'))

check('Migration: pos360_loyalty_tiers table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_loyalty_tiers'))

check('Migration: pos360_loyalty_points_ledger table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_loyalty_points_ledger'))

check('Migration: pos360_loyalty_rewards table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_loyalty_rewards'))

check('Migration: pos360_loyalty_reward_redemptions table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_loyalty_reward_redemptions'))

check('Migration: pos360_loyalty_adjustments table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_loyalty_adjustments'))

check('Migration: pos360_guest_smokecraft_links table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_smokecraft_links'))

check('Migration: pos360_guest_eat_insights table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_eat_insights'))

check('Migration: pos360_guest_service_recovery table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_service_recovery'))

check('Migration: pos360_guest_offline_queue table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_offline_queue'))

check('Migration: pos360_guest_audit table',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('pos360_guest_audit'))

check('Migration: idempotency_key in ledger',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('idempotency_key'))

check('Migration: exposes_private_data column present',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('exposes_private_data'))

check('Migration: contains_secrets column present',
  () => read('server/db/migrations/038_pos360_customer_loyalty.sql').includes('contains_secrets'))

// ── Event Contracts ────────────────────────────────────────────────────────────
check('Event contracts file exists',
  () => exists('server/services/pos360/pos360GuestEventContracts.js'))

check('GUEST_EVENTS exported',
  () => read('server/services/pos360/pos360GuestEventContracts.js').includes('export const GUEST_EVENTS'))

check('SUPPORTED_LANGUAGES exported from event contracts',
  () => read('server/services/pos360/pos360GuestEventContracts.js').includes('export const SUPPORTED_LANGUAGES'))

check('DEFAULT_LOYALTY_TIER_NAMES exported (not hardcoded)',
  () => read('server/services/pos360/pos360GuestEventContracts.js').includes('export const DEFAULT_LOYALTY_TIER_NAMES'))

// ── Feature Flags ──────────────────────────────────────────────────────────────
check('Feature flags file exists',
  () => exists('server/config/pos360GuestFeatureFlags.js'))

check('getGuestFlags exported',
  () => read('server/config/pos360GuestFeatureFlags.js').includes('export function getGuestFlags'))

// ── Localization ───────────────────────────────────────────────────────────────
check('Localization file exists',
  () => exists('src/locales/pos360Guest.js'))

check('t() function exported',
  () => read('src/locales/pos360Guest.js').includes('export function t('))

check('All 6 languages present',
  () => ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'].every(l => read('src/locales/pos360Guest.js').includes(l)))

check('English no_loyalty_profile message present',
  () => read('src/locales/pos360Guest.js').includes('No loyalty profile is connected for this guest.'))

// ── Service ────────────────────────────────────────────────────────────────────
check('Service file exists',
  () => exists('server/services/pos360/pos360CustomerLoyaltyService.js'))

check('Service: correct DB import path',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes("from '../../db/connection.js'"))

check('Service: fallback comment (no DATABASE_URL mention)',
  () => {
    const src = read('server/services/pos360/pos360CustomerLoyaltyService.js')
    return src.includes('Falls back gracefully when no database connection is configured') &&
           !src.includes('DATABASE_URL')
  })

check('Service: createCustomer exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function createCustomer'))

check('Service: enrollLoyalty exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function enrollLoyalty'))

check('Service: earnPoints exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function earnPoints'))

check('Service: redeemPoints exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function redeemPoints'))

check('Service: requestPointsAdjustment exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function requestPointsAdjustment'))

check('Service: approvePointsAdjustment exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function approvePointsAdjustment'))

check('Service: requestRewardReversal exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function requestRewardReversal'))

check('Service: approveRewardReversal exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function approveRewardReversal'))

check('Service: requestCustomerMerge exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function requestCustomerMerge'))

check('Service: queuePrivacyExport exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function queuePrivacyExport'))

check('Service: queueOfflineGuestAction exported',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('export async function queueOfflineGuestAction'))

check('Service: no fake loyalty redemption success',
  () => {
    const src = read('server/services/pos360/pos360CustomerLoyaltyService.js')
    return src.includes('No loyalty profile is connected for this guest.') &&
           !src.includes('loyalty_success: true')
  })

check('Service: idempotency duplicate check present',
  () => read('server/services/pos360/pos360CustomerLoyaltyService.js').includes('idempotency_key'))

// ── Controller & Routes ────────────────────────────────────────────────────────
check('Controller file exists',
  () => exists('server/controllers/pos360CustomerLoyaltyController.js'))

check('Routes file exists',
  () => exists('server/routes/pos360CustomerLoyaltyRoutes.js'))

check('Routes: mounted at /api/pos360/guests in server/index.js',
  () => read('server/index.js').includes('/api/pos360/guests'))

// ── UI ─────────────────────────────────────────────────────────────────────────
check('UI page exists',
  () => exists('src/pages/pos360/POS360CustomerLoyalty.jsx'))

check('UI: /smokecraft-pos360.png referenced',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('/smokecraft-pos360.png'))

check('UI: CustomerSearchPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('CustomerSearchPanel'))

check('UI: GuestProfilePanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('GuestProfilePanel'))

check('UI: LoyaltyProfilePanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('LoyaltyProfilePanel'))

check('UI: TierManagementPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('TierManagementPanel'))

check('UI: RewardsCatalogPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('RewardsCatalogPanel'))

check('UI: RewardRedemptionPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('RewardRedemptionPanel'))

check('UI: PointsAdjustmentPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('PointsAdjustmentPanel'))

check('UI: RewardReversalPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('RewardReversalPanel'))

check('UI: ConsentPrivacyPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('ConsentPrivacyPanel'))

check('UI: EATGuestInsightsPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('EATGuestInsightsPanel'))

check('UI: SmokeCraftGuestPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('SmokeCraftGuestPanel'))

check('UI: DuplicateDetectionPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('DuplicateDetectionPanel'))

check('UI: MergeRequestPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('MergeRequestPanel'))

check('UI: ServiceRecoveryPanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('ServiceRecoveryPanel'))

check('UI: GuestLanguageSelector component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('GuestLanguageSelector'))

check('UI: GuestOfflineQueuePanel component present',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('GuestOfflineQueuePanel'))

check('UI: honest empty state — no loyalty profile message',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('No loyalty profile is connected for this guest.'))

check('UI: honest empty state — E.A.T. not connected',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('E.A.T. guest insights are not connected yet.'))

check('UI: honest empty state — SmokeCraft not connected',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('SmokeCraft guest intelligence is not connected yet.'))

check('UI: honest empty state — no rewards available',
  () => read('src/pages/pos360/POS360CustomerLoyalty.jsx').includes('No rewards are available for this guest.'))

check('App.jsx: guests route registered',
  () => read('src/App.jsx').includes('path="guests"') && read('src/App.jsx').includes('POS360CustomerLoyalty'))

console.log(`\n── Result: ${passed} passed, ${failed} failed ──────────────────────────\n`)
if (failed > 0) process.exit(1)
