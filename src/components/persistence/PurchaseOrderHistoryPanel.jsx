import PersistenceStatusBadge from './PersistenceStatusBadge.jsx'

export default function PurchaseOrderHistoryPanel({ orders = [], persistenceStatus }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Purchase Order History ({orders.length})</p>
        <PersistenceStatusBadge status={persistenceStatus ?? 'in_memory_only'} />
      </div>
      {orders.length === 0 && <p className="text-xs text-gray-500">No purchase orders recorded.</p>}
      {orders.slice(0, 8).map((po, i) => (
        <div key={po.purchase_order_id ?? i} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{po.vendor_name ?? 'No vendor'}</span>
          <span className="text-orange-600 font-medium">{po.submission_status ?? 'reorder_not_submitted'}</span>
          <span className="text-gray-400">{po.approval_status}</span>
        </div>
      ))}
      <p className="text-[10px] text-gray-400">purchase_order_not_submitted · vendor_api_required</p>
    </div>
  )
}
