/**
 * SmokeCraftOrderStatusPanel
 * Displays the full status of a SmokeCraft order.
 * Never shows "sent to POS" unless posSyncStatus confirms it.
 * Honest fallback warnings throughout.
 */

export default function SmokeCraftOrderStatusPanel({ order }) {
  if (!order) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        No order to display.
      </div>
    )
  }

  const rows = [
    { label: 'Order ID',         value: order.orderId ?? '—' },
    { label: 'Order Mode',       value: order.orderMode ?? '—' },
    { label: 'Status',           value: order.orderStatus ?? '—' },
    { label: 'Sync',             value: order.syncStatus ?? 'not_connected' },
    { label: 'POS360',           value: order.posSyncStatus ?? 'not_connected' },
    { label: 'E.A.T.',           value: order.eatSyncStatus ?? 'not_connected' },
    { label: 'Persistence',      value: order.persistenceMode ?? 'memory_fallback' },
    { label: 'Production Ready', value: order.productionReady ? 'yes' : 'no' },
  ]

  const posConnected = order.posSyncStatus === 'synced'
  const eatConnected = order.eatSyncStatus === 'synced'

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Order Status</h2>

      <div className="text-xs space-y-1">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
            <span className="font-mono text-gray-800 dark:text-gray-200">{r.value}</span>
          </div>
        ))}
      </div>

      {!posConnected && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          POS360 is not_connected. Order has not been sent to POS.
        </div>
      )}
      {!eatConnected && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          E.A.T. is not_connected. Management sync is preview_only.
        </div>
      )}
      {order.persistenceMode === 'memory_fallback' && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Order is in memory_fallback mode. Database required for production persistence.
        </div>
      )}

      {order.items && order.items.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Items</div>
          {order.items.map((item, i) => (
            <div key={i} className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>{item.name ?? item.menuItemId ?? `Item ${i + 1}`}</span>
              <span>{item.quantity ?? 1}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
