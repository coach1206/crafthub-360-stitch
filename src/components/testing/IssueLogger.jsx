/**
 * IssueLogger — Phase 12
 * Form to log issues during or after a live venue test.
 */

import { useState } from 'react'
import { SEVERITY_LEVELS, ISSUE_TYPES } from '../../config/testModeConfig.js'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'

export default function IssueLogger({ venueTestId, onIssueLogged }) {
  const [description, setDescription] = useState('')
  const [issueType,   setIssueType]   = useState('other')
  const [screenName,  setScreenName]  = useState('')
  const [severity,    setSeverity]    = useState('medium')
  const [saving,      setSaving]      = useState(false)
  const [lastLogged,  setLastLogged]  = useState(null)
  const [expanded,    setExpanded]    = useState(true)

  async function save() {
    if (!description.trim() || !venueTestId) return
    setSaving(true)
    try {
      const r = await fetch('/api/venue-test/issue', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ venueTestId, issueType, screenName, description: description.trim(), severity }),
      })
      const d = await r.json()
      if (d.success) {
        setLastLogged(d.data)
        setDescription('')
        setScreenName('')
        if (onIssueLogged) onIssueLogged(d.data)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${GOLD}18`, borderRadius: '10px', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: `${GOLD}44`, textTransform: 'uppercase' }}>Issue Logger</span>
        <span style={{ color: `${GOLD}55`, fontSize: '0.75rem' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          {/* Severity — quick select first */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {SEVERITY_LEVELS.map(s => (
              <button
                key={s.value}
                onClick={() => setSeverity(s.value)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '5px', fontSize: '0.72rem',
                  fontFamily: 'Georgia, serif', letterSpacing: '0.1em', cursor: 'pointer',
                  border: `1px solid ${severity === s.value ? s.color : `${GOLD}22`}`,
                  background: severity === s.value ? `${s.color}18` : 'transparent',
                  color: severity === s.value ? s.color : `${GOLD}44`,
                  fontWeight: severity === s.value ? 600 : 400,
                  minHeight: '40px',
                }}
              >{s.label}</button>
            ))}
          </div>

          {/* Issue type */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, letterSpacing: '0.1em', marginBottom: '0.35rem' }}>Type</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ISSUE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setIssueType(t.value)}
                  style={{
                    padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem',
                    fontFamily: 'Georgia, serif', cursor: 'pointer', border: 'none',
                    background: issueType === t.value ? `${GOLD}22` : 'transparent',
                    color: issueType === t.value ? GOLD : `${GOLD}55`,
                    minHeight: '32px',
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>

          {/* Screen */}
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              value={screenName}
              onChange={e => setScreenName(e.target.value)}
              placeholder="Screen / location (optional)"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
                color: GOLD, padding: '0.6rem 0.75rem', borderRadius: '6px',
                fontFamily: 'Georgia, serif', fontSize: '0.8rem',
              }}
            />
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue — what happened, what was expected, any error messages…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
              color: GOLD, padding: '0.6rem 0.75rem', borderRadius: '6px',
              fontFamily: 'Georgia, serif', fontSize: '0.8rem', lineHeight: 1.5,
              marginBottom: '0.75rem',
            }}
          />

          <button
            onClick={save}
            disabled={!description.trim() || saving || !venueTestId}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '6px',
              background: description.trim() && venueTestId ? '#f97316' : 'rgba(249,115,22,0.15)',
              color: description.trim() && venueTestId ? '#fff' : 'rgba(249,115,22,0.4)',
              border: 'none', fontFamily: 'Georgia, serif', fontSize: '0.78rem',
              letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
              fontWeight: 600, minHeight: '48px',
            }}
          >{saving ? 'Logging…' : 'Log Issue'}</button>

          {lastLogged && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(249,115,22,0.08)', borderRadius: '6px', fontSize: '0.72rem', color: '#f97316' }}>
              ✓ Issue logged — {lastLogged.severity} · {lastLogged.issue_type}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
