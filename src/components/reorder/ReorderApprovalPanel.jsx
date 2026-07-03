export default function ReorderApprovalPanel({ approvalReadiness, actorRole }) {
  const APPROVAL_ROLES = ['manager', 'owner', 'admin']
  const canApprove = APPROVAL_ROLES.includes(actorRole)
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Reorder Approval</p>
      <div className={`text-xs px-2 py-1 rounded ${canApprove ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        Role: <strong>{actorRole ?? 'unknown'}</strong> — {canApprove ? 'approval_role_valid' : 'approval_role_insufficient'}
      </div>
      <p className="text-xs text-gray-500">Required roles: {APPROVAL_ROLES.join(', ')}</p>
      <p className="text-xs text-orange-600 font-medium">
        {approvalReadiness?.submissionStatus ?? 'reorder_not_submitted'}
      </p>
      <p className="text-[10px] text-gray-400">No automatic purchasing. Manager or owner approval required.</p>
    </div>
  )
}
