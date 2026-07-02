import { useNcieRecommendations } from '../../../hooks/ncie/useNcieRecommendations.js'

export default function NcieRecommendationDrawer({ moduleId = 'smokecraft', context = {}, onClose = null }) {
  const {
    recommendations,
    crossCraft,
    isOpen,
    fetchRecommendations,
    fetchCrossCraft,
    openDrawer,
    closeDrawer,
    inventoryStatus,
    recommendationStatus,
    crossCraftStatus,
  } = useNcieRecommendations(moduleId)

  const handleOpen = () => { openDrawer(); fetchRecommendations(context) }
  const handleClose = () => { closeDrawer(); onClose?.() }

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 active:scale-95 transition-all"
          aria-label="View Recommendations"
        >
          <span>✨</span>
          <span>Recommendations</span>
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
                <p className="font-semibold text-gray-900">Craft Recommendations</p>
                <p className="text-xs text-gray-400 mt-0.5">{recommendationStatus} · {inventoryStatus}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {inventoryStatus === 'inventory_unavailable' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Live inventory is not connected. Recommendations are based on craft knowledge, not real-time stock.
              </div>
            )}

            {recommendations?.recommendations?.length > 0 ? (
              <div className="space-y-3">
                {recommendations.recommendations.map((r, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-xl">
                    <p className="font-medium text-gray-900 text-sm">{r.label ?? r.ruleId}</p>
                    {r.reason && <p className="text-xs text-gray-500 mt-1">{r.reason}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                <p>Recommendations preview — no matches for current context.</p>
                <button
                  onClick={() => fetchCrossCraft(null, context)}
                  className="mt-4 px-4 py-2 min-h-[44px] border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  Explore Other Crafts
                </button>
              </div>
            )}

            {crossCraft?.recommendations?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Cross-Craft ({crossCraftStatus})</p>
                <div className="space-y-2">
                  {crossCraft.recommendations.map((r, i) => (
                    <div key={i} className="p-3 bg-violet-50 border border-violet-100 rounded-lg text-sm text-violet-800">
                      {r.label ?? r.ruleId}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
