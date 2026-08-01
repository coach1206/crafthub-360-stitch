/**
 * Real Stripe Payment Adapter — Production Package 2 of 7.
 *
 * This is the ONLY module in the codebase that talks to the Stripe
 * network. Every other payment module (paymentService.js, routes,
 * controllers) calls through this adapter and never imports the
 * `stripe` package directly — that keeps the adapter boundary real
 * and lets tests mock exactly this file's network calls (never the
 * business logic in paymentService.js) per mandate section 2/20.
 *
 * Mode selection is env-driven and honest:
 *   - STRIPE_SECRET_KEY set, starts with `sk_live_` → 'live'
 *   - STRIPE_SECRET_KEY set, starts with `sk_test_` → 'test'
 *   - STRIPE_SECRET_KEY not set at all → adapter is NOT constructed;
 *     callers (paymentService.js) must check `isStripeConfigured()`
 *     first and fail honestly (503 payment_provider_not_configured),
 *     never fabricate a client secret or a paid state.
 *
 * A `stripeClient` may be injected (constructor param) — this is the
 * ONLY supported way tests substitute the real network call. No
 * business-logic function anywhere else is mocked.
 */
import Stripe from 'stripe'

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY
}

export function getStripeMode() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (key.startsWith('sk_live_')) return 'live'
  if (key.startsWith('sk_test_')) return 'test'
  return 'unknown_format'
}

let realClientSingleton = null
function getRealStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  if (!realClientSingleton) {
    realClientSingleton = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      appInfo: { name: 'SmokeCraft 360 Venue Humidor', version: '2.0.0' },
    })
  }
  return realClientSingleton
}

/**
 * Creates the adapter. `stripeClient` is the ONLY test seam — pass a
 * fake object shaped like the Stripe SDK surface used below to
 * exercise paymentService.js business logic deterministically without
 * a network call. Production/dev code never passes this argument.
 */
export function createStripeAdapter({ stripeClient } = {}) {
  const client = stripeClient || getRealStripeClient()
  const mode = stripeClient ? 'mocked_adapter_boundary' : getStripeMode()

  if (!client) {
    throw new Error('stripe_not_configured')
  }

  return {
    mode,

    async createPaymentIntent({ amountCents, currency, orderId, venueId, customerReference, idempotencyKey, metadata = {} }) {
      const intent = await client.paymentIntents.create(
        {
          amount: amountCents,
          currency: (currency || 'usd').toLowerCase(),
          automatic_payment_methods: { enabled: true },
          metadata: { orderId, venueId, customerReference, ...metadata },
        },
        { idempotencyKey }
      )
      return intent
    },

    async retrievePaymentIntent(providerPaymentIntentId) {
      return client.paymentIntents.retrieve(providerPaymentIntentId)
    },

    async cancelPaymentIntent(providerPaymentIntentId) {
      return client.paymentIntents.cancel(providerPaymentIntentId)
    },

    async createRefund({ providerPaymentIntentId, amountCents, reason, idempotencyKey }) {
      return client.refunds.create(
        { payment_intent: providerPaymentIntentId, amount: amountCents, reason },
        { idempotencyKey }
      )
    },

    /**
     * Signature verification happens HERE, inside the adapter, against
     * the raw request body — never against a client-forwarded/parsed
     * payload (mandate section 8). Throws on invalid signature.
     */
    constructWebhookEvent(rawBody, signatureHeader, webhookSecret) {
      return client.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret)
    },
  }
}
