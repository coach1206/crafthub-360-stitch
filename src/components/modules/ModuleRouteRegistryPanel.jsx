export default function ModuleRouteRegistryPanel({ report }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Route Registry</h2>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Status:</span> <span className="text-blue-600 dark:text-blue-400">{report?.status ?? 'routes_ready'}</span></div>
        <div><span className="font-medium">Required Routes:</span> {(report?.requiredRoutes ?? []).length}</div>
        <div><span className="font-medium">Registered:</span> {(report?.registeredRoutes ?? []).length}</div>
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">routes_registered_preview · existing routes not remounted</div>
    </div>
  )
}
