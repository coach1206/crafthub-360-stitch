import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'

function cents(n) { return `$${((n ?? 0) / 100).toFixed(2)}` }

export default function CustomerCartItem({ item, onUpdate, onRemove }) {
  const handleQtyChange = (delta) => {
    const newQty = (item.quantity ?? 1) + delta
    if (newQty < 1) return
    onUpdate?.(item.cart_item_id, { quantity: newQty })
  }

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{item.item_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{item.item_category} · {item.fulfillment_owner}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          <CheckoutStatusBadge status={item.availability_status} />
          {item.partner_id && <CheckoutStatusBadge status={item.approval_status} />}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <p className="font-semibold text-gray-900 text-sm">{cents(item.line_subtotal_amount)}</p>
        <p className="text-xs text-gray-400">{cents(item.unit_amount)} each</p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleQtyChange(-1)}
            className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 active:scale-95 text-lg"
            aria-label="Decrease quantity"
          >−</button>
          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => handleQtyChange(1)}
            className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 active:scale-95 text-lg"
            aria-label="Increase quantity"
          >+</button>
          <button
            onClick={() => onRemove?.(item.cart_item_id)}
            className="ml-1 w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg active:scale-95"
            aria-label="Remove item"
          >✕</button>
        </div>
      </div>
    </div>
  )
}
