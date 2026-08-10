import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import * as api from '../../services/smokecraft/fillerArrangementApiClient.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

// Real educational content for each zone — why it matters, not decoration.
const ZONES = [
  { key: 'ligero', label: 'Ligero Placement', why: 'Ligero leaf grows highest on the plant and carries the most strength and oil. Placed at the core of the bunch, it drives the cigar\'s power and slow-burning richness.' },
  { key: 'viso', label: 'Viso Placement', why: 'Viso sits between Ligero and Seco in strength and burn quality. It surrounds the Ligero core to balance strength with a cleaner, more even combustion.' },
  { key: 'seco', label: 'Seco Placement', why: 'Seco is a mild, aromatic leaf from the lower-middle of the plant. It rounds out the blend\'s flavor without adding much strength.' },
  { key: 'volado', label: 'Volado Placement', why: 'Volado, from the lowest priming, burns fastest and most evenly. A thin layer of Volado helps keep the whole bunch burning at a consistent rate.' },
  { key: 'airflow', label: 'Airflow', why: 'The gaps between leaves inside the bunch determine how freely air moves through the cigar — too tight and the draw chokes, too loose and it burns hot and fast.' },
  { key: 'density', label: 'Bunch Density', why: 'Even density across the bunch is what keeps burn and draw consistent from foot to head — dense or loose pockets both cause problems.' },
  { key: 'strength', label: 'Strength Distribution', why: 'Where the stronger leaves sit inside the bunch controls whether the strength arrives evenly through the smoke or spikes unpredictably.' },
  { key: 'flavor', label: 'Flavor Balance', why: 'The ratio and placement of Ligero/Viso/Seco/Volado is the single biggest lever a blender has over the finished flavor profile.' },
  { key: 'combustion', label: 'Combustion Behavior', why: 'Uneven filler arrangement is the most common root cause of canoeing, tunneling, and runs — the fire finds the path of least resistance.' },
  { key: 'draw', label: 'Draw Performance', why: 'A well-arranged bunch gives even, moderate resistance on every puff — the physical result of correct density and airflow.' },
  { key: 'faults', label: 'Common Filler-Arrangement Faults', why: 'Overfilling causes a plugged draw; underfilling causes a loose, fast, hot burn. Both trace directly back to how the filler was arranged, not the leaf itself.' },
]

