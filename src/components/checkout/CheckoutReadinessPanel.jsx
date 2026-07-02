import { useEffect, useState } from 'react'
import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'
import { getCheckoutReadiness } from '../../services/checkout/customerCheckoutApi.js'

const SEVERITY_ICON = { critical: '🚫', required: '⚠️', warning: '⚠️', info: 'ℹ️' }

export default function CheckoutReadinessPanel({ cartPayload, onReady }) {
  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cartPayload) return
    setLoading(true)
    getCheckoutReadiness(cartPayload).then(r => { setReadiness(r); setLoading(false) })
  }, [cartPayload])

  if (loading) return <div className="py-6 text-center text-gray-400 text-sm">Checking readiness…</div>
  if (!readiness) return null

  const score = readiness.readinessScore ?? 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Checkout Readiness</h3>
        <CheckoutStatusBadge status={readiness.checkoutReadiness ?? 'checkout_preview'} />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Readiness Score</span>
          <span>{score}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ['Payment', readiness.paymentStatus],
          ['Tax',     readiness.taxStatus],
          ['POS',     readiness.posStatus],
          ['KDS',     readiness.kdsStatus],
        ].map(([label, status]) => (
          <div key={label} className="p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <CheckoutStatusBadge status={status} />
          </div>
        ))}
      </div>

      {readiness.blockers?.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Blockers</p>
          {readiness.blockers.map((b, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span>{SEVERITY_ICON[b.severity] ?? 'ℹ️'}</span>
              <span className="text-gray-600">{b.message ?? b.type}</span>
            </div>
          ))}
        </div>
      )}

      {readiness.previewFallback && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
          preview_fallback — database not connected
        </p>
      )}
    </div>
  )
}
