export default function ModuleRegistryPanel({ modules = [] }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Module Registry</h2>
      <p className="text-xs text-yellow-600 dark:text-yellow-400">module_registry_in_memory_only · database_required for durability</p>
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {modules.length === 0
          ? <div className="text-gray-400 dark:text-gray-500">No modules registered</div>
          : modules.map(m => (
            <div key={m.moduleId} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="font-medium">{m.moduleName}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400">{m.moduleStatus}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
