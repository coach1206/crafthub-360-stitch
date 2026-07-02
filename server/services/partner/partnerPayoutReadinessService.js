/**
 * Partner Payout Readiness Service
 * Determines if a partner vendor can receive payouts via Stripe Connect.
 */

export async function getPartnerPayoutReadiness(partnerId) {
  const accountStatus = await getPartnerPaymentAccountStatus(partnerId)
  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID)

  return {
    partnerId,
    canReceivePartnerPayout: false,
    payoutStatus: 'payout_onboarding_required',
    stripeConfigured,
    stripeStatus: stripeConfigured ? 'stripe_keys_present' : 'stripe_keys_missing',
    connectedAccountStatus: accountStatus.status,
    payoutReadinessNote: stripeConfigured
      ? 'Stripe keys present. Partner Stripe Connect account required to receive payouts.'
      : 'Stripe Connect not configured. Payout settlement not available.',
  }
}

export async function validatePartnerCanReceivePayout(partnerId) {
  const readiness = await getPartnerPayoutReadiness(partnerId)
  if (!readiness.stripeConfigured) {
    return { canReceive: false, reason: 'stripe_keys_missing', partnerId }
  }
  return { canReceive: false, reason: 'connected_account_required', partnerId,
    message: 'Partner Stripe Connect account onboarding required.' }
}

export async function getPartnerPaymentAccountStatus(partnerId) {
  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY)
  if (!stripeConfigured) {
    return { partnerId, status: 'stripe_keys_missing', connectedAccountId: null }
  }
  return {
    partnerId,
    status: 'connected_account_required',
    connectedAccountId: null,
    message: 'No Stripe Connect account found for this partner.',
  }
}

export async function getPartnerSettlementWarnings(partnerId) {
  const warnings = []

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push({ type: 'stripe_keys_missing', severity: 'critical', message: 'Stripe secret key not configured.' })
  }
  if (!process.env.STRIPE_CONNECT_CLIENT_ID) {
    warnings.push({ type: 'stripe_connect_required', severity: 'critical', message: 'Stripe Connect client ID not configured.' })
  }
  warnings.push({ type: 'payout_onboarding_required', severity: 'warning',
    message: `Partner ${partnerId} has not completed payout/Stripe Connect onboarding.` })
  warnings.push({ type: 'settlement_pending_preview', severity: 'info',
    message: 'All partner payouts are in preview mode. Cannot release money until Stripe Connect is live.' })

  return { partnerId, warnings, payoutStatus: 'payout_onboarding_required', settlementStatus: 'settlement_pending_preview' }
}
