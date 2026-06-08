/**
 * ObserverNotePanel — Phase 12
 * Quick-capture form for observer notes during a live venue test.
 */

import { useState } from 'react'
import { SEVERITY_LEVELS } from '../../config/testModeConfig.js'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'

const SCREEN_SUGGESTIONS = [
  'Boot', 'Home', 'CraftHub', 'SmokeCraft', 'Mentor Selection',
  'Origins', 'Leaves', 'FlavorDNA', 'Blend', 'SessionComplete',
  'PassportStamp', 'Leaderboard', 'POS3', 'EATCommand', 'KioskSetup', 'Other',
]

export default function ObserverNotePanel({ venueTestId, onNoteAdded }) {
  const [note,       setNote]       = useState('')
  const [screen,     setScreen]     = useState('')
  const [severity,   setSeverity]   = useState('low')
  const [eventType,  setEventType]  = useState('observation')
  const [saving,     setSaving]     = useState(false)
  const [lastSaved,  setLastSaved]  = useState(null)

  async function save() {
    if (!note.trim() || !venueTestId) return
    setSaving(true)
    try {
      const r = await fetch('/api/venue-test/observer-note', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          venueTestId,
          screenName: screen || 'unknown',
          eventType,
          note: note.trim(),
          severity,
        }),
      })
      const d = await r.json()
      if (d.success) {
        setLastSaved(d.data)
        setNote('')
        if (onNoteAdded) onNoteAdded(d.data)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${GOLD}18`, borderRadius: '10px', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '1rem' }}>Observer Note</div>

      {/* Screen */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.7rem', color: `${GOLD}66`, marginBottom: '0.35rem', letterSpacing: '0.1em' }}>Screen / Location</div>
        <input
          list="screen-suggestions"
          value={screen}
          onChange={e => setScreen(e.target.value)}
          placeholder="e.g. SmokeCraft, POS3, Home…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
            color: GOLD, padding: '0.6rem 0.75rem', borderRadius: '6px',
            fontFamily: 'Georgia, serif', fontSize: '0.82rem',
          }}
        />
        <datalist id="screen-suggestions">
          {SCREEN_SUGGESTIONS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      {/* Event type */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {['observation','confusion','excitement','question','task_failed','task_completed'].map(et => (
          <button
            key={et}
            onClick={() => setEventType(et)}
            style={{
              padding: '0.35rem 0.7rem', borderRadius: '4px', fontSize: '0.68rem',
              letterSpacing: '0.07em', cursor: 'pointer', border: 'none',
              background: eventType === et ? `${GOLD}22` : 'transparent',
              color: eventType === et ? GOLD : `${GOLD}55`,
              fontFamily: 'Georgia, serif',
            }}
          >{et.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Note textarea */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="What did you observe? Be specific — screen name, what happened, what the participant said or did…"
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical',
          background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
          color: GOLD, padding: '0.6rem 0.75rem', borderRadius: '6px',
          fontFamily: 'Georgia, serif', fontSize: '0.82rem', lineHeight: 1.5,
          marginBottom: '0.75rem',
        }}
      />

      {/* Severity */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: `${GOLD}55`, letterSpacing: '0.1em', marginRight: '0.25rem' }}>Severity</span>
        {SEVERITY_LEVELS.map(s => (
          <button
            key={s.value}
            onClick={() => setSeverity(s.value)}
            style={{
              padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.68rem',
              fontFamily: 'Georgia, serif', letterSpacing: '0.07em', cursor: 'pointer',
              border: `1px solid ${severity === s.value ? s.color : 'transparent'}`,
              background: severity === s.value ? `${s.color}18` : 'transparent',
              color: severity === s.value ? s.color : `${GOLD}44`,
              minHeight: '32px',
            }}
          >{s.label}</button>
        ))}
      </div>

      <button
        onClick={save}
        disabled={!note.trim() || saving || !venueTestId}
        style={{
          width: '100%', padding: '0.75rem', borderRadius: '6px',
          background: note.trim() && venueTestId ? GOLD : `${GOLD}22`,
          color: note.trim() && venueTestId ? DARK : `${GOLD}44`,
          border: 'none', fontFamily: 'Georgia, serif', fontSize: '0.78rem',
          letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
          fontWeight: 600, minHeight: '48px',
        }}
      >{saving ? 'Saving…' : 'Save Note'}</button>

      {lastSaved && (
        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(74,222,128,0.08)', borderRadius: '6px', fontSize: '0.72rem', color: '#4ade80' }}>
          ✓ Saved — {lastSaved.screen_name} · {lastSaved.severity}
        </div>
      )}
    </div>
  )
}
