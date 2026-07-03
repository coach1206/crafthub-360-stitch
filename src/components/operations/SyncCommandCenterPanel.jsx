import OperationsStatusBadge from './OperationsStatusBadge.jsx'

export default function SyncCommandCenterPanel({ readiness = {}, events = [] }) {
  const failed  = events.filter(e => e.sync_status === 'failed').length
  const queued  = events.filter(e => e.sync_status === 'queued').length
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Sync Command Center</p>
        <OperationsStatusBadge status="external_sync_not_live" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-blue-50 dark:bg-blue-900 rounded p-2">
          <p className="font-bold text-blue-700">{queued}</p>
          <p className="text-gray-500">Queued</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 rounded p-2">
          <p className="font-bold text-red-600">{failed}</p>
          <p className="text-gray-500">Failed</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <p className="font-bold text-gray-600">{events.length}</p>
          <p className="text-gray-500">Total</p>
        </div>
      </div>
      <p className="text-[10px] text-blue-500">external_sync_not_live · real_time_push_pending · external_pos_required</p>
      <p className="text-[10px] text-gray-400">vendor_sync_not_live · vendor_api_required</p>
    </div>
  )
}
