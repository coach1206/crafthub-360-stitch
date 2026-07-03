import React from 'react'

const STATUS_COLORS = {
  staff_order_preview:           'bg-blue-100 text-blue-800',
  staff_assisted_preview:        'bg-purple-100 text-purple-800',
  manager_approval_required:     'bg-red-100 text-red-800',
  manager_approved_preview:      'bg-green-100 text-green-800',
  manager_rejected_preview:      'bg-red-200 text-red-900',
  manual_pos360_handoff:         'bg-yellow-100 text-yellow-800',
  pos_sync_pending:              'bg-gray-100 text-gray-700',
  table_layout_preview:          'bg-indigo-100 text-indigo-800',
  floor_layout_preview:          'bg-indigo-100 text-indigo-800',
  section_layout_preview:        'bg-teal-100 text-teal-800',
  staff_order_cancelled:         'bg-gray-200 text-gray-600',
  preview_fallback:              'bg-orange-100 text-orange-800',
  not_persisted:                 'bg-yellow-50 text-yellow-700',
}

export default function StaffStatusBadge({ status, label }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${color}`}>
      {label ?? status}
    </span>
  )
}
