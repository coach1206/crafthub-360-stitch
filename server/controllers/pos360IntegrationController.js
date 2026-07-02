/**
 * POS360 Integration Controller
 * Safe response shapes — never expose tokens, raw OAuth payloads, or secrets.
 */
import * as hub from '../services/pos360IntegrationHub.js'
import * as mappingService from '../services/pos360ItemMappingService.js'
import * as auditService from '../services/pos360AuditLogService.js'
import * as healthService from '../services/pos360ProviderHealthService.js'
import { assertTenantVenueId } from '../middleware/venueTenantGuard.js'

function safe(obj) {
  if (!obj) return obj
  const forbidden = ['access_token', 'refresh_token', 'accessToken', 'refreshToken', 'oauth_token', 'secret', 'encryption_key', 'webhook_secret']
  const result = { ...obj }
  for (const key of forbidden) delete result[key]
  return result
}

export async function getProviders(req, res) {
  try {
    const providers = await hub.listSupportedProviders()
    res.json({ ok: true, providers })
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function getVenueConnections(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  try {
    const result = await hub.getProviderConnectionStatus(venueId)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function beginConnection(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName } = req.params
  try {
    await auditService.logProviderConnectionAttempt({ venueId, providerName, actorId: req.body?.staffId, actorRole: req.body?.staffRole, request: { action: 'begin_connection' } })
    const result = await hub.beginProviderConnection(venueId, providerName)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function completeConnection(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName } = req.params
  try {
    await auditService.logProviderConnectionAttempt({ venueId, providerName, actorId: req.body?.staffId, actorRole: req.body?.staffRole, request: { action: 'complete_connection' } })
    const result = await hub.completeProviderConnection(venueId, providerName, req.body)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function disconnectProvider(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName } = req.params
  try {
    const result = await hub.disconnectProvider(venueId, providerName)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function syncMenu(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName } = req.params
  try {
    const result = await hub.syncMenu(venueId, providerName)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function syncInventory(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName } = req.params
  try {
    const result = await hub.syncInventory(venueId, providerName)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function createOrder(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName } = req.params
  try {
    await auditService.logOrderSyncAttempt({ venueId, providerName, request: req.body })
    const result = await hub.createProviderOrder(venueId, providerName, req.body)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function getOrderStatus(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName, providerOrderId } = req.params
  try {
    const result = await hub.getProviderOrderStatus(venueId, providerName, providerOrderId)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function receiveWebhook(req, res) {
  // Always 200 immediately — process async
  res.status(200).json({ ok: true, received: true, status: 'webhook_pending' })
  const { providerName } = req.params
  try {
    await hub.handleProviderWebhook(providerName, req.body, req.headers)
  } catch { /* silent — already acked */ }
}

export async function createManualOrder(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  try {
    const result = await hub.createManualOrderTicket(venueId, req.body)
    res.json(safe(result))
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function getManualMode(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const result = await hub.getManualModeStatus(venueId)
  res.json(result)
}

export async function getMappings(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { providerName } = req.params
  try {
    const result = await mappingService.getItemMappings(venueId, providerName)
    res.json(result)
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function createMapping(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  try {
    const result = await mappingService.createItemMapping({ ...req.body, venueId })
    res.json(result)
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function updateMapping(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  const { mappingId } = req.params
  try {
    const result = await mappingService.updateItemMapping(mappingId, req.body)
    res.json(result)
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function getAuditLogs(req, res) {
  const venueId = assertTenantVenueId(req, res)
  if (!venueId) return
  try {
    const result = await auditService.getAuditLogsForVenue(venueId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}

export async function getProviderHealth(req, res) {
  const { providerName } = req.query
  try {
    if (providerName) {
      const result = await healthService.getProviderHealth(providerName)
      return res.json(result)
    }
    const { SUPPORTED_PROVIDERS } = await import('../services/pos360IntegrationHub.js')
    const results = await Promise.all(SUPPORTED_PROVIDERS.map(p => healthService.getProviderHealth(p)))
    res.json({ ok: true, providers: results })
  } catch (err) {
    res.status(500).json({ ok: false, status: 'provider_error', message: err.message })
  }
}
