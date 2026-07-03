export default function ModuleFoundationReadinessPanel({ data }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">NOMPF — Module Foundation Readiness</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">NOVEE OS Module Packaging Foundation</p>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Engine:</span> <span className="text-green-600 dark:text-green-400">NOMPF</span></div>
        <div><span className="font-medium">Status:</span> <span className="text-blue-600 dark:text-blue-400">{data?.schema?.status ?? 'schema_ready'}</span></div>
        <div><span className="font-medium">Registry:</span> <span className="text-blue-600 dark:text-blue-400">{data?.registry?.registryStatus ?? 'module_registry_active'}</span></div>
        <div><span className="font-medium">Persistence:</span> <span className="text-yellow-600 dark:text-yellow-400">{data?.registry?.persistenceMode ?? 'in_memory_only'}</span></div>
        <div><span className="font-medium">Modules:</span> {data?.registry?.totalModules ?? 15}</div>
        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">preview_only — not_yet_packaged</div>
        <div className="text-xs text-gray-400 dark:text-gray-500">NOVEE OS is platform software. noveeos.com is the portal.</div>
      </div>
    </div>
  )
}
