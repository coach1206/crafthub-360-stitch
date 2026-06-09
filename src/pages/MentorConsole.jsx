/**
 * Mentor Console — T015
 * Human Mentor dashboard for viewing assigned sessions,
 * adding guidance notes, and tracking learner progress.
 *
 * Requires: human_mentor role (access_mentor_console permission)
 * Founder L0 also has full access.
 */

import { useState, useEffect } from 'react'
import { useSecurity } from '../context/SecurityContext.jsx'

const GOLD   = '#C9A84C'
const DARK   = '#060402'
const CARD   = 'rgba(14,9,3,0.98)'
const BORDER = 'rgba(201,168,76,0.16)'
const DIM    = 'rgba(201,168,76,0.45)'
const API    = '/api/mentor'

// ── Sub-components ────────────────────────────────────────────

function Badge({ children, color = GOLD }) {
  return (
    <span style={{
      display:       'inline-block',
      padding:       '2px 8px',
      borderRadius:  10,
      background:    color + '15',
      border:        `1px solid ${color}33`,
      color:         color + 'cc',
      fontSize:      9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      fontFamily:    '"JetBrains Mono", monospace',
    }}>
      {children}
    </span>
  )
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: GOLD }}>{icon}</span>
      <span style={{ color: DIM, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function SessionRow({ session, onSelect, selected }) {
  const isActive = session.status === 'active'
  return (
    <button
      onClick={() => onSelect(session)}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '12px 16px',
        background:    selected ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
        border:        `1px solid ${selected ? GOLD + '44' : 'rgba(201,168,76,0.10)'}`,
        borderRadius:  8,
        cursor:        'pointer',
        width:         '100%',
        textAlign:     'left',
        transition:    'all 0.15s',
        marginBottom:  8,
      }}
    >
      <div style={{
        width:         8, height: 8, borderRadius: '50%', flexShrink: 0,
        background:    isActive ? '#4caf50' : 'rgba(201,168,76,0.3)',
        boxShadow:     isActive ? '0 0 6px #4caf5088' : 'none',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: GOLD, fontSize: 12, letterSpacing: '0.06em', marginBottom: 2 }}>
          {session.guest_name || session.session_id || 'Guest Session'}
        </div>
        <div style={{ color: 'rgba(201,168,76,0.35)', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}>
          {session.module || 'SmokeCraft 360'} · {session.stage || 'in progress'}
        </div>
      </div>
      <Badge color={isActive ? '#4caf50' : GOLD}>{session.status || 'active'}</Badge>
    </button>
  )
}

const PROTOTYPE_SESSIONS = [
  { session_id: 'SC-2024-001', guest_name: 'Member #1042', module: 'SmokeCraft 360', stage: 'Blend Selection', status: 'active' },
  { session_id: 'SC-2024-002', guest_name: 'Member #1087', module: 'SmokeCraft 360', stage: 'Origins Deep-Dive', status: 'active' },
  { session_id: 'SC-2024-003', guest_name: 'Member #1031', module: 'SmokeCraft 360', stage: 'Pairing Mastery', status: 'completed' },
]

// ── Main component ────────────────────────────────────────────

export default function MentorConsole() {
  const { user } = useSecurity()

  const [sessions,   setSessions]   = useState([])
  const [selected,   setSelected]   = useState(null)
  const [note,       setNote]       = useState('')
  const [noteType,   setNoteType]   = useState('guidance')
  const [submitting, setSubmitting] = useState(false)
  const [noteResult, setNoteResult] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    fetch(`${API}/sessions`, { credentials: 'include' })
      .then(r => r.json())
      .then(body => {
        if (body?.data?.sessions?.length) {
          setSessions(body.data.sessions)
        } else {
          setSessions(PROTOTYPE_SESSIONS)
        }
      })
      .catch(() => setSessions(PROTOTYPE_SESSIONS))
      .finally(() => setLoading(false))
  }, [])

  async function submitNote() {
    if (!note.trim() || !selected) return
    setSubmitting(true)
    setNoteResult(null)
    try {
      const res = await fetch(`${API}/sessions/${selected.session_id}/notes`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ note_type: noteType, content: note.trim() }),
      })
      const body = await res.json()
      if (body.success) {
        setNoteResult({ ok: true, msg: 'Guidance note recorded.' })
        setNote('')
      } else {
        setNoteResult({ ok: false, msg: body.message || 'Could not save note.' })
      }
    } catch {
      setNoteResult({ ok: false, msg: 'Request failed — check server connection.' })
    }
    setSubmitting(false)
  }

  return (
    <div style={{
      minHeight:  '100vh',
      background: DARK,
      padding:    'clamp(1.5rem, 4vw, 2.5rem)',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: DIM, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '0.4rem' }}>
            NOVEE OS — MENTOR CONSOLE
          </div>
          <h1 style={{
            color: GOLD, fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 400, letterSpacing: '0.1em',
            margin: '0 0 0.25rem', textTransform: 'uppercase',
          }}>
            Human Mentor Console
          </h1>
          <div style={{ color: '#3a3020', fontSize: '12px', letterSpacing: '0.08em' }}>
            Monitor sessions · Add guidance · Track learner progress
          </div>
        </div>

        {/* Identity badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,168,76,0.08)', border: `1px solid ${GOLD}44`,
            borderRadius: 20, padding: '6px 14px', color: GOLD, fontSize: '11px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>school</span>
            {user?.displayName || user?.email || 'Mentor'}
          </div>
          <Badge>human_mentor</Badge>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(280px,1.5fr)', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left: Session list */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1.5rem' }}>
            <SectionTitle icon="format_list_bulleted" label="Assigned Sessions" />
            {loading ? (
              <div style={{ color: 'rgba(201,168,76,0.3)', fontSize: 11, letterSpacing: '0.1em', padding: '1rem 0' }}>
                Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ color: 'rgba(201,168,76,0.2)', fontSize: 11, letterSpacing: '0.1em', padding: '1rem 0' }}>
                No active sessions assigned.
              </div>
            ) : (
              sessions.map(s => (
                <SessionRow
                  key={s.session_id}
                  session={s}
                  selected={selected?.session_id === s.session_id}
                  onSelect={setSelected}
                />
              ))
            )}
          </div>

          {/* Right: Guidance panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Guidance notes */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1.5rem' }}>
              <SectionTitle icon="edit_note" label="Add Guidance Note" />
              {!selected ? (
                <div style={{ color: 'rgba(201,168,76,0.2)', fontSize: 11, letterSpacing: '0.1em', padding: '0.5rem 0' }}>
                  Select a session on the left to add a note.
                </div>
              ) : (
                <>
                  <div style={{
                    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)',
                    borderRadius: 6, padding: '8px 12px', marginBottom: '1rem',
                    color: 'rgba(201,168,76,0.5)', fontSize: 11, letterSpacing: '0.08em',
                  }}>
                    Session: {selected.guest_name} — {selected.stage}
                  </div>

                  {/* Note type selector */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
                    {['guidance', 'tasting', 'pairing', 'observation'].map(t => (
                      <button
                        key={t}
                        onClick={() => setNoteType(t)}
                        style={{
                          padding:       '4px 10px',
                          borderRadius:  12,
                          background:    noteType === t ? 'rgba(201,168,76,0.15)' : 'transparent',
                          border:        `1px solid ${noteType === t ? GOLD + '55' : 'rgba(201,168,76,0.12)'}`,
                          color:         noteType === t ? GOLD : 'rgba(201,168,76,0.3)',
                          fontSize:      9,
                          letterSpacing: '0.14em',
                          cursor:        'pointer',
                          textTransform: 'uppercase',
                          fontFamily:    '"JetBrains Mono", monospace',
                          transition:    'all 0.15s',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Add your guidance, tasting observation, or pairing recommendation…"
                    value={note}
                    onChange={e => { setNote(e.target.value); setNoteResult(null) }}
                    rows={5}
                    style={{
                      width:         '100%',
                      background:    'rgba(255,255,255,0.02)',
                      border:        '1px solid rgba(201,168,76,0.15)',
                      borderRadius:  6,
                      color:         'rgba(201,168,76,0.75)',
                      fontSize:      13,
                      fontFamily:    'Georgia, serif',
                      padding:       '10px 12px',
                      outline:       'none',
                      resize:        'vertical',
                      boxSizing:     'border-box',
                      lineHeight:    1.6,
                      transition:    'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(201,168,76,0.15)'}
                  />

                  {noteResult && (
                    <div style={{
                      marginTop:  '0.75rem',
                      padding:    '8px 12px',
                      borderRadius: 4,
                      background: noteResult.ok ? 'rgba(76,175,80,0.08)' : 'rgba(204,51,51,0.08)',
                      border:     `1px solid ${noteResult.ok ? '#4caf5044' : '#cc333344'}`,
                      color:      noteResult.ok ? '#4caf80' : 'rgba(220,80,80,0.9)',
                      fontSize:   11,
                      letterSpacing: '0.06em',
                    }}>
                      {noteResult.msg}
                    </div>
                  )}

                  <button
                    onClick={submitNote}
                    disabled={submitting || !note.trim()}
                    style={{
                      marginTop:     '0.75rem',
                      padding:       '10px 20px',
                      background:    note.trim() ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.04)',
                      border:        `1px solid ${note.trim() ? GOLD + '55' : 'rgba(201,168,76,0.1)'}`,
                      borderRadius:  6,
                      color:         note.trim() ? GOLD : 'rgba(201,168,76,0.25)',
                      fontSize:      11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor:        note.trim() ? 'pointer' : 'not-allowed',
                      fontFamily:    'Georgia, serif',
                      transition:    'all 0.15s',
                    }}
                  >
                    {submitting ? 'Saving…' : 'Save Note'}
                  </button>
                </>
              )}
            </div>

            {/* Learner progress panel — prototype */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1.5rem' }}>
              <SectionTitle icon="trending_up" label="Learner Progress" />
              {selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Origins Module',     pct: 100, done: true },
                    { label: 'Leaf Identification', pct: 85,  done: false },
                    { label: 'Blend Selection',    pct: 60,  done: false },
                    { label: 'Pairing Mastery',    pct: 20,  done: false },
                  ].map(({ label, pct, done }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: done ? GOLD : 'rgba(201,168,76,0.5)', fontSize: 11, letterSpacing: '0.06em' }}>
                          {label}
                        </span>
                        <span style={{ color: done ? GOLD : 'rgba(201,168,76,0.35)', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(201,168,76,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background:  done ? GOLD : 'rgba(201,168,76,0.35)',
                          borderRadius: 2, transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ color: 'rgba(201,168,76,0.2)', fontSize: 9, letterSpacing: '0.15em', marginTop: 4 }}>
                    PROTOTYPE DATA — REAL DATA REQUIRES DB
                  </div>
                </div>
              ) : (
                <div style={{ color: 'rgba(201,168,76,0.2)', fontSize: 11, letterSpacing: '0.1em' }}>
                  Select a session to view progress.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(201,168,76,0.08)', display: 'flex', gap: 12 }}>
          <a href="/" style={{ color: 'rgba(201,168,76,0.35)', fontSize: '11px', letterSpacing: '0.1em', textDecoration: 'none' }}>
            ← Home
          </a>
        </div>
      </div>
    </div>
  )
}
