import PersistenceStatusBadge from './PersistenceStatusBadge.jsx'

export default function ApprovalDecisionHistoryPanel({ approvals = [], persistenceStatus }) {
  const statusColor = (s) =>
    s?.startsWith('approved') ? 'text-green-600' :
    s?.startsWith('rejected') ? 'text-red-600' : 'text-yellow-600'
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Approval Decisions ({approvals.length})</p>
        <PersistenceStatusBadge status={persistenceStatus ?? 'in_memory_only'} />
      </div>
      {approvals.length === 0 && <p className="text-xs text-gray-500">No approval decisions recorded.</p>}
      {approvals.slice(0, 8).map((a, i) => (
        <div key={a.approval_id ?? i} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
          <span className="text-gray-600 dark:text-gray-400">{a.approval_type}</span>
          <span className={`font-medium ${statusColor(a.approval_status)}`}>{a.approval_status}</span>
          <span className="text-gray-400">{a.approved_role ?? a.requested_role}</span>
        </div>
      ))}
    </div>
  )
}
