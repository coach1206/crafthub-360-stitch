/**
 * CustomerCheckoutDemo — Phase 12 demo page.
 * All checkout states are preview-only. No payment is captured.
 * Route: /checkout/demo (add to App.jsx when approved, or use as component only)
 */
import { useState } from 'react'
import CustomerCartPanel from '../../components/checkout/CustomerCartPanel.jsx'
import CheckoutReadinessPanel from '../../components/checkout/CheckoutReadinessPanel.jsx'
import CheckoutPreviewPanel from '../../components/checkout/CheckoutPreviewPanel.jsx'
import ReceiptPreviewPanel from '../../components/checkout/ReceiptPreviewPanel.jsx'
import SelfOrderActionPanel from '../../components/checkout/SelfOrderActionPanel.jsx'
import StaffHandoffPanel from '../../components/checkout/StaffHandoffPanel.jsx'
import CustomerOrderStatusPanel from '../../components/checkout/CustomerOrderStatusPanel.jsx'
import CheckoutStatusBadge from '../../components/checkout/CheckoutStatusBadge.jsx'
import {
  createCart, addCartItem, buildCheckoutPreview, getReceiptPreview,
} from '../../services/checkout/customerCheckoutApi.js'

const DEMO_VENUE_ID = 'demo-venue-001'

const DEMO_ITEMS = [
  { item_name: 'Casa Magna Colorado Robusto', item_category: 'cigar', unit_amount: 2200, quantity: 1, tax_category: 'tobacco' },
  { item_name: 'Don Julio 1942 — 2oz Pour', item_category: 'spirit', unit_amount: 3500, quantity: 1, tax_category: 'alcohol' },
  { item_name: 'SmokeCraft Membership — Annual', item_category: 'membership', unit_amount: 29900, quantity: 1, partner_id: 'partner-001' },
]

export default function CustomerCheckoutDemo() {
  const [step, setStep] = useState('cart')
  const [cart, setCart] = useState(null)
  const [cartId, setCartId] = useState(null)
  const [checkoutPreview, setCheckoutPreview] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState([])

  const addLog = (msg) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10))

  const handleBuildCart = async () => {
    setLoading(true)
    const cartResult = await createCart({ venue_id: DEMO_VENUE_ID, order_mode: 'self_order_preview' })
    addLog(`createCart → ${cartResult.cartStatus}`)
    if (!cartResult.ok) { setLoading(false); return }
    let currentCart = cartResult.cart
    for (const item of DEMO_ITEMS) {
      const r = await addCartItem(cartResult.cart.cart_id, item)
      addLog(`addCartItem "${item.item_name}" → ${r.cartStatus}`)
      if (r.cart) currentCart = r.cart
    }
    currentCart.items = DEMO_ITEMS.map((item, i) => ({
      ...item,
      cart_item_id: `demo-item-${i}`,
      cart_id: cartResult.cart.cart_id,
      venue_id: DEMO_VENUE_ID,
      line_subtotal_amount: item.unit_amount * item.quantity,
      availability_status: 'availability_required',
      approval_status: item.partner_id ? 'approval_required' : 'venue_item',
      fulfillment_owner: 'venue',
    }))
    currentCart.subtotal_amount = DEMO_ITEMS.reduce((s, i) => s + i.unit_amount * i.quantity, 0)
    setCart(currentCart)
    setCartId(cartResult.cart.cart_id)
    setLoading(false)
  }

  const handleProceedToCheckout = async () => {
    if (!cartId || !cart) return
    setLoading(true)
    const preview = await buildCheckoutPreview(cartId, { venue_id: DEMO_VENUE_ID })
    addLog(`buildCheckoutPreview → ${preview.checkoutStatus}`)
    setCheckoutPreview(preview)
    const receipt = await getReceiptPreview(cartId)
    addLog(`getReceiptPreview → ${receipt.receiptStatus ?? 'receipt_preview'}`)
    setReceiptPreview(receipt)
    setStep('checkout')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Checkout Demo</h1>
          <p className="text-sm text-gray-500 mt-1">Phase 12 — Self-Order and Checkout Preview Engine</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <CheckoutStatusBadge status="checkout_preview" />
            <CheckoutStatusBadge status="self_order_preview" />
            <CheckoutStatusBadge status="payment_confirmation_required" />
            <CheckoutStatusBadge status="receipt_preview" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          This is a preview-only demo. No payment is captured, no order is persisted, no kitchen is notified, and no tax is collected.
        </div>

        {!cart && (
          <div className="text-center">
            <button
              onClick={handleBuildCart}
              disabled={loading}
              className="px-6 py-3 min-h-[48px] bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Building Demo Cart…' : 'Build Demo Cart'}
            </button>
          </div>
        )}

        {cart && step === 'cart' && (
          <>
            <CustomerCartPanel
              cart={cart}
              onCartChange={setCart}
              onProceed={handleProceedToCheckout}
            />
            <CheckoutReadinessPanel
              cartPayload={{ ...cart, items: cart.items ?? [] }}
            />
          </>
        )}

        {step === 'checkout' && (
          <>
            {checkoutPreview && (
              <CheckoutPreviewPanel
                checkoutPreview={checkoutPreview}
                onSubmit={() => setStep('selforder')}
                onStaffHandoff={() => setStep('staff')}
              />
            )}
            {receiptPreview && <ReceiptPreviewPanel receiptPreview={receiptPreview} />}
            <CustomerOrderStatusPanel orderId={null} />
          </>
        )}

        {step === 'selforder' && (
          <>
            <SelfOrderActionPanel cartId={cartId} onSubmitted={(r) => { addLog(`selfOrderSubmit → ${r.submissionStatus}`); setStep('status') }} />
            {receiptPreview && <ReceiptPreviewPanel receiptPreview={receiptPreview} />}
          </>
        )}

        {step === 'staff' && (
          <StaffHandoffPanel
            cartId={cartId}
            venueId={DEMO_VENUE_ID}
            onHandoffRequested={(r) => addLog(`staffHandoff → ${r.handoffStatus}`)}
          />
        )}

        {step === 'status' && <CustomerOrderStatusPanel orderId={null} />}

        {log.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono space-y-1 max-h-48 overflow-y-auto">
            {log.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {['cart', 'checkout', 'selforder', 'staff', 'status'].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-3 py-1.5 min-h-[44px] text-xs rounded-lg border transition-all ${step === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
