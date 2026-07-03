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
import {
  startStaffOrderSession, addItemToSession, updateSessionItem, removeSessionItem,
  submitSessionPreview, cancelSession, getStaffOrderReadiness,
  listSections, listTables, getTableLayout,
  createManagerApproval, listManagerApprovals, approveManagerRequest, rejectManagerRequest,
  createPOS360Handoff, listPOS360Handoffs,
  getTableStatusBoard, updateTableStatus,
} from '../../services/staff/staffOrderApi.js'

const DEMO_VENUE = 'demo-venue-staff-001'
const DEMO_ITEMS = [
  { item_name: 'Churchill Cigar', item_category: 'cigar', unit_amount: 2200, quantity: 2 },
  { item_name: 'Bourbon Neat',    item_category: 'beverage', unit_amount: 1800, quantity: 1 },
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
  const [session, setSession] = useState(null)
  const [sections, setSections] = useState([])
  const [tables, setTables] = useState([])
  const [statusBoard, setStatusBoard] = useState([])
  const [approvals, setApprovals] = useState([])
  const [handoffs, setHandoffs] = useState([])
  const [readiness, setReadiness] = useState(null)
  const [events, setEvents] = useState([])
  const [step, setStep] = useState('start')

  function log(msg) { setEvents(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]) }

  useEffect(() => {
    listSections(DEMO_VENUE).then(r => { if (r.ok) setSections(r.sections ?? []) })
    listTables(DEMO_VENUE).then(r => { if (r.ok) setTables(r.tables ?? []) })
    getTableStatusBoard(DEMO_VENUE).then(r => { if (r.ok) setStatusBoard(r.tableStatusBoard ?? []) })
    listManagerApprovals(DEMO_VENUE).then(r => { if (r.ok) setApprovals(r.requests ?? []) })
    listPOS360Handoffs(DEMO_VENUE).then(r => { if (r.ok) setHandoffs(r.handoffs ?? []) })
    getStaffOrderReadiness(DEMO_VENUE).then(r => { if (r.ok) setReadiness(r) })
  }, [])

  async function handleStart() {
    const r = await startStaffOrderSession(DEMO_VENUE, { staff_id: 'staff-demo-01' })
    if (r.ok) { setSession(r.session); log(`Session started: ${r.session.staff_order_session_id.slice(0,8)} · ${r.sessionStatus}`) }
    for (const item of DEMO_ITEMS) {
      const ir = await addItemToSession(r.session.staff_order_session_id, item)
      if (ir.ok) { setSession(s => ({ ...s, items: [...(s?.items ?? []), ir.item] })); log(`Added item: ${item.item_name}`) }
    }
    setStep('order')
  }

  async function handleAddItem(item) {
    if (!session) return
    const r = await addItemToSession(session.staff_order_session_id, item)
    if (r.ok) { setSession(s => ({ ...s, items: [...(s?.items ?? []), r.item] })); log(`Added: ${item.item_name}`) }
  }

  async function handleRemoveItem(itemId) {
    if (!session) return
    const r = await removeSessionItem(session.staff_order_session_id, itemId)
    if (r.ok) { setSession(s => ({ ...s, items: (s.items ?? []).filter(i => i.item_id !== itemId) })); log(`Removed item`) }
  }

  async function handleQuantityChange(itemId, qty) {
    if (!session) return
    const r = await updateSessionItem(session.staff_order_session_id, itemId, { quantity: qty })
    if (r.ok) { setSession(s => ({ ...s, items: (s.items ?? []).map(i => i.item_id === itemId ? r.item : i) })) }
  }

  async function handleSubmit(sid) {
    const r = await submitSessionPreview(sid, {})
    log(`Submit preview: ${r.submissionStatus ?? r.sessionStatus} · ${r.posStatus ?? ''}`)
    setStep('submitted')
  }

  async function handleCancel() {
    if (!session) return
    const r = await cancelSession(session.staff_order_session_id, 'demo cancel')
    if (r.ok) { setSession(null); setStep('start'); log(`Session cancelled`) }
  }

  async function handleRequestApproval({ approval_type, reason }) {
    const r = await createManagerApproval(DEMO_VENUE, { approval_type, reason, staff_order_session_id: session?.staff_order_session_id })
    if (r.ok) { setApprovals(p => [...p, r.approvalRequest]); log(`Approval requested: ${approval_type} · ${r.approvalStatus}`) }
  }

  async function handleApprove(id) {
    const r = await approveManagerRequest(id, { manager_id: 'mgr-demo-01' })
    if (r.ok) { setApprovals(p => p.map(a => a.approval_request_id === id ? r.approvalRequest : a)); log(`Approved: ${r.approvalStatus}`) }
  }

  async function handleReject(id) {
    const r = await rejectManagerRequest(id, { manager_id: 'mgr-demo-01' })
    if (r.ok) { setApprovals(p => p.map(a => a.approval_request_id === id ? r.approvalRequest : a)); log(`Rejected: ${r.approvalStatus}`) }
  }

  async function handleCreateHandoff() {
    const r = await createPOS360Handoff(DEMO_VENUE, { staff_order_session_id: session?.staff_order_session_id, items: session?.items ?? [] })
    if (r.ok) { setHandoffs(p => [...p, r.handoff]); log(`POS360 handoff: ${r.handoffStatus} · ${r.posStatus}`) }
  }

  async function handleStatusChange(tableId, newStatus) {
    const r = await updateTableStatus(DEMO_VENUE, tableId, newStatus)
    if (r.ok) { setStatusBoard(p => p.map(b => b.table_id === tableId ? { ...b, table_status: newStatus } : b)); log(`Table ${tableId.slice(0,6)} → ${newStatus}`) }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Staff Operations Demo</h1>
        <div className="flex gap-2 flex-wrap">
          <StaffStatusBadge status="staff_order_preview" />
          <StaffStatusBadge status="table_layout_preview" />
          <StaffStatusBadge status="manager_approval_required" />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        Staff order preview only. No payment captured. No POS synced. No kitchen notified. Not persisted.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <StaffReadinessPanel readiness={readiness} />
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500">Status</div>
          <div className="flex flex-wrap gap-1">
            {['staff_order_preview','manager_approval_required','manual_pos360_handoff','pos_sync_pending','not_persisted'].map(s => (
              <StaffStatusBadge key={s} status={s} />
            ))}
          </div>
        </div>
      </div>

      {step === 'start' && (
        <div className="text-center py-8">
          <button onClick={handleStart} className="min-h-[44px] px-8 bg-blue-600 text-white rounded-lg text-base font-semibold">
            Start Staff Order Session
          </button>
        </div>
      )}

      {(step === 'order' || step === 'submitted') && session && (
        <StaffOrderPanel
          session={session}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onQuantityChange={handleQuantityChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      <SectionSelector sections={sections} />

      <TableLayoutBoard tables={tables} statusMap={Object.fromEntries(statusBoard.map(b => [b.table_id, b.table_status]))} />

      <PatioLayoutPanel tables={tables} statusMap={Object.fromEntries(statusBoard.map(b => [b.table_id, b.table_status]))} />

      <TableStatusBoard board={statusBoard} onStatusChange={handleStatusChange} />

      <ManagerApprovalPanel
        approvals={approvals}
        onRequest={handleRequestApproval}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ManualPOS360HandoffPanel handoffs={handoffs} onCreateHandoff={handleCreateHandoff} />

      <EventLog events={events} />

      <div className="text-xs text-gray-400 text-center space-y-1 pb-8">
        <div>protected_screen_not_modified · staff_order_preview · table_layout_preview</div>
        <div>manager_approval_required · manual_pos360_handoff · pos_sync_pending · not_persisted</div>
      </div>
    </div>
  )
}
