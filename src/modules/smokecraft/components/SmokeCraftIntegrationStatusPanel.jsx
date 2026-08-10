/**
 * SmokeCraftIntegrationStatusPanel
 * Shows overall integration health — POS360, E.A.T., pairing, venue menu,
 * passport, billing, marketplace, license. Honest not_connected warnings.
 */

const STATUS_COLORS = {
  healthy:        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  degraded:       'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  not_connected:  'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  missing_config: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  preview_only:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  unsafe:         'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  unknown:        'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
}

function HealthChip({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.unknown}`}>
      {status ?? 'unknown'}
    </span>
  )
}

function IntegrationRow({ label, healthStatus, connectionStatus, extra }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
      <div className="flex items-center gap-1 flex-wrap justify-end">
        <HealthChip status={healthStatus ?? 'unknown'} />
        {connectionStatus && connectionStatus !== healthStatus && (
          <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{connectionStatus}</span>
        )}
        {extra && <span className="text-xs text-gray-400 dark:text-gray-500">{extra}</span>}
      </div>
    </div>
  )
}

export default function SmokeCraftIntegrationStatusPanel({ health }) {
  if (!health) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Integration status not available.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Integration Status</h2>
        <HealthChip status={health.overallHealth ?? 'unknown'} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <IntegrationRow label="POS360"       healthStatus={health.pos360?.healthStatus}          connectionStatus={health.pos360?.connectionStatus} />
        <IntegrationRow label="E.A.T."       healthStatus={health.eat?.healthStatus}             connectionStatus={health.eat?.connectionStatus} extra={health.eat?.managementSyncStatus} />
        <IntegrationRow label="Pairing Provider" healthStatus={health.pairingProvider?.healthStatus} connectionStatus={health.pairingProvider?.connectionStatus} extra={health.pairingProvider?.recommendationStatus} />
        <IntegrationRow label="Venue Menu"   healthStatus={health.venueMenuProvider?.healthStatus} connectionStatus={health.venueMenuProvider?.connectionStatus} extra={health.venueMenuProvider?.menuSource} />
        <IntegrationRow label="Passport"     healthStatus={health.passportConnections?.healthStatus} connectionStatus={health.passportConnections?.connectionStatus} />
        <IntegrationRow label="Loyalty"      healthStatus={health.loyaltyProvider?.healthStatus} connectionStatus={health.loyaltyProvider?.connectionStatus} />
        <IntegrationRow label="Billing"      healthStatus="preview_only" extra={health.billing?.billingStatus} />
        <IntegrationRow label="Marketplace"  healthStatus="not_connected" extra={health.marketplace?.marketplaceStatus} />
        <IntegrationRow label="License"      healthStatus="not_connected" extra={health.license?.licenseStatus} />
      </div>

      {!health.productionReady && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          SmokeCraft integrations are not production-ready. Connect database and verify all connectors.
        </div>
      )}
    </div>
  )
}
