import { useState } from 'react'
import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'
import { submitSelfOrderPreview } from '../../services/checkout/customerCheckoutApi.js'

export default function SelfOrderActionPanel({ cartId, onSubmitted }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!cartId) return
    setLoading(true)
    const res = await submitSelfOrderPreview(cartId, {})
    setLoading(false)
    setResult(res)
    onSubmitted?.(res)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Self-Order</h3>
        <CheckoutStatusBadge status={result?.selfOrderStatus ?? result?.submissionStatus ?? 'self_order_preview'} />
      </div>

      <p className="text-sm text-gray-500">
        Submit your order for venue review. This is a preview — no payment will be charged until a live checkout integration is active.
      </p>

      <div className="flex flex-wrap gap-2 text-xs">
        <CheckoutStatusBadge status="payment_confirmation_required" />
        <CheckoutStatusBadge status="tax_preview_required" />
        <CheckoutStatusBadge status="inventory_unavailable" />
      </div>

      {result && (
        <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
          <p className="font-medium mb-1">Submission Status</p>
          <CheckoutStatusBadge status={result.submissionStatus ?? 'order_submission_preview'} />
          {result.submissionNote && <p className="mt-2 text-gray-400">{result.submissionNote}</p>}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !cartId}
        className="w-full py-3 min-h-[48px] bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Submit Self-Order Preview'}
      </button>
    </div>
  )
}
