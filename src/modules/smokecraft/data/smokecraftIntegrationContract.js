/**
 * SmokeCraft Integration Contract
 * Defines integration status shape and production readiness structure.
 */

export const INTEGRATION_CONTRACT_VERSION = '0.1.0'

export function createIntegrationStatus(overrides = {}) {
  return {
    statusId:           `int_status_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    module:             'smokecraft',
    moduleBuild:        7,
    productionReady:    false,
    overallHealth:      'unknown',
    database:           { persistenceMode: 'memory_fallback', productionReady: false },
    pos360:             { connectionStatus: 'not_connected', configured: false, connected: false },
    eat:                { connectionStatus: 'not_connected', configured: false, connected: false, syncStatus: 'preview_only' },
    pairingProvider:    { connectionStatus: 'not_connected', configured: false, connected: false, aiBacked: false },
    venueMenuProvider:  { connectionStatus: 'not_connected', configured: false, connected: false, venueMenuBacked: false },
    passportConnections:{ connectionStatus: 'not_connected', configured: false, connected: false },
    billing:            { billingStatus: 'preview_only', configured: false, connected: false },
    marketplace:        { marketplaceStatus: 'not_live_marketplace', configured: false, connected: false },
    license:            { licenseStatus: 'license_not_enforced', configured: false, connected: false },
    syncQueue:          { enabled: false, status: 'preview_only' },
    secretSafety:       { safe: true, containsSecrets: false },
    evaluatedAt:        new Date().toISOString(),
    ...overrides,
  }
}
