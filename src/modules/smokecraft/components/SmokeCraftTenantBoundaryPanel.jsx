/**
 * SmokeCraftTenantBoundaryPanel
 * Shows tenant boundary status and cross-tenant access rules.
 * crossTenantAccessAllowed is always false.
 */

function BoundaryChip({ status }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
      {status ?? 'unknown'}
    </span>
  )
}

export default function SmokeCraftTenantBoundaryPanel({ tenant }) {
  if (!tenant) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Tenant boundary not available.
      </div>
    )
  }

  const scopedAreas = tenant.scopedAreas ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Tenant Boundary</h2>
        <BoundaryChip status={tenant.tenantBoundaryStatus} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Cross-Tenant Access</span>
          <span className="text-green-600 dark:text-green-400 font-medium">blocked (always false)</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Tenant Ready</span>
          <span className="text-red-500 dark:text-red-400">no</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Production Ready</span>
          <span className="text-red-500 dark:text-red-400">no</span>
        </div>
        <div className="flex justify-between text-xs py-1.5">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Persistence Mode</span>
          <span className="font-mono text-gray-500 dark:text-gray-400">{tenant.persistenceMode}</span>
        </div>
      </div>

      {scopedAreas.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tenant-Scoped Areas</h3>
          <ul className="text-xs space-y-0.5 pl-3">
            {scopedAreas.map((area, i) => (
              <li key={i} className="text-gray-600 dark:text-gray-400 list-disc">{area}</li>
            ))}
          </ul>
        </>
      )}

      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
        Full multi-tenant persistence is not yet production-verified. Tenant boundaries are contract-ready but not database-enforced.
      </div>
    </div>
  )
}
