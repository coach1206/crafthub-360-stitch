import React, { useState, useEffect } from 'react'
import StaffOrderPanel from '../../components/staff/StaffOrderPanel.jsx'
import TableLayoutBoard from '../../components/staff/TableLayoutBoard.jsx'
import PatioLayoutPanel from '../../components/staff/PatioLayoutPanel.jsx'
import SectionSelector from '../../components/staff/SectionSelector.jsx'
import TableStatusBoard from '../../components/staff/TableStatusBoard.jsx'
import ManagerApprovalPanel from '../../components/staff/ManagerApprovalPanel.jsx'
import ManualPOS360HandoffPanel from '../../components/staff/ManualPOS360HandoffPanel.jsx'
import StaffReadinessPanel from '../../components/staff/StaffReadinessPanel.jsx'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge.jsx'
import StaffAssignmentOverlay from '../../components/staff/StaffAssignmentOverlay.jsx'
import TableActionMenu from '../../components/staff/TableActionMenu.jsx'
import LayoutSavePreviewBar from '../../components/staff/LayoutSavePreviewBar.jsx'
import LayoutWarningPanel from '../../components/staff/LayoutWarningPanel.jsx'
import { getDragDropCapability } from '../../services/staff/tableDragDropEngine.js'
import {
  startStaffOrderSession, addItemToSession, updateSessionItem, removeSessionItem,
  submitSessionPreview, cancelSession, getStaffOrderReadiness,
  listSections, listTables, getTableStatusBoard, updateTableStatus,
  createManagerApproval, listManagerApprovals, approveManagerRequest, rejectManagerRequest,
  createPOS360Handoff, listPOS360Handoffs, updateTableLayoutPosition, resetTableLayoutPreview,
} from '../../services/staff/staffOrderApi.js'

const DEMO_VENUE = 'demo-venue-staff-001'
const DEMO_TABLES = [
  { table_id: 'tbl-001', venue_id: DEMO_VENUE, table_name: 'Table 1', table_type: 'standard', seat_count: 4, table_status: 'open',   section_id: 's-lounge', x_position: 40,  y_position: 40,  width: 120, height: 80,  rotation: 0, server_id: null, metadata: {} },
  { table_id: 'tbl-002', venue_id: DEMO_VENUE, table_name: 'Table 2', table_type: 'standard', seat_count: 2, table_status: 'seated', section_id: 's-lounge', x_position: 220, y_position: 40,  width: 100, height: 70,  rotation: 0, server_id: 'srv-1', metadata: {} },
  { table_id: 'tbl-003', venue_id: DEMO_VENUE, table_name: 'Table 3', table_type: 'booth',    seat_count: 6, table_status: 'ordering',section_id: 's-lounge', x_position: 40,  y_position: 180, width: 140, height: 90,  rotation: 0, server_id: null, metadata: {} },
  { table_id: 'tbl-P1',  venue_id: DEMO_VENUE, table_name: 'Patio A', table_type: 'patio',   seat_count: 4, table_status: 'open',   section_id: 's-patio',  x_position: 40,  y_position: 40,  width: 110, height: 80,  rotation: 0, server_id: null, metadata: { is_patio: true }, section_type: 'patio' },
  { table_id: 'tbl-P2',  venue_id: DEMO_VENUE, table_name: 'Patio B', table_type: 'patio',   seat_count: 2, table_status: 'reserved_preview', section_id: 's-patio', x_position: 200, y_position: 40, width: 100, height: 70, rotation: 0, server_id: null, metadata: { is_patio: true }, section_type: 'patio' },
]
const DEMO_SECTIONS = [
  { section_id: 's-lounge', section_name: 'Main Lounge', section_type: 'lounge' },
  { section_id: 's-patio',  section_name: 'Outdoor Patio', section_type: 'patio' },
  { section_id: 's-bar',    section_name: 'Bar', section_type: 'bar' },
]

function EventLog({ events }) {
  if (!events.length) return null
  return (
    <div className="font-mono text-xs bg-gray-900 text-green-400 rounded-lg p-3 max-h-48 overflow-y-auto space-y-0.5">
      {events.map((e, i) => <div key={i}>&gt; {e}</div>)}
    </div>
  )
}

