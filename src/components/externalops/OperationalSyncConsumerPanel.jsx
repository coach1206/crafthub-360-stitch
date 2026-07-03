export default function OperationalSyncConsumerPanel({ readiness = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Sync Event Consumer</p>
        <span className="text-xs font-semibold text-blue-500">consumer_preview_only</span>
      </div>
      <p className="text-xs text-green-600">sync_event_consumer_foundation_ready</p>
      <p className="text-xs text-orange-500">real_time_push_pending</p>
      <p className="text-xs text-gray-400">websocket_required · sse_required · webhook_consumer_pending</p>
    </div>
  )
}
