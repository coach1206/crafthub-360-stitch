export default function BlockedSyncPanel({ blockedEvents = [] }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Blocked Sync Events ({blockedEvents.length})</p>
        <span className={`text-xs font-semibold ${blockedEvents.length > 0 ? 'text-gray-600' : 'text-green-600'}`}>
          {blockedEvents.length > 0 ? 'blocked' : 'none'}
        </span>
      </div>
      {blockedEvents.length === 0 && <p className="text-xs text-gray-500">No blocked sync events.</p>}
      {blockedEvents.slice(0, 6).map((e, i) => (
        <div key={e.syncEventId ?? i} className="text-xs border-b dark:border-gray-700 pb-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-gray-600 dark:text-gray-400">{e.syncEventId ?? '—'}</span>
            <span className="text-gray-400 text-[10px]">blocked</span>
          </div>
          {e.reason && <p className="text-[10px] text-gray-400">{e.reason}</p>}
        </div>
      ))}
    </div>
  )
}
