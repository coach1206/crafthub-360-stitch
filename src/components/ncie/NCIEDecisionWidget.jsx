import React, { useState } from 'react'
import { Compass, ChevronRight, Info } from 'lucide-react'

export default function NCIEDecisionWidget({ decision, onRequestDecision, isLoading = false }) {
  const [showAlternatives, setShowAlternatives] = useState(false)

  if (isLoading) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-2/3" />
          <div className="h-3 bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-800 rounded w-4/5" />
        </div>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
        <Compass className="mx-auto mb-2 text-zinc-600" size={20} />
        <p className="text-zinc-400 text-sm mb-3">Tell us your preferences to get a guided recommendation.</p>
        <button
          className="text-sm text-amber-400 border border-amber-500/30 rounded-lg px-4 py-2 hover:bg-amber-500/10 transition-colors"
          onClick={() => onRequestDecision?.()}
        >
          Start Decision Guide
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Compass size={16} className="text-amber-400" />
        <span className="text-sm font-medium text-white">NCIE Decision</span>
        <span className="ml-auto text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
          {decision.confidenceScore ?? 0}% match
        </span>
      </div>

      <div className="p-4 space-y-3">
        {decision.recommendedProfiles?.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">Recommended Profiles</p>
            <div className="flex flex-wrap gap-1.5">
              {decision.recommendedProfiles.map(p => (
                <span key={p} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg">
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {decision.whyThisFits && (
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Why This Fits</p>
            <p className="text-sm text-zinc-300">{decision.whyThisFits}</p>
          </div>
        )}

        {decision.mentorExplanation && (
          <div className="border-l-2 border-amber-500/40 pl-3">
            <p className="text-xs text-zinc-400 italic">{decision.mentorExplanation}</p>
          </div>
        )}

        {decision.learnMoreBeforeChoosing?.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-zinc-500">
            <Info size={12} className="mt-0.5 flex-shrink-0 text-zinc-600" />
            <p>{decision.learnMoreBeforeChoosing[0]}</p>
          </div>
        )}

        {decision.alternativeChoices?.length > 0 && (
          <button
            className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-300 transition-colors"
            onClick={() => setShowAlternatives(!showAlternatives)}
          >
            <ChevronRight size={12} className={`transition-transform ${showAlternatives ? 'rotate-90' : ''}`} />
            {showAlternatives ? 'Hide' : 'Show'} alternatives ({decision.alternativeChoices.length})
          </button>
        )}

        {showAlternatives && decision.alternativeChoices?.map(alt => (
          <div key={alt.ruleId} className="bg-zinc-800/30 rounded-lg p-2.5">
            <p className="text-xs text-zinc-400">{alt.rationale}</p>
            {alt.recommendedProfiles?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {alt.recommendedProfiles.map(p => (
                  <span key={p} className="text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                    {p.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
