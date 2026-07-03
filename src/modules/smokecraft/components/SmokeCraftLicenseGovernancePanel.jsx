/**
 * SmokeCraftLicenseGovernancePanel
 * Shows license governance preview state and entitlements.
 * Never claims license enforced.
 */

function LicenseChip({ state }) {
  const isBlocked = state?.includes('blocked')
  const isPreview = state?.includes('preview') || state === 'license_not_enforced'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      isBlocked
        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        : isPreview
          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      {state ?? 'unknown'}
    </span>
  )
}

function EntitlementRow({ name, entitlement }) {
  const allowed = entitlement?.allowed
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <span className="text-gray-600 dark:text-gray-400 font-mono">{name}</span>
      <div className="flex items-center gap-1">
        <span className={allowed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
          {allowed ? 'preview' : 'blocked'}
        </span>
        {entitlement?.blockedReason && (
          <span className="text-gray-400 dark:text-gray-500">({entitlement.blockedReason})</span>
        )}
      </div>
    </div>
  )
}

export default function SmokeCraftLicenseGovernancePanel({ license }) {
  if (!license) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        License governance not available.
      </div>
    )
  }

  const entitlements = license.entitlements ?? {}

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">License Governance</h2>
        <LicenseChip state={license.licenseState} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">License Enforced</span>
          <span className="text-red-500 dark:text-red-400">no</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Entitlement Status</span>
          <span className="text-amber-600 dark:text-amber-400">{license.entitlementStatus}</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Billing</span>
          <span className="text-amber-600 dark:text-amber-400">{license.billingStatus}</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Provider Connected</span>
          <span className="text-red-500 dark:text-red-400">no</span>
        </div>
      </div>

      {Object.keys(entitlements).length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Entitlements (preview)</h3>
          <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
            {Object.entries(entitlements).map(([key, val]) => (
              <EntitlementRow key={key} name={key} entitlement={val} />
            ))}
          </div>
        </>
      )}

      <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
        License enforcement is not active. No live license is checked. All entitlements are preview_only.
      </div>
    </div>
  )
}
