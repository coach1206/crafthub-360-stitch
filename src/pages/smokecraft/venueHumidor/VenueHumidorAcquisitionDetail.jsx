import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

function genKey(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
const field = (label, value) => value ? <div><strong style={{ opacity: 0.7 }}>{label}:</strong> {value}</div> : <div style={{ opacity: 0.5 }}><strong>{label}:</strong> unknown</div>

export default function VenueHumidorAcquisitionDetail() {
  const navigate = useNavigate()
  const { acquisitionId } = useParams()
  const [state, setState] = useState('loading')
  const [acquisition, setAcquisition] = useState(null)
  const [rating, setRating] = useState(0)
  const [tastingNote, setTastingNote] = useState('')
  const [saveState, setSaveState] = useState('idle')

  async function load() {
    setState('loading')
    const result = await api.getMyAcquisitionDetail(acquisitionId)
    if (!result.ok) {
      setState(result.status === 404 ? 'not_found' : result.status === 403 ? 'unauthorized' : 'error')
      return
    }
    setAcquisition(result.acquisition)
    setRating(result.acquisition.rating || 0)
    setTastingNote(result.acquisition.tasting_note || '')
    setState('ready')
  }
  useEffect(() => { load() }, [acquisitionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveRating(newRating) {
    setSaveState('saving')
    const result = await api.saveAcquisitionNote(acquisitionId, { rating: newRating }, genKey('rating'))
    if (!result.ok) { setSaveState('failed'); return }
    setRating(newRating)
    setSaveState('saved')
    await load()
  }
  async function handleSaveNote() {
    setSaveState('saving')
    const result = await api.saveAcquisitionNote(acquisitionId, { tastingNote }, genKey('note'))
    if (!result.ok) { setSaveState('failed'); return }
    setSaveState('saved')
    await load()
  }
  async function handleMarkSmoked() {
    setSaveState('saving')
    const result = await api.saveAcquisitionNote(acquisitionId, { isSmoked: true }, genKey('smoked'))
    if (!result.ok) { setSaveState('failed'); return }
    setSaveState('saved')
    await load()
  }

  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading acquisition…" />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This acquisition could not be found." />
  if (state === 'unauthorized') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="This acquisition does not belong to your account." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this acquisition right now." onRetry={load} />

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 700, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/passport/acquisitions')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>← My Passport</button>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
              {acquisition.primary_image_url && <img src={acquisition.primary_image_url} alt={acquisition.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{acquisition.brand}</div>
              <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,24px)', margin: '2px 0' }}>{acquisition.name}</h1>
              <div style={{ fontSize: 12, color: OK }}>✓ Verified fulfillment</div>
            </div>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 6, fontSize: 13 }}>
            <div>Acquired from: {acquisition.venue_name} ({acquisition.venue_city || 'unknown location'})</div>
            <div>Acquired on: {new Date(acquisition.acquired_at).toLocaleDateString()}</div>
            <div>Quantity: {acquisition.quantity}</div>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Cigar Details</h2>
            <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              {field('Country', acquisition.country)}
              {field('Wrapper', acquisition.wrapper)}
              {field('Binder', acquisition.binder)}
              {field('Filler', acquisition.filler)}
              {field('Vitola', acquisition.vitola)}
              {field('Strength', acquisition.strength)}
              {field('Body', acquisition.body)}
              {field('Smoke time', acquisition.smoke_time_minutes ? `${acquisition.smoke_time_minutes} min` : null)}
              {field('Flavor notes', (acquisition.flavor_notes || []).join(', ') || null)}
              {field('Venue notes', acquisition.venue_description)}
            </div>
            <button type="button" onClick={() => navigate('/smokecraft/pairing')} style={{ minHeight: 40, marginTop: 10, padding: '6px 16px', borderRadius: 16, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>View Pairing Suggestions</button>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Your Rating</h2>
            <div role="radiogroup" aria-label="Rate this cigar" style={{ display: 'flex', gap: 4, fontSize: 24 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" role="radio" aria-checked={rating >= n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  onClick={() => handleSaveRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rating >= n ? GOLD : 'rgba(229,226,225,0.3)', minWidth: 44, minHeight: 44 }}>★</button>
              ))}
            </div>

            <label htmlFor="tastingNote" style={{ display: 'block', fontSize: 12, marginTop: 12, marginBottom: 4 }}>Your tasting notes</label>
            <textarea id="tastingNote" value={tastingNote} onChange={e => setTastingNote(e.target.value)}
              style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }} />
            <button type="button" disabled={saveState === 'saving'} onClick={handleSaveNote} style={{ minHeight: 40, marginTop: 8, padding: '6px 16px', borderRadius: 16, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Save Note</button>

            {acquisition.is_smoked
              ? <p style={{ fontSize: 12, color: OK, marginTop: 10 }}>Marked as smoked{acquisition.smoked_at ? ` on ${new Date(acquisition.smoked_at).toLocaleDateString()}` : ''}.</p>
              : <button type="button" disabled={saveState === 'saving'} onClick={handleMarkSmoked} style={{ minHeight: 40, marginTop: 10, padding: '6px 16px', borderRadius: 16, border: `1px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Mark as Smoked</button>}
            {saveState === 'failed' && <p role="alert" style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>Unable to save right now.</p>}
          </div>
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
