import React from 'react'

const VERTICAL_COLORS = {
  smokecraft:      { bg: 'bg-amber-900/30', border: 'border-amber-700/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  pourcraft:       { bg: 'bg-amber-900/20', border: 'border-amber-700/30', text: 'text-amber-300', dot: 'bg-amber-400' },
  beercraft:       { bg: 'bg-yellow-900/20', border: 'border-yellow-700/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  winecraft:       { bg: 'bg-purple-900/20', border: 'border-purple-700/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  coffeecraft:     { bg: 'bg-orange-900/20', border: 'border-orange-700/30', text: 'text-orange-400', dot: 'bg-orange-500' },
  teacraft:        { bg: 'bg-green-900/20', border: 'border-green-700/30', text: 'text-green-400', dot: 'bg-green-500' },
  chocolatecraft:  { bg: 'bg-amber-950/30', border: 'border-amber-800/30', text: 'text-amber-500', dot: 'bg-amber-600' },
  bbqcraft:        { bg: 'bg-red-900/20', border: 'border-red-700/30', text: 'text-red-400', dot: 'bg-red-500' },
  steakcraft:      { bg: 'bg-red-900/20', border: 'border-red-700/30', text: 'text-red-400', dot: 'bg-red-500' },
  chefcraft:       { bg: 'bg-blue-900/20', border: 'border-blue-700/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  mixologycraft:   { bg: 'bg-cyan-900/20', border: 'border-cyan-700/30', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  cheesecraft:     { bg: 'bg-yellow-900/20', border: 'border-yellow-700/30', text: 'text-yellow-500', dot: 'bg-yellow-500' },
  dessertcraft:    { bg: 'bg-pink-900/20', border: 'border-pink-700/30', text: 'text-pink-400', dot: 'bg-pink-500' },
  hospitalitycraft:{ bg: 'bg-indigo-900/20', border: 'border-indigo-700/30', text: 'text-indigo-400', dot: 'bg-indigo-500' },
}

const DEFAULT_COLORS = { bg: 'bg-zinc-900', border: 'border-zinc-700', text: 'text-zinc-400', dot: 'bg-zinc-500' }

export default function NCIEVerticalBadge({ moduleId, displayName, status = 'craft_vertical_registered', size = 'sm' }) {
  const colors = VERTICAL_COLORS[moduleId] ?? DEFAULT_COLORS
  const isActive = status === 'active'

  if (size === 'lg') {
    return (
      <div className={`rounded-xl border px-4 py-3 ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${colors.dot} ${isActive ? '' : 'opacity-40'}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>{displayName}</span>
        </div>
        <span className="text-xs text-zinc-500">{isActive ? 'Active vertical' : 'Registered · Coming soon'}</span>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors.bg} ${colors.border} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${isActive ? '' : 'opacity-40'}`} />
      {displayName}
    </span>
  )
}
