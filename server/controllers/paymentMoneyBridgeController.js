/**
 * Payment / Money Bridge Controller
 * All responses sanitized — never exposes Stripe keys, secrets, or raw PII.
 */

import { listPaymentProviderReadiness, getStripeReadiness } from '../config/paymentProviderConfig.js'
import { buildPaymentPreview, calculateMoneyBridgeSplit, getMoneyBridgePaymentStatus } from '../services/payments/moneyBridgePaymentEngine.js'
import { getOwnerPaymentAccount, createOwnerPaymentAccount, beginOwnerOnboarding, refreshOwnerOnboardingStatus, getVenuePaymentReadiness, getPartnerVendorPaymentReadiness, getPlatformPaymentReadiness } from '../services/payments/paymentAccountOnboardingService.js'
import { createPaymentIntent, createCheckoutSession, createRefund } from '../services/payments/stripeConnectService.js'
import { previewRefund, requestRefund, getRefundsForOrder } from '../services/payments/paymentRefundReversalService.js'
import { receivePaymentWebhook } from '../services/payments/paymentWebhookService.js'
import { getPaymentAuditLogs, logPaymentAction } from '../services/payments/paymentAuditLogService.js'

function safeAccount(account) {
  if (!account) return null
  const forbidden = ['stripe_secret_key', 'connected_account_secret', 'refresh_token', 'access_token']
  const result = { ...account }
  for (const key of forbidden) delete result[key]
  return result
}

export async function getPaymentReadiness(req, res) {
  const readiness = listPaymentProviderReadiness()
  const platform = await getPlatformPaymentReadiness()
  res.json({
    ok: true,
    stripeReadiness: readiness.stripe.readinessStatus,
    stripeConnectReady: readiness.stripe.ready,
    missingVars: readiness.stripe.missingVars,
    platformPaymentReadiness: platform,
    settlementStatus: 'settlement_pending_preview',
    message: readiness.stripe.message,
  })
}

export async function getAccountStatus(req, res) {
  const { ownerType, ownerId } = req.params
  const result = await getOwnerPaymentAccount(ownerType, ownerId)
  res.json({ ok: true, ownerType, ownerId, account: safeAccount(result.account), accountStatus: result.accountStatus ?? result.account?.accountStatus ?? 'stripe_required', onboardingStatus: result.onboardingStatus ?? result.account?.onboardingStatus ?? 'onboarding_required', storageMode: result.storageMode })
}

export async function createAccount(req, res) {
  const { ownerType, ownerId } = req.params
  const result = await createOwnerPaymentAccount(ownerType, ownerId, req.body ?? {})
  res.json({ ok: result.ok, ownerType, ownerId, accountStatus: result.account?.accountStatus ?? 'stripe_required', storageMode: result.storageMode, message: result.message })
}

export async function createOnboardingLink(req, res) {
  const { ownerType, ownerId } = req.params
  const result = await beginOwnerOnboarding(ownerType, ownerId)
  res.json({ ok: result.ok, ownerType, ownerId, status: result.status, onboardingUrl: result.onboardingUrl ?? null, message: result.message })
}

export async function refreshAccountStatus(req, res) {
  const { ownerType, ownerId } = req.params
  const result = await refreshOwnerOnboardingStatus(ownerType, ownerId)
  res.json({ ok: result.ok, ownerType, ownerId, accountStatus: result.accountStatus, onboardingStatus: result.onboardingStatus, chargesEnabled: result.chargesEnabled ?? false, payoutsEnabled: result.payoutsEnabled ?? false, storageMode: result.storageMode })
}

export async function getPaymentPreview(req, res) {
  const orderPayload = req.body ?? {}
  const preview = buildPaymentPreview(orderPayload)
  await logPaymentAction({ actionType: 'payment_preview', request: orderPayload, response: { settlementStatus: preview.settlementStatus } })
  res.json(preview)
}

export async function createPaymentIntentHandler(req, res) {
  const result = await createPaymentIntent(req.body ?? {})
  res.json({ ok: result.ok, status: result.status, paymentIntentId: result.paymentIntentId ?? null, paymentStatus: result.paymentStatus, message: result.message })
}

export async function createCheckoutSessionHandler(req, res) {
  const result = await createCheckoutSession(req.body ?? {})
  res.json({ ok: result.ok, status: result.status, sessionId: result.sessionId ?? null, sessionUrl: result.sessionUrl ?? null, paymentStatus: result.paymentStatus })
}

export async function getOrderPaymentStatus(req, res) {
  const { orderId } = req.params
  const result = await getMoneyBridgePaymentStatus(orderId)
  res.json(result)
}

export async function getRefundPreview(req, res) {
  const { orderId } = req.params
  const preview = previewRefund(orderId, req.body ?? {})
  res.json(preview)
}

export async function createRefundHandler(req, res) {
  const { orderId } = req.params
  const refundReady = process.env.STRIPE_SECRET_KEY
  if (!refundReady) {
    return res.json({ ok: false, orderId, refundStatus: 'refund_requires_processor', message: 'Stripe not configured. Cannot process refund.' })
  }
  const result = await requestRefund(orderId, req.body ?? {})
  res.json(result)
}

export async function receiveWebhookHandler(req, res) {
  const { providerName } = req.params
  // Always 200 immediately for webhooks
  res.status(200).json({ ok: true, status: 'webhook_pending', received: true })
  // Process async (fire-and-forget)
  receivePaymentWebhook(providerName, req.body, req.headers).catch(() => {})
}

export async function getAuditLogsHandler(req, res) {
  const filters = { ownerType: req.query.ownerType, ownerId: req.query.ownerId }
  const result = await getPaymentAuditLogs(filters)
  res.json({ ok: true, logs: result.logs, storageMode: result.storageMode })
}
