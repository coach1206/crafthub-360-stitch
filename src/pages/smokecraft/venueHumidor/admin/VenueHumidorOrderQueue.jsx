import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../../services/venueHumidor/venueHumidorAdminApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { useAdminVenueId } from './useAdminVenueId.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const inputStyle = { minHeight: 44, padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }

const STATUS_LABEL = {
  new: 'New', awaiting_confirmation: 'Awaiting Confirmation', confirmed: 'Confirmed',
  in_preparation: 'In Preparation', ready: 'Ready', completed: 'Completed',
  cancelled: 'Cancelled', expired: 'Expired', blocked: 'Blocked',
}
const STATUS_COLOR = {
  new: CREAM, awaiting_confirmation: GOLD, confirmed: GOLD, in_preparation: GOLD,
  ready: OK, completed: OK, cancelled: DANGER, expired: DANGER, blocked: DANGER,
}

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }
function orderAgeMinutes(createdAt) { return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000) }

export default function VenueHumidorOrderQueue() {
  const navigate = useNavigate()
  const [venueId, setVenueId] = useAdminVenueId()
  const [state, setState] = useState('loading')
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.listOrderQueue(venueId, { search, fulfillmentStatus: statusFilter, assignedStaffId: assignedFilter })
    if (!result.ok) {
      setState(result.status === 403 ? 'unauthorized' : result.status === 401 ? 'session_expired' : 'error')
      return
    }
    setOrders(result.orders)
    setState(result.orders.length === 0 ? 'empty' : 'ready')
  }
  useEffect(() => { load() }, [venueId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1200, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/admin/humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← Back to Inventory</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Order Fulfillment Queue</h1>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
            <input aria-label="Venue ID" placeholder="Venue ID" value={venueId} onChange={e => setVenueId(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
            <input aria-label="Search orders" placeholder="Order #, customer" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} style={{ ...inputStyle, flex: '2 1 200px' }} />
            <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, flex: '1 1 160px' }}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select aria-label="Filter by assignment" value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} style={{ ...inputStyle, flex: '1 1 160px' }}>
              <option value="">Any assignment</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <button type="button" onClick={load} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
            <button type="button" onClick={() => navigate('/smokecraft/admin/humidor/orders/history')} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Fulfillment History</button>
          </div>

          {state === 'no_venue' && <p style={{ fontSize: 13 }}>Enter a venue ID to load its order queue.</p>}
          {state === 'offline' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You appear to be offline. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'session_expired' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Your session has expired. Please log in again.</p>}
          {state === 'unauthorized' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You do not have permission to view this venue's orders.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Unable to load the queue right now. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}
          {state === 'empty' && <p style={{ fontSize: 13 }}>No orders match the current filters.</p>}

          {state === 'ready' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: 8 }}>Order #</th>
                    <th style={{ padding: 8 }}>Created / Age</th>
                    <th style={{ padding: 8 }}>Fulfillment</th>
                    <th style={{ padding: 8 }}>Items / Qty</th>
                    <th style={{ padding: 8 }}>Total</th>
                    <th style={{ padding: 8 }}>Payment</th>
                    <th style={{ padding: 8 }}>Status</th>
                    <th style={{ padding: 8 }}>Assigned</th>
                    <th style={{ padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.order_id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8 }}>{o.order_number}</td>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleString()}<br /><span style={{ opacity: 0.6 }}>{orderAgeMinutes(o.created_at)}m ago</span></td>
                      <td style={{ padding: 8 }}>{o.fulfillment_method?.replace(/_/g, ' ')}</td>
                      <td style={{ padding: 8 }}>{o.item_count} / {o.total_quantity}</td>
                      <td style={{ padding: 8 }}>{fmtCents(o.total_cents)}</td>
                      <td style={{ padding: 8 }}>{o.payment_status?.replace(/_/g, ' ')}</td>
                      <td style={{ padding: 8, color: STATUS_COLOR[o.fulfillment_status] }}>{STATUS_LABEL[o.fulfillment_status] || o.fulfillment_status}</td>
                      <td style={{ padding: 8 }}>{o.assigned_staff_id || <em style={{ opacity: 0.5 }}>unassigned</em>}</td>
                      <td style={{ padding: 8 }}>
                        <button type="button" onClick={() => navigate(`/smokecraft/admin/humidor/orders/${o.order_id}`)}
                          style={{ minHeight: 32, padding: '4px 10px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
