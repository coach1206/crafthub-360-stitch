/**
 * SmokeCraftStaffOperationsPanel
 * Shows staff queue summary, pending/accepted/completed/cancelled orders,
 * handoff status, and POS not_connected warning.
 */

function OrderStatusBadge({ status }) {
  const colors = {
    pending:          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    accepted_by_staff:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    completed:        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    cancelled:        'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    sent_to_pos:      'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
      {status ?? '—'}
    </span>
  )
}

function QueueStatBox({ label, value, color = 'gray' }) {
  const colorMap = {
    amber:  'bg-amber-50 dark:bg-amber-900/20',
    blue:   'bg-blue-50 dark:bg-blue-900/20',
    green:  'bg-green-50 dark:bg-green-900/20',
    red:    'bg-red-50 dark:bg-red-900/20',
    gray:   'bg-gray-50 dark:bg-gray-800/50',
  }
  return (
    <div className={`rounded p-3 text-center space-y-0.5 ${colorMap[color]}`}>
      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value ?? 0}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  )
}

function OrderRow({ record }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <div>
        <div className="font-mono text-gray-600 dark:text-gray-400">{record.queueRecordId ?? record.orderId ?? '—'}</div>
        <div className="text-gray-400 dark:text-gray-500">{record.orderMode ?? '—'}</div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <OrderStatusBadge status={record.orderStatus} />
        {record.handoffStatus && (
          <span className="text-gray-400 dark:text-gray-500">handoff: {record.handoffStatus}</span>
        )}
      </div>
    </div>
  )
}

export default function SmokeCraftStaffOperationsPanel({ staffQueue }) {
  if (!staffQueue) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Staff queue data not available.
      </div>
    )
  }

  const {
    pendingCount = 0,
    acceptedCount = 0,
    completedCount = 0,
    cancelledCount = 0,
    records = [],
    posNotConnected,
    eatSyncStatus,
  } = staffQueue

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Staff Operations</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QueueStatBox label="Pending"   value={pendingCount}   color="amber" />
        <QueueStatBox label="Accepted"  value={acceptedCount}  color="blue" />
        <QueueStatBox label="Completed" value={completedCount} color="green" />
        <QueueStatBox label="Cancelled" value={cancelledCount} color="red" />
      </div>

      {records.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Queue</div>
          <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
            {records.map((r, i) => <OrderRow key={r.queueRecordId ?? i} record={r} />)}
          </div>
        </div>
      )}

      {posNotConnected && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
          POS360 not connected — orders cannot be sent to POS system.
        </div>
      )}

      {eatSyncStatus === 'not_connected' && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          E.A.T. sync is not connected — management sync is preview_only.
        </div>
      )}

      {records.length === 0 && (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          No orders in staff queue.
        </div>
      )}
    </div>
  )
}
