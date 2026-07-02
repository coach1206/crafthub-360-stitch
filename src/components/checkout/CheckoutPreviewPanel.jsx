import CheckoutStatusBadge from './CheckoutStatusBadge.jsx'

function cents(n) { return `$${((n ?? 0) / 100).toFixed(2)}` }

export default function CheckoutPreviewPanel({ checkoutPreview, onSubmit, onStaffHandoff }) {
  if (!checkoutPreview) return null

  const {
    checkoutStatus, orderStatus, taxStatus, paymentStatus,
    posStatus, kdsStatus, inventoryStatus, previewNote,
  } = checkoutPreview

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Checkout Preview</h3>
        <CheckoutStatusBadge status={checkoutStatus ?? 'checkout_preview'} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          ['Order',     orderStatus],
          ['Payment',   paymentStatus],
          ['Tax',       taxStatus],
          ['POS',       posStatus],
          ['KDS',       kdsStatus],
          ['Inventory', inventoryStatus],
        ].map(([label, status]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-gray-400">{label}</span>
            <CheckoutStatusBadge status={status} />
          </div>
        ))}
      </div>

      {previewNote && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
          {previewNote}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={onSubmit}
          className="w-full py-3 min-h-[48px] bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Submit Order Preview
        </button>
        <button
          onClick={onStaffHandoff}
          className="w-full py-3 min-h-[48px] border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
        >
          Request Staff Assist
        </button>
      </div>
    </div>
  )
}
