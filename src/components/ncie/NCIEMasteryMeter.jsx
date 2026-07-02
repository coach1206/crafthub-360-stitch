import React from 'react'
import { Zap } from 'lucide-react'

export default function NCIEMasteryMeter({ masteryPercent = 0, craftLevel = 'apprentice', moduleId, compact = false }) {
  const clampedPercent = Math.min(100, Math.max(0, masteryPercent))

  const getColor = () => {
    if (clampedPercent >= 80) return { ring: 'stroke-amber-400', text: 'text-amber-400', glow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' }
    if (clampedPercent >= 50) return { ring: 'stroke-blue-400', text: 'text-blue-400', glow: '' }
    return { ring: 'stroke-zinc-500', text: 'text-zinc-400', glow: '' }
  }

  const colors     = getColor()
  const radius     = 28
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clampedPercent / 100) * circumference

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <svg viewBox="0 0 68 68" className={`w-8 h-8 -rotate-90 ${colors.glow}`}>
            <circle cx="34" cy="34" r={radius} className="stroke-zinc-800 fill-none" strokeWidth="6" />
            <circle cx="34" cy="34" r={radius} className={`${colors.ring} fill-none`} strokeWidth="6"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${colors.text}`}>{clampedPercent}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white capitalize">{craftLevel.replace(/_/g, ' ')}</p>
          <p className="text-xs text-zinc-500">{clampedPercent}% mastery</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 68 68" className={`w-24 h-24 -rotate-90 ${colors.glow}`}>
          <circle cx="34" cy="34" r={radius} className="stroke-zinc-800 fill-none" strokeWidth="6" />
          <circle cx="34" cy="34" r={radius} className={`${colors.ring} fill-none`} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colors.text}`}>{clampedPercent}%</span>
          <span className="text-xs text-zinc-500">mastery</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-white capitalize">{craftLevel.replace(/_/g, ' ')}</p>
        <p className="text-xs text-zinc-500">{moduleId} · preview</p>
      </div>

      <div className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-600">
        <Zap size={10} />
        <span>Mastery tracking is preview-only</span>
      </div>
    </div>
  )
}
