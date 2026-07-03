/**
 * SmokeCraftVenueAnalyticsPanel
 * Shows session, order, pairing, reward, XP, loyalty, fallback, and integration analytics.
 * Shows production readiness warning when in memory_fallback mode.
 */

function AnalyticRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium text-gray-800 dark:text-gray-200 ${mono ? 'font-mono' : ''}`}>{value ?? 0}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-0">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</div>
      <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
        {children}
      </div>
    </div>
  )
}

export default function SmokeCraftVenueAnalyticsPanel({ analytics }) {
  if (!analytics) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Analytics not available.
      </div>
    )
  }

  const {
    totalActiveSessions = 0, totalCompletedSessions = 0,
    totalOrderRequests = 0, customerSelfOrderCount = 0, staffAssistedOrderCount = 0,
    pendingOrderCount = 0, acceptedOrderCount = 0, completedOrderCount = 0, cancelledOrderCount = 0,
    pairingRecommendationCount = 0, localIntelligenceCount = 0, providerBackedCount = 0,
    rewardEvaluationCount = 0, xpIssued = 0, loyaltyPointsIssued = 0,
    passportEligibleCount = 0, passportAwardedCount = 0, blockedRewardCount = 0,
    fallbackUsageCount = 0, posNotConnectedCount = 0, eatPreviewOnlyCount = 0,
    analyticsStatus, productionReady,
  } = analytics

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Venue Analytics</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          analyticsStatus === 'memory_fallback'
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {analyticsStatus ?? 'memory_fallback'}
        </span>
      </div>

      <Section title="Sessions">
        <AnalyticRow label="Active Sessions"    value={totalActiveSessions} />
        <AnalyticRow label="Completed Sessions" value={totalCompletedSessions} />
      </Section>

      <Section title="Orders">
        <AnalyticRow label="Total Requests"     value={totalOrderRequests} />
        <AnalyticRow label="Customer Self-Order" value={customerSelfOrderCount} />
        <AnalyticRow label="Staff-Assisted"     value={staffAssistedOrderCount} />
        <AnalyticRow label="Pending"            value={pendingOrderCount} />
        <AnalyticRow label="Accepted"           value={acceptedOrderCount} />
        <AnalyticRow label="Completed"          value={completedOrderCount} />
        <AnalyticRow label="Cancelled"          value={cancelledOrderCount} />
      </Section>

      <Section title="Pairings">
        <AnalyticRow label="Recommendations"    value={pairingRecommendationCount} />
        <AnalyticRow label="Local Intelligence" value={localIntelligenceCount} />
        <AnalyticRow label="Provider-Backed"    value={providerBackedCount} />
      </Section>

      <Section title="Rewards">
        <AnalyticRow label="Evaluations"        value={rewardEvaluationCount} />
        <AnalyticRow label="XP Issued"          value={xpIssued} />
        <AnalyticRow label="Loyalty Points"     value={loyaltyPointsIssued} />
        <AnalyticRow label="Passport Eligible"  value={passportEligibleCount} />
        <AnalyticRow label="Passport Awarded"   value={passportAwardedCount} />
        <AnalyticRow label="Blocked Rewards"    value={blockedRewardCount} />
      </Section>

      <Section title="Fallback & Integration Counters">
        <AnalyticRow label="Fallback Usage"     value={fallbackUsageCount} />
        <AnalyticRow label="POS Not-Connected"  value={posNotConnectedCount} />
        <AnalyticRow label="E.A.T. Preview-Only" value={eatPreviewOnlyCount} />
      </Section>

      {!productionReady && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Analytics are in memory_fallback mode. Requires DATABASE_URL for production-ready analytics.
        </div>
      )}
    </div>
  )
}
