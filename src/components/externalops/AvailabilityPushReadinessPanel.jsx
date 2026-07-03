export default function AvailabilityPushReadinessPanel({ readiness = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Availability Push</p>
        <span className="text-xs font-semibold text-orange-500">real_time_push_pending</span>
      </div>
      <p className="text-xs text-orange-500">real_time_push_pending</p>
      <p className="text-xs text-gray-400">websocket_required · sse_required · webhook_required</p>
      <p className="text-[10px] text-gray-400">Foundation ready. Live push not yet active.</p>
    </div>
  )
}
