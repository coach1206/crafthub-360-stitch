export default function DeploymentReadinessPanel({ report = {} }) {
  const blockers = report.blockers ?? []
  const warnings = report.warnings ?? []
  const ok = report.ok ?? false
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Deployment Readiness</p>
        <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {ok ? 'ready' : 'not_ready'}
        </span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Environment</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{report.environmentMode ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Provider</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{report.provider ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Persistence</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{report.persistence ?? 'in_memory_only'}</span>
        </div>
      </div>
      {blockers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-red-600">Blockers ({blockers.length})</p>
          {blockers.map((b, i) => (
            <p key={i} className="text-[10px] text-red-500">{typeof b === 'string' ? b : `${b.key}: ${b.message}`}</p>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-yellow-600">Warnings ({warnings.length})</p>
          {warnings.map((w, i) => <p key={i} className="text-[10px] text-yellow-500">{w}</p>)}
        </div>
      )}
    </div>
  )
}
