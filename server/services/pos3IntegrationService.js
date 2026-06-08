/**
 * POS 3 Integration Service — Phase 9
 * Routes requests to the correct provider adapter.
 * Provider key → adapter module map. Static import for ESM.
 */

import * as prototype  from '../integrations/pos3/providers/prototypeProvider.js'
import * as clover     from '../integrations/pos3/providers/cloverProvider.js'
import * as toast      from '../integrations/pos3/providers/toastProvider.js'
import * as square     from '../integrations/pos3/providers/squareProvider.js'
import * as shopify    from '../integrations/pos3/providers/shopifyProvider.js'
import * as lightspeed from '../integrations/pos3/providers/lightspeedProvider.js'
import * as ncr        from '../integrations/pos3/providers/ncrProvider.js'
import * as micros     from '../integrations/pos3/providers/microsProvider.js'

import { POS3_PROVIDER_REGISTRY, isKnownProvider } from '../integrations/pos3/pos3ProviderRegistry.js'
import { getCredentialStatus }                     from '../integrations/pos3/pos3CredentialVault.js'

const ADAPTERS = {
  prototype,
  clover,
  toast,
  square,
  shopify,
  lightspeed,
  ncr,
  micros,
}

/**
 * Returns the adapter module for a provider key, or null if unknown.
 */
export function getProvider(key) {
  return ADAPTERS[key] || null
}

/**
 * GET /api/pos3/providers
 * Returns all providers with metadata and credential status.
 */
export function listProviders() {
  return POS3_PROVIDER_REGISTRY.map(meta => ({
    ...meta,
    credentialStatus: getCredentialStatus(meta.key),
  }))
}

/**
 * GET /api/pos3/providers/:key/status
 */
export function getProviderStatus(key) {
  if (!isKnownProvider(key)) {
    return { success: false, message: `Unknown provider: ${key}` }
  }
  const adapter = ADAPTERS[key]
  const status  = adapter.getConnectionStatus()
  const creds   = getCredentialStatus(key)
  return { ...status, credentialStatus: creds }
}

/**
 * POST /api/pos3/providers/:key/test-connection
 * Admin+ only (enforced at route level).
 */
export async function testProviderConnection(key) {
  if (!isKnownProvider(key)) {
    return { success: false, message: `Unknown provider: ${key}` }
  }
  const adapter = ADAPTERS[key]
  const creds   = getCredentialStatus(key)

  if (key !== 'prototype' && !creds.configured) {
    return {
      success:  false,
      provider: key,
      mode:     'not_configured',
      message:  `Cannot test connection — missing credentials: ${creds.missingKeys.join(', ')}`,
    }
  }

  return adapter.validateCredentials()
}

/**
 * Generic provider data fetcher with error wrapping.
 */
export async function fetchFromProvider(key, method, ...args) {
  const adapter = ADAPTERS[key]
  if (!adapter) return { success: false, message: `Unknown provider: ${key}` }
  if (typeof adapter[method] !== 'function') return { success: false, message: `Method ${method} not found on provider ${key}` }
  try {
    const result = await Promise.resolve(adapter[method](...args))
    return result
  } catch (err) {
    console.error(`[pos3Service] ${key}.${method}:`, err.message)
    return { success: false, provider: key, message: `Provider error: ${err.message}` }
  }
}
