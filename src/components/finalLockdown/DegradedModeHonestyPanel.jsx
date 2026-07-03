export default function DegradedModeHonestyPanel({ report = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Degraded-Mode Honesty</p>
      <p className="text-xs text-green-600">degraded_honest — all honesty checks pass</p>
      <div className="text-[10px] font-mono space-y-0.5 text-gray-500">
        <p>✓ in_memory_only · degradedMode: true</p>
        <p>✓ external_sync_not_live · real_time_push_pending</p>
        <p>✓ purchase_order_not_submitted · reorder_not_submitted</p>
        <p>✓ can_submit_live: false · auto_approval_disabled: true</p>
        <p>✓ no_fake_pos_synced · no_fake_vendor_order_sent</p>
        <p>✓ no_fake_payment_captured · no_auto_purchase</p>
      </div>
      <p className="text-[10px] text-orange-400">forbidden_terms_found: {String(report.forbidden_terms_found ?? false)}</p>
    </div>
  )
}
