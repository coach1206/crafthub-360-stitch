export default function ModuleVersioningPanel({ report }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Versioning</h2>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Version:</span> {report?.version ?? '0.0.0'}</div>
        <div><span className="font-medium">Status:</span> <span className="text-blue-600 dark:text-blue-400">{report?.versionStatus ?? 'version_current'}</span></div>
        <div><span className="font-medium">Upgrade:</span> <span className="text-gray-500 dark:text-gray-400">{report?.upgradeStatus ?? 'upgrade_preview_ready'}</span></div>
        <div><span className="font-medium">Rollback:</span> <span className="text-gray-500 dark:text-gray-400">{report?.rollbackStatus ?? 'rollback_preview_ready'}</span></div>
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">upgrade_preview_ready · rollback_preview_ready</div>
    </div>
  )
}
