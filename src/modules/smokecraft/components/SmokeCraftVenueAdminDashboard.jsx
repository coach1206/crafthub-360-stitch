/**
 * SmokeCraftVenueAdminDashboard
 * Venue admin overview — sessions, orders, pairings, rewards, passport,
 * loyalty, POS360 status, E.A.T. status, persistence, fallback warnings.
 * Does not modify SmokeCraft customer journey screens.
 */

function StatusChip({ value, label }) {
  const colorMap = {
    not_connected:        'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    preview_only:         'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    memory_fallback:      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    not_live_marketplace: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    license_not_enforced: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    active:               'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    connected:            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  }
  const cls = colorMap[value] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label ?? value ?? '—'}
    </span>
  )
}

function StatTile({ label, value, sub }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-3 text-center space-y-0.5">
      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value ?? 0}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  )
}

function IntegrationRow({ label, status, syncStatus }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex gap-1">
        <StatusChip value={status} label={status} />
        {syncStatus && <StatusChip value={syncStatus} label={syncStatus} />}
      </div>
    </div>
  )
}

export default function SmokeCraftVenueAdminDashboard({ overview }) {
  if (!overview) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Venue admin overview not available.
      </div>
    )
  }

  const {
    activeSessions = 0, completedSessions = 0,
    totalOrderRequests = 0, customerSelfOrders = 0, staffAssistedOrders = 0,
    pairingEvents = 0, rewardEvents = 0, xpIssued = 0, loyaltyPointsIssued = 0,
    passportAwardedCount = 0, blockedRewardCount = 0,
    staffQueue = {}, integrations = {}, persistenceMode, productionReady,
    warnings = [],
  } = overview

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Venue Admin Dashboard</h2>
        <StatusChip value="active" label="Active" />
      </div>

      {/* Sessions + Orders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatTile label="Active Sessions"    value={activeSessions} />
        <StatTile label="Completed Sessions" value={completedSessions} />
        <StatTile label="Pending Orders"     value={staffQueue?.pendingOrders ?? 0} />
        <StatTile label="Staff Orders"       value={staffAssistedOrders} />
      </div>

      {/* Pairing + Rewards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatTile label="Pairing Events"     value={pairingEvents} />
        <StatTile label="Reward Events"      value={rewardEvents} />
        <StatTile label="XP Issued"          value={xpIssued} />
        <StatTile label="Passport Awarded"   value={passportAwardedCount} />
      </div>

      {/* Loyalty + Blocked */}
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Loyalty Points Issued" value={loyaltyPointsIssued} />
        <StatTile label="Blocked Rewards"       value={blockedRewardCount} sub="policy enforced" />
      </div>

      {/* Integrations */}
      <div>
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Integration Status</div>
        <div className="border border-gray-100 dark:border-gray-800 rounded p-2 space-y-0">
          <IntegrationRow label="POS360"      status={integrations?.pos360?.status ?? 'not_connected'} />
          <IntegrationRow label="E.A.T."      status={integrations?.eat?.status ?? 'not_connected'} syncStatus={integrations?.eat?.syncStatus} />
          <IntegrationRow label="Database"    status={integrations?.database?.persistenceMode ?? 'memory_fallback'} />
          <IntegrationRow label="Marketplace" status={integrations?.marketplace?.marketplaceStatus ?? 'not_live_marketplace'} />
          <IntegrationRow label="License"     status={integrations?.license?.licenseStatus ?? 'license_not_enforced'} />
          <IntegrationRow label="Billing"     status={integrations?.billing?.billingStatus ?? 'preview_only'} />
        </div>
      </div>

      {/* Fallback warning */}
      {(persistenceMode === 'memory_fallback' || !productionReady) && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Admin data is in memory_fallback mode. Requires DATABASE_URL for production persistence.
        </div>
      )}

      {/* Operational warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
              {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
