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

export default function VenueHumidorMyAcquisitions() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [acquisitions, setAcquisitions] = useState([])

  async function load() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.listMyAcquisitions()
    if (!result.ok) { setState(result.status === 401 ? 'session_expired' : 'error'); return }
    setAcquisitions(result.acquisitions)
    setState(result.acquisitions.length === 0 ? 'empty' : 'ready')
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/orders')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← My Orders</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }}>My Passport — Venue Humidor Acquisitions</h1>

          {state === 'offline' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You appear to be offline. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'session_expired' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Your session has expired. Please refresh.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Unable to load your Passport right now. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}
          {state === 'empty' && <p style={{ fontSize: 13 }}>No verified cigar acquisitions yet — they appear here after a completed Venue Humidor order.</p>}

          {state === 'ready' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {acquisitions.map(a => (
                <div key={a.acquisition_id} onClick={() => navigate(`/smokecraft/passport/acquisitions/${a.acquisition_id}`)} role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/smokecraft/passport/acquisitions/${a.acquisition_id}`)}
                  style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, cursor: 'pointer' }}>
                  <div style={{ width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
                    {a.primary_image_url && <img src={a.primary_image_url} alt={a.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{a.brand}</div>
                  <div style={{ fontSize: 14, color: GOLD }}>{a.product_name}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{a.venue_name} · {new Date(a.acquired_at).toLocaleDateString()}</div>
                  <div style={{ fontSize: 11, color: OK, marginTop: 4 }}>✓ Verified fulfillment</div>
                  {a.rating && <div style={{ fontSize: 11, marginTop: 2 }}>{'★'.repeat(a.rating)}{'☆'.repeat(5 - a.rating)}</div>}
                  {a.is_smoked && <div style={{ fontSize: 11, opacity: 0.7 }}>Smoked</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
