import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'

function cents(n) { return `$${((n ?? 0) / 100).toFixed(2)}` }

export default function ReceiptPreviewPanel({ receiptPreview }) {
  if (!receiptPreview) return null
  const r = receiptPreview.formattedReceipt ?? receiptPreview.receiptPreview ?? receiptPreview

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Receipt Preview</h3>
        <CheckoutStatusBadge status={r.receiptStatus ?? r.receipt_status ?? 'receipt_preview'} />
      </div>

      {(r.items ?? r.lineItems ?? []).length > 0 && (
        <div className="space-y-2">
          {(r.items ?? r.lineItems ?? []).map((item, i) => (
            <div key={item.cart_item_id ?? i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{item.item_name} × {item.quantity}</span>
              <span className="text-gray-900 font-medium">{cents(item.line_subtotal_amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">{cents(r.subtotal ?? r.subtotal_amount)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Est. Tax <CheckoutStatusBadge status={r.taxStatus ?? r.tax_status ?? 'tax_preview_required'} className="ml-1" /></span>
          <span>{cents(r.estimatedTax ?? r.tax_amount)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Fees</span>
          <span>{cents(r.fees ?? r.fee_amount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
          <span className="font-semibold text-gray-900">Est. Total</span>
          <span className="font-bold text-gray-900">{cents(r.estimatedTotal ?? r.total_amount)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <CheckoutStatusBadge status={r.paymentStatus ?? r.payment_status ?? 'payment_confirmation_required'} />
        <CheckoutStatusBadge status={r.orderStatus ?? r.order_status ?? 'order_submission_preview'} />
      </div>

      {(r.disclosures ?? []).length > 0 && (
        <div className="space-y-1">
          {(r.disclosures ?? []).map((d, i) => (
            <p key={i} className="text-xs text-gray-400">⚠️ {d.message}</p>
          ))}
        </div>
      )}

      {(r.previewNote ?? r.receiptNote) && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
          {r.previewNote ?? r.receiptNote}
        </p>
      )}
    </div>
  )
}
