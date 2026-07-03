import React from 'react'
import TableCard from './TableCard.jsx'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function TableLayoutBoard({ tables = [], statusMap = {}, selectedTableId, onSelectTable }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Floor Layout</span>
        <StaffStatusBadge status="floor_layout_preview" />
      </div>
      <div className="p-4 flex flex-wrap gap-3 min-h-[100px]">
        {tables.length === 0
          ? <div className="text-sm text-gray-400 w-full text-center py-4">No tables configured.</div>
          : tables.map(t => (
            <TableCard
              key={t.table_id}
              table={t}
              tableStatus={statusMap[t.table_id]}
              onSelect={onSelectTable}
              selected={selectedTableId === t.table_id}
            />
          ))
        }
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
        floor_layout_preview · table_layout_preview · drag_drop_ready
      </div>
    </div>
  )
}
