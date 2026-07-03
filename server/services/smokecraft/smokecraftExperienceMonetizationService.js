/**
 * SmokeCraft Experience Monetization Service
 * Preview/governance layer only — not payment processing.
 * All billing remains preview_only. No charge is created. No payment is claimed.
 * Marketplace status: not_live_marketplace. License: license_not_enforced.
 */

import { createMonetizationRecord, MONETIZATION_TYPES, BILLING_STATUS } from '../../../src/modules/smokecraft/data/smokecraftMonetizationContract.js'
import { createRewardAuditEntry, REWARD_AUDIT_EVENTS } from './smokecraftRewardAuditService.js'
import { syncSmokeCraftOrderToEAT } from './smokecraftEatSyncBridgeService.js'

const _monetizationLog = new Map()
let _counter = 1

function newMonetizationId() {
  return `sc-mon-${Date.now()}-${_counter++}`
}

const PREVIEW_MODELS = [
  {
    type: MONETIZATION_TYPES.VENUE_SUBSCRIPTION_PREVIEW,
    label: 'Venue Subscription',
    description: 'Monthly venue subscription for SmokeCraft module access.',
    amount: 149,
    currency: 'usd',
    billingCycle: 'monthly',
    previewOnly: true,
  },
  {
    type: MONETIZATION_TYPES.PER_EXPERIENCE_FEE_PREVIEW,
    label: 'Per-Experience Fee',
    description: 'Per SmokeCraft session fee charged to venue.',
    amount: 5,
    currency: 'usd',
    billingCycle: 'per_session',
    previewOnly: true,
  },
  {
    type: MONETIZATION_TYPES.PREMIUM_PAIRING_UPGRADE_PREVIEW,
    label: 'Premium Pairing Upgrade',
    description: 'AI-backed pairing recommendation upgrade.',
    amount: 29,
    currency: 'usd',
    billingCycle: 'monthly',
    previewOnly: true,
  },
  {
    type: MONETIZATION_TYPES.PASSPORT_MEMBERSHIP_PREVIEW,
    label: 'Passport Membership',
    description: 'Customer passport membership for loyalty and rewards.',
    amount: 19,
    currency: 'usd',
    billingCycle: 'monthly',
    previewOnly: true,
  },
  {
    type: MONETIZATION_TYPES.STAFF_ASSISTED_SERVICE_FEE_PREVIEW,
    label: 'Staff-Assisted Service Fee',
    description: 'Fee for staff-assisted SmokeCraft sessions.',
    amount: 15,
    currency: 'usd',
    billingCycle: 'per_session',
    previewOnly: true,
  },
  {
    type: MONETIZATION_TYPES.LOYALTY_SPONSOR_REWARD_PREVIEW,
    label: 'Loyalty Sponsor Reward',
    description: 'Sponsor-funded reward integration.',
    amount: 0,
    currency: 'usd',
    billingCycle: 'sponsor',
    previewOnly: true,
  },
  {
    type: MONETIZATION_TYPES.WHITE_LABEL_VENUE_LICENSE_PREVIEW,
    label: 'White-Label Venue License',
    description: 'White-label SmokeCraft license for venue.',
    amount: 499,
    currency: 'usd',
    billingCycle: 'monthly',
    previewOnly: true,
  },
  {
    type: MONETIZATION_TYPES.DATA_INSIGHT_DASHBOARD_PREVIEW,
    label: 'Data Insights Dashboard',
    description: 'Advanced analytics and management dashboard.',
    amount: 79,
    currency: 'usd',
    billingCycle: 'monthly',
    previewOnly: true,
  },
]

export function getPreviewMonetizationModels() {
  return PREVIEW_MODELS.map(m => ({
    ...m,
    billingStatus: BILLING_STATUS.PREVIEW_ONLY,
    licenseStatus: 'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
    posVerified: false,
    previewOnly: true,
    note: 'No charge will be created. Billing is preview_only until billing provider is connected.',
  }))
}

export async function evaluateMonetization({ venueId, userId, sourceEventType, monetizationType }) {
  const model = PREVIEW_MODELS.find(m => m.type === monetizationType) ?? PREVIEW_MODELS[0]
  const monetizationId = newMonetizationId()

  const record = createMonetizationRecord({
    monetizationId,
    venueId,
    userId,
    sourceEventType,
    monetizationType: model.type,
    amount: model.amount,
    currency: model.currency,
    billingStatus: BILLING_STATUS.PREVIEW_ONLY,
    licenseStatus: 'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
    posVerified: false,
    previewOnly: true,
  })

  _monetizationLog.set(monetizationId, record)

  createRewardAuditEntry({
    userId, venueId,
    eventType: REWARD_AUDIT_EVENTS.MONETIZATION_EVAL,
    sourceEventType: sourceEventType ?? 'monetization_evaluate',
  })

  await syncSmokeCraftOrderToEAT(
    { userId, venueId, eventType: 'monetization.previewEvaluated', monetizationType: model.type },
    'smokeCraft.monetization.previewEvaluated'
  )

  return {
    record,
    previewOnly: true,
    billingStatus: 'preview_only',
    licenseStatus: 'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
    message: 'No charge created. Monetization model is preview_only.',
  }
}

export function getMonetizationReport(venueId) {
  const allEntries = [..._monetizationLog.values()].filter(r => r.venueId === venueId)
  return {
    venueId,
    previewModels: getPreviewMonetizationModels(),
    evaluationCount: allEntries.length,
    billingStatus: 'preview_only',
    licenseStatus: 'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
    previewOnly: true,
  }
}
