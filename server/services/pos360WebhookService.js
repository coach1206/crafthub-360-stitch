/**
 * POS360 Webhook Service
 * Receives, verifies, deduplicates, and stores provider webhook events.
 * Never processes unverified events as final truth.
 */
import { isDbAvailable, query } from '../db/connection.js'

const seenWebhookIds = new Set()
const webhookStore = []

const WEBHOOK_SECRET_VARS = {
  square:      'SQUARE_WEBHOOK_SIGNATURE_KEY',
  toast:       'TOAST_CLIENT_SECRET',
  clover:      'CLOVER_APP_SECRET',
  lightspeed:  'LIGHTSPEED_CLIENT_SECRET',
  shopify_pos: 'SHOPIFY_WEBHOOK_SECRET',
}

export async function verifyWebhook(providerName, payload, headers) {
  const secretVar = WEBHOOK_SECRET_VARS[providerName]
  if (!secretVar) {
    return { verified: false, status: 'provider_not_connected', message: `Unknown provider: ${providerName}` }
  }
  const secret = process.env[secretVar]
  if (!secret) {
    return { verified: false, status: 'credentials_missing', missingVar: secretVar, message: `Webhook signature secret ${secretVar} not configured. Cannot verify ${providerName} webhook.` }
  }
  // Real signature verification would be provider-specific here.
  // Returning webhook_pending until OAuth + real adapter verification is implemented.
  return { verified: false, status: 'webhook_pending', message: 'Webhook verification not yet implemented for this provider. Event stored as unverified.' }
}

export function ignoreDuplicateWebhook(providerName, providerEventId) {
  if (!providerEventId) return false
  const key = `${providerName}::${providerEventId}`
  if (seenWebhookIds.has(key)) return true
  seenWebhookIds.add(key)
  return false
}

export function normalizeWebhookEvent(providerName, payload) {
  return {
    providerName,
    providerEventId: payload?.event_id ?? payload?.id ?? null,
    eventType: payload?.type ?? payload?.event_type ?? 'unknown',
    payloadJson: payload,
    receivedAt: new Date().toISOString(),
  }
}

export async function storeWebhookEvent(providerName, normalizedEvent) {
  webhookStore.push({ ...normalizedEvent, storedAt: new Date().toISOString() })

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO pos_webhook_events (provider_name, provider_event_id, event_type, payload_json, signature_verified, processing_status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [providerName, normalizedEvent.providerEventId, normalizedEvent.eventType,
         JSON.stringify(normalizedEvent.payloadJson), false, 'webhook_pending']
      )
      return { ok: true, storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  return { ok: true, storageMode: 'memory_fallback', persistenceStatus: 'not_persisted' }
}

export async function receiveWebhook(providerName, payload, headers) {
  const normalized = normalizeWebhookEvent(providerName, payload)

  if (ignoreDuplicateWebhook(providerName, normalized.providerEventId)) {
    return { ok: true, status: 'ignored', reason: 'duplicate', providerEventId: normalized.providerEventId }
  }

  const verification = await verifyWebhook(providerName, payload, headers)
  await storeWebhookEvent(providerName, { ...normalized, signatureVerified: verification.verified })

  return {
    ok: true,
    received: true,
    verified: verification.verified,
    status: verification.status ?? 'webhook_pending',
    providerName,
    message: verification.verified ? 'Webhook received and verified.' : 'Webhook received but not verified. Stored as webhook_pending.',
  }
}

export async function processWebhookEvent(eventId) {
  return { ok: false, status: 'webhook_pending', message: 'Webhook processing not yet implemented. Provider integration required.' }
}
