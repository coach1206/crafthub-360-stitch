import ModuleManifestCard from './ModuleManifestCard'

export default function InitialModuleManifestPanel({ manifests = [] }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Initial Module Manifests ({manifests.length})</h2>
      <p className="text-xs text-amber-600 dark:text-amber-400">not_yet_packaged · needs_module_manifest · all modules are drafts</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {manifests.map(m => <ModuleManifestCard key={m.moduleId} manifest={m} />)}
      </div>
    </div>
  )
}
