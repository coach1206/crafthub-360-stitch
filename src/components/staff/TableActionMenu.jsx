import React from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

const ACTIONS = [
  { key: 'start_order',      label: 'Start Staff Order',         role: 'server',   status: 'staff_order_preview' },
  { key: 'assign_table',     label: 'Assign Table',              role: 'host',     status: 'table_assignment_pending' },
  { key: 'assign_section',   label: 'Assign Section',            role: 'host',     status: 'section_layout_preview' },
  { key: 'request_approval', label: 'Request Manager Approval',  role: 'any',      status: 'manager_approval_required' },
  { key: 'pos360_handoff',   label: 'Create POS360 Handoff',     role: 'any',      status: 'manual_pos360_handoff' },
  { key: 'view_customer',    label: 'View Customer Handoff',      role: 'any',      status: 'staff_assisted_preview' },
  { key: 'view_order',       label: 'View Order Status',          role: 'any',      status: 'staff_order_preview' },
  { key: 'mark_status',      label: 'Mark Table Status',          role: 'server',   status: 'table_assignment_pending' },
]

export default function TableActionMenu({ table, onAction, onClose }) {
  if (!table) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-lg w-64">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Table Actions — {table.table_name}</span>
        {onClose && <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400">✕</button>}
      </div>
      <div className="py-1">
        {ACTIONS.map(a => (
          <button
            key={a.key}
            onClick={() => { onAction?.(a.key, table); onClose?.() }}
            className="w-full min-h-[44px] px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
          >
            <span>{a.label}</span>
            <StaffStatusBadge status={a.status} />
          </button>
        ))}
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
        Actions respect staff role permissions.
      </div>
    </div>
  )
}