export default function FillerArrangement() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState({}) // zoneKey -> viewed_at
  const [activeZone, setActiveZone] = useState(null)
  const [note, setNote] = useState('')
  const [noteSaveState, setNoteSaveState] = useState('idle') // idle | saving | saved
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [quizResult, setQuizResult] = useState(null)
  const [lessonComplete, setLessonComplete] = useState(false)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const noteTimer = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [progRes, noteRes] = await Promise.all([api.getProgress(), api.getNote()])
      if (cancelled) return
      if (!progRes.ok) { setStatus('error'); return }
      const map = {}
      for (const p of progRes.progress || []) map[p.zone_key] = p.viewed_at
      setProgress(map)
      if (noteRes.ok && noteRes.note) setNote(noteRes.note.note_text || '')
      setStatus('ready')
    }
    load()
    return () => { cancelled = true }
  }, [])

  function openZone(zoneKey) {
    triggerHaptic('light')
    setActiveZone(zoneKey)
    api.recordZoneViewed(zoneKey).then(res => {
      if (res.ok) setProgress(prev => ({ ...prev, [zoneKey]: res.progress.viewed_at }))
    })
  }

  function handleNoteChange(e) {
    const val = e.target.value
    setNote(val)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    setNoteSaveState('saving')
    noteTimer.current = setTimeout(async () => {
      const res = await api.saveNote(val)
      setNoteSaveState(res.ok ? 'saved' : 'idle')
    }, 600)
  }

  async function handleQuizSubmit() {
    if (quizAnswer == null) return
    triggerHaptic('medium')
    const isCorrect = quizAnswer === 'even-distribution'
    const res = await api.submitQuizAnswer('filler-arrangement-primary-goal', isCorrect)
    if (res.ok) setQuizResult({ isCorrect, xpAwarded: res.xpAwarded })
  }

  async function handleComplete() {
    triggerHaptic('medium')
    const res = await api.completeLesson()
    if (res.ok) setLessonComplete(true)
  }

  const viewedCount = Object.keys(progress).length
  const allViewed = viewedCount === ZONES.length

  if (status === 'loading') {
    return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading lesson…" />
  }
  if (status === 'error') {
    return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Something went wrong loading this lesson." onRetry={() => window.location.reload()} />
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/wrapper-strength') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Construction &amp; Craft
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
          <img src={SC_ASSETS.fillerArrangementLesson} alt="Filler Arrangement" style={{ width: '100%', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>Filler Arrangement</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 16px' }}>
          How filler leaves are arranged inside the cigar defines airflow, balance, combustion, and the
          journey of flavor. Explore each topic below — no topic is marked read until you open it.
        </p>

        <div style={{ fontSize: 11, color: GOLD, marginBottom: 10 }}>{viewedCount} / {ZONES.length} topics explored</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10, marginBottom: 20 }}>
          {ZONES.map(z => {
            const viewed = !!progress[z.key]
            return (
              <button key={z.key} type="button" onClick={() => openZone(z.key)}
                aria-pressed={activeZone === z.key}
                aria-label={`${z.label}${viewed ? ' (explored)' : ''}`}
                style={{
                  textAlign: 'left', minHeight: 64, padding: 12, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: activeZone === z.key ? 'rgba(233,193,118,0.14)' : GLASS,
                  border: `1.5px solid ${activeZone === z.key ? GOLD : (viewed ? 'rgba(127,208,163,0.4)' : BORDER)}`,
                  color: CREAM,
                }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{z.label}{viewed && ' ✓'}</div>
              </button>
            )
          })}
        </div>

        {activeZone && (
          <div role="region" aria-live="polite" style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 6 }}>{ZONES.find(z => z.key === activeZone)?.label}</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{ZONES.find(z => z.key === activeZone)?.why}</p>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="fa-notes" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(233,193,118,0.55)', marginBottom: 6 }}>
            <span>Your Notes</span>
            <span aria-live="polite">{noteSaveState === 'saving' ? 'Saving…' : noteSaveState === 'saved' ? 'Saved' : ''}</span>
          </label>
          <textarea id="fa-notes" value={note} onChange={handleNoteChange}
            placeholder="What did you learn about filler arrangement?"
            style={{ width: '100%', minHeight: 80, resize: 'vertical', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
        </div>

        {allViewed && !quizResult && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 10 }}>Knowledge Check</div>
            <p style={{ fontSize: 13, marginBottom: 10 }}>What is the primary goal of correct filler arrangement?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="radiogroup" aria-label="Knowledge check answer">
              {[
                { key: 'even-distribution', label: 'Even airflow, density, and strength distribution throughout the bunch' },
                { key: 'strongest-leaf-only', label: 'Using only the strongest leaf available' },
                { key: 'appearance-only', label: 'Making the wrapper look symmetrical' },
              ].map(opt => (
                <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="fa-quiz" checked={quizAnswer === opt.key} onChange={() => setQuizAnswer(opt.key)} />
                  {opt.label}
                </label>
              ))}
            </div>
            <button type="button" onClick={handleQuizSubmit} disabled={quizAnswer == null}
              style={{ marginTop: 12, minHeight: 44, padding: '10px 20px', borderRadius: 20, border: 'none', cursor: quizAnswer == null ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, background: quizAnswer == null ? 'rgba(233,193,118,0.25)' : GOLD, color: '#241605' }}>
              Submit Answer
            </button>
          </div>
        )}

        {quizResult && (
          <div style={{ background: GLASS, border: `1px solid ${quizResult.isCorrect ? '#7fd0a3' : '#e2a6a6'}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: quizResult.isCorrect ? '#7fd0a3' : '#e2a6a6' }}>
              {quizResult.isCorrect ? 'Correct!' : 'Not quite.'}
            </div>
            <p style={{ fontSize: 12, margin: '6px 0 0' }}>
              Correct filler arrangement is about even airflow, density, and strength distribution — that's
              what keeps burn, draw, and flavor consistent.
            </p>
          </div>
        )}

        {allViewed && quizResult && !lessonComplete && (
          <button type="button" onClick={handleComplete}
            style={{ minHeight: 48, padding: '12px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, background: GOLD, color: '#241605' }}>
            Complete Lesson
          </button>
        )}

        {lessonComplete && (
          <div style={{ background: GLASS, border: `1px solid ${GOLD}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 15, color: GOLD, fontWeight: 700 }}>Lesson Complete</div>
            <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>Your progress has been saved.</p>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          {/* Holistic Fix 5B-2A-1: real, server-computed, context-aware
              guidance (via the shared mentor-guidance service) replaces
              the previous hardcoded string. */}
          <DynamicMentorPanel context="filler-arrangement" />
        </div>
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
