import React, { useState } from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function StaffAssignmentOverlay({ table, sections = [], onAssignServer, onAssignSection, onClose }) {
  const [serverId, setServerId] = useState(table?.server_id ?? '')
  const [sectionId, setSectionId] = useState(table?.section_id ?? '')

  if (!table) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Assign Staff — {table.table_name}</span>
        <StaffStatusBadge status="staff_assignment_pending" />
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Server / Staff ID</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="staff-id or name"
              value={serverId}
              onChange={e => setServerId(e.target.value)}
            />
            <button
              onClick={() => onAssignServer?.(table.table_id, serverId)}
              className="min-h-[44px] px-3 bg-blue-600 text-white rounded text-sm"
            >Assign</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Section</label>
          <div className="flex gap-2">
            <select className="flex-1 border rounded px-2 py-1 text-sm" value={sectionId} onChange={e => setSectionId(e.target.value)}>
              <option value="">No section</option>
              {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.section_name}</option>)}
            </select>
            <button
              onClick={() => onAssignSection?.(table.table_id, sectionId)}
              className="min-h-[44px] px-3 bg-indigo-600 text-white rounded text-sm"
            >Assign</button>
          </div>
        </div>
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t flex items-center justify-between">
        <span>staff_assignment_pending · not_persisted</span>
        {onClose && <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>}
      </div>
    </div>
  )
}
