export default function MissingEnvVarsPanel({ missing = [] }) {
  if (missing.length === 0) return (
    <div className="rounded border border-green-200 bg-green-50 dark:bg-green-900 p-3 text-xs text-green-700 dark:text-green-300">
      All required environment variables are set.
    </div>
  )
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900 dark:border-orange-700 p-3 space-y-1">
      <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">Missing Environment Variables ({missing.length})</p>
      {missing.map((v, i) => (
        <div key={i} className="text-xs">
          <span className="font-mono font-semibold text-orange-700 dark:text-orange-300">
            {typeof v === 'string' ? v : v.key}
          </span>
          {v.description && <span className="ml-1 text-orange-500">— {v.description}</span>}
        </div>
      ))}
      <p className="text-[10px] text-orange-400 mt-1">Set these variables to enable full production mode.</p>
    </div>
  )
}
