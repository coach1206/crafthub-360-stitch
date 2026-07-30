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

const inputStyle = { minHeight: 40, padding: '6px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 12 }

const EVENT_TYPES = [
  'receiving', 'box_opened', 'stick_added', 'stick_removed', 'damage', 'loss', 'complimentary',
  'return', 'count_correction', 'reservation_created', 'reservation_released', 'reservation_fulfilled',
  'hold_created', 'hold_expired', 'hold_released', 'sale_completed', 'cancellation_restored',
]

export default function VenueHumidorAdminInventoryEvents() {
  const navigate = useNavigate()
  const [venueId] = useAdminVenueId()
  const [state, setState] = useState('loading')
  const [events, setEvents] = useState([])
  const [productId, setProductId] = useState('')
  const [eventType, setEventType] = useState('')
  const [actorId, setActorId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    setState('loading')
    const result = await api.listInventoryEvents(venueId, { productId, eventType, actorId, from, to })
    if (!result.ok) { setState(result.status === 403 ? 'unauthorized' : 'error'); return }
    setEvents(result.events)
    setState('ready')
  }
  useEffect(() => { load() }, [venueId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/admin/humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Dashboard</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }}>Inventory Event History</h1>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <input aria-label="Filter by product ID" placeholder="Product ID" value={productId} onChange={e => setProductId(e.target.value)} style={inputStyle} />
            <select aria-label="Filter by event type" value={eventType} onChange={e => setEventType(e.target.value)} style={inputStyle}>
              <option value="">All event types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input aria-label="Filter by actor" placeholder="Actor ID" value={actorId} onChange={e => setActorId(e.target.value)} style={inputStyle} />
            <input aria-label="From date" type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
            <input aria-label="To date" type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
            <button type="button" onClick={load} style={{ minHeight: 40, padding: '6px 16px', borderRadius: 16, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Filter</button>
          </div>

          {state === 'no_venue' && <p style={{ fontSize: 13 }}>Set a venue ID on the dashboard first.</p>}
          {state === 'unauthorized' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You do not have permission to view this history.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Unable to load event history right now. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}

          {state === 'ready' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: 8 }}>Timestamp</th>
                    <th style={{ padding: 8 }}>Event Type</th>
                    <th style={{ padding: 8 }}>Product</th>
                    <th style={{ padding: 8 }}>Before</th>
                    <th style={{ padding: 8 }}>Delta</th>
                    <th style={{ padding: 8 }}>After</th>
                    <th style={{ padding: 8 }}>Reason</th>
                    <th style={{ padding: 8 }}>Actor</th>
                    <th style={{ padding: 8 }}>Role</th>
                    <th style={{ padding: 8 }}>Reference</th>
                    <th style={{ padding: 8 }}>Idempotency Key</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.event_id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(e.created_at).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>{e.event_type}</td>
                      <td style={{ padding: 8 }}>{e.product_name} ({e.product_sku})</td>
                      <td style={{ padding: 8 }}>{e.physical_quantity_before}</td>
                      <td style={{ padding: 8 }}>{e.quantity_delta > 0 ? `+${e.quantity_delta}` : e.quantity_delta}</td>
                      <td style={{ padding: 8 }}>{e.physical_quantity_after}</td>
                      <td style={{ padding: 8 }}>{e.reason || '—'}</td>
                      <td style={{ padding: 8 }}>{e.actor_id}</td>
                      <td style={{ padding: 8 }}>{e.actor_role || '—'}</td>
                      <td style={{ padding: 8 }}>{e.reference_type ? `${e.reference_type}:${e.reference_id}` : '—'}</td>
                      <td style={{ padding: 8, fontSize: 10, opacity: 0.7 }}>{e.idempotency_key || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && <p style={{ fontSize: 13, marginTop: 12 }}>No inventory events match these filters.</p>}
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
