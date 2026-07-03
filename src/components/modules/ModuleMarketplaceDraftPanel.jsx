export default function ModuleMarketplaceDraftPanel({ report, drafts = [] }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Marketplace Drafts</h2>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Total Eligible:</span> {report?.marketplaceEligible ?? drafts.length}</div>
        <div><span className="font-medium">Live Marketplace:</span> <span className="text-red-500 dark:text-red-400">not_live_marketplace</span></div>
        <div><span className="font-medium">Status:</span> <span className="text-amber-600 dark:text-amber-400">listing_drafts_only</span></div>
      </div>
      <div className="text-xs space-y-0.5 max-h-40 overflow-y-auto">
        {drafts.map(d => (
          <div key={d.moduleId} className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>{d.moduleName}</span>
            <span className="text-amber-600 dark:text-amber-400">{d.draftStatus}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">marketplace_draft · not_live_marketplace · preview_only</div>
    </div>
  )
}
