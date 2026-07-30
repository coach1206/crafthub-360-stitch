import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

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

export default function VenueHumidorMyOrders() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.listMyOrders({ status: statusFilter, search })
    if (!result.ok) { setState(result.status === 401 ? 'session_expired' : 'error'); return }
    setOrders(result.orders)
    setState(result.orders.length === 0 ? 'empty' : 'ready')
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/venue-humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← Back to Humidor</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>My Orders</h1>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
            <input aria-label="Search orders" placeholder="Order #, venue, cigar" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              style={{ minHeight: 44, flex: '2 1 200px', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
            <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ minHeight: 44, flex: '1 1 160px', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }}>
              <option value="">All</option>
              <option value="active">Active</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button type="button" onClick={load} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
            <button type="button" onClick={() => navigate('/smokecraft/passport/acquisitions')} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>My Passport</button>
          </div>

          {state === 'offline' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You appear to be offline. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'session_expired' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Your session has expired. Please refresh.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Unable to load your orders right now. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}
          {state === 'empty' && <p style={{ fontSize: 13 }}>No orders match the current filters.</p>}

          {state === 'ready' && orders.map(o => (
            <div key={o.order_id} onClick={() => navigate(`/smokecraft/orders/${o.order_id}`)} role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/smokecraft/orders/${o.order_id}`)}
              style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong style={{ color: GOLD }}>{o.order_number}</strong>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{o.venue_name}{o.venue_city ? `, ${o.venue_city}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: STATUS_COLOR[o.fulfillment_status], fontSize: 13 }}>{STATUS_LABEL[o.fulfillment_status] || o.fulfillment_status}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>{o.item_count} item{o.item_count === 1 ? '' : 's'} · Qty {o.total_quantity} · {o.fulfillment_method?.replace(/_/g, ' ')}</span>
                <span>{fmtCents(o.total_cents)}</span>
              </div>
              {o.has_passport_acquisition && <div style={{ fontSize: 11, color: OK, marginTop: 4 }}>✓ Passport acquisition recorded</div>}
            </div>
          ))}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
