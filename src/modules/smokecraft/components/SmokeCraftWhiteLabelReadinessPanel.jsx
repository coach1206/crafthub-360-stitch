/**
 * SmokeCraftWhiteLabelReadinessPanel
 * Shows white-label readiness, allowed/blocked overrides, and protection rules.
 */

function StatusChip({ status }) {
  const isPreview = status?.includes('preview')
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      isPreview
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      {status ?? 'unknown'}
    </span>
  )
}

function OverrideRow({ label, allowed }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={allowed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
        {allowed ? 'allowed' : 'blocked'}
      </span>
    </div>
  )
}

export default function SmokeCraftWhiteLabelReadinessPanel({ whiteLabelData }) {
  if (!whiteLabelData) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        White-label readiness not available.
      </div>
    )
  }

  const protected_ = whiteLabelData.protectedBrandElements ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">White-Label Readiness</h2>
        <StatusChip status={whiteLabelData.whiteLabelStatus} />
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <OverrideRow label="Logo override"           allowed={whiteLabelData.logoOverrideAllowed} />
        <OverrideRow label="Color theme override"    allowed={whiteLabelData.colorThemeOverrideAllowed} />
        <OverrideRow label="Copy override"           allowed={whiteLabelData.copyOverrideAllowed} />
        <OverrideRow label="Venue naming override"   allowed={whiteLabelData.venueNamingOverrideAllowed} />
        <OverrideRow label="Module display name"     allowed={whiteLabelData.moduleDisplayNameOverrideAllowed} />
        <OverrideRow label="Legal footer override"   allowed={whiteLabelData.legalFooterOverrideAllowed} />
        <OverrideRow label="Support contact override" allowed={whiteLabelData.supportContactOverrideAllowed} />
        <OverrideRow label="Journey logic override"  allowed={false} />
        <OverrideRow label="Bypass protected progression" allowed={false} />
      </div>

      {protected_.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Protected Brand Elements</h3>
          <ul className="text-xs space-y-0.5">
            {protected_.map((el, i) => (
              <li key={i} className="text-gray-500 dark:text-gray-400 font-mono">{el}</li>
            ))}
          </ul>
        </>
      )}

      {whiteLabelData.poweredByNoveeOSRequired && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Powered-by NOVEE OS metadata is required. License enforcement is not active — white-label remains preview_only.
        </div>
      )}
    </div>
  )
}
