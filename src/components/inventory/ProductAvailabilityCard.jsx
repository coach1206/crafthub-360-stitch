import InventoryStatusBadge from './InventoryStatusBadge.jsx'

export default function ProductAvailabilityCard({ product }) {
  if (!product) return null
  return (
    <div className="border rounded-lg p-3 bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.product_name ?? product.product_id}</p>
          <p className="text-xs text-gray-500 mt-0.5">{product.product_category ?? 'general'}</p>
        </div>
        <InventoryStatusBadge status={product.availability_status} />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span>Stock: <strong>{product.current_stock ?? 0}</strong></span>
        <span>Available: <strong>{product.available_stock ?? 0}</strong></span>
        <span>Threshold: <strong>{product.reorder_threshold ?? 5}</strong></span>
      </div>
      {product.sync_status && (
        <p className="mt-1 text-[10px] text-gray-400">{product.sync_status}</p>
      )}
    </div>
  )
}
