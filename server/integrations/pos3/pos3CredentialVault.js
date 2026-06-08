/**
 * POS 3 Credential Vault — Phase 9
 *
 * Checks whether environment variables for each provider are configured.
 * NEVER returns raw credentials. NEVER logs credentials.
 * Returns config status only — for UI display and connection gating.
 */

import { PROVIDER_MAP } from './pos3ProviderRegistry.js'

const PROVIDER_ENV_KEYS = Object.freeze({
  prototype:  [],
  clover:     ['CLOVER_API_KEY', 'CLOVER_MERCHANT_ID'],
  toast:      ['TOAST_CLIENT_ID', 'TOAST_CLIENT_SECRET', 'TOAST_LOCATION_GUID'],
  square:     ['SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID'],
  shopify:    ['SHOPIFY_STORE_URL', 'SHOPIFY_ACCESS_TOKEN'],
  lightspeed: ['LIGHTSPEED_CLIENT_ID', 'LIGHTSPEED_CLIENT_SECRET', 'LIGHTSPEED_BUSINESS_ID'],
  ncr:        ['NCR_API_KEY', 'NCR_ENTERPRISE_UNIT', 'NCR_SITE_ID'],
  micros:     ['MICROS_API_KEY', 'MICROS_PROPERTY_ID', 'MICROS_RVC_SEQ'],
})

/**
 * Returns credential config status for a provider.
 * Never exposes actual values — only which keys are missing.
 */
export function getCredentialStatus(providerKey) {
  const requiredKeys = PROVIDER_ENV_KEYS[providerKey] || []

  if (providerKey === 'prototype') {
    return {
      providerKey,
      configured:  true,
      mode:        'prototype',
      missingKeys: [],
    }
  }

  const missingKeys = requiredKeys.filter(k => !process.env[k])

  return {
    providerKey,
    configured:  missingKeys.length === 0,
    mode:        missingKeys.length === 0 ? 'live' : 'prototype',
    missingKeys: missingKeys.map(k => k),   // key name only — never the value
  }
}

/**
 * Returns credential status for all providers.
 */
export function getAllCredentialStatuses() {
  return Object.keys(PROVIDER_ENV_KEYS).map(getCredentialStatus)
}

/**
 * Returns true if a provider is ready to make live API calls.
 * prototype is always ready. Others require all env vars to be set.
 */
export function isProviderReady(providerKey) {
  if (providerKey === 'prototype') return true
  const status = getCredentialStatus(providerKey)
  return status.configured
}
