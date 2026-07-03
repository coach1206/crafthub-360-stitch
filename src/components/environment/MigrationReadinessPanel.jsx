export default function MigrationReadinessPanel({ report = {} }) {
  const ok = report.ok ?? false
  const pending = report.pendingMigrations ?? []
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Migration Readiness</p>
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${ok ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {report.status ?? 'database_required'}
        </span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Latest expected</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{report.latestExpected ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Latest applied</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{report.latestApplied ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Pending</span>
          <span className={`font-semibold ${pending.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>{pending.length}</span>
        </div>
      </div>
      {pending.length > 0 && (
        <div className="space-y-1">
          {pending.slice(0, 5).map(m => (
            <p key={m} className="text-[10px] font-mono text-orange-600">{m}</p>
          ))}
          <p className="text-[10px] text-gray-400">Run: npm run db:migrate</p>
        </div>
      )}
    </div>
  )
}
