/**
 * POS 3 Provider Registry — Phase 9
 * Single source of truth for all supported POS provider metadata.
 * liveReady:true only for prototype in Phase 9.
 * All others are adapter-prepared but not credential-configured.
 */

export const POS3_PROVIDER_REGISTRY = Object.freeze([
  {
    key:                  'prototype',
    name:                 'NOVEE Prototype',
    status:               'active',
    mode:                 'prototype',
    supportsWebhooks:     false,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       true,
    supportsStaff:        true,
    credentialsRequired:  [],
    liveReady:            true,
    description:          'Built-in prototype provider with realistic demo data. No credentials required.',
  },
  {
    key:                  'clover',
    name:                 'Clover',
    status:               'not_configured',
    mode:                 'prototype',
    supportsWebhooks:     true,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       true,
    supportsStaff:        true,
    credentialsRequired:  ['CLOVER_API_KEY', 'CLOVER_MERCHANT_ID'],
    liveReady:            false,
    description:          'Clover POS — adapter prepared. Requires API credentials.',
  },
  {
    key:                  'toast',
    name:                 'Toast POS',
    status:               'not_configured',
    mode:                 'prototype',
    supportsWebhooks:     true,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       true,
    supportsStaff:        true,
    credentialsRequired:  ['TOAST_CLIENT_ID', 'TOAST_CLIENT_SECRET', 'TOAST_LOCATION_GUID'],
    liveReady:            false,
    description:          'Toast POS — adapter prepared. Requires OAuth credentials.',
  },
  {
    key:                  'square',
    name:                 'Square',
    status:               'not_configured',
    mode:                 'prototype',
    supportsWebhooks:     true,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       false,
    supportsStaff:        true,
    credentialsRequired:  ['SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID'],
    liveReady:            false,
    description:          'Square — adapter prepared. Requires access token.',
  },
  {
    key:                  'shopify',
    name:                 'Shopify',
    status:               'not_configured',
    mode:                 'prototype',
    supportsWebhooks:     true,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       false,
    supportsStaff:        false,
    credentialsRequired:  ['SHOPIFY_STORE_URL', 'SHOPIFY_ACCESS_TOKEN'],
    liveReady:            false,
    description:          'Shopify — adapter prepared. Best for retail/hybrid venues.',
  },
  {
    key:                  'lightspeed',
    name:                 'Lightspeed Restaurant',
    status:               'not_configured',
    mode:                 'prototype',
    supportsWebhooks:     true,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       true,
    supportsStaff:        true,
    credentialsRequired:  ['LIGHTSPEED_CLIENT_ID', 'LIGHTSPEED_CLIENT_SECRET', 'LIGHTSPEED_BUSINESS_ID'],
    liveReady:            false,
    description:          'Lightspeed Restaurant — adapter prepared. OAuth 2.0 required.',
  },
  {
    key:                  'ncr',
    name:                 'NCR Aloha',
    status:               'not_configured',
    mode:                 'prototype',
    supportsWebhooks:     false,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       true,
    supportsStaff:        true,
    credentialsRequired:  ['NCR_API_KEY', 'NCR_ENTERPRISE_UNIT', 'NCR_SITE_ID'],
    liveReady:            false,
    description:          'NCR Aloha — adapter prepared. Enterprise credentials required.',
  },
  {
    key:                  'micros',
    name:                 'Oracle MICROS',
    status:               'not_configured',
    mode:                 'prototype',
    supportsWebhooks:     false,
    supportsInventory:    true,
    supportsMenu:         true,
    supportsOrders:       true,
    supportsTables:       true,
    supportsStaff:        true,
    credentialsRequired:  ['MICROS_API_KEY', 'MICROS_PROPERTY_ID', 'MICROS_RVC_SEQ'],
    liveReady:            false,
    description:          'Oracle MICROS — adapter prepared. Property and RVC credentials required.',
  },
])

/** Map keyed by provider key for O(1) lookup */
export const PROVIDER_MAP = Object.freeze(
  Object.fromEntries(POS3_PROVIDER_REGISTRY.map(p => [p.key, p]))
)

export function getProviderMeta(key) {
  return PROVIDER_MAP[key] || null
}

export function isKnownProvider(key) {
  return !!PROVIDER_MAP[key]
}
