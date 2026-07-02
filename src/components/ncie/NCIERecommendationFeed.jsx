import React from 'react'
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react'

function InventoryUnavailableBadge() {
  return (
    <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded flex items-center gap-1">
      <AlertCircle size={10} />
      Inventory unavailable
    </span>
  )
}

function ProductRecCard({ rec }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-300">Product Recommendation</p>
        <InventoryUnavailableBadge />
      </div>
      {rec.profiles?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rec.profiles.map(p => (
            <span key={p} className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
              {p.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
      {rec.rationale && <p className="text-xs text-zinc-500">{rec.rationale}</p>}
    </div>
  )
}

function CrossCraftCard({ rec }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2 border-l-2 border-blue-500/40">
      <p className="text-xs font-medium text-zinc-300 flex items-center gap-1">
        <ArrowRight size={12} className="text-blue-400" />
        Explore {rec.targetModuleId?.replace('craft', 'Craft')}
      </p>
      {rec.message && <p className="text-xs text-zinc-400">{rec.message}</p>}
      <span className="text-xs text-zinc-600">cross_craft_preview</span>
    </div>
  )
}

function LessonRecCard({ rec }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
      <p className="text-xs font-medium text-zinc-300">Next Lesson</p>
      <p className="text-xs text-amber-400">{rec.nextLesson?.replace(/_/g, ' ')}</p>
      {rec.rationale && <p className="text-xs text-zinc-500">{rec.rationale}</p>}
    </div>
  )
}

export default function NCIERecommendationFeed({ recommendations, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
          <div className="h-16 bg-zinc-800 rounded" />
          <div className="h-16 bg-zinc-800 rounded" />
        </div>
      </div>
    )
  }

  if (!recommendations) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
        <Sparkles className="mx-auto mb-2 text-zinc-600" size={20} />
        <p className="text-zinc-500 text-sm">No recommendations yet. Explore lessons to unlock suggestions.</p>
      </div>
    )
  }

  const { productRecommendations = [], crossCraftRecommendations = [], lessonRecommendations = [] } = recommendations

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles size={16} className="text-amber-400" />
        <span className="text-sm font-medium text-white">NCIE Recommendations</span>
        <span className="ml-auto text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">preview</span>
      </div>

      <div className="p-4 space-y-3">
        {productRecommendations.map((rec, i) => <ProductRecCard key={i} rec={rec} />)}
        {crossCraftRecommendations.map((rec, i) => <CrossCraftCard key={i} rec={rec} />)}
        {lessonRecommendations.map((rec, i) => <LessonRecCard key={i} rec={rec} />)}

        {productRecommendations.length === 0 && crossCraftRecommendations.length === 0 && lessonRecommendations.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-2">No recommendations match current context.</p>
        )}
      </div>
    </div>
  )
}
