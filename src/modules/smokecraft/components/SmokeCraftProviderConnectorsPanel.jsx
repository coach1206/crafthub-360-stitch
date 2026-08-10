/**
 * SmokeCraftProviderConnectorsPanel
 * Lists all 10 provider connectors with honest connection status.
 * Never shows connected: true — all are not_connected in this build.
 */

const STATUS_COLORS = {
  connected:        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  config_detected:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  not_connected:    'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  missing_config:   'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  degraded:         'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  error:            'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  preview_only:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
}

function StatusChip({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
      {status ?? 'unknown'}
    </span>
  )
}

function ConnectorRow({ connector }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <div className="min-w-0">
        <span className="text-gray-700 dark:text-gray-300 font-medium">{connector.label ?? connector.type}</span>
        {connector.configured && (
          <span className="ml-1.5 text-gray-400 dark:text-gray-500">config detected</span>
        )}
      </div>
      <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
        <StatusChip status={connector.connectionStatus} />
        {connector.healthStatus && connector.healthStatus !== connector.connectionStatus && (
          <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{connector.healthStatus}</span>
        )}
      </div>
    </div>
  )
}

const CONNECTOR_LABELS = {
  pos360:               'POS360',
  eat_system:           'E.A.T. System',
  pairing_provider:     'Pairing Provider',
  venue_menu_provider:  'Venue Menu Provider',
  passport_connections: 'Passport Connections',
  loyalty_provider:     'Loyalty Provider',
  billing_provider:     'Billing Provider',
  analytics_provider:   'Analytics Provider',
  marketplace_provider: 'Marketplace Provider',
  license_provider:     'License Provider',
}

export default function SmokeCraftProviderConnectorsPanel({ connectors, report }) {
  if (!connectors) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Connector registry not available.
      </div>
    )
  }

  const connectorList = Array.isArray(connectors)
    ? connectors
    : Object.values(connectors)

  const connectedCount = report?.connectedCount ?? 0
  const totalCount = connectorList.length

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Provider Connectors</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {connectedCount}/{totalCount} connected
        </span>
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        {connectorList.map(c => (
          <ConnectorRow
            key={c.type}
            connector={{ ...c, label: CONNECTOR_LABELS[c.type] }}
          />
        ))}
      </div>

      {report?.allNotConnected && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          No provider connectors are live. Configure endpoint and API key environment variables to enable connections.
        </div>
      )}
    </div>
  )
}
