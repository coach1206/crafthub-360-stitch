export default function ModulePermissionPanel({ report }) {
  const map = report?.permissionMap ?? {}
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Permission Map</h2>
      <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
        {Object.entries(map).map(([role, status]) => (
          <div key={role} className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">{role}</span>
            <span className={`text-xs ${status === 'permission_granted' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>{status}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">permission_map preview_only · existing role behavior unchanged</div>
    </div>
  )
}
