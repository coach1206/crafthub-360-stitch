import PersistenceStatusBadge from './PersistenceStatusBadge.jsx'

const STATUS_COLOR = {
  queued:    'text-blue-600',
  processed: 'text-green-600',
  failed:    'text-red-600',
  database_required: 'text-orange-600',
  external_system_required: 'text-purple-600',
}

export default function OperationalSyncEventPanel({ readiness }) {
  if (!readiness) return (
    <div className="rounded-lg border p-3 text-xs text-gray-500">
      sync_event_queued · external_sync_not_live
    </div>
  )
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Operational Sync Events</p>
        <PersistenceStatusBadge status={readiness.databaseRequired ? 'database_required' : 'persisted'} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-blue-50 dark:bg-blue-900 rounded p-2">
          <p className="font-bold text-blue-700">{readiness.queuedEvents ?? 0}</p>
          <p className="text-gray-500">Queued</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900 rounded p-2">
          <p className="font-bold text-green-700">{readiness.processedEvents ?? 0}</p>
          <p className="text-gray-500">Processed</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 rounded p-2">
          <p className="font-bold text-red-700">{readiness.failedEvents ?? 0}</p>
          <p className="text-gray-500">Failed</p>
        </div>
      </div>
      <p className={`text-xs font-medium ${STATUS_COLOR[readiness.syncStatus] ?? 'text-gray-500'}`}>
        {readiness.syncMessage ?? 'sync_event_queued'}
      </p>
      {readiness.externalSyncNotLive && (
        <p className="text-[10px] text-blue-500">external_sync_not_live · real_time_push_pending</p>
      )}
    </div>
  )
}
