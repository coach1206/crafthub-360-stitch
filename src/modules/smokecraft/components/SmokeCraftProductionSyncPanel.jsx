/**
 * SmokeCraftProductionSyncPanel
 * Shows sync queue status and recent sync events.
 * Honest: blocked_not_connected / preview_only when no live connectors.
 */

const SYNC_STATUS_COLORS = {
  queued:                 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  ready:                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
  blocked_missing_config: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  blocked_not_connected:  'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  attempting:             'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
  synced:                 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  failed:                 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  retry_scheduled:        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
  dead_letter:            'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  preview_only:           'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
}

function SyncChip({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SYNC_STATUS_COLORS[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
      {status ?? 'unknown'}
    </span>
  )
}

function CountRow({ label, count }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-mono text-gray-800 dark:text-gray-200">{count ?? 0}</span>
    </div>
  )
}

function SyncEventRow({ event }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <div className="min-w-0">
        <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{event.targetSystem}</span>
        {event.eventType && (
          <span className="ml-1.5 text-gray-400 dark:text-gray-500">{event.eventType}</span>
        )}
      </div>
      <SyncChip status={event.syncStatus} />
    </div>
  )
}

export default function SmokeCraftProductionSyncPanel({ syncQueue }) {
  if (!syncQueue) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Sync queue status not available.
      </div>
    )
  }

  const events = syncQueue.recentEvents ?? []
  const counts = syncQueue.counts ?? {}

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Production Sync Queue</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {syncQueue.totalEvents ?? 0} total events
        </span>
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <CountRow label="Queued"              count={counts.queued} />
        <CountRow label="Blocked (no config)" count={counts.blocked_missing_config} />
        <CountRow label="Blocked (not connected)" count={counts.blocked_not_connected} />
        <CountRow label="Retry Scheduled"     count={counts.retry_scheduled} />
        <CountRow label="Dead Letter"         count={counts.dead_letter} />
        <CountRow label="Synced"              count={counts.synced} />
        <CountRow label="Failed"              count={counts.failed} />
      </div>

      {events.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Events</h3>
          <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
            {events.map(e => <SyncEventRow key={e.syncEventId} event={e} />)}
          </div>
        </>
      )}

      {syncQueue.allBlockedNotConnected && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          All sync events are blocked — no provider connectors are live. Sync will proceed once connectors are configured and verified.
        </div>
      )}
    </div>
  )
}
