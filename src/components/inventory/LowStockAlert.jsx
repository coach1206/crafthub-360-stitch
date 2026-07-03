export default function LowStockAlert({ items = [], onReorder }) {
  if (!items.length) return null
  const critical = items.filter(i => i.availability_status === 'sold_out')
  const low      = items.filter(i => i.availability_status === 'low_stock')
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700 p-3">
      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        ⚠ Stock Alert — {items.length} item{items.length !== 1 ? 's' : ''} need attention
      </p>
      {critical.length > 0 && (
        <p className="text-xs text-red-700 dark:text-red-300 mb-1">
          Sold out: {critical.map(i => i.product_name).join(', ')}
        </p>
      )}
      {low.length > 0 && (
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          Low stock: {low.map(i => i.product_name).join(', ')}
        </p>
      )}
      {onReorder && (
        <button
          onClick={onReorder}
          className="mt-2 min-h-[44px] w-full rounded bg-yellow-700 text-white text-xs font-medium px-3 py-2 hover:bg-yellow-800"
        >
          Review Reorder Recommendations
        </button>
      )}
    </div>
  )
}
