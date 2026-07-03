import OperationsStatusBadge from './OperationsStatusBadge.jsx'

const STATUS_COLOR = {
  receiving_pending:      'text-yellow-600',
  received:               'text-green-600',
  receiving_preview_only: 'text-orange-500',
  partially_received:     'text-blue-600',
  damaged:                'text-red-600',
}

export default function ReceivingConfirmationQueuePanel({ records = [], databaseAvailable = false }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Receiving Queue ({records.length})</p>
        <OperationsStatusBadge status={databaseAvailable ? 'operational' : 'database_required'} />
      </div>
      {records.length === 0 && <p className="text-xs text-gray-500">No receiving records.</p>}
      {records.slice(0, 6).map((r, i) => (
        <div key={r.receiving_id ?? i} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
          <span className="text-gray-600 dark:text-gray-400">{r.receiving_id?.slice(0, 8) ?? '—'}</span>
          <span className={`font-mono font-semibold ${STATUS_COLOR[r.receiving_status] ?? 'text-gray-500'}`}>
            {r.receiving_status ?? 'receiving_pending'}
          </span>
        </div>
      ))}
      {!databaseAvailable && (
        <p className="text-[10px] text-orange-500">receiving_preview_only · inventory_not_persisted · adjusted_in_memory_only</p>
      )}
    </div>
  )
}
