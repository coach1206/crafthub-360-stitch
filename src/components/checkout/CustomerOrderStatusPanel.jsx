import { useState, useEffect } from 'react'
import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'
import { getCustomerOrderStatus, getCustomerOrderTimeline } from '../../services/checkout/customerCheckoutApi.js'

export default function CustomerOrderStatusPanel({ orderId }) {
  const [status, setStatus] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    Promise.all([
      getCustomerOrderStatus(orderId),
      getCustomerOrderTimeline(orderId),
    ]).then(([s, t]) => { setStatus(s); setTimeline(t); setLoading(false) })
  }, [orderId])

  if (!orderId) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-2">Order Status</h3>
      <CheckoutStatusBadge status="order_submission_preview" />
      <p className="text-xs text-gray-400 mt-2">No order ID yet. Submit an order preview to track status.</p>
    </div>
  )

  if (loading) return <div className="py-6 text-center text-gray-400 text-sm">Loading order status…</div>

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Order Status</h3>
        <CheckoutStatusBadge status={status?.orderStatus ?? 'order_submission_preview'} />
      </div>

      {status && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="font-semibold text-gray-900">{status.displayStatus}</p>
          <p className="text-sm text-gray-500 mt-0.5">{status.description}</p>
          {status.nextStep && <p className="text-xs text-indigo-600 mt-2">→ {status.nextStep}</p>}
        </div>
      )}

      {timeline?.timeline?.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Timeline</p>
          <div className="space-y-2">
            {timeline.timeline.map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">{event.label}</span>
                  <span className="text-xs text-gray-400">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">Order ID: {orderId}</p>
    </div>
  )
}
