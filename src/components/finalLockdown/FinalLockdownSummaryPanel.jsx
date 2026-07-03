export default function FinalLockdownSummaryPanel({ report = {} }) {
  const { lockdownStatus, productionStatus, blockers = [], can_submit_live, auto_approval_disabled, external_sync_not_live, real_time_push_pending, phase19_sealed } = report
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Phase 19 — Final Lockdown</p>
      <div className="text-xs space-y-1">
        <p className={lockdownStatus === 'locked' ? 'text-green-600' : 'text-red-500'}>
          lockdownStatus: {lockdownStatus || 'locked'}
        </p>
        <p className={productionStatus === 'production_ready_with_env' ? 'text-blue-500' : 'text-orange-500'}>
          productionStatus: {productionStatus || 'production_blocked'}
        </p>
        {phase19_sealed && <p className="text-green-600">phase19_sealed: true</p>}
        <p className="text-gray-500">can_submit_live: {String(can_submit_live ?? false)}</p>
        <p className="text-gray-500">auto_approval_disabled: {String(auto_approval_disabled ?? true)}</p>
        {external_sync_not_live && <p className="text-orange-500">external_sync_not_live</p>}
        {real_time_push_pending && <p className="text-orange-500">real_time_push_pending</p>}
        {blockers.length > 0 && <p className="text-red-500">{blockers.length} blocker(s)</p>}
      </div>
    </div>
  )
}
