const SCRIPTS = [
  'verify:final-lockdown','verify:external-operations-gateway','verify:locc-dashboard',
  'verify:environment-readiness','verify:inventory-persistence-sync','verify:inventory',
  'verify:reorder-connectors','verify:staff-dragdrop','verify:staff','verify:checkout',
  'verify:ncie-wiring','verify:ncie','verify:kds','verify:orders','verify:tax',
  'verify:payments','verify:database','verify:pos360','verify:venue-onboarding','verify:partner-vendors',
]

export default function VerificationRegistryPanel() {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Verification Registry</p>
      <p className="text-xs text-green-600">20 verification scripts registered</p>
      <div className="text-[10px] font-mono space-y-0.5 text-gray-500 max-h-32 overflow-y-auto">
        {SCRIPTS.map(s => <p key={s}>✓ npm run {s}</p>)}
        <p>✓ npm run build</p>
      </div>
      <p className="text-[10px] text-gray-400">All must pass before module build series begins.</p>
    </div>
  )
}
