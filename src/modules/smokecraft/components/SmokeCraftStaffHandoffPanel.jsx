/**
 * SmokeCraftStaffHandoffPanel
 * Shows staff handoff status for a SmokeCraft order.
 * Displays POS and E.A.T. connection status honestly.
 */

const STATUS_LABELS = {
  draft:              { label: 'Draft',               color: 'gray' },
  requested:          { label: 'Order Requested',     color: 'blue' },
  sent_to_staff:      { label: 'Sent to Staff',       color: 'amber' },
  accepted_by_staff:  { label: 'Staff Accepted',      color: 'green' },
  staff_assisting:    { label: 'Staff Assisting',     color: 'green' },
  sent_to_pos:        { label: 'Sent to POS',         color: 'green' },
  completed:          { label: 'Completed',           color: 'green' },
  cancelled:          { label: 'Cancelled',           color: 'red' },
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'gray' }
  const colorMap = {
    gray:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    blue:  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    red:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorMap[s.color]}`}>
      {s.label}
    </span>
  )
}

export default function SmokeCraftStaffHandoffPanel({ order, onRequestStaff }) {
  if (!order) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        No active order.
      </div>
    )
  }

  const posNotConnected = order.posSyncStatus === 'not_connected' || !order.posSyncStatus
  const eatNotConnected = order.eatSyncStatus === 'not_connected' || !order.eatSyncStatus

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Staff Handoff</h2>
        <StatusBadge status={order.orderStatus} />
      </div>

      <div className="text-xs space-y-1 text-gray-500 dark:text-gray-400">
        <div><span className="font-medium">Order ID:</span> {order.orderId ?? '—'}</div>
        <div><span className="font-medium">Mode:</span> {order.orderMode ?? '—'}</div>
        {order.serverId && <div><span className="font-medium">Staff:</span> {order.serverId}</div>}
        {order.staffNotes && <div><span className="font-medium">Staff Notes:</span> {order.staffNotes}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`rounded p-2 ${posNotConnected ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
          <div className="font-medium text-gray-700 dark:text-gray-300">POS360</div>
          <div className={posNotConnected ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}>
            {posNotConnected ? 'not_connected' : 'connected'}
          </div>
        </div>
        <div className={`rounded p-2 ${eatNotConnected ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
          <div className="font-medium text-gray-700 dark:text-gray-300">E.A.T.</div>
          <div className={eatNotConnected ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}>
            {eatNotConnected ? 'not_connected' : 'connected'}
          </div>
        </div>
      </div>

      {['draft', 'requested'].includes(order.orderStatus) && onRequestStaff && (
        <button
          onClick={() => onRequestStaff(order.orderId)}
          className="w-full text-sm rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 py-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          Request Staff Assistance
        </button>
      )}
    </div>
  )
}
