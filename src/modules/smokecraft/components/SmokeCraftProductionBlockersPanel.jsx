/**
 * SmokeCraftProductionBlockersPanel
 * Shows all production blockers with severity and affected areas.
 */

const SEVERITY_COLORS = {
  critical: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  high:     'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300',
  medium:   'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
}

function BlockerCard({ blocker }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded p-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{blocker.title}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${SEVERITY_COLORS[blocker.severity] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
          {blocker.severity}
        </span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{blocker.affectedArea} — {blocker.currentStatus}</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">{blocker.requiredResolution}</div>
      <div className="flex gap-2 text-xs">
        {blocker.blocksProduction && <span className="text-red-500 dark:text-red-400">blocks production</span>}
        {blocker.blocksMarketplace && <span className="text-red-500 dark:text-red-400">blocks marketplace</span>}
        {blocker.blocksLicenseEnforcement && <span className="text-red-500 dark:text-red-400">blocks license</span>}
      </div>
    </div>
  )
}

export default function SmokeCraftProductionBlockersPanel({ blockers }) {
  const blockerList = blockers?.allBlockers ?? blockers ?? []

  if (!blockerList.length) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Production blockers not available.
      </div>
    )
  }

  const critical = blockerList.filter(b => b.severity === 'critical')
  const others   = blockerList.filter(b => b.severity !== 'critical')

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Production Blockers</h2>
        <span className="text-xs text-red-600 dark:text-red-400">{blockerList.length} blockers</span>
      </div>

      {critical.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Critical</h3>
          <div className="space-y-2">
            {critical.map(b => <BlockerCard key={b.blockerId} blocker={b} />)}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">High / Medium</h3>
          <div className="space-y-2">
            {others.map(b => <BlockerCard key={b.blockerId} blocker={b} />)}
          </div>
        </>
      )}
    </div>
  )
}
