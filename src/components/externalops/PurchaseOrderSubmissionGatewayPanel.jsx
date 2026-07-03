export default function PurchaseOrderSubmissionGatewayPanel({ readiness = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">PO Submission Gateway</p>
        <span className="text-xs font-semibold text-orange-500">
          {readiness.submissionStatus ?? 'not_submitted'}
        </span>
      </div>
      <p className="text-xs text-orange-500">purchase_order_not_submitted</p>
      <p className="text-xs text-orange-500">reorder_not_submitted</p>
      <p className="text-xs text-gray-500">auto_approval_disabled · approval_required</p>
      {readiness.emailFallbackAvailable && <p className="text-xs text-blue-500">email_channel_available</p>}
      <p className="text-[10px] text-gray-400">canSubmitLive: false · vendor_api_required</p>
    </div>
  )
}
