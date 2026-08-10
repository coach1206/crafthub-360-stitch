import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../../services/venueHumidor/venueHumidorAdminApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { useAdminVenueId } from './useAdminVenueId.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const DANGER = 'rgba(255,150,150,0.9)'

const inputStyle = { minHeight: 40, padding: '6px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 12 }

const EVENT_TYPES = [
  'order_claimed', 'order_assigned', 'order_confirmed', 'preparation_started',
  'item_picked', 'order_ready', 'order_completed', 'order_cancelled',
  'order_blocked', 'order_unblocked', 'fulfillment_note_added',
]

export default function VenueHumidorFulfillmentHistory() {
  const navigate = useNavigate()
  const [venueId] = useAdminVenueId()
  const [state, setState] = useState('loading')
  const [events, setEvents] = useState([])
  const [orderId, setOrderId] = useState('')
  const [eventType, setEventType] = useState('')
  const [actorId, setActorId] = useState('')

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    setState('loading')
    const result = await api.listFulfillmentHistory(venueId, { orderId, eventType, actorId })
    if (!result.ok) { setState(result.status === 403 ? 'unauthorized' : 'error'); return }
    setEvents(result.events)
    setState('ready')
  }
  useEffect(() => { load() }, [venueId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/admin/humidor/orders')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Queue</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }}>Fulfillment History</h1>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <input aria-label="Filter by order ID" placeholder="Order ID" value={orderId} onChange={e => setOrderId(e.target.value)} style={inputStyle} />
            <select aria-label="Filter by event type" value={eventType} onChange={e => setEventType(e.target.value)} style={inputStyle}>
              <option value="">All event types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input aria-label="Filter by actor" placeholder="Actor ID" value={actorId} onChange={e => setActorId(e.target.value)} style={inputStyle} />
            <button type="button" onClick={load} style={{ minHeight: 40, padding: '6px 16px', borderRadius: 16, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Filter</button>
          </div>

          {state === 'no_venue' && <p style={{ fontSize: 13 }}>Set a venue ID on the queue screen first.</p>}
          {state === 'unauthorized' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You do not have permission to view this history.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Unable to load history right now. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}

          {state === 'ready' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: 8 }}>Timestamp</th>
                    <th style={{ padding: 8 }}>Order #</th>
                    <th style={{ padding: 8 }}>Event Type</th>
                    <th style={{ padding: 8 }}>Previous → New</th>
                    <th style={{ padding: 8 }}>Actor</th>
                    <th style={{ padding: 8 }}>Role</th>
                    <th style={{ padding: 8 }}>Reason / Note</th>
                    <th style={{ padding: 8 }}>Idempotency Key</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.event_id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{new Date(e.created_at).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>{e.order_number}</td>
                      <td style={{ padding: 8 }}>{e.event_type}</td>
                      <td style={{ padding: 8 }}>{e.previous_state || '—'} → {e.new_state || '—'}</td>
                      <td style={{ padding: 8 }}>{e.actor_id}</td>
                      <td style={{ padding: 8 }}>{e.actor_role || '—'}</td>
                      <td style={{ padding: 8 }}>{e.reason || e.staff_note || '—'}</td>
                      <td style={{ padding: 8, fontSize: 10, opacity: 0.7 }}>{e.idempotency_key || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && <p style={{ fontSize: 13, marginTop: 12 }}>No fulfillment events match these filters.</p>}
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
