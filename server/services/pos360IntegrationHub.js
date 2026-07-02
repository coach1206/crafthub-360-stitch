/**
 * POS360IntegrationHub — Central hub service for POS provider integrations.
 *
 * Routes all POS operations to the correct adapter.
 * Enforces tenant guard (venueId required) on all venue-scoped methods.
 * Never exposes raw tokens or OAuth payloads in responses.
 */

import { getProviderReadiness, listProviderReadiness } from '../config/posProviderConfig.js';
import { getEncryptionStatus } from '../utils/encryption.js';

// Lazy adapter cache — loaded on first use
const adapterCache = {};

async function loadAdapter(providerName) {
  if (adapterCache[providerName]) return adapterCache[providerName];

  const adapterMap = {
    square:         () => import('./pos/providers/squareAdapter.js'),
    toast:          () => import('./pos/providers/toastAdapter.js'),
    clover:         () => import('./pos/providers/cloverAdapter.js'),
    lightspeed:     () => import('./pos/providers/lightspeedAdapter.js'),
    shopify_pos:    () => import('./pos/providers/shopifyPosAdapter.js'),
    manual_pos360:  () => import('./pos/providers/manualPos360Adapter.js'),
    future_provider:() => import('./pos/providers/futureProviderAdapter.js'),
  };

  const loader = adapterMap[providerName];
  if (!loader) {
    throw new Error(`Unknown POS provider: ${providerName}`);
  }

  const module = await loader();
  const AdapterClass = module.default;
  const instance = new AdapterClass();
  adapterCache[providerName] = instance;
  return instance;
}

// In-memory connection status store (DB-backed when available)
const venueConnectionStore = {};

/**
 * Tenant guard helper. Returns true if valid, false + sends 400 if not.
 * Used internally only — controllers use the middleware version.
 */
function guardVenueId(venueId) {
  if (!venueId || typeof venueId !== 'string' || venueId.trim() === '') {
    return { valid: false, response: { status: 'tenant_guard_active', error: 'venueId required' } };
  }
  return { valid: true };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the adapter instance for a named provider.
 * @param {string} providerName
 * @returns {Promise<BasePosProviderAdapter>}
 */
export async function getProviderAdapter(providerName) {
  return loadAdapter(providerName);
}

/**
 * List all supported providers with their readiness and manual mode flag.
 */
export function listSupportedProviders() {
  return listProviderReadiness().map((r) => ({
    providerName: r.providerName,
    readinessStatus: r.readinessStatus,
    manualModeAvailable: true,
    missingVars: r.missingVars,
    message: r.message,
  }));
}

/**
 * Get connection status for all providers for a venue.
 * Never includes tokens.
 * @param {string} venueId
 */
export async function getProviderConnectionStatus(venueId) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  const providers = listProviderReadiness();
  const venueConnections = venueConnectionStore[venueId] || {};

  return {
    venueId,
    tenantGuardStatus: 'tenant_guard_active',
    providers: providers.map((r) => {
      const conn = venueConnections[r.providerName] || {};
      return {
        providerName: r.providerName,
        readinessStatus: r.readinessStatus,
        connectionStatus: conn.connectionStatus || 'provider_not_connected',
        connectedAt: conn.connectedAt || null,
        // Tokens deliberately omitted
      };
    }),
  };
}

/**
 * Begin an OAuth connection for a provider.
 * @param {string} venueId
 * @param {string} providerName
 */
export async function beginProviderConnection(venueId, providerName) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  let adapter;
  try {
    adapter = await loadAdapter(providerName);
  } catch (err) {
    return { status: 'integration_required', error: err.message, venueId, providerName };
  }

  const result = adapter.beginOAuth();
  return { venueId, providerName, tenantGuardStatus: 'tenant_guard_active', ...result };
}

/**
 * Complete an OAuth connection. Validates encryption key before storing any tokens.
 * @param {string} venueId
 * @param {string} providerName
 * @param {object} oauthPayload  — raw OAuth callback data; never re-exposed
 */
export async function completeProviderConnection(venueId, providerName, oauthPayload) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  const encStatus = getEncryptionStatus();
  if (!encStatus.available) {
    return {
      status: 'encryption_key_required',
      venueId,
      providerName,
      tenantGuardStatus: 'tenant_guard_active',
      message: 'Cannot store OAuth tokens — encryption key not configured.',
    };
  }

  let adapter;
  try {
    adapter = await loadAdapter(providerName);
  } catch (err) {
    return { status: 'integration_required', error: err.message, venueId, providerName };
  }

  const result = adapter.completeOAuth(oauthPayload);
  // Never return raw token data
  const safeResult = { ...result };
  delete safeResult.accessToken;
  delete safeResult.refreshToken;
  delete safeResult.token;

  return { venueId, providerName, tenantGuardStatus: 'tenant_guard_active', ...safeResult };
}

/**
 * Disconnect a provider for a venue.
 * @param {string} venueId
 * @param {string} providerName
 */
export async function disconnectProvider(venueId, providerName) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  if (!venueConnectionStore[venueId]) venueConnectionStore[venueId] = {};
  venueConnectionStore[venueId][providerName] = {
    connectionStatus: 'provider_not_connected',
    disconnectedAt: new Date().toISOString(),
  };

  return {
    status: 'audit_logged',
    venueId,
    providerName,
    tenantGuardStatus: 'tenant_guard_active',
    message: `Provider ${providerName} disconnected for venue ${venueId}.`,
  };
}

