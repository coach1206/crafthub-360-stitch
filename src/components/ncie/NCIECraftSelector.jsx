import React from 'react'
import NCIEVerticalBadge from './NCIEVerticalBadge'

export default function NCIECraftSelector({ crafts = [], selectedModuleId, onSelectCraft, showAllStatuses = false }) {
  const displayCrafts = showAllStatuses
    ? crafts
    : crafts.filter(c => c.launchStatus === 'active' || c.launchStatus === 'craft_vertical_registered')

  if (!displayCrafts.length) {
    return (
      <div className="text-center py-6">
        <p className="text-zinc-500 text-sm">No craft verticals available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Craft360 Verticals</p>
      <div className="grid grid-cols-2 gap-2">
        {displayCrafts.map(craft => {
          const isSelected = craft.moduleId === selectedModuleId
          const isActive   = craft.launchStatus === 'active'

          return (
            <button
              key={craft.moduleId}
              onClick={() => isActive && onSelectCraft?.(craft)}
              disabled={!isActive}
              className={`rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/5'
                  : isActive
                    ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 cursor-pointer'
                    : 'border-zinc-800 bg-zinc-950 opacity-50 cursor-not-allowed'
              }`}
            >
              <p className={`text-xs font-medium mb-1 ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                {craft.displayName}
              </p>
              <NCIEVerticalBadge
                moduleId={craft.moduleId}
                displayName={isActive ? 'Active' : 'Coming soon'}
                status={craft.launchStatus}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
