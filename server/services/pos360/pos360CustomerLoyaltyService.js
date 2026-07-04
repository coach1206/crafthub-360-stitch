/**
 * pos360CustomerLoyaltyService.js — Phase B.8
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { GUEST_EVENTS, LOYALTY_TRANSACTION_TYPES, MANAGER_REQUIRED_ACTIONS } from './pos360GuestEventContracts.js'

const AREA = 'customer_loyalty'

async function auditRecord(venueId, tenantId, actorId, eventType, payload, customerId = null) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_guest_audit
       (tenant_id, venue_id, actor_id, customer_id, event_type, area, payload, contains_secrets, exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE)`,
    [tenantId, venueId, actorId, customerId, eventType, AREA, JSON.stringify(payload)]
  )
}

// ── Customer ──────────────────────────────────────────────────────────────────

export async function createCustomer({ venueId, tenantId, actorId, displayName, firstName, lastName, email, phone, preferredLanguage, isAnonymous, metadata = {} }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `INSERT INTO pos360_customers
       (tenant_id, venue_id, display_name, first_name, last_name, email, phone, preferred_language, is_anonymous, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [tenantId, venueId, displayName, firstName, lastName, email, phone, preferredLanguage || 'en-US', !!isAnonymous, JSON.stringify(metadata)]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.CUSTOMER_CREATED, { displayName }, result.rows[0].id)
  return { ok: true, customer: result.rows[0] }
}

export async function getCustomer({ venueId, customerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT * FROM pos360_customers WHERE id=$1 AND venue_id=$2 LIMIT 1`,
    [customerId, venueId]
  )
  if (!result.rows.length) return { ok: false, error: 'not_found', area: AREA }
  return { ok: true, customer: result.rows[0] }
}

export async function updateCustomer({ venueId, tenantId, actorId, customerId, updates }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const { displayName, firstName, lastName, email, phone, preferredLanguage } = updates
  const result = await query(
    `UPDATE pos360_customers SET display_name=COALESCE($3,display_name), first_name=COALESCE($4,first_name), last_name=COALESCE($5,last_name), email=COALESCE($6,email), phone=COALESCE($7,phone), preferred_language=COALESCE($8,preferred_language), updated_at=now()
     WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [customerId, venueId, displayName, firstName, lastName, email, phone, preferredLanguage]
  )
  if (!result.rows.length) return { ok: false, error: 'not_found', area: AREA }
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.CUSTOMER_UPDATED, { updates }, customerId)
  return { ok: true, customer: result.rows[0] }
}

export async function searchCustomers({ venueId, q, limit = 20, offset = 0 }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT * FROM pos360_customers WHERE venue_id=$1
       AND (display_name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)
       AND is_merged=FALSE
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [venueId, `%${q}%`, limit, offset]
  )
  return { ok: true, customers: result.rows }
}

// ── Guest Profile ─────────────────────────────────────────────────────────────

export async function createGuestProfile({ venueId, tenantId, actorId, customerId, membershipNumber, allergyNotes, dietaryRestrictions = [] }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `INSERT INTO pos360_guest_profiles (tenant_id, venue_id, customer_id, membership_number, allergy_notes, dietary_restrictions)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [tenantId, venueId, customerId, membershipNumber, allergyNotes, JSON.stringify(dietaryRestrictions)]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.GUEST_PROFILE_CREATED, {}, customerId)
  return { ok: true, profile: result.rows[0] }
}

export async function getGuestProfile({ venueId, customerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT * FROM pos360_guest_profiles WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`,
    [venueId, customerId]
  )
  if (!result.rows.length) return { ok: false, error: 'not_found', note: 'No loyalty profile is connected for this guest.', area: AREA }
  return { ok: true, profile: result.rows[0] }
}

export async function recordGuestVisit({ venueId, tenantId, actorId, customerId, orderAmountCents }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(
    `UPDATE pos360_guest_profiles SET visit_count=visit_count+1, total_spend_cents=total_spend_cents+$3, last_visit_at=now(), updated_at=now()
     WHERE venue_id=$1 AND customer_id=$2`,
    [venueId, customerId, orderAmountCents || 0]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.GUEST_VISIT_RECORDED, { orderAmountCents }, customerId)
  return { ok: true }
}

// ── Consent ───────────────────────────────────────────────────────────────────

export async function recordConsent({ venueId, tenantId, actorId, customerId, consentType, granted, collectionMethod }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(
    `INSERT INTO pos360_guest_consents (tenant_id, venue_id, customer_id, consent_type, granted, granted_at, collection_method)
     VALUES ($1,$2,$3,$4,$5, CASE WHEN $5 THEN now() ELSE NULL END, $6)`,
    [tenantId, venueId, customerId, consentType, granted, collectionMethod]
  )
  const ev = granted ? GUEST_EVENTS.CONSENT_GRANTED : GUEST_EVENTS.CONSENT_REVOKED
  await auditRecord(venueId, tenantId, actorId, ev, { consentType, granted }, customerId)
  return { ok: true, note: 'Consent preference recorded.' }
}

// ── Loyalty ───────────────────────────────────────────────────────────────────

export async function enrollLoyalty({ venueId, tenantId, actorId, customerId, loyaltyNumber }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const existing = await query(
    `SELECT id FROM pos360_loyalty_profiles WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`,
    [venueId, customerId]
  )
  if (existing.rows.length) return { ok: true, loyalty: existing.rows[0], note: 'Already enrolled.' }
  const result = await query(
    `INSERT INTO pos360_loyalty_profiles (tenant_id, venue_id, customer_id, loyalty_number)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [tenantId, venueId, customerId, loyaltyNumber]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.LOYALTY_ENROLLED, {}, customerId)
  return { ok: true, loyalty: result.rows[0] }
}

export async function getLoyaltyProfile({ venueId, customerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT lp.*, lt.tier_name, lt.tier_slug, lt.multiplier, lt.benefits
     FROM pos360_loyalty_profiles lp
     LEFT JOIN pos360_loyalty_tiers lt ON lp.current_tier_id=lt.id
     WHERE lp.venue_id=$1 AND lp.customer_id=$2 LIMIT 1`,
    [venueId, customerId]
  )
  if (!result.rows.length) return { ok: false, error: 'not_found', note: 'No loyalty profile is connected for this guest.', area: AREA }
  return { ok: true, loyalty: result.rows[0] }
}

export async function earnPoints({ venueId, tenantId, actorId, customerId, points, referenceId, referenceType, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const lp = await query(`SELECT * FROM pos360_loyalty_profiles WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`, [venueId, customerId])
  if (!lp.rows.length) return { ok: false, error: 'not_enrolled', note: 'No loyalty profile is connected for this guest.', area: AREA }
  const loyaltyProfileId = lp.rows[0].id
  const dupCheck = await query(`SELECT id FROM pos360_loyalty_points_ledger WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dupCheck.rows.length) return { ok: true, duplicate: true, note: 'Duplicate earn skipped.' }
  await query(`UPDATE pos360_loyalty_profiles SET points_balance=points_balance+$2, lifetime_points_earned=lifetime_points_earned+$2, last_activity_at=now() WHERE id=$1`, [loyaltyProfileId, points])
  const newBalance = lp.rows[0].points_balance + points
  await query(
    `INSERT INTO pos360_loyalty_points_ledger (tenant_id, venue_id, loyalty_profile_id, customer_id, transaction_type, points_delta, balance_after, reference_id, reference_type, reason, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [tenantId, venueId, loyaltyProfileId, customerId, LOYALTY_TRANSACTION_TYPES.EARN, points, newBalance, referenceId, referenceType, reason, idempotencyKey]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.LOYALTY_POINTS_EARNED, { points }, customerId)
  return { ok: true, pointsEarned: points, newBalance }
}

export async function redeemPoints({ venueId, tenantId, actorId, customerId, points, rewardId, orderId, paymentId, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const lp = await query(`SELECT * FROM pos360_loyalty_profiles WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`, [venueId, customerId])
  if (!lp.rows.length) return { ok: false, error: 'not_enrolled', note: 'No loyalty profile is connected for this guest.', area: AREA }
  if (lp.rows[0].points_balance < points) return { ok: false, error: 'insufficient_points', area: AREA }
  const dupCheck = await query(`SELECT id FROM pos360_loyalty_points_ledger WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dupCheck.rows.length) return { ok: true, duplicate: true, note: 'Duplicate redeem skipped.' }
  const loyaltyProfileId = lp.rows[0].id
  const newBalance = lp.rows[0].points_balance - points
  await query(`UPDATE pos360_loyalty_profiles SET points_balance=points_balance-$2, lifetime_points_redeemed=lifetime_points_redeemed+$2 WHERE id=$1`, [loyaltyProfileId, points])
  await query(
    `INSERT INTO pos360_loyalty_points_ledger (tenant_id, venue_id, loyalty_profile_id, customer_id, transaction_type, points_delta, balance_after, reference_id, reference_type, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [tenantId, venueId, loyaltyProfileId, customerId, LOYALTY_TRANSACTION_TYPES.REDEEM, -points, newBalance, rewardId, 'reward', idempotencyKey]
  )
  if (rewardId) {
    const rd = await query(`SELECT requires_manager FROM pos360_loyalty_rewards WHERE id=$1 LIMIT 1`, [rewardId])
    const requiresManager = rd.rows[0]?.requires_manager || false
    await query(
      `INSERT INTO pos360_loyalty_reward_redemptions (tenant_id, venue_id, customer_id, loyalty_profile_id, reward_id, order_id, payment_id, points_spent, status, requires_manager, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [tenantId, venueId, customerId, loyaltyProfileId, rewardId, orderId, paymentId, points, requiresManager ? 'pending_manager' : 'applied', requiresManager, idempotencyKey + '_redemption']
    )
  }
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.LOYALTY_POINTS_REDEEMED, { points }, customerId)
  return { ok: true, pointsRedeemed: points, newBalance }
}

export async function requestPointsAdjustment({ venueId, tenantId, actorId, customerId, adjustmentType, pointsDelta, reason, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const lp = await query(`SELECT id FROM pos360_loyalty_profiles WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`, [venueId, customerId])
  if (!lp.rows.length) return { ok: false, error: 'not_enrolled', note: 'No loyalty profile is connected for this guest.', area: AREA }
  const dupCheck = await query(`SELECT id FROM pos360_loyalty_adjustments WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dupCheck.rows.length) return { ok: true, duplicate: true }
  const result = await query(
    `INSERT INTO pos360_loyalty_adjustments (tenant_id, venue_id, customer_id, loyalty_profile_id, requested_by, adjustment_type, points_delta, reason, requires_manager, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9) RETURNING *`,
    [tenantId, venueId, customerId, lp.rows[0].id, actorId, adjustmentType, pointsDelta, reason, idempotencyKey]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.LOYALTY_ADJUSTMENT_REQUESTED, { adjustmentType, pointsDelta, reason }, customerId)
  return { ok: true, adjustment: result.rows[0], requiresManager: true, note: 'Points adjustment requires manager approval.' }
}

export async function approvePointsAdjustment({ venueId, tenantId, actorId, adjustmentId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const adj = await query(`SELECT * FROM pos360_loyalty_adjustments WHERE id=$1 AND venue_id=$2 LIMIT 1`, [adjustmentId, venueId])
  if (!adj.rows.length) return { ok: false, error: 'not_found', area: AREA }
  const a = adj.rows[0]
  await query(`UPDATE pos360_loyalty_adjustments SET status='approved', approved_by=$2, approved_at=now() WHERE id=$1`, [adjustmentId, actorId])
  await query(`UPDATE pos360_loyalty_profiles SET points_balance=points_balance+$2 WHERE id=$1`, [a.loyalty_profile_id, a.points_delta])
  const lp = await query(`SELECT points_balance FROM pos360_loyalty_profiles WHERE id=$1`, [a.loyalty_profile_id])
  await query(
    `INSERT INTO pos360_loyalty_points_ledger (tenant_id, venue_id, loyalty_profile_id, customer_id, transaction_type, points_delta, balance_after, reason, requires_manager, approved_by, approved_at, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9,now(),$10)`,
    [tenantId, venueId, a.loyalty_profile_id, a.customer_id, LOYALTY_TRANSACTION_TYPES.ADJUST, a.points_delta, lp.rows[0].points_balance, a.reason, actorId, adjustmentId + '_approved']
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.LOYALTY_ADJUSTMENT_APPROVED, { adjustmentId }, a.customer_id)
  return { ok: true }
}

// ── Reward Reversal ───────────────────────────────────────────────────────────

export async function requestRewardReversal({ venueId, tenantId, actorId, redemptionId, reason }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await query(`UPDATE pos360_loyalty_reward_redemptions SET requires_manager=TRUE, status='pending_reversal' WHERE id=$1 AND venue_id=$2`, [redemptionId, venueId])
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.REWARD_REVERSAL_REQUESTED, { redemptionId, reason }, null)
  return { ok: true, requiresManager: true, note: 'Reward reversal requires manager approval.' }
}

export async function approveRewardReversal({ venueId, tenantId, actorId, redemptionId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const rdm = await query(`SELECT * FROM pos360_loyalty_reward_redemptions WHERE id=$1 AND venue_id=$2 LIMIT 1`, [redemptionId, venueId])
  if (!rdm.rows.length) return { ok: false, error: 'not_found', area: AREA }
  const r = rdm.rows[0]
  await query(`UPDATE pos360_loyalty_reward_redemptions SET reversed=TRUE, reversed_by=$2, reversed_at=now(), status='reversed' WHERE id=$1`, [redemptionId, actorId])
  await query(`UPDATE pos360_loyalty_profiles SET points_balance=points_balance+$2 WHERE id=$1`, [r.loyalty_profile_id, r.points_spent])
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.REWARD_REVERSAL_APPROVED, { redemptionId }, r.customer_id)
  return { ok: true }
}

// ── Loyalty Tiers ─────────────────────────────────────────────────────────────

export async function listLoyaltyTiers({ venueId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT * FROM pos360_loyalty_tiers WHERE venue_id=$1 AND is_active=TRUE ORDER BY tier_order`,
    [venueId]
  )
  return { ok: true, tiers: result.rows }
}

export async function createLoyaltyTier({ venueId, tenantId, actorId, tierName, tierSlug, tierOrder, pointsThreshold, multiplier, benefits = [], memberPricingEnabled }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `INSERT INTO pos360_loyalty_tiers (tenant_id, venue_id, tier_name, tier_slug, tier_order, points_threshold, multiplier, benefits, member_pricing_enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (venue_id, tier_slug) DO UPDATE SET tier_name=$3, tier_order=$5, points_threshold=$6, multiplier=$7, benefits=$8, member_pricing_enabled=$9 RETURNING *`,
    [tenantId, venueId, tierName, tierSlug, tierOrder, pointsThreshold, multiplier || 1.0, JSON.stringify(benefits), !!memberPricingEnabled]
  )
  await auditRecord(venueId, tenantId, actorId, 'tier_upserted', { tierName }, null)
  return { ok: true, tier: result.rows[0] }
}

// ── Rewards Catalog ───────────────────────────────────────────────────────────

export async function listRewards({ venueId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT * FROM pos360_loyalty_rewards WHERE venue_id=$1 AND is_active=TRUE ORDER BY points_cost`,
    [venueId]
  )
  if (!result.rows.length) return { ok: true, rewards: [], note: 'No rewards are available for this guest.' }
  return { ok: true, rewards: result.rows }
}

// ── E.A.T. Insights ───────────────────────────────────────────────────────────

export async function listEATInsights({ venueId, customerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT * FROM pos360_guest_eat_insights WHERE venue_id=$1 AND customer_id=$2 ORDER BY created_at DESC LIMIT 50`,
    [venueId, customerId]
  )
  if (!result.rows.length) return { ok: true, insights: [], note: 'E.A.T. guest insights are not connected yet.' }
  return { ok: true, insights: result.rows }
}

// ── Service Recovery ──────────────────────────────────────────────────────────

export async function triggerServiceRecovery({ venueId, tenantId, actorId, customerId, recoveryType, orderId, reason }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `INSERT INTO pos360_guest_service_recovery (tenant_id, venue_id, customer_id, triggered_by, recovery_type, order_id, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [tenantId, venueId, customerId, actorId, recoveryType, orderId, reason]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.SERVICE_RECOVERY_TRIGGERED, { recoveryType, reason }, customerId)
  return { ok: true, recovery: result.rows[0] }
}

// ── Privacy ───────────────────────────────────────────────────────────────────

export async function queuePrivacyExport({ venueId, tenantId, actorId, customerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.CUSTOMER_PRIVACY_EXPORT, { queued: true }, customerId)
  return { ok: true, note: 'Privacy data export has been queued.' }
}

export async function queuePrivacyDelete({ venueId, tenantId, actorId, customerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.CUSTOMER_PRIVACY_DELETE, { queued: true }, customerId)
  return { ok: true, note: 'Privacy data deletion has been queued.' }
}

// ── Offline Queue ─────────────────────────────────────────────────────────────

export async function queueOfflineGuestAction({ venueId, tenantId, actionType, payload, idempotencyKey }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const dup = await query(`SELECT id FROM pos360_guest_offline_queue WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`, [idempotencyKey, venueId])
  if (dup.rows.length) return { ok: true, duplicate: true }
  await query(
    `INSERT INTO pos360_guest_offline_queue (tenant_id, venue_id, action_type, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5)`,
    [tenantId, venueId, actionType, JSON.stringify(payload), idempotencyKey]
  )
  return { ok: true, note: 'Guest action queued for offline sync.' }
}

// ── Merge Request ─────────────────────────────────────────────────────────────

export async function requestCustomerMerge({ venueId, tenantId, actorId, sourceCustomerId, targetCustomerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `INSERT INTO pos360_guest_merge_requests (tenant_id, venue_id, source_customer_id, target_customer_id, requested_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [tenantId, venueId, sourceCustomerId, targetCustomerId, actorId]
  )
  await auditRecord(venueId, tenantId, actorId, GUEST_EVENTS.MERGE_REQUESTED, { sourceCustomerId, targetCustomerId }, sourceCustomerId)
  return { ok: true, mergeRequest: result.rows[0], requiresManager: true, note: 'Customer merge requires manager approval.' }
}

// ── SmokeCraft Link (placeholder) ─────────────────────────────────────────────

export async function getSmokecraftLink({ venueId, customerId }) {
  if (!isDbAvailable()) return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA }
  const result = await query(
    `SELECT * FROM pos360_guest_smokecraft_links WHERE venue_id=$1 AND customer_id=$2 LIMIT 1`,
    [venueId, customerId]
  )
  if (!result.rows.length) return { ok: true, link: null, note: 'SmokeCraft guest intelligence is not connected yet.' }
  return { ok: true, link: result.rows[0] }
}
