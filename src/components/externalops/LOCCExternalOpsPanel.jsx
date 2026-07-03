export default function LOCCExternalOpsPanel({ summary = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">LOCC External Operations</p>
      <div className="text-xs space-y-1">
        <p className="text-orange-500">external_sync_not_live</p>
        <p className="text-orange-500">real_time_push_pending</p>
        <p className="text-orange-500">reorder_not_submitted</p>
        <p className="text-orange-500">purchase_order_not_submitted</p>
        <p className="text-gray-500">canSubmitLive: false</p>
        <p className="text-gray-500">autoApprovalDisabled: true</p>
        {summary.databaseRequired && <p className="text-red-500">database_required</p>}
      </div>
    </div>
  )
}
