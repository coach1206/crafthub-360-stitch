import OperationsStatusBadge from './OperationsStatusBadge.jsx'

export default function FailedSyncPanel({ failedEvents = [], onRetry = null }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Failed Sync Events</p>
        <span className={`text-xs font-semibold ${failedEvents.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {failedEvents.length} failed
        </span>
      </div>
      {failedEvents.length === 0 && <p className="text-xs text-gray-500">No failed sync events.</p>}
      {failedEvents.slice(0, 6).map((e, i) => (
        <div key={e.sync_event_id ?? i} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1 gap-2">
          <span className="font-mono text-gray-600 dark:text-gray-400 truncate">{e.event_type ?? 'sync_event'}</span>
          <OperationsStatusBadge status="failed" size="xs" />
          {onRetry && (
            <button onClick={() => onRetry(e.sync_event_id)}
              className="text-[10px] text-blue-500 underline">retry</button>
          )}
        </div>
      ))}
      <p className="text-[10px] text-orange-400">external_sync_not_live · retry_queues_event_only</p>
    </div>
  )
}
