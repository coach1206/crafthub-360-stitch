export default function ModuleLifecycleHookPanel({ report }) {
  const hooks = report?.hooks ?? {}
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Lifecycle Hooks</h2>
      <div className="text-sm space-y-1">
        {Object.entries(hooks).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="font-medium capitalize">{k}</span>
            <span className="text-blue-600 dark:text-blue-400 text-xs">{v}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">install_preview · uninstall_preview · preview_only</div>
    </div>
  )
}
