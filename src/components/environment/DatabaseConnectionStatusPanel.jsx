import EnvironmentModeBadge from './EnvironmentModeBadge.jsx'

export default function DatabaseConnectionStatusPanel({ status = {}, redacted = null }) {
  const connected = status.status === 'connected' || status.status === 'url_present' || status.status === 'pool_ready'
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Database Connection</p>
        <EnvironmentModeBadge mode={connected ? 'local_database' : 'database_missing'} />
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className={`font-mono font-semibold ${connected ? 'text-green-600' : 'text-orange-600'}`}>
            {status.status ?? 'missing_database_url'}
          </span>
        </div>
        {redacted && (
          <div className="flex justify-between">
            <span className="text-gray-500">URL (redacted)</span>
            <span className="font-mono text-gray-400 truncate max-w-[200px]">{redacted}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Degraded mode</span>
          <span className={status.degradedMode ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
            {status.degradedMode ? 'true' : 'false'}
          </span>
        </div>
      </div>
      {status.degradedMode && (
        <p className="text-[10px] text-orange-500">database_required · in_memory_only · set DATABASE_URL to enable persistence</p>
      )}
    </div>
  )
}
