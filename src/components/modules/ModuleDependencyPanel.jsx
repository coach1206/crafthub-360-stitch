export default function ModuleDependencyPanel({ moduleId, report }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Dependency Map</h2>
      <div className="text-xs text-gray-500 dark:text-gray-400">{moduleId}</div>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Status:</span> <span className="text-blue-600 dark:text-blue-400">{report?.status ?? 'dependency_preview_only'}</span></div>
        <div><span className="font-medium">Dependencies:</span> {(report?.dependencies ?? []).join(', ') || 'none'}</div>
        <div><span className="font-medium">Optional:</span> {(report?.optionalDependencies ?? []).join(', ') || 'none'}</div>
        {report?.missingDependencies?.length > 0 && (
          <div className="text-red-600 dark:text-red-400 text-xs">Missing: {report.missingDependencies.join(', ')}</div>
        )}
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">dependency_preview_only</div>
    </div>
  )
}
