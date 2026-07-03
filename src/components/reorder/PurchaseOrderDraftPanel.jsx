export default function PurchaseOrderDraftPanel({ po, onApprove, onReject }) {
  if (!po) return (
    <div className="rounded-lg border p-4 text-xs text-gray-500">
      No purchase order selected. <span className="text-blue-500">reorder_not_submitted</span>
    </div>
  )
  const totalDisplay = po.estimated_total > 0
    ? `$${(po.estimated_total / 100).toFixed(2)}`
    : 'No cost estimate'
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">Purchase Order Draft</p>
          <p className="text-xs text-gray-500">{po.vendor_name ?? 'No vendor assigned'}</p>
        </div>
        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
          {po.approval_status}
        </span>
      </div>
      <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
        <p>Reason: {po.reorder_reason}</p>
        <p>Lead time: {po.estimated_lead_time_days}d</p>
        <p>Estimated total: <strong>{totalDisplay}</strong></p>
        <p>Submission: <strong className="text-orange-600">{po.submission_status}</strong></p>
      </div>
      {po.items?.length > 0 && (
        <div className="space-y-1">
          {po.items.map((item, i) => (
            <div key={i} className="text-xs flex justify-between bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
              <span>{item.product_name}</span>
              <span>×{item.recommended_quantity}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-400">preview_only · approval required before submission</p>
      <div className="flex gap-2">
        {onApprove && (
          <button onClick={() => onApprove(po)} className="flex-1 min-h-[44px] rounded bg-green-600 text-white text-xs font-medium px-3 py-2 hover:bg-green-700">
            Approve
          </button>
        )}
        {onReject && (
          <button onClick={() => onReject(po)} className="flex-1 min-h-[44px] rounded bg-red-600 text-white text-xs font-medium px-3 py-2 hover:bg-red-700">
            Reject
          </button>
        )}
      </div>
    </div>
  )
}
