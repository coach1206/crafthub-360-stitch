import React from 'react'

const STATUS_COLORS = {
  open:                  'bg-green-100 border-green-300 text-green-800',
  seated:                'bg-blue-100 border-blue-300 text-blue-800',
  ordering:              'bg-yellow-100 border-yellow-300 text-yellow-800',
  ordered:               'bg-orange-100 border-orange-300 text-orange-800',
  preparing:             'bg-purple-100 border-purple-300 text-purple-800',
  ready:                 'bg-teal-100 border-teal-300 text-teal-800',
  served:                'bg-gray-100 border-gray-300 text-gray-700',
  check_requested:       'bg-pink-100 border-pink-300 text-pink-800',
  closed:                'bg-gray-50 border-gray-200 text-gray-400',
  unavailable:           'bg-red-100 border-red-300 text-red-800',
  reserved_preview:      'bg-indigo-100 border-indigo-300 text-indigo-800',
  table_assignment_pending: 'bg-gray-100 border-gray-200 text-gray-500',
}

export default function TableCard({
  table, tableStatus, onSelect, selected,
  hasCollision, hasBoundaryWarning, hasManagerApproval,
  hasHandoff, hasCustomerHandoff,
}) {
  const status = tableStatus ?? table.table_status ?? 'table_assignment_pending'
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.table_assignment_pending

  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect?.(table) }}
      className={`w-full h-full rounded-lg border-2 px-2 py-1 text-xs font-semibold flex flex-col justify-between transition-all select-none cursor-pointer ${colors} ${selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${hasCollision ? 'ring-2 ring-orange-500' : ''} ${hasBoundaryWarning ? 'outline outline-red-400' : ''}`}
      aria-label={`Table ${table.table_name}`}
    >
      <div className="font-bold truncate">{table.table_name}</div>
      <div className="opacity-70 text-[10px] capitalize truncate">{status.replace(/_/g, ' ')}</div>
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="opacity-50 text-[10px]">{table.seat_count ?? 2}s · {table.table_type ?? 'std'}</span>
        <div className="flex gap-0.5">
          {table.server_id   && <span title="Server assigned" className="text-[10px]">👤</span>}
          {hasCollision      && <span title="collision_warning" className="text-[10px] text-orange-600">⚠</span>}
          {hasBoundaryWarning && <span title="section_boundary_warning" className="text-[10px] text-red-600">⛔</span>}
          {hasManagerApproval && <span title="manager_approval_required" className="text-[10px] text-red-500">M</span>}
          {hasHandoff        && <span title="manual_pos360_handoff" className="text-[10px] text-yellow-600">P</span>}
          {hasCustomerHandoff && <span title="customer_handoff" className="text-[10px] text-purple-600">C</span>}
        </div>
      </div>
      {/* Drag handle indicator */}
      <div className="absolute top-0.5 right-1 text-[8px] text-gray-400 opacity-40 select-none">⠿</div>
    </div>
  )
}
