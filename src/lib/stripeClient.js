/**
 * Stripe frontend client helper.
 * Only VITE_STRIPE_PUBLISHABLE_KEY is safe to expose to the frontend.
 * The backend STRIPE_SECRET_KEY must never appear here.
 */

export function getStripePublishableKey() {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null
}

export function getStripePublishableKeyStatus() {
  const key = getStripePublishableKey()
  if (!key) {
    return {
      present: false,
      status: 'stripe_publishable_key_required',
      checkoutEnabled: false,
      message: 'Set VITE_STRIPE_PUBLISHABLE_KEY in your environment to enable checkout.',
    }
  }
  const isLive = key.startsWith('pk_live_')
  const isTest = key.startsWith('pk_test_')
  return {
    present: true,
    status: 'stripe_configured_frontend',
    checkoutEnabled: true,
    environment: isLive ? 'live' : isTest ? 'test' : 'unknown_format',
    keyPrefix: key.slice(0, 7) + '****',
  }
}

export function isStripeCheckoutEnabled() {
  return !!getStripePublishableKey()
}

export function getCheckoutDisabledReason() {
  if (!getStripePublishableKey()) {
    return 'checkout_disabled_missing_publishable_key'
  }
  return null
}
