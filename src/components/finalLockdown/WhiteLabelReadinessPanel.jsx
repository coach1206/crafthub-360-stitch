import WhiteLabelLicenseTierCard from './WhiteLabelLicenseTierCard.jsx'

const DEMO_TIERS = [
  { licenseTier: 'core', venueLimit: 1, whiteLabelAllowed: false, resellerAllowed: false, currentStatus: 'tier_defined_not_enforced', blockers: ['license_gate_engine_not_built'] },
  { licenseTier: 'premium', venueLimit: 5, whiteLabelAllowed: false, resellerAllowed: false, currentStatus: 'tier_defined_not_enforced', blockers: ['license_gate_engine_not_built'] },
  { licenseTier: 'enterprise', venueLimit: null, whiteLabelAllowed: false, resellerAllowed: false, currentStatus: 'tier_defined_not_enforced', blockers: ['license_gate_engine_not_built'] },
  { licenseTier: 'white_label', venueLimit: null, whiteLabelAllowed: true, resellerAllowed: false, currentStatus: 'tier_defined_not_enforced', blockers: ['license_gate_engine_not_built'] },
]

export default function WhiteLabelReadinessPanel({ tiers = DEMO_TIERS }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">White-Label Licensing Readiness</p>
      <p className="text-xs text-orange-500">white_label_ready_draft — license_gate_not_built</p>
      <div className="space-y-1.5">
        {tiers.map(t => <WhiteLabelLicenseTierCard key={t.licenseTier} tier={t} />)}
      </div>
      <p className="text-[10px] text-gray-400">tiers_defined_not_enforced · needs_module_build_9</p>
    </div>
  )
}
