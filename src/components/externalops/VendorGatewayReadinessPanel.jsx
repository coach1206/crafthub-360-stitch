export default function VendorGatewayReadinessPanel({ status = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Vendor Gateway Readiness</p>
        <span className="text-xs font-semibold text-orange-500">
          {status.connectionStatus ?? 'credentials_required'}
        </span>
      </div>
      <p className="text-xs text-orange-500">vendor_api_required</p>
      <p className="text-xs text-orange-500">reorder_not_submitted</p>
      <p className="text-xs text-orange-500">purchase_order_not_submitted</p>
      <p className="text-[10px] text-gray-400">No auto-submission. Approval required before any vendor order.</p>
    </div>
  )
}
