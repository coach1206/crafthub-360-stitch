import { getAnalyticsAdapterStatus } from '../../../services/ncie/ncieAnalyticsAdapter.js'
import { getAIStatus } from '../../../services/ncie/openAiEducationClient.js'
import { getDecisionReadiness } from '../../../services/ncie/decisionEngine.js'
import { getMasteryReadiness } from '../../../services/ncie/passportMasteryEngine.js'

const STATUS_COLORS = {
  ncie_ready:                  'bg-emerald-100 text-emerald-700',
  screen_wiring_ready:         'bg-emerald-100 text-emerald-700',
  verified_outline_available:  'bg-sky-100 text-sky-700',
  ai_unavailable:              'bg-amber-100 text-amber-700',
  analytics_preview:           'bg-gray-100 text-gray-500',
  passport_preview:            'bg-yellow-100 text-yellow-700',
  mastery_preview:             'bg-yellow-100 text-yellow-700',
  decision_preview:            'bg-violet-100 text-violet-700',
  mentor_preview:              'bg-indigo-100 text-indigo-700',
  commerce_preview:            'bg-orange-100 text-orange-700',
  inventory_unavailable:       'bg-red-100 text-red-600',
  not_persisted:               'bg-gray-100 text-gray-400',
}

function StatusBadge({ label, value }) {
  const colorClass = STATUS_COLORS[value] ?? 'bg-gray-100 text-gray-500'
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono ${colorClass}`}>
      <span className="text-gray-500 font-normal">{label}:</span>
      <span>{value}</span>
    </div>
  )
}

export default function NcieScreenStatusDock({ moduleId = 'smokecraft', visible = false }) {
  if (!visible) return null

  const analyticsStatus = getAnalyticsAdapterStatus()
  const aiStatus        = getAIStatus()
  const decisionReady   = getDecisionReadiness(moduleId)
  const masteryReady    = getMasteryReadiness(moduleId)

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur border border-gray-200 rounded-2xl shadow-lg px-4 py-3 max-w-[95vw] overflow-x-auto">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 text-center">NCIE Screen Status</p>
      <div className="flex flex-wrap gap-1.5 justify-center">
        <StatusBadge label="module"    value={moduleId} />
        <StatusBadge label="ai"        value={aiStatus.aiStatus} />
        <StatusBadge label="analytics" value={analyticsStatus.analyticsStatus} />
        <StatusBadge label="persist"   value={analyticsStatus.persistenceStatus} />
        <StatusBadge label="decision"  value={decisionReady?.decisionReadiness ?? 'decision_preview'} />
        <StatusBadge label="mastery"   value={masteryReady?.masteryReadiness ?? 'mastery_preview'} />
        <StatusBadge label="wiring"    value="screen_wiring_ready" />
      </div>
    </div>
  )
}
