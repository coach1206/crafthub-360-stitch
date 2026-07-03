export default function ModuleLicenseReadinessPanel({ report }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">License Readiness</h2>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">License Gate Built:</span> <span className="text-red-500 dark:text-red-400">{String(report?.licenseGateBuilt ?? false)}</span></div>
        <div><span className="font-medium">Enforcement:</span> <span className="text-yellow-600 dark:text-yellow-400">license_not_enforced</span></div>
        <div><span className="font-medium">Total Modules:</span> {report?.totalModules ?? 15}</div>
        {report?.byTier && (
          <div className="text-xs space-y-0.5">
            {Object.entries(report.byTier).map(([tier, count]) => count > 0 && (
              <div key={tier} className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>{tier}</span><span>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">license_ready_draft · license_not_enforced · preview_only</div>
    </div>
  )
}
