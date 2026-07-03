export default function ProductionBlockerNotice({ blockers = [] }) {
  if (blockers.length === 0) return null
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
      <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">Production Blockers</p>
      <ul className="space-y-1">
        {blockers.map((b, i) => (
          <li key={i} className="text-xs text-red-600 dark:text-red-400 font-mono">
            ✗ {typeof b === 'string' ? b : b.blocker || JSON.stringify(b)}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-red-500 mt-2">Resolve all blockers before production launch.</p>
    </div>
  )
}
