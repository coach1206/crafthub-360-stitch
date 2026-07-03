export default function ExternalPOSReadinessPanel({ status = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">External POS Readiness</p>
        <span className="text-xs font-semibold text-orange-500">
          {status.connectionStatus ?? 'credentials_required'}
        </span>
      </div>
      <p className="text-xs text-orange-500">external_sync_not_live</p>
      {status.external_pos_required && (
        <p className="text-xs text-red-500">external_pos_required · external_pos_credentials_required</p>
      )}
      <p className="text-xs text-gray-400">real_time_push_pending</p>
    </div>
  )
}
