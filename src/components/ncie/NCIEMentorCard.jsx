import React from 'react'
import { User, MessageCircle } from 'lucide-react'

export default function NCIEMentorCard({ mentor, onSelectMentor, isSelected = false }) {
  if (!mentor) return null

  return (
    <div
      className={`rounded-xl border p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-500/5'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
      }`}
      onClick={() => onSelectMentor?.(mentor)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white">{mentor.displayName}</p>
            {isSelected && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Active</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 capitalize mb-2">{mentor.teachingStyle?.replace('_', ' ')} · {mentor.archetype?.replace('_', ' ')}</p>
          <p className="text-xs text-zinc-400 italic">"{mentor.signaturePhrase}"</p>
        </div>
      </div>

      {mentor.specialties?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {mentor.specialties.slice(0, 4).map(s => (
            <span key={s} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{s.replace(/_/g, ' ')}</span>
          ))}
        </div>
      )}

      <button
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-amber-400 border border-amber-500/30 rounded-lg py-2 hover:bg-amber-500/10 transition-colors"
        onClick={e => { e.stopPropagation(); onSelectMentor?.(mentor) }}
      >
        <MessageCircle size={12} />
        Ask {mentor.displayName}
      </button>
    </div>
  )
}
