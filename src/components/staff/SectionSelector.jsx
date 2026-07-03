import React from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function SectionSelector({ sections = [], selectedId, onSelect }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-500 mb-1">Select Section</div>
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <button
            key={s.section_id}
            onClick={() => onSelect?.(s.section_id)}
            className={`min-h-[44px] px-3 py-1 rounded-lg border text-sm transition-colors ${selectedId === s.section_id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 hover:border-indigo-400'}`}
          >
            {s.section_name}
            <span className="ml-1 text-xs opacity-60">({s.section_type})</span>
          </button>
        ))}
      </div>
      <div className="mt-1"><StaffStatusBadge status="section_layout_preview" /></div>
    </div>
  )
}
