const STATUS_CONFIG = {
  cart_preview:                 { label: 'Cart Preview',         color: 'bg-gray-100 text-gray-600' },
  checkout_preview:             { label: 'Checkout Preview',     color: 'bg-blue-100 text-blue-700' },
  self_order_preview:           { label: 'Self-Order Preview',   color: 'bg-sky-100 text-sky-700' },
  order_submission_preview:     { label: 'Order Preview',        color: 'bg-indigo-100 text-indigo-700' },
  receipt_preview:              { label: 'Receipt Preview',      color: 'bg-purple-100 text-purple-700' },
  payment_confirmation_required:{ label: 'Payment Required',     color: 'bg-amber-100 text-amber-700' },
  tax_preview_required:         { label: 'Tax Preview',          color: 'bg-yellow-100 text-yellow-700' },
  pos_sync_pending:             { label: 'POS Pending',          color: 'bg-orange-100 text-orange-700' },
  kds_routing_pending:          { label: 'KDS Pending',          color: 'bg-rose-100 text-rose-700' },
  inventory_unavailable:        { label: 'Inventory N/A',        color: 'bg-red-100 text-red-600' },
  staff_handoff_preview:        { label: 'Staff Assist',         color: 'bg-violet-100 text-violet-700' },
  database_required:            { label: 'DB Required',          color: 'bg-gray-100 text-gray-500' },
  preview_fallback:             { label: 'Preview',              color: 'bg-gray-50 text-gray-400' },
  not_persisted:                { label: 'Not Saved',            color: 'bg-gray-50 text-gray-400' },
  order_pending:                { label: 'Order Pending',        color: 'bg-blue-100 text-blue-700' },
  order_accepted:               { label: 'Accepted',             color: 'bg-emerald-100 text-emerald-700' },
  order_preparing:              { label: 'Preparing',            color: 'bg-teal-100 text-teal-700' },
  order_ready:                  { label: 'Ready',                color: 'bg-green-100 text-green-700' },
  order_completed:              { label: 'Complete',             color: 'bg-emerald-100 text-emerald-700' },
  order_cancelled:              { label: 'Cancelled',            color: 'bg-red-100 text-red-600' },
}

export default function CheckoutStatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] ?? { label: status ?? 'Unknown', color: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${config.color} ${className}`}>
      {config.label}
    </span>
  )
}
