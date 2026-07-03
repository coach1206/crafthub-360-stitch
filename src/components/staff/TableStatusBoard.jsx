import React from 'react'
import TableCard from './TableCard.jsx'
import StaffStatusBadge from './StaffStatusBadge.jsx'

const ALL_STATUSES = ['open','seated','ordering','ordered','preparing','ready','served','check_requested','closed','unavailable','reserved_preview','table_assignment_pending']

export default function TableStatusBoard({ board = [], onStatusChange }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Table Status Board</span>
        <StaffStatusBadge status="table_assignment_pending" label="status_preview" />
      </div>
      <div className="p-4 space-y-3">
        {board.length === 0
          ? <div className="text-sm text-gray-400 text-center py-4">No table status data.</div>
          : board.map(record => (
            <div key={record.table_id} className="flex items-center gap-3 flex-wrap">
              <div className="text-sm font-medium w-24 truncate">{record.table_id?.slice(0,8)}</div>
              <StaffStatusBadge status={record.table_status} />
              {onStatusChange && (
                <select
                  value={record.table_status}
                  onChange={e => onStatusChange(record.table_id, e.target.value)}
                  className="text-xs border rounded px-1 py-0.5 ml-2"
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
          ))
        }
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
        table status board · preview mode · not_persisted
      </div>
    </div>
  )
}
