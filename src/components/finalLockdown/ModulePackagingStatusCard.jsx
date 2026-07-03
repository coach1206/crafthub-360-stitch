import ReadyToPackageBadge from './ReadyToPackageBadge.jsx'

export default function ModulePackagingStatusCard({ module: mod }) {
  if (!mod) return null
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{mod.moduleName}</p>
        <ReadyToPackageBadge status={mod.packagingReadiness} />
      </div>
      <p className="text-[10px] text-gray-500 font-mono">{mod.moduleId} · {mod.coreOrAddon}</p>
      {mod.blockers?.length > 0 && (
        <p className="text-[10px] text-orange-500 truncate">⚠ {mod.blockers[0]}</p>
      )}
    </div>
  )
}
