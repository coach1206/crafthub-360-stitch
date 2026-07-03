/**
 * SmokeCraftLoyaltyProgressPanel
 * Shows XP, loyalty points, tier, visit progress, badges.
 * Shows production readiness warning when in memory_fallback mode.
 */

const TIER_COLORS = {
  ember:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  spark:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  flame:   'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  torch:   'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  inferno: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
}

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-3 space-y-0.5 text-center">
      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  )
}

export default function SmokeCraftLoyaltyProgressPanel({ summary }) {
  if (!summary) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        No loyalty progress yet. Complete SmokeCraft journey steps to earn XP and rewards.
      </div>
    )
  }

  const { totalXP = 0, totalLoyaltyPoints = 0, tier, stampsEarned = 0, badgesEarned = 0, persistenceMode, productionReady } = summary
  const tierKey = tier?.tier ?? 'ember'
  const tierLabel = tier?.label ?? 'Ember'
  const nextTierXP = tier?.maxXP ?? null
  const progressPct = nextTierXP ? Math.min((totalXP - (tier?.minXP ?? 0)) / (nextTierXP - (tier?.minXP ?? 0)) * 100, 100) : 100

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Loyalty Progress</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[tierKey] ?? TIER_COLORS.ember}`}>
          {tierLabel}
        </span>
      </div>

      {/* XP progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">{totalXP.toLocaleString()} XP</span>
          {nextTierXP && <span className="text-gray-400 dark:text-gray-500">Next tier: {nextTierXP.toLocaleString()} XP</span>}
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Total XP" value={totalXP.toLocaleString()} />
        <StatBox label="Loyalty Points" value={totalLoyaltyPoints.toLocaleString()} />
        <StatBox label="Passport Stamps" value={stampsEarned} />
        <StatBox label="Badges" value={badgesEarned} />
      </div>

      {persistenceMode === 'memory_fallback' && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Loyalty data is in memory_fallback mode. Requires DATABASE_URL for production persistence.
        </div>
      )}

      {!productionReady && (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Preview rewards — not production-ready without database and POS360 connection.
        </div>
      )}
    </div>
  )
}
