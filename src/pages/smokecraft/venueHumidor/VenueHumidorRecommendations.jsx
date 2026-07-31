import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftJourney } from '../../../context/SmokeCraftJourneyContext.jsx'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { PAIRING_CATEGORIES } from '../../../utils/pairingEngine.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

function genKey(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

const STRENGTHS = ['mild', 'mild_medium', 'medium', 'medium_full', 'full']
const BODIES = ['light', 'light_medium', 'medium', 'medium_full', 'full']
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'experienced']

function fieldLabel(v) { return String(v || '').replace(/_/g, ' ') }

export function RecommendationCard({ r, onOpen, onOutcome }) {
  return (
    <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
          {r.primaryImageUrl && <img src={r.primaryImageUrl} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{r.brand}</div>
          <button type="button" onClick={() => onOpen(r.productId)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: GOLD, fontSize: 15, fontFamily: 'inherit', textAlign: 'left' }}>{r.name}</button>
          <div style={{ fontSize: 11, opacity: 0.65 }}>{fieldLabel(r.vitola)} · {fieldLabel(r.strength)} · {fieldLabel(r.body)}</div>
          <div style={{ fontSize: 13, color: OK }}>${(r.priceCents / 100).toFixed(2)}</div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, textAlign: 'right' }}>Score {r.score}<br />{r.confidence} confidence</div>
      </div>
      {r.reasons?.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: OK }}>
          {r.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
        </ul>
      )}
      {r.cautions?.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: GOLD }}>
          {r.cautions.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => { onOutcome?.(r.productId, 'accepted'); onOpen(r.productId) }} style={{ minHeight: 36, padding: '4px 12px', borderRadius: 14, border: `1px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>View & Add</button>
        <button type="button" onClick={() => onOutcome?.(r.productId, 'declined')} style={{ minHeight: 36, padding: '4px 12px', borderRadius: 14, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Not for me</button>
      </div>
    </div>
  )
}

export default function VenueHumidorRecommendations({ pairingMode = false }) {
  const navigate = useNavigate()
  const { journey } = useSmokeCraftJourney()
  const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null

  const [preferences, setPreferences] = useState({ preferredStrength: '', preferredBody: '', flavorFamilies: [], experienceLevel: '', smokingDurationPref: '', budgetMinCents: '', budgetMaxCents: '' })
  const [beverageCategory, setBeverageCategory] = useState('')
  const [state, setState] = useState('idle')
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!venueId) { setState('no_venue'); return }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
  }, [venueId])

  async function runRecommendations() {
    if (!venueId) { setState('no_venue'); return }
    setState('loading')
    const payload = {
      ...preferences,
      smokingDurationPref: preferences.smokingDurationPref ? Number(preferences.smokingDurationPref) : null,
      budgetMinCents: preferences.budgetMinCents ? Number(preferences.budgetMinCents) * 100 : null,
      budgetMaxCents: preferences.budgetMaxCents ? Number(preferences.budgetMaxCents) * 100 : null,
    }
    const result = await api.getRecommendations(venueId, payload, beverageCategory || null, genKey('rec'))
    if (!result.ok) { setState(result.status === 401 ? 'session_expired' : 'error'); return }
    setData(result)
    setState(result.results.length === 0 ? 'empty' : 'ready')
  }

  async function handleOutcome(productId, outcome) {
    if (!venueId) return
    await api.recordRecommendationOutcome(venueId, productId, outcome, genKey('outcome'))
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/venue-humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← Humidor</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>{pairingMode ? 'Cigar & Beverage Pairing' : 'Recommended For You'}</h1>
          <p style={{ fontSize: 12, opacity: 0.65, margin: '0 0 16px' }}>
            {data ? (data.signalsUsed?.coldStart ? 'Based on the answers you selected below — no purchase history yet.' : 'Based on your selected answers and your purchase history.') : 'Answer a few questions to get started, or run recommendations with no preferences for a general view.'}
          </p>

          {state === 'no_venue' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Select a venue first to see inventory-aware recommendations.</p>}
          {state === 'offline' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You appear to be offline.</p>}
          {state === 'session_expired' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Your session has expired. Please refresh.</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>The recommendation service is unavailable right now. <button type="button" onClick={runRecommendations} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}

          {venueId && (
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 16, display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
                <label style={{ fontSize: 12 }}>Strength
                  <select value={preferences.preferredStrength} onChange={e => setPreferences(p => ({ ...p, preferredStrength: e.target.value }))} style={{ width: '100%', minHeight: 40, marginTop: 4, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
                    <option value="">Any</option>
                    {STRENGTHS.map(s => <option key={s} value={s}>{fieldLabel(s)}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>Body
                  <select value={preferences.preferredBody} onChange={e => setPreferences(p => ({ ...p, preferredBody: e.target.value }))} style={{ width: '100%', minHeight: 40, marginTop: 4, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
                    <option value="">Any</option>
                    {BODIES.map(b => <option key={b} value={b}>{fieldLabel(b)}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>Experience level
                  <select value={preferences.experienceLevel} onChange={e => setPreferences(p => ({ ...p, experienceLevel: e.target.value }))} style={{ width: '100%', minHeight: 40, marginTop: 4, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
                    <option value="">Any</option>
                    {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{fieldLabel(l)}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>Beverage pairing
                  <select value={beverageCategory} onChange={e => setBeverageCategory(e.target.value)} style={{ width: '100%', minHeight: 40, marginTop: 4, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
                    <option value="">None</option>
                    {PAIRING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>Smoking duration (min)
                  <input type="number" value={preferences.smokingDurationPref} onChange={e => setPreferences(p => ({ ...p, smokingDurationPref: e.target.value }))} style={{ width: '100%', minHeight: 40, marginTop: 4, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontSize: 12 }}>Budget min ($)
                  <input type="number" value={preferences.budgetMinCents} onChange={e => setPreferences(p => ({ ...p, budgetMinCents: e.target.value }))} style={{ width: '100%', minHeight: 40, marginTop: 4, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontSize: 12 }}>Budget max ($)
                  <input type="number" value={preferences.budgetMaxCents} onChange={e => setPreferences(p => ({ ...p, budgetMaxCents: e.target.value }))} style={{ width: '100%', minHeight: 40, marginTop: 4, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: 'border-box' }} />
                </label>
              </div>
              <button type="button" onClick={runRecommendations} style={{ minHeight: 44, padding: '8px 20px', borderRadius: 18, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', justifySelf: 'start' }}>Get Recommendations</button>
            </div>
          )}

          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading recommendations…</p>}
          {state === 'empty' && <p style={{ fontSize: 13 }}>No matching recommendations right now — try adjusting your preferences.</p>}

          {beverageCategory && data && data.beverageDataAvailable === false && (
            <p role="status" style={{ fontSize: 12, color: GOLD }}>Beverage pairing data is unavailable for this category — results below are based on cigar preferences only.</p>
          )}

          {state === 'ready' && (
            <div style={{ display: 'grid', gap: 10 }}>
              {data.results.map(r => <RecommendationCard key={r.productId} r={r} onOpen={id => navigate(`/smokecraft/venue-humidor/${id}`)} onOutcome={handleOutcome} />)}
            </div>
          )}

          {data?.outOfStock?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h2 style={{ fontSize: 14, color: GOLD }}>Currently Unavailable</h2>
              {data.outOfStock.map(o => (
                <div key={o.productId} style={{ fontSize: 12, opacity: 0.7, padding: '4px 0' }}>{o.name} — {o.reason.replace(/_/g, ' ')}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
