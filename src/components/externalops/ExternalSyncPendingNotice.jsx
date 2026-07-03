export default function ExternalSyncPendingNotice() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 p-3 space-y-1">
      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">external_sync_not_live</p>
      <p className="text-[10px] text-blue-600 dark:text-blue-400">real_time_push_pending · vendor_sync_not_live</p>
      <p className="text-[10px] text-gray-400">websocket_required · sse_required · webhook_required</p>
    </div>
  )
}
