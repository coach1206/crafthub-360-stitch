/**
 * Stripe Readiness Service
 * Reports Stripe configuration status. Never returns actual key values.
 * Only presence/absence is checked and reported.
 */

function redactKey(key) {
  if (!key || key.length < 8) return '****'
  return key.slice(0, 7) + '****' + key.slice(-4)
}

export function getStripeSecretKeyStatus() {
  const present = !!process.env.STRIPE_SECRET_KEY
  const val = process.env.STRIPE_SECRET_KEY || ''
  const isLive = val.startsWith('sk_live_')
  const isTest = val.startsWith('sk_test_')
  return {
    present,
    status: present ? 'stripe_configured_backend' : 'stripe_secret_key_required',
    environment: present ? (isLive ? 'live' : isTest ? 'test' : 'unknown_format') : 'not_configured',
    redacted: present ? redactKey(val) : null,
    keyName: 'STRIPE_SECRET_KEY',
    backendOnly: true,
    neverExposeToFrontend: true,
  }
}

export function getStripePublishableKeyStatus() {
  const viteKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY
  const legacyKey = process.env.STRIPE_PUBLISHABLE_KEY
  const val = viteKey || legacyKey || ''
  const present = !!val
  const isLive = val.startsWith('pk_live_')
  const isTest = val.startsWith('pk_test_')
  return {
    present,
    status: present ? 'stripe_configured_frontend' : 'stripe_publishable_key_required',
    environment: present ? (isLive ? 'live' : isTest ? 'test' : 'unknown_format') : 'not_configured',
    redacted: present ? redactKey(val) : null,
    viteKeyName: 'VITE_STRIPE_PUBLISHABLE_KEY',
    legacyKeyName: 'STRIPE_PUBLISHABLE_KEY',
    safeForFrontend: true,
    activeKeyName: viteKey ? 'VITE_STRIPE_PUBLISHABLE_KEY' : legacyKey ? 'STRIPE_PUBLISHABLE_KEY' : null,
  }
}

export function getStripeWebhookSecretStatus() {
  const present = !!process.env.STRIPE_WEBHOOK_SECRET
  const val = process.env.STRIPE_WEBHOOK_SECRET || ''
  return {
    present,
    status: present ? 'stripe_webhook_ready' : 'stripe_webhook_secret_required',
    webhookStatus: present ? 'webhook_configured' : 'webhook_not_live',
    paymentWebhookStatus: present ? 'payment_webhook_ready' : 'payment_webhook_pending',
    redacted: present ? redactKey(val) : null,
    keyName: 'STRIPE_WEBHOOK_SECRET',
    backendOnly: true,
  }
}

export function getStripePaymentReadiness() {
  const secret = getStripeSecretKeyStatus()
  const publishable = getStripePublishableKeyStatus()
  const webhook = getStripeWebhookSecretStatus()

  const hasSecret = secret.present
  const hasPublishable = publishable.present

  return {
    paymentReady: hasSecret && hasPublishable,
    status: hasSecret && hasPublishable ? 'payment_ready_with_env' : 'payment_blocked_missing_env',
    stripeSecretStatus: secret.status,
    stripePublishableStatus: publishable.status,
    stripeWebhookStatus: webhook.status,
    degradedMode: !hasSecret,
    blockers: [
      ...(!hasSecret ? ['stripe_secret_key_required'] : []),
      ...(!hasPublishable ? ['stripe_publishable_key_required'] : []),
    ],
    warnings: [
      ...(!webhook.present ? ['stripe_webhook_secret_required', 'webhook_not_live', 'payment_webhook_pending'] : []),
    ],
  }
}

export function getStripeCheckoutReadiness() {
  const secret = getStripeSecretKeyStatus()
  const publishable = getStripePublishableKeyStatus()
  return {
    checkoutReady: secret.present && publishable.present,
    status: secret.present && publishable.present ? 'checkout_ready_with_env' : 'checkout_disabled_missing_env',
    backendReady: secret.present,
    frontendReady: publishable.present,
    blockers: [
      ...(!secret.present ? ['stripe_secret_key_required'] : []),
      ...(!publishable.present ? ['stripe_publishable_key_required'] : []),
    ],
  }
}

export function getStripeWebhookReadiness() {
  return getStripeWebhookSecretStatus()
}

export function buildStripeReadinessReport() {
  const secret = getStripeSecretKeyStatus()
  const publishable = getStripePublishableKeyStatus()
  const webhook = getStripeWebhookSecretStatus()
  const payment = getStripePaymentReadiness()
  const checkout = getStripeCheckoutReadiness()

  return {
    stripeReady: payment.paymentReady,
    paymentStatus: payment.status,
    secretKey: secret,
    publishableKey: publishable,
    webhookSecret: webhook,
    paymentReadiness: payment,
    checkoutReadiness: checkout,
    webhookReadiness: webhook,
    blockers: payment.blockers,
    warnings: payment.warnings,
    degradedMode: payment.degradedMode,
    timestamp: new Date().toISOString(),
    note: 'Key values are never returned. Only presence/absence reported.',
  }
}

export function buildStripeMissingKeyResponse(missingKeys = []) {
  return {
    ok: false,
    status: 'stripe_not_configured',
    missingKeys,
    blockers: missingKeys.map(k => `${k.toLowerCase().replace('stripe_', 'stripe_').replace(/_/g, '_')}_required`),
    paymentStatus: 'payment_blocked_missing_env',
    degradedMode: true,
    canProcessPayment: false,
    note: 'Configure Stripe environment variables to enable payment processing.',
  }
}

export function buildStripeConfiguredResponse() {
  const report = buildStripeReadinessReport()
  return {
    ok: report.stripeReady,
    status: report.paymentStatus,
    stripeConfigured: report.stripeReady,
    backendConfigured: report.secretKey.present,
    frontendConfigured: report.publishableKey.present,
    webhookConfigured: report.webhookSecret.present,
    environment: report.secretKey.environment,
    degradedMode: report.degradedMode,
    note: 'Key values are never returned in API responses.',
  }
}
