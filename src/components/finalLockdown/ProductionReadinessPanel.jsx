export default function ProductionReadinessPanel({ report = {} }) {
  const { productionStatus, blockers = [], warnings = [] } = report
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Production Readiness</p>
      <div className="text-xs space-y-1">
        <p className={productionStatus === 'production_ready_with_env' ? 'text-blue-500' : 'text-red-500'}>
          {productionStatus || 'production_blocked'}
        </p>
        {blockers.map((b, i) => (
          <p key={i} className="text-red-500 font-mono">✗ {b.blocker || b}</p>
        ))}
        {warnings.slice(0, 3).map((w, i) => (
          <p key={i} className="text-orange-500 font-mono">⚠ {w.warning || w}</p>
        ))}
        <p className="text-gray-400 text-[10px]">database_required · external_credentials_required · stripe_required</p>
      </div>
    </div>
  )
}