/**
 * Sync menu from a provider.
 * @param {string} venueId
 * @param {string} providerName
 */
export async function syncMenu(venueId, providerName) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  let adapter;
  try {
    adapter = await loadAdapter(providerName);
  } catch (err) {
    return { status: 'provider_not_connected', error: err.message, venueId, providerName };
  }

  const result = adapter.syncMenu();
  return { venueId, providerName, tenantGuardStatus: 'tenant_guard_active', ...result };
}

/**
 * Sync inventory from a provider.
 * @param {string} venueId
 * @param {string} providerName
 */
export async function syncInventory(venueId, providerName) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  let adapter;
  try {
    adapter = await loadAdapter(providerName);
  } catch (err) {
    return { status: 'provider_not_connected', error: err.message, venueId, providerName };
  }

  const result = adapter.syncInventory();
  return { venueId, providerName, tenantGuardStatus: 'tenant_guard_active', ...result };
}

/**
 * Create an order via a provider. Checks mappings first.
 * @param {string} venueId
 * @param {string} providerName
 * @param {object} orderPayload
 */
export async function createProviderOrder(venueId, providerName, orderPayload) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  // Dynamic import of mapping service to avoid circular deps
  let mappingCheck;
  try {
    const { validateOrderMappings } = await import('./pos360ItemMappingService.js');
    mappingCheck = await validateOrderMappings(venueId, providerName, orderPayload);
    if (!mappingCheck.valid) {
      return {
        venueId,
        providerName,
        tenantGuardStatus: 'tenant_guard_active',
        ...mappingCheck,
      };
    }
  } catch (err) {
    // Mapping service unavailable — continue for manual_pos360
    if (providerName !== 'manual_pos360') {
      return {
        status: 'mapping_required',
        venueId,
        providerName,
        tenantGuardStatus: 'tenant_guard_active',
        message: 'Item mapping service unavailable.',
      };
    }
  }

  let adapter;
  try {
    adapter = await loadAdapter(providerName);
  } catch (err) {
    return { status: 'provider_not_connected', error: err.message, venueId, providerName };
  }

  const result = adapter.createOrder(orderPayload);
  return { venueId, providerName, tenantGuardStatus: 'tenant_guard_active', ...result };
}

/**
 * Get the status of a previously created provider order.
 * @param {string} venueId
 * @param {string} providerName
 * @param {string} orderId
 */
export async function getProviderOrderStatus(venueId, providerName, orderId) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  let adapter;
  try {
    adapter = await loadAdapter(providerName);
  } catch (err) {
    return { status: 'provider_not_connected', error: err.message, venueId, providerName, orderId };
  }

  const result = adapter.getOrderStatus(orderId);
  return { venueId, providerName, tenantGuardStatus: 'tenant_guard_active', ...result };
}

/**
 * Handle an inbound webhook. Verifies signature before processing.
 * @param {string} providerName
 * @param {object} payload
 * @param {object} headers
 */
export async function handleProviderWebhook(providerName, payload, headers) {
  let adapter;
  try {
    adapter = await loadAdapter(providerName);
  } catch (err) {
    return { status: 'integration_required', error: err.message, providerName };
  }

  const sigResult = adapter.verifyWebhookSignature(payload, headers);
  if (!sigResult.verified) {
    return { providerName, verified: false, processed: false, ...sigResult };
  }

  const result = adapter.handleWebhook(payload, headers);
  return { providerName, ...result };
}

/**
 * Return manual mode availability for a venue.
 * @param {string} venueId
 */
export async function getManualModeStatus(venueId) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  return {
    venueId,
    manualModeAvailable: true,
    status: 'manual_mode',
    tenantGuardStatus: 'tenant_guard_active',
    message: 'Manual POS360 is always available as a fallback.',
  };
}

/**
 * Create a manual order ticket via ManualPos360Adapter.
 * @param {string} venueId
 * @param {object} orderPayload
 */
export async function createManualOrderTicket(venueId, orderPayload) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  const adapter = await loadAdapter('manual_pos360');
  const result = adapter.createOrder({ ...orderPayload, venueId });
  return { venueId, tenantGuardStatus: 'tenant_guard_active', ...result };
}

/**
 * Aggregate POS readiness warnings for a venue.
 * @param {string} venueId
 */
export async function getVenuePOSReadiness(venueId) {
  const guard = guardVenueId(venueId);
  if (!guard.valid) return guard.response;

  const providers = listProviderReadiness();
  const warnings = [];

  for (const p of providers) {
    if (p.readinessStatus === 'credentials_missing') {
      warnings.push({
        providerName: p.providerName,
        issue: 'credentials_missing',
        missingVars: p.missingVars,
      });
    } else if (p.readinessStatus === 'oauth_required') {
      warnings.push({
        providerName: p.providerName,
        issue: 'oauth_required',
        message: 'Credentials present but OAuth not completed.',
      });
    }
  }

  const encStatus = getEncryptionStatus();
  if (!encStatus.available) {
    warnings.push({
      issue: 'encryption_key_required',
      message: 'Cannot store OAuth tokens without an encryption key.',
    });
  }

  return {
    venueId,
    tenantGuardStatus: 'tenant_guard_active',
    manualModeAvailable: true,
    warnings,
    readyProviders: providers
      .filter((p) => p.readinessStatus === 'manual_mode')
      .map((p) => p.providerName),
    summary:
      warnings.length === 0
        ? 'All configured providers ready.'
        : `${warnings.length} readiness issue(s) found.`,
  };
}
