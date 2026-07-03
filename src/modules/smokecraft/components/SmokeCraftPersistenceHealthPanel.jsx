/**
 * SmokeCraftPersistenceHealthPanel
 * Shows overall database persistence health status.
 */

function StatusChip({ value, label }) {
  const positive = value === true || value === 'database_verified' || value === 'healthy'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      positive
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    }`}>
      {label ?? String(value)}
    </span>
  )
}

export default function SmokeCraftPersistenceHealthPanel({ health }) {
  if (!health) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Persistence health not available.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Persistence Health</h2>
        <StatusChip value={health.overallPersistenceMode} label={health.overallPersistenceMode} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          ['DB Configured',  health.databaseConfigured ? 'Yes' : 'No'],
          ['DB Verified',    health.databaseVerified   ? 'Yes' : 'No'],
          ['Production Ready', health.productionReady  ? 'Yes' : 'No'],
          ['Areas Total',    health.areasTotal],
          ['DB Verified Areas', health.areasDatabaseVerified],
          ['Memory Fallback', health.areasMemoryFallback],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded px-2 py-1">
            <span className="text-gray-500 dark:text-gray-400">{k}</span>
            <span className={`font-medium ${v === 'Yes' ? 'text-green-600 dark:text-green-400' : v === 'No' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>{v}</span>
          </div>
        ))}
      </div>

      {health.criticalWarnings?.length > 0 && (
        <div className="space-y-1">
          {health.criticalWarnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">{w}</div>
          ))}
        </div>
      )}

      {health.nextRequiredActions?.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Actions</h3>
          <ol className="space-y-0.5">
            {health.nextRequiredActions.map((a, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-300 font-mono">{a}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
