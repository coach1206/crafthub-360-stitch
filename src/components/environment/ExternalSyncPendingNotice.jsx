export default function ExternalSyncPendingNotice({ showPOS = true, showVendor = true }) {
  return (
    <div className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-900 dark:border-blue-700 p-2 text-xs space-y-1">
      {showPOS && (
        <p className="text-blue-800 dark:text-blue-200">
          <strong>external_sync_not_live</strong> — No live POS sync active.
          <span className="ml-1 text-blue-500">external_pos_required · real_time_push_pending</span>
        </p>
      )}
      {showVendor && (
        <p className="text-blue-800 dark:text-blue-200">
          <strong>vendor_sync_not_live</strong> — No vendor/distributor API connected.
          <span className="ml-1 text-blue-500">distributor_connection_required · manufacturer_connection_required · reorder_not_submitted</span>
        </p>
      )}
    </div>
  )
}
