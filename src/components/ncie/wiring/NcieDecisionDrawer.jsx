import { useNcieDecision } from '../../../hooks/ncie/useNcieDecision.js'

export default function NcieDecisionDrawer({ moduleId = 'smokecraft', guestProfile = {}, onClose = null }) {
  const {
    decision,
    isOpen,
    isLoading,
    buildDecision,
    clearDecision,
    openDrawer,
    closeDrawer,
    readiness,
    decisionStatus,
  } = useNcieDecision(moduleId)

  const handleClose = () => { clearDecision(); closeDrawer(); onClose?.() }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => { openDrawer(); buildDecision(guestProfile) }}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:scale-95 transition-all"
          aria-label="Get a Recommendation"
        >
          <span>🧭</span>
          <span>Help Me Choose</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={handleClose}>
          <div
            className="bg-white w-full max-w-2xl rounded-t-2xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">Craft Decision Guide</p>
                <p className="text-xs text-gray-400 mt-0.5">{decisionStatus}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {isLoading && (
              <div className="py-8 text-center text-gray-400 text-sm">Building your recommendation...</div>
            )}

            {!isLoading && decision && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="font-semibold text-emerald-900">{decision.recommendation}</p>
                  {decision.whyThisFits && (
                    <p className="text-sm text-emerald-700 mt-2">{decision.whyThisFits}</p>
                  )}
                </div>

                {decision.mentorExplanation && (
                  <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Mentor Note</p>
                    <p>{decision.mentorExplanation}</p>
                  </div>
                )}

                {decision.lessonInfluences?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Lesson Insights</p>
                    <ul className="space-y-1">
                      {decision.lessonInfluences.map((l, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {decision.learnMoreBeforeChoosing?.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-800 mb-1">Learn before you choose:</p>
                    <ul className="space-y-0.5">
                      {decision.learnMoreBeforeChoosing.map((l, i) => (
                        <li key={i} className="text-xs text-amber-700">• {l}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {decision.confidenceScore != null && (
                  <p className="text-xs text-gray-400 text-right">Confidence: {Math.round(decision.confidenceScore * 100)}%</p>
                )}
              </div>
            )}

            {!isLoading && !decision && (
              <div className="py-8 text-center text-gray-400 text-sm">
                <p>No decision data available.</p>
                <p className="mt-1 text-xs">{readiness?.decisionReadiness ?? 'decision_preview'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
