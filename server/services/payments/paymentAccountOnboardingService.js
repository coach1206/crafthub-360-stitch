/**
 * Payment Account Onboarding Service
 * Manages Stripe Connect onboarding status for platform, venues, and partners.
 */

import { getStripeReadiness } from '../../config/paymentProviderConfig.js'
import { isDbAvailable, query } from '../../db/connection.js'

const previewAccountStore = new Map()

const VALID_OWNER_TYPES = ['platform', 'venue', 'partner_vendor', 'distributor', 'manufacturer']

export async function getOwnerPaymentAccount(ownerType, ownerId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM payment_provider_accounts WHERE owner_type = $1 AND owner_id = $2 LIMIT 1',
        [ownerType, ownerId]
      )
      if (rows[0]) {
        return { ok: true, account: rows[0], storageMode: 'postgres' }
      }
    } catch { /* fallback */ }
  }

  const preview = previewAccountStore.get(`${ownerType}::${ownerId}`)
  return {
    ok: true,
    account: preview ?? null,
    accountStatus: preview?.accountStatus ?? 'stripe_required',
    onboardingStatus: preview?.onboardingStatus ?? 'onboarding_required',
    storageMode: 'memory_fallback',
  }
}

export async function createOwnerPaymentAccount(ownerType, ownerId, payload = {}) {
  if (!VALID_OWNER_TYPES.includes(ownerType)) {
    return { ok: false, status: 'invalid_owner_type', message: `Invalid owner type: ${ownerType}` }
  }

  const account = {
    ownerType,
    ownerId,
    ownerName: payload.name ?? ownerId,
    paymentProvider: 'stripe',
    onboardingStatus: 'onboarding_required',
    accountStatus: 'stripe_required',
    chargesEnabled: false,
    payoutsEnabled: false,
    createdAt: new Date().toISOString(),
  }
  previewAccountStore.set(`${ownerType}::${ownerId}`, account)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO payment_provider_accounts
           (owner_type, owner_id, owner_name, payment_provider, onboarding_status, account_status)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT DO NOTHING`,
        [ownerType, ownerId, account.ownerName, 'stripe', 'onboarding_required', 'stripe_required']
      )
    } catch { /* fallback */ }
  }

  return {
    ok: true,
    account,
    storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback',
    message: 'Payment account record created. Stripe Connect onboarding required.',
  }
}

export async function beginOwnerOnboarding(ownerType, ownerId) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return {
      ok: false,
      status: 'stripe_keys_missing',
      onboardingStatus: 'onboarding_required',
      onboardingUrl: null,
      message: 'Stripe not configured. Cannot begin onboarding.',
    }
  }
  if (!readiness.stripeConnectReady) {
    return {
      ok: false,
      status: 'stripe_connect_required',
      onboardingStatus: 'onboarding_required',
      onboardingUrl: null,
      message: 'Stripe Connect client ID not configured.',
    }
  }

  return {
    ok: false,
    status: 'onboarding_required',
    onboardingStatus: 'onboarding_required',
    onboardingUrl: null,
    message: 'Onboarding flow requires live Stripe OAuth. Not implemented yet.',
  }
}

export async function refreshOwnerOnboardingStatus(ownerType, ownerId) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return { ok: false, status: 'stripe_keys_missing', onboardingStatus: 'stripe_required' }
  }

  const existing = await getOwnerPaymentAccount(ownerType, ownerId)
  return {
    ok: true,
    ownerType,
    ownerId,
    onboardingStatus: existing.account?.onboardingStatus ?? 'onboarding_required',
    accountStatus: existing.account?.accountStatus ?? 'stripe_required',
    chargesEnabled: false,
    payoutsEnabled: false,
    storageMode: existing.storageMode,
    message: 'Status from memory fallback. Live refresh requires Stripe API.',
  }
}

export async function validateOwnerCanReceivePayout(ownerType, ownerId) {
  const account = await getOwnerPaymentAccount(ownerType, ownerId)
  const a = account.account
  if (!a) {
    return { canReceivePayout: false, status: 'connected_account_required', reason: 'No payment account found.' }
  }
  if (a.accountStatus === 'stripe_required' || !a.connectedAccountId) {
    return { canReceivePayout: false, status: 'stripe_required', reason: 'Stripe Connect not configured.' }
  }
  if (a.onboardingStatus !== 'onboarding_complete') {
    return { canReceivePayout: false, status: 'onboarding_required', reason: 'Onboarding not complete.' }
  }
  if (!a.payoutsEnabled) {
    return { canReceivePayout: false, status: 'payouts_disabled', reason: 'Payouts not enabled on Stripe account.' }
  }
  return { canReceivePayout: true, status: 'payout_ready' }
}

export async function getVenuePaymentReadiness(venueId) {
  const account = await getOwnerPaymentAccount('venue', venueId)
  const readiness = getStripeReadiness()
  return {
    venueId,
    stripeReadiness: readiness.readinessStatus,
    accountStatus: account.account?.accountStatus ?? 'stripe_required',
    onboardingStatus: account.account?.onboardingStatus ?? 'onboarding_required',
    canReceiveReferralPayout: false,
    message: account.account ? 'Venue account exists. Onboarding required for payouts.' : 'No venue payment account. Create one to begin onboarding.',
    storageMode: account.storageMode,
  }
}

export async function getPartnerVendorPaymentReadiness(partnerId) {
  const account = await getOwnerPaymentAccount('partner_vendor', partnerId)
  const readiness = getStripeReadiness()
  return {
    partnerId,
    stripeReadiness: readiness.readinessStatus,
    accountStatus: account.account?.accountStatus ?? 'stripe_required',
    onboardingStatus: account.account?.onboardingStatus ?? 'onboarding_required',
    canReceivePartnerPayout: false,
    message: account.account ? 'Partner account exists. Onboarding required for payouts.' : 'No partner payment account. Create one to begin onboarding.',
    storageMode: account.storageMode,
  }
}

export async function getPlatformPaymentReadiness() {
  const readiness = getStripeReadiness()
  return {
    stripeReadiness: readiness.readinessStatus,
    stripeReady: readiness.stripeReady,
    stripeConnectReady: readiness.stripeConnectReady,
    webhookReady: readiness.webhookReady,
    missingVars: readiness.missingVars,
    commissionCollectionReady: false,
    message: readiness.stripeReady
      ? 'Stripe keys present. Connect setup required for commission collection.'
      : 'Stripe keys missing. Commission collection unavailable.',
  }
}
