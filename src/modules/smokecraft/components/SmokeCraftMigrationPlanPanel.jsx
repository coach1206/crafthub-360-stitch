/**
 * SmokeCraftMigrationPlanPanel
 * Shows migration plan. Always warns that no auto-migration is run.
 */

const RISK_COLORS = {
  low:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  high:   'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

export default function SmokeCraftMigrationPlanPanel({ plan }) {
  if (!plan) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Migration plan not available.
      </div>
    )
  }

  const areas = plan.areas ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Migration Plan</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
          {plan.safeToRun ? 'safe to run' : 'review required'}
        </span>
      </div>

      <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1.5 font-medium">
        No automatic migration is run. Review the migration file and apply manually.
      </div>

      <div className="space-y-1 text-xs">
        {[
          ['Migration File',   plan.migrationFile],
          ['Auto-Run',         plan.autoRunEnabled ? 'ENABLED' : 'Disabled'],
          ['Safe to Run Now',  plan.safeToRun ? 'Yes' : 'No — manual review required'],
          ['DB Configured',    plan.databaseConfigured ? 'Yes' : 'No'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-gray-500 dark:text-gray-400">{k}</span>
            <span className={`font-medium ${k === 'Auto-Run' && v === 'ENABLED' ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>{v}</span>
          </div>
        ))}
      </div>

      {plan.instructions?.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Instructions</h3>
          <ol className="space-y-0.5">
            {plan.instructions.map((inst, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-300 font-mono">{inst}</li>
            ))}
          </ol>
        </div>
      )}

      {areas.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Areas ({areas.length})
          </h3>
          <div className="border border-gray-100 dark:border-gray-800 rounded p-2 max-h-48 overflow-y-auto space-y-1">
            {areas.slice(0, 20).map(a => (
              <div key={a.areaId} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300">{a.areaId}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">{a.sourceMode} → {a.targetMode}</span>
                  <span className={`px-1 rounded text-xs ${RISK_COLORS[a.riskLevel] ?? ''}`}>{a.riskLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
