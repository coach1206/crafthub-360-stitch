/**
 * SmokeCraftUpgradeRollbackPanel
 * Shows upgrade and rollback preview plans.
 * No migration is executed. Plans only.
 */

function PlanChip({ status }) {
  const isPreview = status?.includes('preview')
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      isPreview
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      {status ?? 'unknown'}
    </span>
  )
}

export default function SmokeCraftUpgradeRollbackPanel({ upgradeRollback }) {
  if (!upgradeRollback) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Upgrade/rollback status not available.
      </div>
    )
  }

  const rollbackSteps = upgradeRollback.rollbackSteps ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Upgrade / Rollback</h2>
        <PlanChip status={upgradeRollback.upgradePlanStatus} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Current Version</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{upgradeRollback.currentVersion}</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Target Version</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{upgradeRollback.targetVersion}</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Upgrade Plan</span>
          <PlanChip status={upgradeRollback.upgradePlanStatus} />
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Rollback Plan</span>
          <PlanChip status={upgradeRollback.rollbackPlanStatus} />
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Migration Required</span>
          <span className="text-gray-500 dark:text-gray-400">{upgradeRollback.migrationRequired ? 'yes' : 'no'}</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Migration Executed</span>
          <span className="text-green-600 dark:text-green-400">no</span>
        </div>
        <div className="flex justify-between text-xs py-1.5">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Breaking Changes</span>
          <span className="text-gray-500 dark:text-gray-400">{upgradeRollback.breakingChanges?.length ?? 0}</span>
        </div>
      </div>

      {rollbackSteps.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rollback Steps (Plan)</h3>
          <ol className="text-xs space-y-1 pl-3">
            {rollbackSteps.map((step, i) => (
              <li key={i} className="text-gray-600 dark:text-gray-400">{i + 1}. {step}</li>
            ))}
          </ol>
        </>
      )}

      <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
        This is a preview plan only — no migration has been executed and no database has been altered.
      </div>
    </div>
  )
}
