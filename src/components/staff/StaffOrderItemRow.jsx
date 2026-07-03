import React from 'react'

export default function StaffOrderItemRow({ item, onRemove, onQuantityChange }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.item_name}</div>
        <div className="text-xs text-gray-500">{item.item_category} · ${(item.unit_amount / 100).toFixed(2)} ea</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onQuantityChange?.(item.item_id, Math.max(1, item.quantity - 1))}
          className="w-7 h-7 flex items-center justify-center rounded border text-sm"
          aria-label="Decrease quantity"
        >-</button>
        <span className="text-sm w-5 text-center">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange?.(item.item_id, item.quantity + 1)}
          className="w-7 h-7 flex items-center justify-center rounded border text-sm"
          aria-label="Increase quantity"
        >+</button>
      </div>
      <div className="text-sm font-mono w-16 text-right">${(item.line_subtotal_amount / 100).toFixed(2)}</div>
      <button
        onClick={() => onRemove?.(item.item_id)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:text-red-700 text-lg"
        aria-label="Remove item"
      >×</button>
    </div>
  )
}
