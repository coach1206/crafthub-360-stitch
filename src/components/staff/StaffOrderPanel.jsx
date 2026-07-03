import React, { useState } from 'react'
import StaffOrderItemRow from './StaffOrderItemRow.jsx'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function StaffOrderPanel({ session, onAddItem, onRemoveItem, onQuantityChange, onSubmit, onCancel }) {
  const [newItem, setNewItem] = useState({ item_name: '', unit_amount: 0, quantity: 1 })

  const subtotal = (session?.items ?? []).reduce((s, i) => s + i.line_subtotal_amount, 0)

  function handleAdd(e) {
    e.preventDefault()
    if (!newItem.item_name.trim()) return
    onAddItem?.({ ...newItem, unit_amount: Math.round(parseFloat(newItem.unit_amount || 0) * 100), quantity: parseInt(newItem.quantity || 1, 10) })
    setNewItem({ item_name: '', unit_amount: 0, quantity: 1 })
  }

  if (!session) return (
    <div className="p-4 rounded-lg border border-gray-200 text-gray-400 text-sm">No active staff order session.</div>
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-sm">Staff Order</span>
          <span className="ml-2 text-xs text-gray-400 font-mono">{session.staff_order_session_id?.slice(0,8)}</span>
        </div>
        <StaffStatusBadge status={session.session_status} />
      </div>

      <div className="p-3 space-y-0.5 min-h-[80px]">
        {(session.items ?? []).length === 0
          ? <div className="text-sm text-gray-400 py-4 text-center">No items added yet.</div>
          : (session.items ?? []).map(item => (
            <StaffOrderItemRow
              key={item.item_id}
              item={item}
              onRemove={onRemoveItem}
              onQuantityChange={onQuantityChange}
            />
          ))
        }
      </div>

      <form onSubmit={handleAdd} className="px-3 pb-3 flex gap-2 flex-wrap">
        <input
          className="flex-1 min-w-[140px] border rounded px-2 py-1 text-sm"
          placeholder="Item name"
          value={newItem.item_name}
          onChange={e => setNewItem(p => ({ ...p, item_name: e.target.value }))}
        />
        <input
          className="w-20 border rounded px-2 py-1 text-sm"
          placeholder="Price"
          type="number" min="0" step="0.01"
          value={newItem.unit_amount}
          onChange={e => setNewItem(p => ({ ...p, unit_amount: e.target.value }))}
        />
        <input
          className="w-14 border rounded px-2 py-1 text-sm"
          placeholder="Qty"
          type="number" min="1"
          value={newItem.quantity}
          onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
        />
        <button type="submit" className="min-h-[44px] px-3 bg-blue-600 text-white rounded text-sm">Add</button>
      </form>

      <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between gap-2">
        <div className="text-sm font-mono">Subtotal: <strong>${(subtotal / 100).toFixed(2)}</strong></div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="min-h-[44px] px-3 border rounded text-sm text-gray-600">Cancel</button>
          <button onClick={() => onSubmit?.(session.staff_order_session_id)} className="min-h-[44px] px-4 bg-green-600 text-white rounded text-sm">Submit Preview</button>
        </div>
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 bg-yellow-50 border-t">
        staff_order_preview · payment_confirmation_required · pos_sync_pending
      </div>
    </div>
  )
}
