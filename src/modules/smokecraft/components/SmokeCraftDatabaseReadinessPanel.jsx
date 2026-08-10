/**
 * SmokeCraftDatabaseReadinessPanel
 * Shows database persistence mode, readiness, and warnings.
 * Honest: memory_fallback when no DATABASE_URL.
 */

const MODE_COLORS = {
  database:                 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  database_config_detected: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  memory_fallback:          'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

function ModeChip({ mode }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODE_COLORS[mode] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
      {mode ?? 'unknown'}
    </span>
  )
}

function StatusRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
      <span className={`text-gray-800 dark:text-gray-200 ${mono ? 'font-mono' : ''}`}>{String(value ?? '—')}</span>
    </div>
  )
}

export default function SmokeCraftDatabaseReadinessPanel({ database }) {
  if (!database) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Database readiness not available.
      </div>
    )
  }

  const warnings = database.warnings ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Database Readiness</h2>
        <ModeChip mode={database.persistenceMode} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <StatusRow label="Persistence Mode"   value={database.persistenceMode} />
        <StatusRow label="Production Ready"   value={database.productionReady ? 'yes' : 'no'} />
        <StatusRow label="DATABASE_URL"        value={database.databaseUrlPresent ? 'present' : 'not set'} />
        <StatusRow label="Config Verified"    value={database.configVerified ? 'yes' : 'no'} />
        {database.databaseHost && (
          <StatusRow label="Host" value={database.databaseHost} mono />
        )}
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">
              {w}
            </li>
          ))}
        </ul>
      )}

      {database.persistenceMode === 'memory_fallback' && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
          Running in memory fallback — data will not persist between restarts. Set DATABASE_URL to enable persistence.
        </div>
      )}
    </div>
  )
}
