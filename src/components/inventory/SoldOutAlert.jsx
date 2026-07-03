export default function SoldOutAlert({ items = [] }) {
  const soldOut = items.filter(i => i.availability_status === 'sold_out')
  if (!soldOut.length) return null
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700 p-3">
      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
        🚫 {soldOut.length} Product{soldOut.length !== 1 ? 's' : ''} Sold Out
      </p>
      <ul className="mt-1 text-xs text-red-700 dark:text-red-300 list-disc list-inside">
        {soldOut.map(i => (
          <li key={i.product_id}>{i.product_name ?? i.product_id}</li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-red-500">inventory_unavailable — checkout blocked for sold-out items</p>
    </div>
  )
}
