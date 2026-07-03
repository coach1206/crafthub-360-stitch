import InventoryStatusBadge from './InventoryStatusBadge.jsx'

export default function InventoryReadinessPanel({ readiness }) {
  if (!readiness) return (
    <div className="rounded-lg border p-4 text-xs text-gray-500">
      Loading inventory readiness… <span className="text-blue-500">inventory_sync_pending</span>
    </div>
  )
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Inventory Readiness</p>
        <InventoryStatusBadge status={readiness.inventoryStatus ?? 'inventory_sync_pending'} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <p className="text-lg font-bold">{readiness.productCount ?? 0}</p>
          <p className="text-gray-500">Products</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 rounded p-2">
          <p className="text-lg font-bold text-red-700">{readiness.soldOutCount ?? 0}</p>
          <p className="text-gray-500">Sold Out</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900 rounded p-2">
          <p className="text-lg font-bold text-yellow-700">{readiness.lowStockCount ?? 0}</p>
          <p className="text-gray-500">Low Stock</p>
        </div>
      </div>
      {readiness.blockers?.length > 0 && (
        <div className="space-y-1">
          {readiness.blockers.map((b, i) => (
            <div key={i} className={`text-xs px-2 py-1 rounded ${b.severity === 'critical' ? 'bg-red-100 text-red-700' : b.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
              {b.type}{b.count !== undefined ? ` (${b.count})` : ''}
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-400">{readiness.persistenceStatus} · {readiness.syncStatus}</p>
    </div>
  )
}
