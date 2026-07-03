import FinalLockdownSummaryPanel from '../components/finalLockdown/FinalLockdownSummaryPanel.jsx'
import ProductionReadinessPanel from '../components/finalLockdown/ProductionReadinessPanel.jsx'
import ProtectedFileIntegrityPanel from '../components/finalLockdown/ProtectedFileIntegrityPanel.jsx'
import DegradedModeHonestyPanel from '../components/finalLockdown/DegradedModeHonestyPanel.jsx'
import SecuritySafetyAuditPanel from '../components/finalLockdown/SecuritySafetyAuditPanel.jsx'
import ModuleReadinessMapPanel from '../components/finalLockdown/ModuleReadinessMapPanel.jsx'
import MarketplaceReadinessPanel from '../components/finalLockdown/MarketplaceReadinessPanel.jsx'
import WhiteLabelReadinessPanel from '../components/finalLockdown/WhiteLabelReadinessPanel.jsx'
import VerificationRegistryPanel from '../components/finalLockdown/VerificationRegistryPanel.jsx'
import LaunchChecklistPanel from '../components/finalLockdown/LaunchChecklistPanel.jsx'
import PostPhaseModulePlanPanel from '../components/finalLockdown/PostPhaseModulePlanPanel.jsx'
import ProductionBlockerNotice from '../components/finalLockdown/ProductionBlockerNotice.jsx'

const DEMO_REPORT = {
  lockdownStatus: 'locked',
  productionStatus: 'production_blocked',
  phase19_sealed: true,
  can_submit_live: false,
  auto_approval_disabled: true,
  external_sync_not_live: true,
  real_time_push_pending: true,
  vendor_sync_not_live: true,
  blockers: [],
}

const DEMO_BLOCKERS = [
  { blocker: 'database_required', severity: 'critical' },
  { blocker: 'session_secret_required', severity: 'critical' },
  { blocker: 'stripe_required', severity: 'high' },
]

const DEMO_PRODUCTION = {
  productionStatus: 'production_blocked',
  blockers: DEMO_BLOCKERS,
  warnings: [
    { warning: 'external_sync_not_live' },
    { warning: 'vendor_sync_not_live' },
    { warning: 'real_time_push_pending' },
  ],
}

const DEMO_PROTECTED = {
  existence: {
    all_present: true,
    count: 9,
    present: 9,
    missing: 0,
    files: [
      { file: 'src/components/smokecraft/SmokeCraftAssetScreen.jsx', exists: true },
      { file: 'src/components/smokecraft/SmokeCraftHotspotLayer.jsx', exists: true },
      { file: 'src/components/smokecraft/SmokeCraftAssetRoute.jsx', exists: true },
      { file: 'src/constants/session.js', exists: true },
      { file: 'src/utils/passportProgress.js', exists: true },
      { file: 'src/utils/passportEntry.js', exists: true },
      { file: 'src/constants/smokecraftJourney.js', exists: true },
      { file: 'src/pages/POS360.jsx', exists: true },
      { file: 'server/services/eatCommandHubContract.js', exists: true },
    ],
  },
}

export default function FinalProductionLockdownDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Final Production Lockdown Demo</h1>
          <p className="text-sm text-gray-500 mt-1">Phase 19 FPLMRL — Component proof page · Not final admin dashboard</p>
          <p className="text-xs text-orange-400 mt-1">Phase 19 of 19 — The 19-phase core build is sealed after this phase.</p>
        </div>

        <ProductionBlockerNotice blockers={DEMO_BLOCKERS} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FinalLockdownSummaryPanel report={DEMO_REPORT} />
          <ProductionReadinessPanel report={DEMO_PRODUCTION} />
          <ProtectedFileIntegrityPanel report={DEMO_PROTECTED} />
          <DegradedModeHonestyPanel />
          <SecuritySafetyAuditPanel />
          <VerificationRegistryPanel />
          <LaunchChecklistPanel />
          <MarketplaceReadinessPanel />
          <WhiteLabelReadinessPanel />
          <PostPhaseModulePlanPanel />
        </div>

        <ModuleReadinessMapPanel />

        <div className="rounded-lg border bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Phase 19 Honest Status Summary</p>
          <div className="text-[10px] font-mono space-y-0.5 text-gray-500">
            <p>phase_19_sealed: true · lockdownStatus: locked · 19_phases_complete</p>
            <p>database_required · session_secret_required · stripe_required</p>
            <p>external_sync_not_live · real_time_push_pending · vendor_sync_not_live</p>
            <p>can_submit_live: false · auto_approval_disabled: true</p>
            <p>module_manifests_not_created · module_install_hooks_not_built</p>
            <p>license_gate_not_built · marketplace_not_live · white_label_not_live</p>
            <p>production_blocked_until_env_configured</p>
            <p>next: Post-Phase Final Audit Review → Module Build 1</p>
          </div>
        </div>
      </div>
    </div>
  )
}
