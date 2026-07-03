export default function MinimumOrderWarning({ vendor, estimatedTotal = 0 }) {
  if (!vendor) return null
  const minAmount = vendor.minimum_order_amount ?? 0
  const belowMin  = minAmount > 0 && estimatedTotal < minAmount
  if (!belowMin) return null
  return (
    <div className="rounded border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700 p-2 text-xs text-yellow-800 dark:text-yellow-200">
      ⚠ Below minimum order amount. Required: ${(minAmount / 100).toFixed(2)}, current: ${(estimatedTotal / 100).toFixed(2)}.
    </div>
  )
}
