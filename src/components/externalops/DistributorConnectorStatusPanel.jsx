export default function DistributorConnectorStatusPanel({ status = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Distributor Connector</p>
        <span className="text-xs font-semibold text-orange-500">distributor_connection_required</span>
      </div>
      <p className="text-xs text-orange-500">distributor_connection_required</p>
      <p className="text-xs text-gray-500">reorder_not_submitted</p>
      <p className="text-[10px] text-gray-400">DISTRIBUTOR_API_KEY not configured.</p>
    </div>
  )
}
