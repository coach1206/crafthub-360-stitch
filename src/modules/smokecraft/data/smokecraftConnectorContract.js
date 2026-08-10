/**
 * SmokeCraft Connector Contract
 * Defines connector categories, connection status values, and connector record shape.
 */

export const CONNECTOR_CATEGORIES = {
  POS360:             'pos360',
  EAT_SYSTEM:         'eat_system',
  PAIRING_PROVIDER:   'pairing_provider',
  VENUE_MENU_PROVIDER:'venue_menu_provider',
  PASSPORT_CONNECTIONS:'passport_connections',
  LOYALTY_PROVIDER:   'loyalty_provider',
  BILLING_PROVIDER:   'billing_provider',
  ANALYTICS_PROVIDER: 'analytics_provider',
  MARKETPLACE_PROVIDER:'marketplace_provider',
  LICENSE_PROVIDER:   'license_provider',
}

export const CONNECTION_STATUSES = {
  NOT_CONNECTED:     'not_connected',
  CONFIG_DETECTED:   'config_detected',
  CONNECTED:         'connected',
  DEGRADED:          'degraded',
  ERROR:             'error',
  PREVIEW_ONLY:      'preview_only',
  MISSING_CONFIG:    'missing_config',
}

export const HEALTH_STATUSES = {
  HEALTHY:        'healthy',
  DEGRADED:       'degraded',
  NOT_CONNECTED:  'not_connected',
  MISSING_CONFIG: 'missing_config',
  PREVIEW_ONLY:   'preview_only',
  UNSAFE:         'unsafe',
  UNKNOWN:        'unknown',
}

export const CONNECTOR_CONTRACT_VERSION = '0.1.0'

export function createConnectorRecord(overrides = {}) {
  return {
    connectorId:          null,
    connectorType:        null,
    displayName:          null,
    configured:           false,
    connected:            false,
    productionReady:      false,
    requiredEnvVars:      [],
    optionalEnvVars:      [],
    lastHealthCheckAt:    null,
    healthStatus:         HEALTH_STATUSES.UNKNOWN,
    connectionStatus:     CONNECTION_STATUSES.NOT_CONNECTED,
    syncEnabled:          false,
    canSend:              false,
    canReceive:           false,
    safeToUse:            false,
    warnings:             [],
    ...overrides,
  }
}
