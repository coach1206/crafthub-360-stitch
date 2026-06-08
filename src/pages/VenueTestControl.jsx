/**
 * VenueTestControl — Phase 12
 * Manager+ only. Full venue testing dashboard.
 * Route: /venue-test
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate }                       from 'react-router-dom'
import { useSecurity }                       from '../context/SecurityContext.jsx'
import TestSessionTimer                      from '../components/testing/TestSessionTimer.jsx'
import ObserverNotePanel                     from '../components/testing/ObserverNotePanel.jsx'
import IssueLogger                           from '../components/testing/IssueLogger.jsx'
import TestProgressChecklist                 from '../components/testing/TestProgressChecklist.jsx'
import { TEST_TYPES, READINESS_LABEL }       from '../config/testModeConfig.js'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'
const SEP  = `1px solid rgba(201,168,76,0.08)`

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children, accent }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${accent || GOLD}18`, borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: `${accent || GOLD}44`, textTransform: 'uppercase', marginBottom: '1rem' }}>{title}</div>
      {children}
    </div>
  )
}

function Btn({ children, onClick, disabled, color = GOLD, size = 'md', fullWidth = false }) {
  const pd = size === 'sm' ? '0.5rem 1rem' : '0.875rem 1.5rem'
  const fs = size === 'sm' ? '0.72rem' : '0.78rem'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: pd, borderRadius: '6px', border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: disabled ? `${color}15` : color === GOLD ? GOLD : color,
        color: disabled ? `${color}44` : color === GOLD ? DARK : '#fff',
        fontFamily: 'Georgia, serif', fontSize: fs, letterSpacing: '0.12em',
        textTransform: 'uppercase', fontWeight: 600, minHeight: '44px',
        width: fullWidth ? '100%' : 'auto',
        transition: 'opacity 0.15s',
      }}
    >{children}</button>
  )
}

function IssueCountBadge({ count, severity }) {
  const colors = { blocker: '#f87171', high: '#f97316', medium: '#fbbf24', low: '#4ade80' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: `${colors[severity]}18`, color: colors[severity],
      border: `1px solid ${colors[severity]}33`,
      borderRadius: '4px', padding: '0.1rem 0.5rem', fontSize: '0.7rem',
      fontFamily: 'monospace', fontWeight: 600, minWidth: '28px',
    }}>{count ?? 0}</span>
  )
}

// ── Export modal ──────────────────────────────────────────────────────────────

function ExportModal({ data, label, onClose }) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{ background: '#0a0603', border: `1px solid ${GOLD}33`, borderRadius: '12px', width: '100%', maxWidth: '680px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: SEP }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', color: `${GOLD}66`, textTransform: 'uppercase' }}>{label}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: `${GOLD}55`, fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
        <pre style={{
          flex: 1, overflow: 'auto', margin: 0, padding: '1.25rem 1.5rem',
          fontFamily: 'monospace', fontSize: '0.72rem', color: `${GOLD}cc`, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{text}</pre>
        <div style={{ padding: '1rem 1.5rem', borderTop: SEP }}>
          <Btn size="sm" onClick={() => { navigator.clipboard?.writeText(text) }}>Copy to Clipboard</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VenueTestControl() {
  const navigate                        = useNavigate()
  const { role, isAdmin, isFounder }    = useSecurity()

  const [status,       setStatus]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [activeTest,   setActiveTest]   = useState(null)
  const [summary,      setSummary]      = useState(null)
  const [issues,       setIssues]       = useState([])
  const [notes,        setNotes]        = useState([])

  // Start test form
  const [venueName,    setVenueName]    = useState('')
  const [testType,     setTestType]     = useState('venue_walkthrough')

  // Session tracking
  const [currentSession, setCurrentSession] = useState(null)
  const [partLabel,    setPartLabel]    = useState('Participant 1')
  const [partType,     setPartType]     = useState('guest')

  // UI
  const [tab,          setTab]          = useState('control')
  const [exportModal,  setExportModal]  = useState(null)
  const [resetting,    setResetting]    = useState(false)
  const [resetMsg,     setResetMsg]     = useState(null)
  const [busyBtn,      setBusyBtn]      = useState(null)

  const canAdmin   = role === 'admin' || role === 'founder_level_0' || isAdmin?.() || isFounder?.()
  const canFounder = role === 'founder_level_0' || isFounder?.()

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/venue-test/status', { credentials: 'include' })
      const d = await r.json()
      if (d.success) {
        setStatus(d.data)
        setActiveTest(d.data.activeTest)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSummary = useCallback(async (vtId) => {
    if (!vtId) return
    const r = await fetch(`/api/venue-test/summary?venueTestId=${vtId}`, { credentials: 'include' })
    const d = await r.json()
    if (d.success) setSummary(d.data)
  }, [])

  const fetchIssues = useCallback(async (vtId) => {
    if (!vtId) return
    const r = await fetch(`/api/venue-test/issues?venueTestId=${vtId}`, { credentials: 'include' })
    const d = await r.json()
    if (d.success) setIssues(d.data)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    if (!activeTest?.venue_test_id) return
    fetchSummary(activeTest.venue_test_id)
    fetchIssues(activeTest.venue_test_id)
  }, [activeTest, fetchSummary, fetchIssues])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleStartTest() {
    if (!venueName.trim()) return
    setBusyBtn('start')
    try {
      const r = await fetch('/api/venue-test/start', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueName: venueName.trim(), testType }),
      })
      const d = await r.json()
      if (d.success) { setActiveTest(d.data); await fetchStatus() }
    } finally { setBusyBtn(null) }
  }

  async function handleEndTest() {
    if (!activeTest?.venue_test_id) return
    setBusyBtn('end')
    try {
      const r = await fetch('/api/venue-test/end', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueTestId: activeTest.venue_test_id }),
      })
      const d = await r.json()
      if (d.success) { setActiveTest(null); setSummary(null); setCurrentSession(null); await fetchStatus() }
    } finally { setBusyBtn(null) }
  }

  async function handleStartSession() {
    if (!activeTest?.venue_test_id) return
    setBusyBtn('session_start')
    try {
      const r = await fetch('/api/venue-test/session/start', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueTestId: activeTest.venue_test_id, participantLabel: partLabel, participantType: partType }),
      })
      const d = await r.json()
      if (d.success) setCurrentSession(d.data)
    } finally { setBusyBtn(null) }
  }

  async function handleEndSession(status = 'completed') {
    if (!currentSession?.id) return
    setBusyBtn('session_end')
    try {
      await fetch('/api/venue-test/session/end', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.id, completionStatus: status }),
      })
      setCurrentSession(null)
      await fetchSummary(activeTest?.venue_test_id)
    } finally { setBusyBtn(null) }
  }

  async function handleReset() {
    if (!canAdmin || !activeTest?.venue_test_id) return
    setResetting(true); setResetMsg(null)
    try {
      const r = await fetch('/api/venue-test/reset-demo-data', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueTestId: activeTest.venue_test_id }),
      })
      const d = await r.json()
      if (d.success) setResetMsg(`Reset complete — ${d.data.cleared.length} item(s) cleared`)
      else           setResetMsg(`Reset failed: ${d.message}`)
    } finally { setResetting(false) }
  }

  async function handleExportJson() {
    if (!activeTest?.venue_test_id) return
    setBusyBtn('export_json')
    try {
      const r = await fetch(`/api/venue-test/export/json?venueTestId=${activeTest.venue_test_id}`, { credentials: 'include' })
      const d = await r.json()
      if (d.success) setExportModal({ data: d.data, label: 'Full Export — JSON' })
    } finally { setBusyBtn(null) }
  }

  async function handleExportCsv(type = 'summary') {
    if (!activeTest?.venue_test_id) return
    setBusyBtn(`export_csv_${type}`)
    try {
      const r = await fetch(`/api/venue-test/export/csv?venueTestId=${activeTest.venue_test_id}&type=${type}`, { credentials: 'include' })
      const d = await r.json()
      if (d.success) setExportModal({ data: type === 'full' ? JSON.stringify(d.data, null, 2) : d.data.csv, label: `Export CSV — ${type}` })
    } finally { setBusyBtn(null) }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const readiness = summary ? READINESS_LABEL(summary.readinessScore) : null

  const TABS = [
    { key: 'control',   label: 'Control' },
    { key: 'notes',     label: 'Notes' },
    { key: 'issues',    label: `Issues${issues.length ? ` (${issues.length})` : ''}` },
    { key: 'checklist', label: 'Checklist' },
    { key: 'summary',   label: 'Summary' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: DARK, color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.5 }}>Loading venue test system…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: DARK, color: GOLD, fontFamily: 'Georgia, serif', padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: `${GOLD}55`, fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', padding: 0, marginBottom: '0.75rem', display: 'block', textTransform: 'uppercase' }}>← Back</button>
            <div style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '0.35rem' }}>NOVEE OS · Phase 12</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 400, letterSpacing: '0.05em', lineHeight: 1.2 }}>Venue Test Control</h1>
          </div>

          {/* Live status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTest ? '#4ade80' : `${GOLD}33`, boxShadow: activeTest ? '0 0 8px #4ade80' : 'none' }} />
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: activeTest ? '#4ade80' : `${GOLD}44` }}>
              {activeTest ? `Live: ${activeTest.venue_name}` : 'No Active Test'}
            </span>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '0.5rem 1rem', borderRadius: '5px', fontSize: '0.7rem',
              fontFamily: 'Georgia, serif', letterSpacing: '0.1em', cursor: 'pointer',
              border: `1px solid ${tab === t.key ? GOLD : `${GOLD}22`}`,
              background: tab === t.key ? `${GOLD}12` : 'transparent',
              color: tab === t.key ? GOLD : `${GOLD}55`,
              minHeight: '36px',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── TAB: CONTROL ───────────────────────────────────────────────── */}
        {tab === 'control' && (
          <>
            {/* Start / active test card */}
            {!activeTest ? (
              <Section title="Start Venue Test">
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Venue Name</div>
                  <input
                    value={venueName}
                    onChange={e => setVenueName(e.target.value)}
                    placeholder="e.g. SmokeCraft at The Venue"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
                      color: GOLD, padding: '0.7rem 0.875rem', borderRadius: '7px',
                      fontFamily: 'Georgia, serif', fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Test Type</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {TEST_TYPES.map(t => (
                      <button key={t.value} onClick={() => setTestType(t.value)} style={{
                        padding: '0.45rem 0.9rem', borderRadius: '5px', fontSize: '0.7rem',
                        fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: '36px',
                        border: `1px solid ${testType === t.value ? GOLD : `${GOLD}22`}`,
                        background: testType === t.value ? `${GOLD}12` : 'transparent',
                        color: testType === t.value ? GOLD : `${GOLD}55`,
                      }}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <Btn onClick={handleStartTest} disabled={!venueName.trim() || busyBtn === 'start'} color="#4ade80" fullWidth>
                  {busyBtn === 'start' ? 'Starting…' : 'Start Venue Test'}
                </Btn>
              </Section>
            ) : (
              <Section title="Active Test" accent="#4ade80">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: `${GOLD}44`, letterSpacing: '0.12em', marginBottom: '0.2rem' }}>Venue</div>
                    <div style={{ fontSize: '0.88rem', color: GOLD }}>{activeTest.venue_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: `${GOLD}44`, letterSpacing: '0.12em', marginBottom: '0.2rem' }}>Type</div>
                    <div style={{ fontSize: '0.82rem', color: GOLD }}>{activeTest.test_type?.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: `${GOLD}44`, letterSpacing: '0.12em', marginBottom: '0.2rem' }}>Test ID</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: `${GOLD}77` }}>{activeTest.venue_test_id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: `${GOLD}44`, letterSpacing: '0.12em', marginBottom: '0.2rem' }}>Sessions</div>
                    <div style={{ fontSize: '0.88rem', color: GOLD }}>{summary?.totalSessions ?? '—'} / {summary?.completedGuestJourneys ?? '—'} completed</div>
                  </div>
                </div>
                <button
                  onClick={handleEndTest}
                  disabled={busyBtn === 'end'}
                  style={{
                    background: 'transparent', border: `1px solid rgba(248,113,113,0.4)`,
                    color: '#f87171', padding: '0.625rem 1.25rem', borderRadius: '6px',
                    fontFamily: 'Georgia, serif', fontSize: '0.72rem', letterSpacing: '0.12em',
                    textTransform: 'uppercase', cursor: 'pointer', minHeight: '44px',
                  }}
                >{busyBtn === 'end' ? 'Ending…' : 'End Test'}</button>
              </Section>
            )}

            {/* Session tracking */}
            {activeTest && (
              <Section title="Participant Session">
                {!currentSession ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, marginBottom: '0.35rem', letterSpacing: '0.1em' }}>Participant Label</div>
                        <input
                          value={partLabel}
                          onChange={e => setPartLabel(e.target.value)}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
                            color: GOLD, padding: '0.6rem 0.75rem', borderRadius: '6px',
                            fontFamily: 'Georgia, serif', fontSize: '0.82rem',
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: `${GOLD}55`, marginBottom: '0.35rem', letterSpacing: '0.1em' }}>Type</div>
                        <select
                          value={partType}
                          onChange={e => setPartType(e.target.value)}
                          style={{
                            background: 'rgba(201,168,76,0.04)', border: `1px solid ${GOLD}22`,
                            color: GOLD, padding: '0.6rem 0.75rem', borderRadius: '6px',
                            fontFamily: 'Georgia, serif', fontSize: '0.82rem',
                          }}
                        >
                          {['guest','staff','manager','founder','observer'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <Btn onClick={handleStartSession} disabled={busyBtn === 'session_start'} color="#60a5fa" fullWidth>
                      {busyBtn === 'session_start' ? 'Starting…' : 'Start Participant Session'}
                    </Btn>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <TestSessionTimer startTime={currentSession.start_time} running={true} label={currentSession.participant_label} />
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Btn size="sm" onClick={() => handleEndSession('completed')} disabled={busyBtn === 'session_end'} color="#4ade80">Completed</Btn>
                        <Btn size="sm" onClick={() => handleEndSession('partial')}   disabled={busyBtn === 'session_end'} color="#fbbf24">Partial</Btn>
                        <Btn size="sm" onClick={() => handleEndSession('abandoned')} disabled={busyBtn === 'session_end'} color="#f87171">Abandoned</Btn>
                      </div>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Admin: Reset */}
            {canAdmin && activeTest && (
              <Section title="Demo Reset" accent="#f97316">
                <p style={{ fontSize: '0.78rem', color: `${GOLD}77`, lineHeight: 1.6, marginTop: 0 }}>
                  Resets prototype guest sessions, passport stamps, and leaderboard demo entries between test runs. Does not delete users, credentials, or audit logs.
                </p>
                <Btn onClick={handleReset} disabled={resetting} color="#f97316">
                  {resetting ? 'Resetting…' : 'Reset Demo Data'}
                </Btn>
                {resetMsg && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#f97316', padding: '0.6rem 0.75rem', background: 'rgba(249,115,22,0.08)', borderRadius: '6px' }}>
                    {resetMsg}
                  </div>
                )}
              </Section>
            )}

            {/* Export */}
            {activeTest && (
              <Section title="Export">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Btn size="sm" onClick={handleExportJson}              disabled={busyBtn === 'export_json'}>Export JSON</Btn>
                  <Btn size="sm" onClick={() => handleExportCsv('summary')} disabled={busyBtn === 'export_csv_summary'}>Summary CSV</Btn>
                  <Btn size="sm" onClick={() => handleExportCsv('issues')} disabled={busyBtn === 'export_csv_issues'}>Issues CSV</Btn>
                  <Btn size="sm" onClick={() => handleExportCsv('notes')}  disabled={busyBtn === 'export_csv_notes'}>Notes CSV</Btn>
                  <Btn size="sm" onClick={() => handleExportCsv('full')}   disabled={busyBtn === 'export_csv_full'}>Full CSV Bundle</Btn>
                </div>
              </Section>
            )}
          </>
        )}

        {/* ── TAB: NOTES ─────────────────────────────────────────────────── */}
        {tab === 'notes' && (
          <>
            {activeTest ? (
              <>
                <ObserverNotePanel
                  venueTestId={activeTest.venue_test_id}
                  onNoteAdded={n => setNotes(prev => [n, ...prev])}
                />
                {notes.length > 0 && (
                  <Section title={`Recent Notes (${notes.length})`} accent="#a3e635">
                    {notes.slice(0, 10).map(n => (
                      <div key={n.id} style={{ padding: '0.75rem 0', borderBottom: SEP }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.65rem', color: `${GOLD}55`, fontFamily: 'monospace' }}>{n.screen_name}</span>
                          <span style={{ fontSize: '0.65rem', color: `${GOLD}44` }}>·</span>
                          <span style={{ fontSize: '0.65rem', color: n.severity === 'blocker' ? '#f87171' : n.severity === 'high' ? '#f97316' : n.severity === 'medium' ? '#fbbf24' : '#4ade80' }}>{n.severity}</span>
                          <span style={{ fontSize: '0.65rem', color: `${GOLD}44` }}>·</span>
                          <span style={{ fontSize: '0.65rem', color: `${GOLD}44` }}>{n.event_type}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: `${GOLD}bb`, lineHeight: 1.5 }}>{n.note}</div>
                      </div>
                    ))}
                  </Section>
                )}
              </>
            ) : (
              <div style={{ background: CARD, borderRadius: '10px', padding: '2rem', textAlign: 'center', border: `1px solid ${GOLD}18` }}>
                <div style={{ color: `${GOLD}44`, fontSize: '0.8rem' }}>Start a venue test to capture observer notes.</div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: ISSUES ────────────────────────────────────────────────── */}
        {tab === 'issues' && (
          <>
            {activeTest ? (
              <>
                <IssueLogger
                  venueTestId={activeTest.venue_test_id}
                  onIssueLogged={i => { setIssues(prev => [i, ...prev]); fetchSummary(activeTest.venue_test_id) }}
                />
                {issues.length > 0 && (
                  <Section title={`Issue Log (${issues.length})`} accent="#f97316">
                    {issues.map(i => (
                      <div key={i.id} style={{ padding: '0.75rem 0', borderBottom: SEP }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <IssueCountBadge count={i.severity?.toUpperCase()} severity={i.severity} />
                          <span style={{ fontSize: '0.68rem', color: `${GOLD}55` }}>{i.issue_type}</span>
                          {i.screen_name && i.screen_name !== 'unknown' && (
                            <><span style={{ fontSize: '0.65rem', color: `${GOLD}33` }}>·</span><span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: `${GOLD}55` }}>{i.screen_name}</span></>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: `${GOLD}bb`, lineHeight: 1.5 }}>{i.description}</div>
                      </div>
                    ))}
                  </Section>
                )}
              </>
            ) : (
              <div style={{ background: CARD, borderRadius: '10px', padding: '2rem', textAlign: 'center', border: `1px solid ${GOLD}18` }}>
                <div style={{ color: `${GOLD}44`, fontSize: '0.8rem' }}>Start a venue test to log issues.</div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: CHECKLIST ─────────────────────────────────────────────── */}
        {tab === 'checklist' && <TestProgressChecklist />}

        {/* ── TAB: SUMMARY ───────────────────────────────────────────────── */}
        {tab === 'summary' && (
          <>
            {summary ? (
              <>
                {/* Readiness score */}
                <div style={{ background: CARD, border: `1px solid ${readiness?.color}33`, borderRadius: '10px', padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '1rem' }}>Readiness Score</div>
                  <div style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', fontWeight: 400, color: readiness?.color, lineHeight: 1, marginBottom: '0.5rem' }}>{summary.readinessScore}</div>
                  <div style={{ fontSize: '0.85rem', color: readiness?.color, letterSpacing: '0.1em', marginBottom: '1rem' }}>{readiness?.label}</div>
                  <div style={{ fontSize: '0.78rem', color: `${GOLD}88`, lineHeight: 1.6, maxWidth: '440px', margin: '0 auto' }}>{summary.recommendation}</div>
                </div>

                <Section title="Test Overview">
                  {[
                    ['Venue',          summary.venueName],
                    ['Test Type',      summary.testType?.replace(/_/g,' ')],
                    ['Total Sessions', summary.totalSessions],
                    ['Completed',      summary.completedGuestJourneys],
                    ['Avg Duration',   summary.averageCompletionTimeMin ? `${summary.averageCompletionTimeMin} min` : '—'],
                    ['Observer Notes', summary.observerNotesCount],
                    ['Total Issues',   summary.totalIssues],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: SEP, fontSize: '0.8rem' }}>
                      <span style={{ color: `${GOLD}55` }}>{k}</span>
                      <span style={{ color: GOLD }}>{v ?? '—'}</span>
                    </div>
                  ))}
                </Section>

                <Section title="Issues by Severity">
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {['blocker','high','medium','low'].map(sev => (
                      <div key={sev} style={{ flex: '1 1 80px', background: 'rgba(201,168,76,0.04)', borderRadius: '8px', padding: '0.875rem', textAlign: 'center', border: `1px solid ${GOLD}15` }}>
                        <IssueCountBadge count={summary.issueCountsBySeverity?.[sev] ?? 0} severity={sev} />
                        <div style={{ fontSize: '0.6rem', color: `${GOLD}44`, marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sev}</div>
                      </div>
                    ))}
                  </div>
                </Section>

                {summary.topScreensWithIssues?.length > 0 && (
                  <Section title="Top Screens with Issues">
                    {summary.topScreensWithIssues.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: SEP, fontSize: '0.8rem' }}>
                        <span style={{ color: `${GOLD}88`, fontFamily: 'monospace' }}>{s.screen}</span>
                        <span style={{ color: GOLD }}>{s.count} issue{s.count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </Section>
                )}
              </>
            ) : (
              <div style={{ background: CARD, borderRadius: '10px', padding: '2rem', textAlign: 'center', border: `1px solid ${GOLD}18` }}>
                <div style={{ color: `${GOLD}44`, fontSize: '0.8rem' }}>
                  {activeTest ? 'No data yet — log sessions and issues to generate a readiness score.' : 'Start a venue test to view the summary.'}
                </div>
              </div>
            )}
          </>
        )}

        {/* Back nav */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: SEP }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: `1px solid ${GOLD}22`, color: `${GOLD}66`, padding: '0.75rem 1.5rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', minHeight: '48px' }}>
            Return Home
          </button>
        </div>
      </div>

      {/* Export modal */}
      {exportModal && <ExportModal data={exportModal.data} label={exportModal.label} onClose={() => setExportModal(null)} />}
    </div>
  )
}
