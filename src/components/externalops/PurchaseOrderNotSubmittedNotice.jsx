export default function PurchaseOrderNotSubmittedNotice({ reason = '' }) {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700 p-3 space-y-1">
      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">purchase_order_not_submitted</p>
      <p className="text-[10px] text-yellow-600 dark:text-yellow-400">reorder_not_submitted · approval_required</p>
      {reason && <p className="text-[10px] text-gray-400">{reason}</p>}
      <p className="text-[10px] text-gray-400">No auto-purchasing. All orders require manager/owner/admin approval.</p>
    </div>
  )
}
