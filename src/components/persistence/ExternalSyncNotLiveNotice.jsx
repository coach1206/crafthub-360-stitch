export default function ExternalSyncNotLiveNotice({ externalPOS = false, vendor = false }) {
  return (
    <div className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 p-3 text-xs space-y-1">
      <p className="font-semibold text-blue-800 dark:text-blue-200">external_sync_not_live</p>
      {externalPOS && (
        <p className="text-blue-700 dark:text-blue-300">external_pos_required — POS inventory sync not active.</p>
      )}
      {vendor && (
        <p className="text-blue-700 dark:text-blue-300">vendor_api_required — Distributor/manufacturer sync not active.</p>
      )}
      <p className="text-blue-600 dark:text-blue-400">real_time_push_pending — Future phase required for live integration.</p>
    </div>
  )
}
