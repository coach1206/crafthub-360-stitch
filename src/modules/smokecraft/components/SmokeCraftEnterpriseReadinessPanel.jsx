/**
 * SmokeCraftEnterpriseReadinessPanel
 * Shows enterprise readiness across all dimensions.
 * Never claims production-ready.
 */

const READINESS_COLORS = {
  ready_for_internal_preview:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  ready_for_governance_review:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  blocked_for_marketplace:      'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  blocked_for_license_enforcement: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  blocked_for_production:       'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  incomplete:                   'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
}

function ReadinessChip({ level }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${READINESS_COLORS[level] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
      {level ?? 'unknown'}
    </span>
  )
}

function DimensionRow({ label, dim }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dim?.ready ? 'bg-green-500' : 'bg-red-400'}`} />
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{dim?.status ?? '—'}</span>
      </div>
    </div>
  )
}

const DIMENSION_LABELS = {
  moduleManifestReadiness:    'Module Manifest',
  routeContractReadiness:     'Route Contract',
  serviceContractReadiness:   'Service Contract',
  integrationReadiness:       'Integration',
  databaseReadiness:          'Database',
  tenantReadiness:            'Tenant Isolation',
  whiteLabelReadiness:        'White-Label',
  licenseGovernanceReadiness: 'License Governance',
  marketplaceDraftReadiness:  'Marketplace Draft',
  featureFlagReadiness:       'Feature Flags',
  upgradeRollbackReadiness:   'Upgrade/Rollback',
  documentationReadiness:     'Documentation',
  protectedFileCompliance:    'Protected Files',
  secretSafety:               'Secret Safety',
  auditCoverage:              'Audit Coverage',
  productionSyncReadiness:    'Production Sync',
}

export default function SmokeCraftEnterpriseReadinessPanel({ readiness }) {
  if (!readiness) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Enterprise readiness not available.
      </div>
    )
  }

  const dims = readiness.dimensions ?? {}
  const blockers = readiness.productionBlockers ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Enterprise Readiness</h2>
        <ReadinessChip level={readiness.overallReadiness} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        {Object.entries(dims).map(([key, dim]) => (
          <DimensionRow key={key} label={DIMENSION_LABELS[key] ?? key} dim={dim} />
        ))}
      </div>

      {blockers.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Production Blockers</h3>
          <ul className="space-y-1">
            {blockers.map((b, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
                {b}
              </li>
            ))}
          </ul>
        </>
      )}

      {!readiness.productionReady && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          SmokeCraft is not production-ready. Resolve all blockers before claiming production status.
        </div>
      )}
    </div>
  )
}
