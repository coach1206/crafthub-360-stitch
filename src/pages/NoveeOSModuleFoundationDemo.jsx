import ModuleFoundationReadinessPanel from '../components/modules/ModuleFoundationReadinessPanel'
import ModuleRegistryPanel from '../components/modules/ModuleRegistryPanel'
import ModuleManifestCard from '../components/modules/ModuleManifestCard'
import ModuleDependencyPanel from '../components/modules/ModuleDependencyPanel'
import ModuleActivationPanel from '../components/modules/ModuleActivationPanel'
import ModuleLifecycleHookPanel from '../components/modules/ModuleLifecycleHookPanel'
import ModuleVersioningPanel from '../components/modules/ModuleVersioningPanel'
import ModulePermissionPanel from '../components/modules/ModulePermissionPanel'
import ModuleRouteRegistryPanel from '../components/modules/ModuleRouteRegistryPanel'
import ModuleServiceRegistryPanel from '../components/modules/ModuleServiceRegistryPanel'
import ModuleComponentRegistryPanel from '../components/modules/ModuleComponentRegistryPanel'
import ModuleHookRegistryPanel from '../components/modules/ModuleHookRegistryPanel'
import ModuleAuditPanel from '../components/modules/ModuleAuditPanel'
import ModuleMarketplaceDraftPanel from '../components/modules/ModuleMarketplaceDraftPanel'
import ModuleLicenseReadinessPanel from '../components/modules/ModuleLicenseReadinessPanel'
import InitialModuleManifestPanel from '../components/modules/InitialModuleManifestPanel'

const EXAMPLE_MANIFEST = {
  moduleId: 'smokecraft-experience',
  moduleName: 'SmokeCraft Experience Module',
  moduleSlug: 'smokecraft-experience',
  moduleType: 'experience_module',
  moduleCategory: 'hospitality',
  moduleDescription: 'SmokeCraft cigar experience — passport, connections, 8-visit/24-session progression.',
  moduleVersion: '0.0.0',
  moduleStatus: 'not_yet_packaged',
  coreOrAddon: 'core',
  premiumEligible: true,
  pricingModel: 'per_venue',
  dependencies: ['nompf-core'],
  manifestNote: 'needs_module_manifest',
}

const EXAMPLE_MANIFESTS = [EXAMPLE_MANIFEST]

const MODULE_BUILD_SEQUENCE = [
  { build: 1, name: 'NOVEE OS Module Packaging Foundation', status: 'complete' },
  { build: 2, name: 'SmokeCraft Experience Module', status: 'next' },
  { build: 3, name: 'POS360 Module', status: 'pending' },
  { build: 4, name: 'E.A.T. Command Hub Module', status: 'pending' },
  { build: 5, name: 'Inventory Availability Module (ISPAE)', status: 'pending' },
  { build: 6, name: 'Reorder Connector Add-On (DMRC)', status: 'pending' },
  { build: 7, name: 'LOCC Module', status: 'pending' },
  { build: 8, name: 'EOCG Module', status: 'pending' },
  { build: 9, name: 'White-Label Marketplace Licensing Module', status: 'pending' },
]

export default function NoveeOSModuleFoundationDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Module Build 1 of 9 · Component proof page · Not final admin dashboard
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          NOVEE OS Module Packaging Foundation
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          NOMPF — the operating layer that future modules plug into
        </p>
      </div>

      {/* Platform Clarification */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-1 text-sm">
        <div className="font-semibold text-blue-800 dark:text-blue-200">Platform Clarification</div>
        <div className="text-blue-700 dark:text-blue-300">
          NOVEE OS is the platform operating layer (platform_software) — not a website. It hosts installable modules, controls module activation, licensing, permissions, tenant/venue access, upgrades, rollback, and marketplace readiness.
        </div>
        <div className="text-blue-600 dark:text-blue-400">
          noveeos.com is the public-facing portal — customer access, marketplace storefront, documentation, login, and support.
        </div>
        <div className="text-amber-700 dark:text-amber-300 font-medium mt-1">
          These modules are not packaged yet · not_live_marketplace · MODULE BUILD 2 is next · not Phase 20
        </div>
      </div>

      {/* Foundation Readiness */}
      <ModuleFoundationReadinessPanel data={{ schema: { status: 'schema_ready' }, registry: { registryStatus: 'module_registry_active', persistenceMode: 'in_memory_only', totalModules: 15 } }} />

      {/* Module Registry */}
      <ModuleRegistryPanel modules={EXAMPLE_MANIFESTS} />

      {/* Manifest Example */}
      <div className="space-y-2">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Module Manifest Example</h2>
        <ModuleManifestCard manifest={EXAMPLE_MANIFEST} />
      </div>

      {/* Dependency / Activation / Lifecycle / Versioning */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ModuleDependencyPanel moduleId="smokecraft-experience" report={{ status: 'dependency_preview_only', dependencies: ['nompf-core'], optionalDependencies: [], missingDependencies: [] }} />
        <ModuleActivationPanel report={{ activationStatus: 'activation_ready', requirementsStatus: 'activation_ready', database_required: true }} />
        <ModuleLifecycleHookPanel report={{ hooks: { install: 'install_preview_ready', uninstall: 'uninstall_preview_ready', enable: 'enable_preview_ready', disable: 'disable_preview_ready', upgrade: 'upgrade_preview_ready', rollback: 'rollback_preview_ready' } }} />
        <ModuleVersioningPanel report={{ version: '0.0.0', versionStatus: 'version_current', upgradeStatus: 'upgrade_preview_ready', rollbackStatus: 'rollback_preview_ready' }} />
      </div>

      {/* Permission Map */}
      <ModulePermissionPanel report={{ permissionMap: { guest: 'preview_only', customer: 'preview_only', server: 'preview_only', bartender: 'preview_only', kitchen_staff: 'preview_only', manager: 'permission_granted', owner: 'permission_granted', admin: 'permission_granted', internal_admin: 'permission_granted' } }} />

      {/* Registries */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleRouteRegistryPanel report={{ status: 'routes_ready', requiredRoutes: [], registeredRoutes: [] }} />
        <ModuleServiceRegistryPanel report={{ status: 'services_ready', requiredServices: ['smokecraftJourneyService'] }} />
        <ModuleComponentRegistryPanel report={{ status: 'components_ready', requiredComponents: ['SmokeCraftAssetScreen'] }} />
        <ModuleHookRegistryPanel report={{ status: 'hooks_ready', supportedSystems: ['eat','pos360','ncie','checkout','staff','kds','locc','eocg','audit'] }} />
        <ModuleAuditPanel report={{ totalEvents: 0, persistenceMode: 'in_memory_only', database_required: true }} />
      </div>

      {/* Marketplace + License */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ModuleMarketplaceDraftPanel report={{ marketplaceEligible: 9 }} drafts={[{ moduleId: 'smokecraft-experience', moduleName: 'SmokeCraft Experience', draftStatus: 'marketplace_draft_ready' }]} />
        <ModuleLicenseReadinessPanel report={{ licenseGateBuilt: false, totalModules: 15, byTier: { standard: 4, premium: 6, enterprise: 3, white_label: 1, reseller: 1, none: 0 } }} />
      </div>

      {/* Initial Module Manifests */}
      <InitialModuleManifestPanel manifests={EXAMPLE_MANIFESTS} />

      {/* Module Build Sequence */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Module Build Sequence</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">POST-PHASE MODULE BUILD SERIES — not Phase 20</p>
        <div className="space-y-1">
          {MODULE_BUILD_SEQUENCE.map(b => (
            <div key={b.build} className={`flex items-center gap-3 text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0 ${b.status === 'complete' ? 'text-green-600 dark:text-green-400' : b.status === 'next' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
              <span className="w-6 text-center font-mono">{b.build}</span>
              <span>{b.name}</span>
              {b.status === 'complete' && <span className="text-xs ml-auto">✓ complete</span>}
              {b.status === 'next' && <span className="text-xs ml-auto">← next</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
