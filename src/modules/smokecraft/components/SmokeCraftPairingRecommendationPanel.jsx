/**
 * SmokeCraftPairingRecommendationPanel
 * Displays a pairing recommendation with honest provider and menu status.
 * Never claims AI-backed unless providerConnected and aiBacked are confirmed true.
 */

function ScoreBar({ score }) {
  const pct = Math.min(Math.max(score ?? 0, 0), 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-amber-500 dark:bg-amber-400 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-gray-600 dark:text-gray-400 w-8 text-right">{pct}</span>
    </div>
  )
}

function ConfidenceBadge({ confidence }) {
  const pct = Math.round((confidence ?? 0) * 100)
  const color = pct >= 70 ? 'green' : pct >= 40 ? 'amber' : 'gray'
  const colorMap = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    gray:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorMap[color]}`}>
      {pct}% confidence
    </span>
  )
}

export default function SmokeCraftPairingRecommendationPanel({ recommendation }) {
  if (!recommendation) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        No recommendation available.
      </div>
    )
  }

  const isAiBacked = recommendation.aiBacked === true && recommendation.providerConnected === true
  const isLocalIntelligence = recommendation.recommendationStatus === 'local_intelligence'
  const isVenueMenuBacked = recommendation.venueMenuBacked === true

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {recommendation.name ?? recommendation.recommendationType ?? 'Pairing Recommendation'}
          </h2>
          {recommendation.recommendationType && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {recommendation.recommendationType}
            </span>
          )}
        </div>
        <ConfidenceBadge confidence={recommendation.confidenceScore} />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-500 dark:text-gray-400">Pairing Score</div>
        <ScoreBar score={recommendation.score} />
      </div>

      {recommendation.explanation && (
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {recommendation.explanation}
        </p>
      )}

      {recommendation.reasonCodes?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recommendation.reasonCodes.map(code => (
            <span key={code} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-mono">
              {code}
            </span>
          ))}
        </div>
      )}

      {recommendation.matchedFlavorNotes?.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Matched Flavor Notes</div>
          <div className="flex flex-wrap gap-1">
            {recommendation.matchedFlavorNotes.map(note => (
              <span key={note} className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                {note}
              </span>
            ))}
          </div>
        </div>
      )}

      {recommendation.conflictingFlavorNotes?.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Conflicts</div>
          <div className="flex flex-wrap gap-1">
            {recommendation.conflictingFlavorNotes.map(note => (
              <span key={note} className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                {note}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1">
        {!isAiBacked && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
            {isLocalIntelligence
              ? 'Local SmokeCraft intelligence — no AI provider connected.'
              : 'Recommendation source: demo_only. No live pairing engine connected.'}
          </div>
        )}
        {isAiBacked && (
          <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded p-2">
            AI-backed recommendation from connected provider.
          </div>
        )}
        {!isVenueMenuBacked && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
            Venue menu is local_fallback — not live-connected.
          </div>
        )}
      </div>
    </div>
  )
}
