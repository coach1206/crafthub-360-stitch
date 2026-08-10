/**
 * SmokeCraftFinalQaPanel
 * Shows QA categories, checks, warnings, and blockers for all 9 builds.
 */

const STATUS_COLORS = {
  passed:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  blocked: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  failed:  'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

function QaChip({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
      {status ?? 'unknown'}
    </span>
  )
}

function CategoryRow({ cat }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-2">
      <span className="text-gray-600 dark:text-gray-400 font-medium">{cat.categoryName}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400 dark:text-gray-500">{cat.checksPassed}/{cat.checksPassed + cat.checksFailed}</span>
        <QaChip status={cat.status} />
      </div>
    </div>
  )
}

export default function SmokeCraftFinalQaPanel({ qa }) {
  if (!qa) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Final QA status not available.
      </div>
    )
  }

  const categories = qa.categories ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Final QA Status</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">{qa.totalPassed ?? 0} passed</span>
          <QaChip status={qa.qaStatus === 'passed_internal_rc' ? 'passed' : qa.qaStatus} />
        </div>
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        {categories.map(cat => <CategoryRow key={cat.categoryId} cat={cat} />)}
      </div>

      <div className="flex gap-3 text-xs">
        <div className={`flex-1 rounded p-2 text-center ${qa.approvedForInternalDemo ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
          Internal Demo: {qa.approvedForInternalDemo ? 'approved' : 'pending'}
        </div>
        <div className="flex-1 rounded p-2 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          Production: not approved
        </div>
        <div className="flex-1 rounded p-2 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          Marketplace: not approved
        </div>
      </div>
    </div>
  )
}
