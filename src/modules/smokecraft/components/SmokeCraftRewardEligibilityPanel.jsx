/**
 * SmokeCraftRewardEligibilityPanel
 * Shows eligible and blocked rewards with policy checks.
 * No early unlock claims. No fake POS reward claims.
 */

function PolicyCheckRow({ check, passed }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full shrink-0 ${passed ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className={`font-mono ${passed ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
        {check}
      </span>
    </div>
  )
}

function RewardRow({ reward }) {
  const statusColors = {
    awarded:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    eligible:     'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    blocked:      'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    preview_only: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    pending:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  }
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded p-2 space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-300">{reward.rewardType ?? '—'}</span>
        <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${statusColors[reward.rewardStatus] ?? statusColors.pending}`}>
          {reward.rewardStatus}
        </span>
      </div>
      {reward.xpAwarded > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">+{reward.xpAwarded} XP</div>
      )}
      {reward.blockedReason && (
        <div className="text-xs text-red-500 dark:text-red-400 font-mono">{reward.blockedReason}</div>
      )}
    </div>
  )
}

export default function SmokeCraftRewardEligibilityPanel({ rewards = [], policyResult = null }) {
  const eligible = rewards.filter(r => r.rewardStatus === 'eligible' || r.rewardStatus === 'awarded')
  const blocked = rewards.filter(r => r.rewardStatus === 'blocked')
  const preview = rewards.filter(r => r.rewardStatus === 'preview_only')

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Reward Eligibility</h2>

      {eligible.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Eligible / Awarded</div>
          {eligible.map(r => <RewardRow key={r.rewardId} reward={r} />)}
        </div>
      )}

      {blocked.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Blocked</div>
          {blocked.map(r => <RewardRow key={r.rewardId} reward={r} />)}
        </div>
      )}

      {preview.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Preview Only</div>
          {preview.map(r => <RewardRow key={r.rewardId} reward={r} />)}
        </div>
      )}

      {policyResult && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Policy Checks</div>
          {(policyResult.checks ?? []).map(check => (
            <PolicyCheckRow
              key={check}
              check={check}
              passed={!(policyResult.violations ?? []).includes(check)}
            />
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1">
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Early unlock not available — Passport Stamp and Connections require journey completion.
        </div>
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          POS-verified spend rewards require POS360 connection — currently not_connected.
        </div>
      </div>

      {rewards.length === 0 && !policyResult && (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          No reward evaluations yet. Complete SmokeCraft journey steps to see eligibility.
        </div>
      )}
    </div>
  )
}
