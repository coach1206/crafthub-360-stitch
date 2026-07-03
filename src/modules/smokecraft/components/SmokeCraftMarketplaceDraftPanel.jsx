/**
 * SmokeCraftMarketplaceDraftPanel
 * Shows marketplace draft metadata and publish blocked reasons.
 * Never shows a live listing.
 */

function StatusChip({ status }) {
  const isDraft = status === 'marketplace_draft' || status === 'not_live_marketplace'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      isDraft
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      {status ?? 'unknown'}
    </span>
  )
}

export default function SmokeCraftMarketplaceDraftPanel({ marketplace }) {
  if (!marketplace) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Marketplace draft not available.
      </div>
    )
  }

  const blockedReasons = marketplace.publishBlockedReasons ?? []
  const features = marketplace.features ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Marketplace Draft</h2>
        <StatusChip status={marketplace.marketplaceStatus} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2 space-y-1">
        <div className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Title</span>
          <span className="text-gray-800 dark:text-gray-200">{marketplace.title}</span>
        </div>
        <div className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Category</span>
          <span className="text-gray-800 dark:text-gray-200">{marketplace.category}</span>
        </div>
        <div className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Pricing Model</span>
          <span className="text-amber-600 dark:text-amber-400">{marketplace.pricingModel}</span>
        </div>
        <div className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Security Review</span>
          <span className="text-gray-500 dark:text-gray-400">{marketplace.securityReviewStatus}</span>
        </div>
        <div className="flex justify-between text-xs py-1">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Governance Review</span>
          <span className="text-gray-500 dark:text-gray-400">{marketplace.governanceReviewStatus}</span>
        </div>
      </div>

      {features.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Features</h3>
          <ul className="text-xs space-y-0.5 pl-3">
            {features.map((f, i) => (
              <li key={i} className="text-gray-600 dark:text-gray-400 list-disc">{f}</li>
            ))}
          </ul>
        </>
      )}

      {blockedReasons.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Publish Blocked — Reasons</h3>
          <ul className="space-y-1">
            {blockedReasons.map((r, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 font-mono">
                {r}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
        No public marketplace listing is live. No price is charged. No customer install is active.
      </div>
    </div>
  )
}
