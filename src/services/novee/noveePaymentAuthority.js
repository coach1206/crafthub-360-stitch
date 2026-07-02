/**
 * NOVEE OS Payment Authority
 * NOVEE OS collects application fees but does not hold venue or vendor funds.
 * Direct-charge model: venue funds flow directly to venue Stripe accounts.
 * All payment operations are preview-only without verified Stripe Connect proof.
 */

export const NOVEE_PAYMENT_MODEL = {
  model:               'direct_charge',
  applicationFeeModel: 'novee_application_fee',
  custodyModel:        'no_custody',
  description:         'NOVEE OS collects application fees only. Venue and vendor funds flow directly through Stripe Connect. NOVEE OS does not hold, manage, or control venue or vendor funds.',
}

export const NOVEE_FEE_STRUCTURE = {
  platformFeePercent:   0,
  applicationFeeNote:   'Application fees are configured per vertical and venue. No live fee is charged without verified Stripe Connect proof.',
  partnerCommission: {
    defaultPercent:     10,
    note:               'SmokeCraft partner commission is 10%. Configured per vertical.',
  },
  venueReferral: {
    defaultPercent:     5,
    note:               'Venue referral commission is 5% of partner subtotal.',
  },
  partnerPayout: {
    defaultPercent:     85,
    note:               'Partner payout = subtotal - commission - referral. Integer cents only.',
  },
  flatRoutingFee: {
    amountCents:        450,
    note:               '$4.50 flat routing fee per order. Preview-only without Stripe verification.',
  },
}

export function getPaymentAuthorityStatus() {
  const hasStripeKey = !!(
    (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_KEY)
  )
  return {
    paymentModel:       NOVEE_PAYMENT_MODEL.model,
    custodyModel:       NOVEE_PAYMENT_MODEL.custodyModel,
    stripeConnectStatus: hasStripeKey ? 'stripe_key_present' : 'stripe_connect_preview',
    paymentBridgeMode:  hasStripeKey ? 'payment_bridge_preview' : 'payment_bridge_preview',
    disbursementMode:   'disbursement_preview',
    applicationFeeMode: 'application_fee_preview',
    message:            'NOVEE OS does not hold venue or vendor funds. All payment operations are preview-only without verified Stripe Connect proof.',
  }
}

export function buildFeePreview(subtotalCents, moduleId = 'smokecraft') {
  if (typeof subtotalCents !== 'number' || subtotalCents < 0) {
    return { ok: false, error: 'invalid_subtotal' }
  }

  const commissionCents  = Math.round(subtotalCents * 0.10)
  const referralCents    = Math.round(subtotalCents * 0.05)
  const payoutCents      = subtotalCents - commissionCents - referralCents
  const routingFeeCents  = NOVEE_FEE_STRUCTURE.flatRoutingFee.amountCents

  return {
    ok:                true,
    moduleId,
    subtotalCents,
    commissionCents,
    referralCents,
    payoutCents,
    routingFeeCents,
    totalFeeCents:     commissionCents + referralCents + routingFeeCents,
    feeMode:           'fee_preview',
    disbursementMode:  'disbursement_preview',
    custodyNote:       'NOVEE OS does not hold these funds. This is a preview calculation only.',
    message:           'Fee preview generated. No live Stripe charge or payout was initiated.',
  }
}

export function getVenuePaymentReadiness(venueId) {
  if (!venueId) return { ok: false, error: 'venue_id_required' }
  return {
    ok:                    true,
    venueId,
    stripeConnectStatus:   'stripe_connect_preview',
    payoutEligibility:     'payout_eligibility_preview',
    disbursementMode:      'disbursement_preview',
    applicationFeeMode:    'application_fee_preview',
    custodyModel:          'no_custody',
    blockers: [
      { type: 'stripe_connect_required', severity: 'critical', message: 'Stripe Connect not verified. No live payment or payout is possible.' },
    ],
    message: 'Venue payment readiness is preview-only. No funds were captured, held, or disbursed.',
  }
}

export function getPartnerPaymentReadiness(partnerId) {
  if (!partnerId) return { ok: false, error: 'partner_id_required' }
  return {
    ok:                    true,
    partnerId,
    stripeConnectStatus:   'stripe_connect_preview',
    payoutEligibility:     'payout_eligibility_preview',
    disbursementMode:      'disbursement_preview',
    commissionModel:       'partner_commission_preview',
    custodyModel:          'no_custody',
    blockers: [
      { type: 'stripe_connect_required', severity: 'critical', message: 'Stripe Connect not verified for partner. No live payout is possible.' },
    ],
    message: 'Partner payment readiness is preview-only. No partner funds were captured, held, or disbursed.',
  }
}
