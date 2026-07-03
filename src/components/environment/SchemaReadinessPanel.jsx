const SECTIONS = ['inventory','reorder','receiving','sync','vendor','payment','pos360']

export default function SchemaReadinessPanel({ report = {} }) {
  const ok = report.ok ?? false
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Schema Readiness</p>
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${ok ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {report.status ?? 'database_required'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {SECTIONS.map(s => {
          const sec = report[s] ?? {}
          return (
            <div key={s} className="flex items-center justify-between border rounded px-2 py-1 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{s}</span>
              <span className={`font-mono ${sec.ok ? 'text-green-600' : 'text-orange-500'}`}>
                {sec.ok ? 'ready' : (sec.status ?? 'required')}
              </span>
            </div>
          )
        })}
      </div>
      {report.degradedMode && (
        <p className="text-[10px] text-orange-500">schema_partial · database_required · run db:migrate to activate</p>
      )}
    </div>
  )
}