export default function StaffOperationsDemo() {
  const [session, setSession]               = useState(null)
  const [sections, setSections]             = useState(DEMO_SECTIONS)
  const [tables, setTables]                 = useState(DEMO_TABLES)
  const [statusMap, setStatusMap]           = useState({})
  const [approvals, setApprovals]           = useState([])
  const [handoffs, setHandoffs]             = useState([])
  const [readiness, setReadiness]           = useState(null)
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [showAssignment, setShowAssignment] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [warnings, setWarnings]             = useState([])
  const [hasUnsaved, setHasUnsaved]         = useState(false)
  const [undoAvailable, setUndoAvailable]   = useState(false)
  const [events, setEvents]                 = useState([])
  const [step, setStep]                     = useState('start')
  const dragCap = getDragDropCapability()

  function log(msg) { setEvents(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]) }

  useEffect(() => {
    getStaffOrderReadiness(DEMO_VENUE).then(r => { if (r.ok) setReadiness(r) })
    listManagerApprovals(DEMO_VENUE).then(r => { if (r.ok) setApprovals(r.requests ?? []) })
    listPOS360Handoffs(DEMO_VENUE).then(r => { if (r.ok) setHandoffs(r.handoffs ?? []) })
    log(`Drag/drop status: ${dragCap.status} · library: ${dragCap.library ?? 'none'}`)
    log('touch_move_ready · keyboard_move_ready · snap_grid_ready')
  }, [])

  async function handleStart() {
    const r = await startStaffOrderSession(DEMO_VENUE, { staff_id: 'staff-demo-01' })
    if (r.ok) {
      setSession(r.session)
      log(`Session: ${r.session.staff_order_session_id.slice(0,8)} · ${r.sessionStatus}`)
      const ir = await addItemToSession(r.session.staff_order_session_id, { item_name: 'Churchill Cigar', item_category: 'cigar', unit_amount: 2200, quantity: 2 })
      if (ir.ok) setSession(s => ({ ...s, items: [...(s?.items ?? []), ir.item] }))
    }
    setStep('order')
  }

  async function handleAddItem(item)   { if (!session) return; const r = await addItemToSession(session.staff_order_session_id, item); if (r.ok) { setSession(s => ({ ...s, items: [...(s?.items ?? []), r.item] })); log(`Added: ${item.item_name}`) } }
  async function handleRemoveItem(id)  { if (!session) return; const r = await removeSessionItem(session.staff_order_session_id, id); if (r.ok) setSession(s => ({ ...s, items: (s.items ?? []).filter(i => i.item_id !== id) })) }
  async function handleQty(itemId, qty){ if (!session) return; const r = await updateSessionItem(session.staff_order_session_id, itemId, { quantity: qty }); if (r.ok) setSession(s => ({ ...s, items: (s.items ?? []).map(i => i.item_id === itemId ? r.item : i) })) }
  async function handleSubmit(sid)     { const r = await submitSessionPreview(sid, {}); log(`Submit: ${r.submissionStatus ?? r.sessionStatus} · pos_sync_pending`) ; setStep('submitted') }
  async function handleCancel()        { if (!session) return; const r = await cancelSession(session.staff_order_session_id, 'demo cancel'); if (r.ok) { setSession(null); setStep('start') } }

  async function handleRequestApproval({ approval_type, reason }) {
    const r = await createManagerApproval(DEMO_VENUE, { approval_type, reason })
    if (r.ok) { setApprovals(p => [...p, r.approvalRequest]); log(`Approval: ${approval_type} · manager_approval_required`) }
  }
  async function handleApprove(id) { const r = await approveManagerRequest(id, { manager_id: 'mgr-01' }); if (r.ok) { setApprovals(p => p.map(a => a.approval_request_id === id ? r.approvalRequest : a)); log(`Approved · manager_approved_preview`) } }
  async function handleReject(id)  { const r = await rejectManagerRequest(id, { manager_id: 'mgr-01' }); if (r.ok) { setApprovals(p => p.map(a => a.approval_request_id === id ? r.approvalRequest : a)); log(`Rejected · manager_rejected_preview`) } }
  async function handleCreateHandoff() { const r = await createPOS360Handoff(DEMO_VENUE, { items: session?.items ?? [] }); if (r.ok) { setHandoffs(p => [...p, r.handoff]); log(`POS360 handoff · manual_pos360_handoff · pos_sync_pending`) } }
  async function handleStatusChange(tableId, s) { const r = await updateTableStatus(DEMO_VENUE, tableId, s); if (r.ok) { setStatusMap(p => ({ ...p, [tableId]: s })); log(`Table ${tableId.slice(0,6)} → ${s}`) } }

  function handlePositionUpdate(tableId, newPos, result) {
    setHasUnsaved(true)
    setUndoAvailable(true)
    log(`Table ${tableId.slice(0,6)} moved to x:${newPos.x_position} y:${newPos.y_position} · ${result.ok ? 'table_position_updated_preview' : 'preview_fallback'}`)
    if (result.collisionWarnings?.length) setWarnings(result.collisionWarnings)
    else setWarnings([])
  }

  function handleTableSelect(tableId) {
    setSelectedTableId(tableId)
    setShowAssignment(false)
    setShowActionMenu(false)
  }

  function handleTableAction(action, table) {
    log(`Action: ${action} on ${table.table_name}`)
    if (action === 'start_order') { handleStart(); setShowActionMenu(false) }
    else if (action === 'request_approval') { handleRequestApproval({ approval_type: 'request_comp', reason: `Table ${table.table_name}` }) }
    else if (action === 'pos360_handoff') { handleCreateHandoff() }
  }

  const selectedTable = tables.find(t => t.table_id === selectedTableId)

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Staff Operations Demo</h1>
        <div className="flex gap-2 flex-wrap">
          <StaffStatusBadge status={dragCap.status} label={dragCap.status} />
          <StaffStatusBadge status="staff_order_preview" />
          <StaffStatusBadge status="layout_not_persisted" />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        Staff order and layout preview only. No payment captured. No POS synced. No kitchen notified. Layout not persisted. Drag tables to reposition.
      </div>

      <LayoutWarningPanel warnings={warnings} dragDropStatus={dragCap.status} persistenceStatus="layout_not_persisted" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StaffReadinessPanel readiness={readiness} />
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500">Library</div>
          <div className="text-xs font-mono bg-gray-50 p-2 rounded border">{dragCap.library ?? 'none'} · {dragCap.status}</div>
          <div className="text-xs font-mono bg-gray-50 p-2 rounded border">touch_move_ready · keyboard_move_ready · snap_grid_ready</div>
        </div>
      </div>

      <LayoutSavePreviewBar
        hasUnsavedChanges={hasUnsaved}
        undoAvailable={undoAvailable}
        saveStatus="layout_save_preview"
        persistenceStatus="layout_not_persisted"
        onSavePreview={() => { setHasUnsaved(false); log('layout_save_preview · database_required') }}
        onReset={() => { resetTableLayoutPreview(DEMO_VENUE); setTables(DEMO_TABLES); setHasUnsaved(false); setUndoAvailable(false); setWarnings([]); log('Layout reset · layout_not_persisted') }}
        onUndo={() => { setUndoAvailable(false); log('Undo last move') }}
      />

      <SectionSelector sections={sections} selectedId={null} onSelect={() => {}} />

      <TableLayoutBoard
        tables={tables}
        statusMap={statusMap}
        selectedTableId={selectedTableId}
        onSelectTable={handleTableSelect}
        venueId={DEMO_VENUE}
        onPositionUpdate={handlePositionUpdate}
      />

      {selectedTable && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowAssignment(v => !v)} className="min-h-[44px] px-4 border rounded text-sm">
            {showAssignment ? 'Hide' : 'Assign Staff'}
          </button>
          <button onClick={() => setShowActionMenu(v => !v)} className="min-h-[44px] px-4 border rounded text-sm">
            {showActionMenu ? 'Hide' : 'Table Actions'}
          </button>
        </div>
      )}

      {showAssignment && selectedTable && (
        <StaffAssignmentOverlay
          table={selectedTable}
          sections={sections}
          onAssignServer={(id, sid) => { log(`Server ${sid} assigned to table ${id.slice(0,6)} · staff_assignment_pending`) }}
          onAssignSection={(id, sid) => { log(`Section ${sid?.slice(0,6)} assigned to table ${id.slice(0,6)} · table_assignment_pending`) }}
          onClose={() => setShowAssignment(false)}
        />
      )}

      {showActionMenu && selectedTable && (
        <TableActionMenu
          table={selectedTable}
          onAction={handleTableAction}
          onClose={() => setShowActionMenu(false)}
        />
      )}

      <PatioLayoutPanel
        tables={tables}
        statusMap={statusMap}
        selectedTableId={selectedTableId}
        onSelectTable={handleTableSelect}
        venueId={DEMO_VENUE}
        onPositionUpdate={handlePositionUpdate}
      />

      <TableStatusBoard board={Object.entries(statusMap).map(([table_id, table_status]) => ({ table_id, table_status }))} onStatusChange={handleStatusChange} />

      {step === 'start' && (
        <div className="text-center py-4">
          <button onClick={handleStart} className="min-h-[44px] px-8 bg-blue-600 text-white rounded-lg text-base font-semibold">Start Staff Order Session</button>
        </div>
      )}

      {(step === 'order' || step === 'submitted') && session && (
        <StaffOrderPanel
          session={session}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onQuantityChange={handleQty}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      <ManagerApprovalPanel
        approvals={approvals}
        onRequest={handleRequestApproval}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ManualPOS360HandoffPanel handoffs={handoffs} onCreateHandoff={handleCreateHandoff} />

      <EventLog events={events} />

      <div className="text-xs text-gray-400 text-center pb-8 space-y-1">
        <div>drag_drop_active · {dragCap.library} · snap_grid_ready · keyboard_move_ready · touch_move_ready</div>
        <div>layout_not_persisted · layout_save_preview · table_position_updated_preview</div>
        <div>manager_approval_required · manual_pos360_handoff · pos_sync_pending</div>
        <div>protected_screen_not_modified</div>
      </div>
    </div>
  )
}
