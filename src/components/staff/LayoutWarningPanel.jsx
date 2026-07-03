import React from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

const SEVERITY = {
  collision_warning:         { color: 'bg-orange-50 border-orange-200 text-orange-700', label: 'collision_warning' },
  overlap_warning:           { color: 'bg-orange-50 border-orange-200 text-orange-700', label: 'overlap_warning' },
  section_boundary_warning:  { color: 'bg-red-50 border-red-200 text-red-700',          label: 'section_boundary_warning' },
  drag_drop_library_required:{ color: 'bg-blue-50 border-blue-200 text-blue-700',       label: 'drag_drop_library_required' },
  layout_not_persisted:      { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', label: 'layout_not_persisted' },
  database_required:         { color: 'bg-gray-50 border-gray-200 text-gray-700',       label: 'database_required' },
}

export default function LayoutWarningPanel({ warnings = [], dragDropStatus, persistenceStatus }) {
  const all = [
    ...warnings,
    dragDropStatus === 'drag_drop_library_required' ? { type: 'drag_drop_library_required', message: 'Install @dnd-kit/core for real drag/drop.' } : null,
    !persistenceStatus || persistenceStatus === 'layout_not_persisted' ? { type: 'layout_not_persisted', message: 'Layout changes are not persisted. Database required.' } : null,
  ].filter(Boolean)

  if (!all.length) return null

  return (
    <div className="space-y-1">
      {all.map((w, i) => {
        const style = SEVERITY[w.type] ?? SEVERITY.layout_not_persisted
        return (
          <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded border text-xs ${style.color}`}>
            <StaffStatusBadge status={style.label} />
            <span>{w.message}</span>
          </div>
        )
      })}
    </div>
  )
}
