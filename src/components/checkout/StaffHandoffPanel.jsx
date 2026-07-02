import { useState } from 'react'
import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'
import { requestStaffHandoff } from '../../services/checkout/customerCheckoutApi.js'

export default function StaffHandoffPanel({ cartId, venueId, onHandoffRequested }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  const handleRequest = async () => {
    if (!cartId) return
    setLoading(true)
    const res = await requestStaffHandoff(cartId, { venue_id: venueId, reason: reason || null })
    setLoading(false)
    setResult(res)
    onHandoffRequested?.(res)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Staff Assist</h3>
        <CheckoutStatusBadge status={result?.handoffStatus ?? 'staff_handoff_preview'} />
      </div>

      <p className="text-sm text-gray-500">
        Request a staff member to assist with your order. Your cart will be shared with staff for review.
      </p>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Reason (optional)</label>
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Need help selecting a product"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
        />
      </div>

      {result && (
        <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl text-xs">
          <p className="font-medium text-violet-800 mb-1">Handoff Requested</p>
          <CheckoutStatusBadge status={result.handoffStatus ?? 'staff_handoff_preview'} />
          {result.staffAssistNote && <p className="mt-2 text-violet-600">{result.staffAssistNote}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-1 text-xs">
        <CheckoutStatusBadge status="staff_handoff_preview" />
        <CheckoutStatusBadge status="pos_sync_pending" />
        <CheckoutStatusBadge status="kds_routing_pending" />
      </div>

      <button
        onClick={handleRequest}
        disabled={loading || !cartId || !!result}
        className="w-full py-3 min-h-[48px] bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? 'Requesting…' : result ? 'Handoff Requested' : 'Request Staff Assist'}
      </button>
    </div>
  )
}
