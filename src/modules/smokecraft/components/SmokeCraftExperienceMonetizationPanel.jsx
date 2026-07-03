/**
 * SmokeCraftExperienceMonetizationPanel
 * Preview monetization models. No billing is active. No charges are created.
 * Shows billingStatus, licenseStatus, marketplaceStatus — all preview_only.
 */

const STATUS_DISPLAY = {
  preview_only:        { label: 'Preview Only',        color: 'amber' },
  not_live_marketplace:{ label: 'Not Live',            color: 'amber' },
  license_not_enforced:{ label: 'Not Enforced',        color: 'amber' },
  connected:           { label: 'Connected',           color: 'green' },
}

function StatusChip({ value }) {
  const s = STATUS_DISPLAY[value] ?? { label: value ?? '—', color: 'gray' }
  const colorMap = {
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    gray:  'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorMap[s.color] ?? colorMap.gray}`}>
      {s.label}
    </span>
  )
}

function ModelCard({ model }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{model.label}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{model.description}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-mono text-gray-700 dark:text-gray-300">
            {model.amount > 0 ? `$${model.amount}/${model.billingCycle}` : 'Sponsor'}
          </div>
          <StatusChip value={model.billingStatus ?? 'preview_only'} />
        </div>
      </div>
    </div>
  )
}

export default function SmokeCraftExperienceMonetizationPanel({ monetizationReport }) {
  if (!monetizationReport) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Monetization preview not available.
      </div>
    )
  }

  const {
    previewModels = [],
    billingStatus,
    licenseStatus,
    marketplaceStatus,
    previewOnly,
  } = monetizationReport

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Experience Monetization</h2>
        <StatusChip value="preview_only" />
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 space-y-0.5">
          <div className="text-gray-400 dark:text-gray-500">Billing</div>
          <StatusChip value={billingStatus ?? 'preview_only'} />
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 space-y-0.5">
          <div className="text-gray-400 dark:text-gray-500">License</div>
          <StatusChip value={licenseStatus ?? 'license_not_enforced'} />
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 space-y-0.5">
          <div className="text-gray-400 dark:text-gray-500">Marketplace</div>
          <StatusChip value={marketplaceStatus ?? 'not_live_marketplace'} />
        </div>
      </div>

      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Preview Models</div>
      <div className="space-y-2">
        {previewModels.length > 0
          ? previewModels.map(m => <ModelCard key={m.type} model={m} />)
          : <div className="text-xs text-gray-400 dark:text-gray-500">No preview models available.</div>
        }
      </div>

      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
        All monetization models are preview_only. No billing is active. No charges are created.
        Connect a billing provider to activate real monetization.
      </div>
    </div>
  )
}
