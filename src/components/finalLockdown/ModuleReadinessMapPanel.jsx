import ModulePackagingStatusCard from './ModulePackagingStatusCard.jsx'

const DEMO_MODULES = [
  { moduleId: 'smokecraft-experience', moduleName: 'SmokeCraft Experience', coreOrAddon: 'core', packagingReadiness: 'needs_module_manifest', blockers: ['module_manifest_not_created'] },
  { moduleId: 'pos360', moduleName: 'POS360', coreOrAddon: 'core', packagingReadiness: 'needs_module_manifest', blockers: ['module_manifest_not_created'] },
  { moduleId: 'eat-command-hub', moduleName: 'E.A.T. Command Hub', coreOrAddon: 'core', packagingReadiness: 'needs_module_manifest', blockers: ['module_manifest_not_created'] },
  { moduleId: 'inventory-ispae', moduleName: 'Inventory / ISPAE', coreOrAddon: 'core', packagingReadiness: 'needs_module_manifest', blockers: ['module_manifest_not_created'] },
  { moduleId: 'reorder-dmrc', moduleName: 'Reorder Connector / DMRC', coreOrAddon: 'addon', packagingReadiness: 'needs_module_manifest', blockers: ['module_manifest_not_created'] },
  { moduleId: 'locc', moduleName: 'LOCC', coreOrAddon: 'core', packagingReadiness: 'needs_module_manifest', blockers: ['module_manifest_not_created'] },
  { moduleId: 'eocg', moduleName: 'EOCG', coreOrAddon: 'addon', packagingReadiness: 'needs_module_manifest', blockers: ['module_manifest_not_created'] },
]

export default function ModuleReadinessMapPanel({ modules = DEMO_MODULES }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Module Readiness Map</p>
      <p className="text-xs text-orange-500">not_yet_packaged — module_manifests_required</p>
      <div className="space-y-1.5">
        {modules.map(m => <ModulePackagingStatusCard key={m.moduleId} module={m} />)}
      </div>
      <p className="text-[10px] text-gray-400">module_install_not_built_yet · readiness_mapped_only</p>
    </div>
  )
}
