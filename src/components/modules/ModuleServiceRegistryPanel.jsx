export default function ModuleServiceRegistryPanel({ report }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Service Registry</h2>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Status:</span> <span className="text-blue-600 dark:text-blue-400">{report?.status ?? 'services_ready'}</span></div>
        <div><span className="font-medium">Required:</span> {(report?.requiredServices ?? []).join(', ') || 'none'}</div>
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">services_registered_preview</div>
    </div>
  )
}
