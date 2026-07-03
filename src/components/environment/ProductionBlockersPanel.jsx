export default function ProductionBlockersPanel({ blockers = [] }) {
  if (blockers.length === 0) return (
    <div className="rounded border border-green-200 bg-green-50 dark:bg-green-900 p-3 text-xs text-green-700 dark:text-green-300">
      No production blockers detected.
    </div>
  )
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900 dark:border-red-700 p-3 space-y-1">
      <p className="text-xs font-semibold text-red-700 dark:text-red-300">Production Blockers ({blockers.length})</p>
      {blockers.map((b, i) => (
        <div key={i} className="text-xs text-red-600 dark:text-red-400">
          <span className="font-mono font-semibold">{typeof b === 'string' ? b : b.key}</span>
          {b.message && <span className="ml-1 text-red-500">— {b.message}</span>}
        </div>
      ))}
    </div>
  )
}
