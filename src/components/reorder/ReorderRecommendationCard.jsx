import ReorderUrgencyBadge from './ReorderUrgencyBadge.jsx'

export default function ReorderRecommendationCard({ rec, onCreatePO }) {
  if (!rec) return null
  return (
    <div className="border rounded-lg p-3 bg-white dark:bg-gray-900 dark:border-gray-700 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{rec.product_name}</p>
        <ReorderUrgencyBadge urgency={rec.urgency} />
      </div>
      <div className="text-xs text-gray-500 flex gap-3">
        <span>Stock: {rec.current_stock}</span>
        <span>Threshold: {rec.reorder_threshold}</span>
        <span>Suggest: {rec.recommended_quantity}</span>
      </div>
      {rec.vendor_name && (
        <p className="text-xs text-gray-500">Vendor: {rec.vendor_name}</p>
      )}
      <p className="text-xs font-medium text-orange-600">{rec.reorder_status}</p>
      {onCreatePO && (
        <button
          onClick={() => onCreatePO(rec)}
          className="mt-1 min-h-[44px] w-full rounded bg-orange-600 text-white text-xs font-medium px-3 py-2 hover:bg-orange-700"
        >
          Draft Purchase Order
        </button>
      )}
    </div>
  )
}
