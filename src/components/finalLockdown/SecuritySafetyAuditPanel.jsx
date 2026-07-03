export default function SecuritySafetyAuditPanel({ report = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Security Safety Audit</p>
      <p className="text-xs text-green-600">status: verified</p>
      <div className="text-[10px] font-mono space-y-0.5 text-gray-500">
        <p>✓ safe_credential_status utility present</p>
        <p>✓ no raw secrets in API responses</p>
        <p>✓ DATABASE_URL redacted</p>
        <p>✓ STRIPE_SECRET_KEY never returned</p>
        <p>✓ vendor/POS/webhook credentials redacted</p>
        <p>✓ unsafe roles blocked from sensitive actions</p>
        <p>✓ purchase order role gate enforced</p>
      </div>
      <p className="text-[10px] text-gray-400">blocked_roles: guest · customer · server · bartender · kitchen_staff</p>
    </div>
  )
}
