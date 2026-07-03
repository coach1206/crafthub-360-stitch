import OperationsStatusBadge from './OperationsStatusBadge.jsx'

export default function PendingApprovalsPanel({ approvals = [], purchaseOrders = [] }) {
  const pending = [...approvals, ...purchaseOrders].filter(a =>
    a.approval_status === 'pending_manager_approval' || a.approval_status === 'pending'
  )
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Pending Approvals</p>
        <span className="text-xs font-semibold text-yellow-600">{pending.length} pending</span>
      </div>
      {pending.length === 0 && <p className="text-xs text-gray-500">No pending approvals.</p>}
      {pending.slice(0, 6).map((a, i) => (
        <div key={a.approval_id ?? a.purchase_order_id ?? i} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
          <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
            {a.approval_type ?? a.vendor_name ?? 'reorder_purchase_order'}
          </span>
          <OperationsStatusBadge status="preview_only" size="xs" />
        </div>
      ))}
      <p className="text-[10px] text-gray-400">auto_approval_disabled · approval_required · reorder_not_submitted</p>
    </div>
  )
}
