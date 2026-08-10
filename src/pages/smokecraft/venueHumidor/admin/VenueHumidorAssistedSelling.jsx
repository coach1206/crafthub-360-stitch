import { useState } from 'react'
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

const inputStyle = { minHeight: 44, padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', width: '100%' }
function genKey(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
function fieldLabel(v) { return String(v || '').replace(/_/g, ' ') }

export default function VenueHumidorAssistedSelling() {
  const navigate = useNavigate()
  const [venueId, setVenueId] = useAdminVenueId()
  const [customerReference, setCustomerReference] = useState('')
  const [preferredStrength, setPreferredStrength] = useState('')
  const [preferredBody, setPreferredBody] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [state, setState] = useState('idle')
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState([])
  const [outcomeMsg, setOutcomeMsg] = useState('')

  async function runRecommendations() {
    if (!venueId) { setState('no_venue'); return }
    setState('loading')
    const preferences = { preferredStrength: preferredStrength || undefined, preferredBody: preferredBody || undefined, budgetMaxCents: priceMax ? Number(priceMax) * 100 : undefined }
    const result = await api.getAssistedRecommendations(venueId, customerReference || null, preferences, null)
    if (!result.ok) { setState(result.status === 403 ? 'unauthorized' : result.status === 401 ? 'session_expired' : 'error'); return }
    setData(result)
    setState(result.results.length === 0 ? 'empty' : 'ready')
  }

  function toggleCompare(productId) {
    setSelected(s => s.includes(productId) ? s.filter(id => id !== productId) : (s.length < 2 ? [...s, productId] : s))
  }

  async function recordOutcome(productId, outcome) {
    const result = await api.recordAssistedSellingOutcome(venueId, productId, outcome, customerReference || null, '', genKey('assisted'))
    setOutcomeMsg(result.ok ? `Recorded: ${outcome}` : 'Failed to record outcome')
  }

  const compared = data?.results?.filter(r => selected.includes(r.productId)) || []

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1000, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/admin/humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← Admin Dashboard</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }}>Assisted Selling</h1>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 16, display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 12 }}>Venue ID
              <input value={venueId} onChange={e => setVenueId(e.target.value)} style={inputStyle} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
              <label style={{ fontSize: 12 }}>Customer reference (optional)
                <input value={customerReference} onChange={e => setCustomerReference(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ fontSize: 12 }}>Preferred strength
                <select value={preferredStrength} onChange={e => setPreferredStrength(e.target.value)} style={inputStyle}>
                  <option value="">Any</option>
                  {['mild', 'mild_medium', 'medium', 'medium_full', 'full'].map(s => <option key={s} value={s}>{fieldLabel(s)}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12 }}>Preferred body
                <select value={preferredBody} onChange={e => setPreferredBody(e.target.value)} style={inputStyle}>
                  <option value="">Any</option>
                  {['light', 'light_medium', 'medium', 'medium_full', 'full'].map(b => <option key={b} value={b}>{fieldLabel(b)}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12 }}>Max price ($)
                <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} style={inputStyle} />
              </label>
            </div>
            <button type="button" onClick={runRecommendations} style={{ minHeight: 44, padding: '8px 20px', borderRadius: 18, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', justifySelf: 'start' }}>Get Recommendations</button>
          </div>

          {state === 'no_venue' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Enter a venue ID.</p>}
          {state === 'unauthorized' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You do not have access to this venue.</p>}
          {state === 'session_expired' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Session expired.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Recommendation service unavailable. <button type="button" onClick={runRecommendations} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}
          {state === 'empty' && <p style={{ fontSize: 13 }}>No eligible products match these filters right now.</p>}
          {outcomeMsg && <p role="status" style={{ fontSize: 12, color: OK }}>{outcomeMsg}</p>}

          {state === 'ready' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
              {data.results.map(r => (
                <div key={r.productId} style={{ background: GLASS, border: `1px solid ${selected.includes(r.productId) ? GOLD : BORDER}`, borderRadius: 10, padding: 12, display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{r.brand}</div>
                  <div style={{ color: GOLD, fontSize: 14 }}>{r.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>{fieldLabel(r.vitola)} · {fieldLabel(r.strength)} · {fieldLabel(r.body)} · {r.availableQuantity} available</div>
                  <div style={{ fontSize: 13, color: OK }}>${(r.priceCents / 100).toFixed(2)} · Score {r.score}</div>
                  <div style={{ fontSize: 11 }}>{r.reasons?.join('; ')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => toggleCompare(r.productId)} style={{ minHeight: 36, padding: '4px 10px', borderRadius: 12, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{selected.includes(r.productId) ? 'Remove from compare' : 'Compare'}</button>
                    <button type="button" onClick={() => recordOutcome(r.productId, 'accepted')} style={{ minHeight: 36, padding: '4px 10px', borderRadius: 12, border: `1px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Accepted</button>
                    <button type="button" onClick={() => recordOutcome(r.productId, 'declined')} style={{ minHeight: 36, padding: '4px 10px', borderRadius: 12, border: `1px solid ${DANGER}`, background: 'transparent', color: DANGER, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Declined</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {compared.length === 2 && (
            <div style={{ marginTop: 20 }}>
              <h2 style={{ fontSize: 14, color: GOLD }}>Comparison</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflowX: 'auto' }}>
                {compared.map(r => (
                  <div key={r.productId} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10, fontSize: 12 }}>
                    <div style={{ color: GOLD }}>{r.name}</div>
                    <div>Strength: {fieldLabel(r.strength)}</div>
                    <div>Body: {fieldLabel(r.body)}</div>
                    <div>Price: ${(r.priceCents / 100).toFixed(2)}</div>
                    <div>Available: {r.availableQuantity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
