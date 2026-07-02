/**
 * Payment Provider Config Contract
 * Returns readiness status based on env vars — never raw keys.
 */

const STRIPE_REQUIRED_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_CONNECT_CLIENT_ID',
]

const STRIPE_OPTIONAL_VARS = [
  'STRIPE_PLATFORM_ACCOUNT_ID',
  'STRIPE_ENVIRONMENT',
]

function checkVars(vars) {
  const missing = vars.filter(v => !process.env[v])
  return { missing, allPresent: missing.length === 0 }
}

export function getStripeReadiness() {
  const required = checkVars(STRIPE_REQUIRED_VARS)
  const hasSecret = !!process.env.STRIPE_SECRET_KEY
  const hasPublishable = !!process.env.STRIPE_PUBLISHABLE_KEY
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
  const hasConnectClientId = !!process.env.STRIPE_CONNECT_CLIENT_ID

  if (!hasSecret) {
    return {
      readinessStatus: 'stripe_keys_missing',
      stripeReady: false,
      stripeConnectReady: false,
      webhookReady: false,
      missingVars: required.missing,
      message: 'STRIPE_SECRET_KEY is not configured. Stripe is not available.',
    }
  }

  if (!hasConnectClientId) {
    return {
      readinessStatus: 'stripe_connect_required',
      stripeReady: true,
      stripeConnectReady: false,
      webhookReady: hasWebhookSecret,
      missingVars: required.missing,
      message: 'STRIPE_CONNECT_CLIENT_ID is not configured. Stripe Connect is not available.',
    }
  }

  if (!hasWebhookSecret) {
    return {
      readinessStatus: 'webhook_pending',
      stripeReady: true,
      stripeConnectReady: true,
      webhookReady: false,
      missingVars: ['STRIPE_WEBHOOK_SECRET'],
      message: 'STRIPE_WEBHOOK_SECRET is not configured. Webhook verification unavailable.',
    }
  }

  return {
    readinessStatus: 'stripe_ready',
    stripeReady: true,
    stripeConnectReady: true,
    webhookReady: true,
    missingVars: [],
    message: 'Stripe configuration detected. Integration requires live validation.',
  }
}

export function getPaymentProviderConfig(providerName) {
  if (providerName === 'manual_preview') {
    return {
      providerName: 'manual_preview',
      readinessStatus: 'payment_preview',
      ready: false,
      message: 'Manual preview mode. No payment processor configured.',
    }
  }

  if (providerName === 'stripe') {
    const readiness = getStripeReadiness()
    return {
      providerName: 'stripe',
      readinessStatus: readiness.readinessStatus,
      ready: readiness.stripeReady && readiness.stripeConnectReady,
      stripeEnvironment: process.env.STRIPE_ENVIRONMENT ?? 'not_set',
      missingVars: readiness.missingVars,
      message: readiness.message,
    }
  }

  return {
    providerName,
    readinessStatus: 'processor_integration_required',
    ready: false,
    message: `Unknown payment provider: ${providerName}`,
  }
}

export function listPaymentProviderReadiness() {
  return {
    stripe: getPaymentProviderConfig('stripe'),
    manual_preview: getPaymentProviderConfig('manual_preview'),
  }
}
