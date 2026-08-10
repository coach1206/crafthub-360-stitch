/**
 * SmokeCraftReleaseCandidatePanel
 * Shows release candidate status with honest approval gates.
 * approvedForProduction and approvedForMarketplace are always false.
 */

export default function SmokeCraftReleaseCandidatePanel({ rc }) {
  if (!rc) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Release candidate status not available.
      </div>
    )
  }

  const data = rc.releaseCandidate ?? rc

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Release Candidate</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          {data.version ?? 'rc-preview'}
        </span>
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">RC ID</span>
          <span className="font-mono text-gray-500 dark:text-gray-400 text-xs">{data.releaseCandidateId}</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Module</span>
          <span className="text-gray-800 dark:text-gray-200">{data.moduleName}</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Build Sequence</span>
          <span className="text-gray-800 dark:text-gray-200">{data.buildSequenceStatus}</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">QA Status</span>
          <span className="text-green-600 dark:text-green-400">{data.qaStatus}</span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Internal Demo</span>
          <span className={data.approvedForInternalDemo ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
            {data.approvedForInternalDemo ? 'approved' : 'pending'}
          </span>
        </div>
        <div className="flex justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Production</span>
          <span className="text-red-500 dark:text-red-400">not approved</span>
        </div>
        <div className="flex justify-between text-xs py-1.5">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Marketplace</span>
          <span className="text-red-500 dark:text-red-400">not approved</span>
        </div>
      </div>

      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
        SmokeCraft is approved for internal demo review only. Production and marketplace approvals require verified database, connectors, billing, license, and compliance review.
      </div>
    </div>
  )
}
