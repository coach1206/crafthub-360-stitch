/**
 * SmokeCraftManagementControlsPanel
 * Shows integration status, fallback status, and pause/resume order controls.
 * Never shows force unlock, fake sync, or billing/license activation controls.
 */

const PROTECTED_ACTION_LABELS = {
  force_passport_unlock:      'Force Passport Unlock',
  force_connections_unlock:   'Force Connections Unlock',
  force_pos_synced:           'Force POS Synced',
  force_eat_synced:           'Force E.A.T. Synced',
  force_reward_redeemed:      'Force Reward Redeemed',
  force_billing_active:       'Force Billing Active',
  force_license_enforced:     'Force License Enforced',
  bypass_reward_policy:       'Bypass Reward Policy',
  bypass_journey_progression: 'Bypass Journey Progression',
}

function IntegrationStatusRow({ label, value, color }) {
  const colorMap = {
    red:    'text-red-600 dark:text-red-400',
    amber:  'text-amber-600 dark:text-amber-400',
    gray:   'text-gray-500 dark:text-gray-400',
    green:  'text-green-600 dark:text-green-400',
  }
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-mono font-medium ${colorMap[color] ?? colorMap.gray}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function SmokeCraftManagementControlsPanel({
  integrations,
  onPauseOrders,
  onResumeOrders,
  ordersPaused = false,
  actorRole = 'manager',
}) {
  if (!integrations) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Management controls not available.
      </div>
    )
  }

  const canControlOrders = ['venueOwner', 'platformAdmin', 'manager'].includes(actorRole)

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Management Controls</h2>

      {/* Integration status */}
      <div>
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Integration Status</div>
        <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
          <IntegrationStatusRow label="POS360"      value={integrations?.pos360?.status ?? 'not_connected'}           color="red" />
          <IntegrationStatusRow label="E.A.T."      value={integrations?.eat?.syncStatus ?? 'not_connected'}          color="amber" />
          <IntegrationStatusRow label="Database"    value={integrations?.database?.persistenceMode ?? 'memory_fallback'} color="amber" />
          <IntegrationStatusRow label="Marketplace" value={integrations?.marketplace?.marketplaceStatus ?? 'not_live_marketplace'} color="gray" />
          <IntegrationStatusRow label="License"     value={integrations?.license?.licenseStatus ?? 'license_not_enforced'} color="gray" />
          <IntegrationStatusRow label="Billing"     value={integrations?.billing?.billingStatus ?? 'preview_only'}    color="amber" />
        </div>
      </div>

      {/* Order request controls */}
      {canControlOrders && (
        <div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Order Requests</div>
          <div className="flex gap-2">
            <button
              onClick={onPauseOrders}
              disabled={ordersPaused}
              className="text-xs px-3 py-1.5 rounded border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 disabled:opacity-40 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
            >
              Pause New Orders
            </button>
            <button
              onClick={onResumeOrders}
              disabled={!ordersPaused}
              className="text-xs px-3 py-1.5 rounded border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 disabled:opacity-40 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
            >
              Resume Orders
            </button>
          </div>
          {ordersPaused && (
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              New order requests are paused for this venue.
            </div>
          )}
        </div>
      )}

      {/* Blocked protected actions — shown for transparency */}
      <div>
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Protected Actions (Always Blocked)</div>
        <div className="border border-red-100 dark:border-red-900/30 rounded p-2 space-y-1">
          {Object.values(PROTECTED_ACTION_LABELS).map(label => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400 line-through">{label}</span>
              <span className="text-red-500 dark:text-red-400 ml-auto font-mono">blocked</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          These controls are permanently blocked. SmokeCraft progression rules cannot be bypassed from admin.
        </div>
      </div>
    </div>
  )
}
