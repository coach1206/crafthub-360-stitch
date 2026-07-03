/**
 * SmokeCraftDatabaseStatusPanel
 * Shows database adapter status. Never exposes DATABASE_URL value.
 */

export default function SmokeCraftDatabaseStatusPanel({ database, warnings }) {
  if (!database) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Database status not available.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Database Status</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          database.configured
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        }`}>
          {database.persistenceMode}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        {[
          ['DATABASE_URL Present', database.databaseUrlPresent ? 'Yes (value hidden)' : 'No'],
          ['Connection Available', database.configured ? 'Yes' : 'No'],
          ['Verified',            database.verified ? 'Yes' : 'No'],
          ['Production Ready',    database.productionReady ? 'Yes' : 'No'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-gray-500 dark:text-gray-400">{k}</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{v}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1.5">
        Secret safety: DATABASE_URL value is never sent to the frontend. Only presence is reported.
      </div>

      {warnings?.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1">{w}</div>
          ))}
        </div>
      )}

      {database.note && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">{database.note}</div>
      )}
    </div>
  )
}
