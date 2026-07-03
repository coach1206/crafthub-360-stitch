export default function ModuleAuditPanel({ report }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Module Audit Trail</h2>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Total Events:</span> {report?.totalEvents ?? 0}</div>
        <div><span className="font-medium">Persistence:</span> <span className="text-yellow-600 dark:text-yellow-400">{report?.persistenceMode ?? 'in_memory_only'}</span></div>
        <div><span className="font-medium">DB Required:</span> <span className="text-yellow-600 dark:text-yellow-400">{report?.database_required ? 'yes' : 'no'}</span></div>
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">audit_preview_only · database_required for durable audit log</div>
    </div>
  )
}
