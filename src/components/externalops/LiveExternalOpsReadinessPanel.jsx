export default function LiveExternalOpsReadinessPanel({ readiness = {} }) {
  const degraded = readiness.degradedMode || readiness.databaseRequired
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Live External Operations Readiness</p>
        <span className={`text-xs font-semibold ${degraded ? 'text-orange-500' : 'text-green-600'}`}>
          {readiness.status ?? 'not_live_ready'}
        </span>
      </div>
      <div className="text-xs space-y-1">
        <p className={readiness.databaseRequired ? 'text-red-500' : 'text-green-600'}>
          {readiness.databaseRequired ? '✗ database_required' : '✓ database_available'}
        </p>
        <p className="text-orange-500">⚠ external_sync_not_live</p>
        <p className="text-orange-500">⚠ real_time_push_pending</p>
        {readiness.external_pos_required && <p className="text-red-500">✗ external_pos_required</p>}
        {readiness.vendor_api_required && <p className="text-red-500">✗ vendor_api_required</p>}
      </div>
    </div>
  )
}
