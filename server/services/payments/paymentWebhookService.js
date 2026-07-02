/**
 * Payment Webhook Service
 * Stores and deduplicates payment webhooks safely.
 * Never processes unverified webhooks as final truth.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const webhookEventStore = []
const seenWebhookIds = new Set()

export async function receivePaymentWebhook(providerName, payload, headers = {}) {
  const verified = await verifyPaymentWebhookSignature(providerName, payload, headers)
  const normalized = normalizePaymentWebhook(providerName, payload)
  const dup = ignoreDuplicatePaymentWebhook(providerName, normalized.providerEventId)

  if (dup.isDuplicate) {
    return { ok: true, status: 'ignored', reason: 'duplicate', providerEventId: normalized.providerEventId }
  }

  const stored = await storePaymentWebhookEvent({ ...normalized, signatureVerified: verified.verified })
  return {
    ok: true,
    status: verified.verified ? 'webhook_pending' : 'signature_required',
    providerEventId: normalized.providerEventId,
    signatureVerified: verified.verified,
    storageMode: stored.storageMode,
    message: verified.verified
      ? 'Webhook received and stored. Processing queued.'
      : 'Webhook received but signature not verified. Stored as unverified.',
  }
}

export async function verifyPaymentWebhookSignature(providerName, payload, headers = {}) {
  if (providerName === 'stripe') {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return {
        verified: false,
        status: 'signature_required',
        missingVar: 'STRIPE_WEBHOOK_SECRET',
        message: 'STRIPE_WEBHOOK_SECRET not configured. Cannot verify signature.',
      }
    }
    // Live Stripe signature verification requires stripe.webhooks.constructEvent — not implemented yet
    return {
      verified: false,
      status: 'webhook_pending',
      message: 'Webhook signature verification requires live Stripe implementation.',
    }
  }

  return { verified: false, status: 'provider_not_connected', message: `Unknown provider: ${providerName}` }
}

export function normalizePaymentWebhook(providerName, payload) {
  const providerEventId =
    payload?.id ?? payload?.event_id ?? `evt_preview_${Date.now()}`
  return {
    paymentProvider: providerName,
    providerEventId,
    eventType: payload?.type ?? payload?.event_type ?? 'unknown',
    payloadJson: payload,
    receivedAt: new Date().toISOString(),
  }
}

export async function storePaymentWebhookEvent(normalizedEvent) {
  const entry = { ...normalizedEvent, id: `pwh-${Date.now()}`, processingStatus: 'webhook_pending' }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO payment_webhook_events
           (payment_provider, provider_event_id, event_type, payload_json, signature_verified, processing_status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          entry.paymentProvider, entry.providerEventId, entry.eventType,
          JSON.stringify(entry.payloadJson), entry.signatureVerified ?? false, 'webhook_pending',
        ]
      )
      return { ok: true, storageMode: 'postgres', processingStatus: 'webhook_pending' }
    } catch { /* fallback */ }
  }

  webhookEventStore.push(entry)
  return {
    ok: true,
    id: entry.id,
    storageMode: 'memory_fallback',
    persistenceStatus: 'preview_fallback',
    processingStatus: 'webhook_pending',
  }
}

export async function processPaymentWebhookEvent(eventId) {
  // Webhook processing requires live Stripe implementation
  return {
    ok: false,
    eventId,
    status: 'webhook_pending',
    message: 'Webhook processing requires live Stripe implementation.',
  }
}

export function ignoreDuplicatePaymentWebhook(providerName, providerEventId) {
  if (!providerEventId) return { isDuplicate: false }
  const key = `${providerName}::${providerEventId}`
  if (seenWebhookIds.has(key)) {
    return { isDuplicate: true, key }
  }
  seenWebhookIds.add(key)
  return { isDuplicate: false, key }
}
