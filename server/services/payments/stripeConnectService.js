/**
 * Stripe Connect Service
 * All methods fail-safe — return honest status when Stripe is not configured.
 * Never claims payment succeeded without real Stripe API confirmation.
 */

import { getStripeReadiness } from '../../config/paymentProviderConfig.js'
import { isDbAvailable, query } from '../../db/connection.js'

// In-memory account store for preview fallback
const previewAccounts = new Map()
const previewWebhookEvents = []

async function getStripeClient() {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) return null
  try {
    const mod = await import('stripe')
    const Stripe = mod.default ?? mod
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  } catch {
    return null
  }
}

export function getStripeReadinessStatus() {
  return getStripeReadiness()
}

export async function createConnectedAccount(ownerType, ownerId, ownerPayload = {}) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return { ok: false, status: 'stripe_keys_missing', message: readiness.message }
  }
  if (!readiness.stripeConnectReady) {
    return { ok: false, status: 'stripe_connect_required', message: readiness.message }
  }

  // Preview: no live Stripe call without full configuration
  const previewId = `acct_preview_${ownerType}_${ownerId}_${Date.now()}`
  const account = {
    id: previewId,
    ownerType,
    ownerId,
    onboardingStatus: 'onboarding_required',
    accountStatus: 'onboarding_required',
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    createdAt: new Date().toISOString(),
  }
  previewAccounts.set(`${ownerType}::${ownerId}`, account)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO payment_provider_accounts
           (owner_type, owner_id, owner_name, connected_account_id, onboarding_status, account_status)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT DO NOTHING`,
        [ownerType, ownerId, ownerPayload.name ?? ownerId, previewId, 'onboarding_required', 'onboarding_required']
      )
    } catch { /* fallback */ }
  }

  return {
    ok: true,
    status: 'onboarding_required',
    connectedAccountId: previewId,
    onboardingStatus: 'onboarding_required',
    chargesEnabled: false,
    payoutsEnabled: false,
    storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback',
    message: 'Connected account record created. Onboarding required before charges or payouts are enabled.',
  }
}

export async function createAccountOnboardingLink(ownerType, ownerId) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return { ok: false, status: 'stripe_keys_missing', onboardingUrl: null }
  }
  if (!readiness.stripeConnectReady) {
    return { ok: false, status: 'stripe_connect_required', onboardingUrl: null }
  }

  return {
    ok: false,
    status: 'onboarding_required',
    onboardingUrl: null,
    storageMode: 'preview_fallback',
    message: 'Onboarding link requires live Stripe Connect OAuth flow. Not implemented yet.',
  }
}

export async function refreshConnectedAccountStatus(ownerType, ownerId) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return { ok: false, status: 'stripe_keys_missing' }
  }

  const preview = previewAccounts.get(`${ownerType}::${ownerId}`)
  if (preview) {
    return {
      ok: true,
      ownerType,
      ownerId,
      accountStatus: preview.accountStatus,
      onboardingStatus: preview.onboardingStatus,
      chargesEnabled: false,
      payoutsEnabled: false,
      storageMode: 'memory_fallback',
      message: 'Account status from preview memory. Live refresh requires Stripe API.',
    }
  }

  return {
    ok: false,
    status: 'connected_account_required',
    message: 'No connected account found for this owner.',
  }
}

export async function getConnectedAccountStatus(ownerType, ownerId) {
  return refreshConnectedAccountStatus(ownerType, ownerId)
}

export async function createPaymentIntent(paymentPayload) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return {
      ok: false,
      status: 'stripe_keys_missing',
      paymentIntentId: null,
      paymentStatus: 'payment_preview',
      message: 'Stripe not configured. Returning payment preview.',
    }
  }

  return {
    ok: false,
    status: 'stripe_connect_required',
    paymentIntentId: null,
    paymentStatus: 'payment_preview',
    message: 'Payment intent creation requires live Stripe Connect setup. Not implemented yet.',
  }
}

export async function createCheckoutSession(paymentPayload) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return {
      ok: false,
      status: 'stripe_keys_missing',
      sessionId: null,
      sessionUrl: null,
      paymentStatus: 'payment_preview',
    }
  }

  return {
    ok: false,
    status: 'processor_integration_required',
    sessionId: null,
    sessionUrl: null,
    paymentStatus: 'payment_preview',
    message: 'Checkout session requires live Stripe Connect implementation.',
  }
}

export async function createTransferOrApplicationFee(settlementPayload) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return { ok: false, status: 'stripe_keys_missing', settlementStatus: 'settlement_pending_preview' }
  }

  return {
    ok: false,
    status: 'stripe_connect_required',
    settlementStatus: 'settlement_pending_preview',
    stripeTransferId: null,
    stripeApplicationFeeId: null,
    message: 'Transfer/application fee requires live Stripe Connect. Not implemented yet.',
  }
}

export async function handleStripeWebhook(payload, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    const event = {
      id: `evt_preview_${Date.now()}`,
      paymentProvider: 'stripe',
      signatureVerified: false,
      processingStatus: 'signature_required',
      receivedAt: new Date().toISOString(),
    }
    previewWebhookEvents.push(event)
    return {
      ok: false,
      status: 'signature_required',
      message: 'STRIPE_WEBHOOK_SECRET not configured. Webhook stored as unverified.',
      storageMode: 'memory_fallback',
    }
  }

  return {
    ok: false,
    status: 'webhook_pending',
    message: 'Webhook verification requires live Stripe webhook handler. Not implemented yet.',
  }
}

export async function createRefund(refundPayload) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return {
      ok: false,
      status: 'stripe_keys_missing',
      refundStatus: 'refund_requires_processor',
      message: 'Stripe not configured. Cannot process refund.',
    }
  }

  return {
    ok: false,
    status: 'processor_integration_required',
    refundStatus: 'refund_requires_processor',
    refundId: null,
    message: 'Refund requires live Stripe payment intent. Not implemented yet.',
  }
}

export async function createReversal(reversalPayload) {
  const readiness = getStripeReadiness()
  if (!readiness.stripeReady) {
    return {
      ok: false,
      status: 'stripe_keys_missing',
      refundStatus: 'reversal_pending',
    }
  }

  return {
    ok: false,
    status: 'processor_integration_required',
    refundStatus: 'reversal_pending',
    reversalId: null,
    message: 'Reversal requires live Stripe transfer. Not implemented yet.',
  }
}
