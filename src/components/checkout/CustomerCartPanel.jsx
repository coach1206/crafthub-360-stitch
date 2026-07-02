import { useState } from 'react'
import CustomerCartItem from './CustomerCartItem.jsx'
import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'
import { addCartItem, updateCartItem, removeCartItem, clearCart } from '../../services/checkout/customerCheckoutApi.js'

function cents(n) { return `$${((n ?? 0) / 100).toFixed(2)}` }

export default function CustomerCartPanel({ cart, onCartChange, onProceed }) {
  const [loading, setLoading] = useState(false)
  const items = cart?.items ?? []

  const handleUpdate = async (cartItemId, payload) => {
    if (!cart?.cart_id) return
    setLoading(true)
    const result = await updateCartItem(cart.cart_id, cartItemId, payload)
    setLoading(false)
    if (result.ok) onCartChange?.(result.cart ?? cart)
  }

  const handleRemove = async (cartItemId) => {
    if (!cart?.cart_id) return
    setLoading(true)
    const result = await removeCartItem(cart.cart_id, cartItemId)
    setLoading(false)
    if (result.ok) onCartChange?.(prev => ({ ...prev, items: (prev?.items ?? []).filter(i => i.cart_item_id !== cartItemId) }))
  }

  const handleClear = async () => {
    if (!cart?.cart_id) return
    setLoading(true)
    await clearCart(cart.cart_id)
    setLoading(false)
    onCartChange?.({ ...cart, items: [], subtotal_amount: 0, total_amount: 0 })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Your Cart</h2>
          <CheckoutStatusBadge status={cart?.cart_status ?? 'cart_preview'} className="mt-1" />
        </div>
        {items.length > 0 && (
          <button onClick={handleClear} disabled={loading}
            className="text-xs text-red-400 hover:text-red-600 px-3 py-2 min-h-[44px]">
            Clear
          </button>
        )}
      </div>

      <div className="px-5">
        {items.length === 0 ? (
          <p className="py-8 text-center text-gray-400 text-sm">Your cart is empty.</p>
        ) : (
          items.map(item => (
            <CustomerCartItem key={item.cart_item_id} item={item} onUpdate={handleUpdate} onRemove={handleRemove} />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">{cents(cart?.subtotal_amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Tax <CheckoutStatusBadge status="tax_preview_required" className="ml-1" /></span>
            <span>+ est.</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Payment <CheckoutStatusBadge status="payment_confirmation_required" className="ml-1" /></span>
            <span>required</span>
          </div>
          <button
            onClick={onProceed}
            disabled={loading || items.length === 0}
            className="w-full mt-3 py-3 min-h-[48px] bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            Proceed to Checkout Preview
          </button>
        </div>
      )}
    </div>
  )
}
