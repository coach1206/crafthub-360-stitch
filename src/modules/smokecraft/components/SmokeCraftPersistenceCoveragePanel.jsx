/**
 * SmokeCraftPersistenceCoveragePanel
 * Shows persistence mode for each SmokeCraft data area.
 */

const MODE_COLORS = {
  memory_fallback:          'text-amber-600 dark:text-amber-400',
  database_contract_ready:  'text-blue-600 dark:text-blue-400',
  database_config_detected: 'text-indigo-600 dark:text-indigo-400',
  database_verified:        'text-green-600 dark:text-green-400',
  not_applicable:           'text-gray-400 dark:text-gray-500',
  blocked:                  'text-red-600 dark:text-red-400',
}

function AreaRow({ area }) {
  const modeColor = MODE_COLORS[area.currentPersistenceMode] ?? 'text-gray-500'
  return (
    <div className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{area.displayName}</span>
      <span className={`flex-shrink-0 font-mono ${modeColor}`}>{area.currentPersistenceMode}</span>
      {area.usesMemoryFallback && (
        <span className="flex-shrink-0 text-amber-500 dark:text-amber-400 text-xs">⚠</span>
      )}
      {area.productionReady && (
        <span className="flex-shrink-0 text-green-500 dark:text-green-400 text-xs">✓</span>
      )}
    </div>
  )
}

export default function SmokeCraftPersistenceCoveragePanel({ areas, summary }) {
  if (!areas?.length) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Persistence coverage not available.
      </div>
    )
  }

  const memFallback = areas.filter(a => a.usesMemoryFallback).length
  const dbVerified  = areas.filter(a => a.databaseVerified).length

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Persistence Coverage</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{areas.length} areas</span>
      </div>

      <div className="flex gap-3 text-xs">
        <span className="text-amber-600 dark:text-amber-400">{memFallback} memory_fallback</span>
        <span className="text-green-600 dark:text-green-400">{dbVerified} verified</span>
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2 max-h-80 overflow-y-auto">
        {areas.map(area => <AreaRow key={area.areaId} area={area} />)}
      </div>

      {summary?.warning && (
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1.5">
          {summary.warning}
        </div>
      )}
    </div>
  )
}
