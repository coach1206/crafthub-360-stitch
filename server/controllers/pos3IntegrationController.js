/**
 * POS 3 Integration Controller — Phase 9
 * Handles HTTP layer for all /api/pos3/* routes.
 * All role enforcement is done in the route layer (middleware).
 * Controller only handles request parsing and response formatting.
 */

import { ok, fail, serverError }     from '../utils/response.js'
import * as service                  from '../services/pos3IntegrationService.js'
import { verifyWebhook }             from '../integrations/pos3/pos3WebhookVerifier.js'
import { isKnownProvider }           from '../integrations/pos3/pos3ProviderRegistry.js'
import {
  prepareStaffRecommendationPayload,
  saveRecommendation,
} from '../services/pos3RecommendationService.js'
import { syncPOS3ToEAT }            from '../services/eatPos3BridgeService.js'
import { query, isDbAvailable }      from '../db/connection.js'
import {
  getPOS3SyncStatus,
  runPOS3SyncNow,
  getPOS3SyncHistory,
} from '../services/pos3AutoSyncService.js'

// ── GET /api/pos3/providers ───────────────────────────────────
export async function getProviders(req, res) {
  try {
    const providers = service.listProviders()
    return ok(res, { providers, count: providers.length })
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/status ───────────────
export async function getProviderStatus(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const status = service.getProviderStatus(providerKey)
    return ok(res, status)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── POST /api/pos3/providers/:providerKey/test-connection ─────
export async function testConnection(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.testProviderConnection(providerKey)
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/locations ────────────
export async function getLocations(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.fetchFromProvider(providerKey, 'fetchLocations')
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/menu ─────────────────
export async function getMenu(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.fetchFromProvider(providerKey, 'fetchMenus')
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/inventory ────────────
export async function getInventory(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.fetchFromProvider(providerKey, 'fetchInventory')
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/orders/active ────────
export async function getActiveOrders(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.fetchFromProvider(providerKey, 'fetchActiveOrders')
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/orders/:orderId ──────
export async function getOrderById(req, res) {
  const { providerKey, orderId } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.fetchFromProvider(providerKey, 'fetchOrderById', orderId)
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/tables ───────────────
export async function getTables(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.fetchFromProvider(providerKey, 'fetchTables')
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers/:providerKey/staff ────────────────
export async function getStaff(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const result = await service.fetchFromProvider(providerKey, 'fetchStaff')
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── POST /api/pos3/providers/:providerKey/recommendation ──────
export async function postRecommendation(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const { session, order, inventory } = req.body || {}
    const payload = prepareStaffRecommendationPayload(session || {}, order || {}, inventory || [])
    await saveRecommendation({ ...payload.recommendations[0], provider: providerKey })
    const provider = service.getProvider(providerKey)
    if (provider) await Promise.resolve(provider.pushPairingRecommendation(payload))
    return ok(res, payload)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── POST /api/pos3/providers/:providerKey/webhook ─────────────
export async function receiveWebhook(req, res) {
  const { providerKey } = req.params
  if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
  try {
    const { valid, reason } = verifyWebhook(providerKey, req.body, req.headers)

    if (!valid) {
      if (isDbAvailable()) {
        await query(
          `INSERT INTO pos3_provider_events (provider_key, event_type, payload, status)
           VALUES ($1, $2, $3, $4)`,
          [providerKey, 'webhook_rejected', JSON.stringify({ reason, headers: Object.keys(req.headers) }), 'failed']
        ).catch(() => {})
      }
      return fail(res, `Webhook rejected: ${reason}`, 401)
    }

    const normalized = await service.fetchFromProvider(providerKey, 'receiveWebhook', req.body, req.headers)

    if (isDbAvailable()) {
      await query(
        `INSERT INTO pos3_provider_events (provider_key, event_type, external_id, payload, status, processed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          providerKey,
          req.body?.type || 'webhook.event',
          req.body?.id   || null,
          JSON.stringify(req.body),
          'processed',
        ]
      ).catch(() => {})
    }

    return ok(res, { received: true, provider: providerKey, result: normalized })
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/sync/status ─────────────────────────────────
export async function getSyncStatus(req, res) {
  try {
    const status  = getPOS3SyncStatus()
    const history = await getPOS3SyncHistory(10)
    return ok(res, { ...status, history })
  } catch (err) {
    return serverError(res, err)
  }
}

// ── POST /api/pos3/sync/run ───────────────────────────────────
export async function runSyncNow(req, res) {
  try {
    const providerKey = req.body?.providerKey || 'prototype'
    if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
    const result = await runPOS3SyncNow(providerKey, 'manual')
    return ok(res, result)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/eat-feed ────────────────────────────────────
export async function getEATFeed(req, res) {
  try {
    const providerKey = req.query.provider || 'prototype'
    if (!isKnownProvider(providerKey)) return fail(res, `Unknown provider: ${providerKey}`, 404)
    const feed = await syncPOS3ToEAT(providerKey)
    return ok(res, feed)
  } catch (err) {
    return serverError(res, err)
  }
}

// ── GET /api/pos3/providers (founder: license panel) ─────────
export async function getFounderLicensePanel(req, res) {
  try {
    const providers = service.listProviders()
    return ok(res, {
      licenseMode:    'prototype',
      revenueEnabled: false,
      billingLinked:  false,
      activeProviders: providers.filter(p => p.liveReady).map(p => p.key),
      pendingProviders: providers.filter(p => !p.liveReady).map(p => p.key),
      note: 'Phase 9 — license and revenue controls are placeholder. No live billing is active.',
    })
  } catch (err) {
    return serverError(res, err)
  }
}
