export default function WhiteLabelLicenseTierCard({ tier }) {
  if (!tier) return null
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 capitalize">{tier.licenseTier} Tier</p>
        <span className="text-[10px] font-mono text-orange-500">{tier.currentStatus}</span>
      </div>
      <p className="text-[10px] text-gray-500">
        Venues: {tier.venueLimit ?? 'unlimited'} · White-label: {tier.whiteLabelAllowed ? 'yes' : 'no'} · Reseller: {tier.resellerAllowed ? 'yes' : 'no'}
      </p>
      {tier.blockers?.length > 0 && (
        <p className="text-[10px] text-orange-500">⚠ {tier.blockers[0]}</p>
      )}
    </div>
  )
}
