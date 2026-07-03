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

export default function TableCard({ table, tableStatus, onSelect, selected }) {
  const status = tableStatus ?? table.table_status ?? 'table_assignment_pending'
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.table_assignment_pending
  return (
    <button
      onClick={() => onSelect?.(table)}
      className={`min-w-[80px] min-h-[64px] rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all ${colors} ${selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
    >
      <div className="font-bold">{table.table_name}</div>
      <div className="opacity-70 capitalize text-[10px]">{status.replace(/_/g, ' ')}</div>
      <div className="opacity-50 text-[10px]">{table.seat_count} seats</div>
    </button>
  )
}
