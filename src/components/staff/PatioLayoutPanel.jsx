import React from 'react'
import TableLayoutBoard from './TableLayoutBoard.jsx'
import StaffStatusBadge from './StaffStatusBadge.jsx'

const PATIO_STATUSES = ['open','seated','ordering','ordered','preparing','ready','served','check_requested','closed','unavailable','reserved_preview','table_assignment_pending']

export default function PatioLayoutPanel({
  tables = [], statusMap = {}, selectedTableId, onSelectTable,
  venueId, onPositionUpdate,
}) {
  const patioTables = tables.filter(t =>
    t.section_type === 'patio' ||
    t.metadata?.is_patio ||
    (t.section_name ?? '').toLowerCase().includes('patio')
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between flex-wrap gap-2">
        <span className="font-semibold text-sm">Patio Layout</span>
        <div className="flex gap-2 flex-wrap">
          <StaffStatusBadge status="patio_layout_preview" />
          <StaffStatusBadge status="drag_drop_active" label="drag_drop_active" />
        </div>
      </div>

      <div className="p-3 bg-sky-50 border-b text-xs text-sky-700 flex flex-wrap gap-3">
        <span>Patio tables: {patioTables.length}</span>
        <StaffStatusBadge status="layout_not_persisted" label="layout_not_persisted" />
        <span className="opacity-60">Weather/availability managed separately. No live reservation claimed.</span>
      </div>

      {patioTables.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">
          No patio tables configured. Add tables with section_type &quot;patio&quot; to see them here.
        </div>
      ) : (
        <TableLayoutBoard
          tables={patioTables}
          statusMap={statusMap}
          selectedTableId={selectedTableId}
          onSelectTable={onSelectTable}
          venueId={venueId}
          onPositionUpdate={onPositionUpdate}
        />
      )}

      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
        patio_layout_preview · reserved_preview · drag_drop_active · layout_not_persisted
      </div>
    </div>
  )
}
