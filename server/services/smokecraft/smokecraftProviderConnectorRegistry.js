/**
 * SmokeCraft Provider Connector Registry
 * Central registry for all SmokeCraft integration connectors.
 * Each connector honestly reports configuration and connection state.
 * No connector claims connected unless real verification occurs.
 */

import {
  CONNECTOR_CATEGORIES,
  CONNECTION_STATUSES,
  HEALTH_STATUSES,
  createConnectorRecord,
} from '../../../src/modules/smokecraft/data/smokecraftConnectorContract.js'
import {
  isPOS360Configured,
  isEatConfigured,
  isPairingProviderConfigured,
  isVenueMenuProviderConfigured,
} from './smokecraftEnvironmentValidationService.js'

function buildConnector(id, type, displayName, requiredEnvVars, optionalEnvVars, configured) {
  const connectionStatus = configured
    ? CONNECTION_STATUSES.CONFIG_DETECTED
    : CONNECTION_STATUSES.NOT_CONNECTED
  const healthStatus = configured
    ? HEALTH_STATUSES.DEGRADED
    : HEALTH_STATUSES.NOT_CONNECTED

  const warnings = []
  if (!configured) {
    warnings.push(`${displayName} env vars not set. Integration unavailable.`)
  } else {
    warnings.push(`${displayName} config detected but connection not verified. Cannot claim connected.`)
  }

  return createConnectorRecord({
    connectorId:       id,
    connectorType:     type,
    displayName,
    configured,
    connected:         false, // never claim connected without real verification
    productionReady:   false,
    requiredEnvVars,
    optionalEnvVars,
    lastHealthCheckAt: new Date().toISOString(),
    healthStatus,
    connectionStatus,
    syncEnabled:       false,
    canSend:           false,
    canReceive:        false,
    safeToUse:         configured, // safe to attempt, not connected
    warnings,
  })
}

export function getConnectorRegistry() {
  return {
    [CONNECTOR_CATEGORIES.POS360]: buildConnector(
      'pos360_connector', CONNECTOR_CATEGORIES.POS360,
      'POS360',
      ['POS360_ENDPOINT', 'POS360_API_KEY'], [],
      isPOS360Configured(),
    ),
    [CONNECTOR_CATEGORIES.EAT_SYSTEM]: buildConnector(
      'eat_connector', CONNECTOR_CATEGORIES.EAT_SYSTEM,
      'E.A.T. Command Hub',
      ['EAT_SYSTEM_ENDPOINT', 'EAT_SYSTEM_API_KEY'], [],
      isEatConfigured(),
    ),
    [CONNECTOR_CATEGORIES.PAIRING_PROVIDER]: buildConnector(
      'pairing_provider_connector', CONNECTOR_CATEGORIES.PAIRING_PROVIDER,
      'SmokeCraft Pairing Provider',
      ['SMOKECRAFT_PAIRING_PROVIDER', 'SMOKECRAFT_PAIRING_ENDPOINT'], ['SMOKECRAFT_PAIRING_API_KEY'],
      isPairingProviderConfigured(),
    ),
    [CONNECTOR_CATEGORIES.VENUE_MENU_PROVIDER]: buildConnector(
      'venue_menu_connector', CONNECTOR_CATEGORIES.VENUE_MENU_PROVIDER,
      'Venue Menu Provider',
      ['POS360_ENDPOINT'], ['EAT_SYSTEM_ENDPOINT'],
      isVenueMenuProviderConfigured(),
    ),
    [CONNECTOR_CATEGORIES.PASSPORT_CONNECTIONS]: buildConnector(
      'passport_connections_connector', CONNECTOR_CATEGORIES.PASSPORT_CONNECTIONS,
      'Passport Connections',
      ['PASSPORT_CONNECTIONS_ENDPOINT'], ['PASSPORT_CONNECTIONS_API_KEY'],
      Boolean(process.env.PASSPORT_CONNECTIONS_ENDPOINT),
    ),
    [CONNECTOR_CATEGORIES.LOYALTY_PROVIDER]: buildConnector(
      'loyalty_provider_connector', CONNECTOR_CATEGORIES.LOYALTY_PROVIDER,
      'Loyalty Provider',
      [], [],
      false, // no dedicated env var yet
    ),
    [CONNECTOR_CATEGORIES.BILLING_PROVIDER]: buildConnector(
      'billing_provider_connector', CONNECTOR_CATEGORIES.BILLING_PROVIDER,
      'Billing Provider',
      ['BILLING_PROVIDER_KEY'], [],
      Boolean(process.env.BILLING_PROVIDER_KEY),
    ),
    [CONNECTOR_CATEGORIES.ANALYTICS_PROVIDER]: buildConnector(
      'analytics_provider_connector', CONNECTOR_CATEGORIES.ANALYTICS_PROVIDER,
      'Analytics Provider',
      [], [],
      false,
    ),
    [CONNECTOR_CATEGORIES.MARKETPLACE_PROVIDER]: buildConnector(
      'marketplace_provider_connector', CONNECTOR_CATEGORIES.MARKETPLACE_PROVIDER,
      'Marketplace Provider',
      ['MARKETPLACE_PROVIDER_KEY'], [],
      Boolean(process.env.MARKETPLACE_PROVIDER_KEY),
    ),
    [CONNECTOR_CATEGORIES.LICENSE_PROVIDER]: buildConnector(
      'license_provider_connector', CONNECTOR_CATEGORIES.LICENSE_PROVIDER,
      'License Provider',
      ['LICENSE_PROVIDER_KEY'], [],
      Boolean(process.env.LICENSE_PROVIDER_KEY),
    ),
  }
}

export function getConnector(connectorType) {
  return getConnectorRegistry()[connectorType] ?? null
}

export function isConnectorConnected(connectorType) {
  const connector = getConnector(connectorType)
  return connector?.connected === true
}

export function getConnectorRegistryReport() {
  const registry = getConnectorRegistry()
  const types = Object.keys(registry)
  const configured = types.filter(t => registry[t].configured).length
  const connected  = types.filter(t => registry[t].connected).length
  return {
    totalConnectors:    types.length,
    configuredCount:    configured,
    connectedCount:     connected,
    productionReadyCount: 0,
    allNotConnected:    connected === 0,
    note:               'No connectors claim connected without real verification.',
  }
}
