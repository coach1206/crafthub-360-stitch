import OperationsStatusBadge from './OperationsStatusBadge.jsx'

export default function ReorderSubmissionPanel({ readiness = {}, recommendations = [] }) {
  const urgentCount = recommendations.filter(r => r.urgency === 'critical' || r.urgency === 'urgent').length
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Reorder Submission</p>
        <OperationsStatusBadge status="vendor_setup_required" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-center">
        <div className="bg-orange-50 dark:bg-orange-900 rounded p-2">
          <p className="font-bold text-orange-600">{recommendations.length}</p>
          <p className="text-gray-500">Recommendations</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 rounded p-2">
          <p className="font-bold text-red-600">{urgentCount}</p>
          <p className="text-gray-500">Urgent</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Submission: <span className="font-mono text-orange-600">reorder_not_submitted</span>
      </p>
      <p className="text-[10px] text-blue-400">vendor_api_required · distributor_connection_required · approval_required</p>
    </div>
  )
}
