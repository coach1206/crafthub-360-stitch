/**
 * POS 3 Webhook Verifier — Phase 9
 *
 * Safety rules:
 * - Never trust incoming payload without normalization
 * - Never mutate orders directly from unknown webhook data
 * - In prototype mode, accept fake signed payloads
 * - For live providers, reject without configured verifier
 */

import crypto from 'crypto'

const VERIFIERS = {
  clover:     verifyCloverWebhook,
  toast:      verifyToastWebhook,
  square:     verifySquareWebhook,
  shopify:    verifyShopifyWebhook,
  lightspeed: verifyLightspeedWebhook,
  ncr:        verifyNcrWebhook,
  micros:     verifyMicrosWebhook,
  prototype:  verifyPrototypeWebhook,
}

/**
 * Dispatches webhook verification to the appropriate provider verifier.
 * Returns { valid: bool, reason: string }
 */
export function verifyWebhook(providerKey, payload, headers) {
  const verifier = VERIFIERS[providerKey]
  if (!verifier) {
    return { valid: false, reason: `No verifier for provider: ${providerKey}` }
  }
  try {
    return verifier(payload, headers)
  } catch (err) {
    return { valid: false, reason: `Verifier error: ${err.message}` }
  }
}

// ── Prototype ─────────────────────────────────────────────────
function verifyPrototypeWebhook(_payload, headers) {
  const sig = headers['x-novee-webhook-signature'] || ''
  if (!sig) return { valid: true, reason: 'prototype_unsigned_accepted' }
  const expected = 'novee-prototype-sig'
  return { valid: sig === expected, reason: sig === expected ? 'prototype_sig_valid' : 'prototype_sig_invalid' }
}

// ── Clover ────────────────────────────────────────────────────
function verifyCloverWebhook(_payload, headers) {
  const secret = process.env.CLOVER_WEBHOOK_SECRET
  if (!secret) return { valid: false, reason: 'CLOVER_WEBHOOK_SECRET not configured' }
  const sig = headers['x-clover-signature'] || ''
  return { valid: !!sig, reason: sig ? 'clover_sig_present' : 'missing_signature' }
}

// ── Toast ─────────────────────────────────────────────────────
function verifyToastWebhook(_payload, headers) {
  const secret = process.env.TOAST_WEBHOOK_SECRET
  if (!secret) return { valid: false, reason: 'TOAST_WEBHOOK_SECRET not configured' }
  const sig = headers['x-toast-signature'] || ''
  return { valid: !!sig, reason: sig ? 'toast_sig_present' : 'missing_signature' }
}

// ── Square ────────────────────────────────────────────────────
function verifySquareWebhook(rawBody, headers) {
  const secret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  if (!secret) return { valid: false, reason: 'SQUARE_WEBHOOK_SIGNATURE_KEY not configured' }
  const sig = headers['x-square-hmacsha256-signature'] || ''
  if (!sig) return { valid: false, reason: 'missing_signature' }
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
  const computed = hmac.digest('base64')
  return { valid: computed === sig, reason: computed === sig ? 'square_hmac_valid' : 'hmac_mismatch' }
}

// ── Shopify ───────────────────────────────────────────────────
function verifyShopifyWebhook(rawBody, headers) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) return { valid: false, reason: 'SHOPIFY_WEBHOOK_SECRET not configured' }
  const sig = headers['x-shopify-hmac-sha256'] || ''
  if (!sig) return { valid: false, reason: 'missing_signature' }
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
  const computed = hmac.digest('base64')
  return { valid: computed === sig, reason: computed === sig ? 'shopify_hmac_valid' : 'hmac_mismatch' }
}

// ── Lightspeed ────────────────────────────────────────────────
function verifyLightspeedWebhook(_payload, headers) {
  const secret = process.env.LIGHTSPEED_WEBHOOK_SECRET
  if (!secret) return { valid: false, reason: 'LIGHTSPEED_WEBHOOK_SECRET not configured' }
  return { valid: false, reason: 'lightspeed_not_configured' }
}

// ── NCR ───────────────────────────────────────────────────────
function verifyNcrWebhook(_payload, _headers) {
  return { valid: false, reason: 'NCR webhooks not supported in current integration tier' }
}

// ── MICROS ────────────────────────────────────────────────────
function verifyMicrosWebhook(_payload, _headers) {
  return { valid: false, reason: 'MICROS webhooks not supported in current integration tier' }
}
