/**
 * SmokeCraftEnvironmentValidationPanel
 * Shows environment variable presence (never values).
 * Secret values are always [REDACTED] — names and presence only.
 */

function PresenceChip({ present }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      present
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    }`}>
      {present ? 'set' : 'not set'}
    </span>
  )
}

function EnvRow({ name, meta }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <div className="min-w-0">
        <span className="font-mono text-gray-700 dark:text-gray-300">{name}</span>
        {meta?.critical && (
          <span className="ml-1.5 text-red-500 dark:text-red-400 font-medium">critical</span>
        )}
        {meta?.secret && (
          <span className="ml-1.5 text-gray-400 dark:text-gray-500">secret</span>
        )}
      </div>
      <PresenceChip present={meta?.present} />
    </div>
  )
}

export default function SmokeCraftEnvironmentValidationPanel({ environment }) {
  if (!environment) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Environment validation not available.
      </div>
    )
  }

  const vars = environment.vars ?? {}
  const varEntries = Object.entries(vars)
  const criticalMissing = environment.criticalMissing ?? 0
  const optionalMissing = environment.optionalMissing ?? 0

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Environment Validation</h2>
        <div className="flex items-center gap-1.5">
          {criticalMissing > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {criticalMissing} critical missing
            </span>
          )}
          {criticalMissing === 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {optionalMissing} optional missing
            </span>
          )}
        </div>
      </div>

      {varEntries.length > 0 && (
        <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
          {varEntries.map(([name, meta]) => (
            <EnvRow key={name} name={name} meta={meta} />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded p-2">
        Secret values are never shown — presence only. Values are [REDACTED] server-side.
      </div>

      {environment.valid === false && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
          Environment is not fully configured. {criticalMissing > 0 ? `${criticalMissing} critical variable(s) missing.` : 'Some optional variables are not set.'}
        </div>
      )}
    </div>
  )
}
