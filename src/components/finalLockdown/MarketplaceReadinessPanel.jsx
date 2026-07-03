export default function MarketplaceReadinessPanel({ report = {} }) {
  const total = report.total_listings || 7
  const drafts = report.draft_listings || 6
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Marketplace Readiness</p>
      <p className="text-xs text-orange-500">marketplace_ready_draft — not_live</p>
      <div className="text-[10px] space-y-0.5 text-gray-500">
        <p>{total} listing drafts prepared · {drafts} marketplace_ready_draft</p>
        <p className="text-orange-400">live_marketplace: false · listing_drafts_only</p>
        <p>Blockers: module_manifests_not_created · install_hooks_not_built</p>
        <p>Blockers: license_gate_not_built · marketplace_registry_not_built</p>
      </div>
      <p className="text-[10px] text-gray-400">Next: Module Build 9 — White-Label Marketplace Licensing Module</p>
    </div>
  )
}
