export default function ModuleManifestCard({ manifest }) {
  if (!manifest) return null
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-1 text-sm">
      <div className="font-semibold text-gray-900 dark:text-gray-100">{manifest.moduleName}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{manifest.moduleSlug} · {manifest.moduleType}</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">{manifest.moduleDescription}</div>
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{manifest.moduleStatus}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{manifest.coreOrAddon}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{manifest.pricingModel}</span>
      </div>
      {manifest.dependencies?.length > 0 && (
        <div className="text-xs text-gray-400 dark:text-gray-500">deps: {manifest.dependencies.join(', ')}</div>
      )}
      <div className="text-xs text-amber-600 dark:text-amber-400">needs_module_manifest · not_yet_packaged</div>
    </div>
  )
}
