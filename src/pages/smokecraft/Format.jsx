import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_5 = getEducationalEnrichment(5)

const NAT_W = 1586
const NAT_H = 992

const GOLD = '#E9C176'
// Root-cause fix: non-opaque background let baked image content
// (including the header brand/session zone) bleed through.
const PANEL = {
  background: '#050505',
  border: '1px solid rgba(233,193,118,0.28)',
  borderRadius: 8,
  position: 'absolute',
  boxSizing: 'border-box',
  fontFamily: 'Georgia, serif',
}

const FORMAT_ZONES = [
  { id: 'robusto',   label: 'Robusto',   desc: '5" × 50 ring',   burnTime: '45–60 min',  drawFeel: 'Balanced', ringGauge: 50, lengthIn: 5.0, notes: 'The benchmark medium-size. Balanced and concentrated.' },
  { id: 'toro',      label: 'Toro',      desc: '6" × 52 ring',   burnTime: '60–75 min',  drawFeel: 'Open',     ringGauge: 52, lengthIn: 6.0, notes: "Extra length opens up the blend's mid-section." },
  { id: 'churchill', label: 'Churchill', desc: '7" × 48 ring',   burnTime: '75–90 min',  drawFeel: 'Refined',  ringGauge: 48, lengthIn: 7.0, notes: 'Ring gauge keeps it refined. Long smoke, elegant evolution.' },
  { id: 'corona',    label: 'Corona',    desc: '5.5" × 42 ring', burnTime: '35–45 min',  drawFeel: 'Focused',  ringGauge: 42, lengthIn: 5.5, notes: "Smaller ring focuses the wrapper's flavor front and center." },
  { id: 'gordo',     label: 'Gordo',     desc: '6" × 60 ring',   burnTime: '90–120 min', drawFeel: 'Cool',     ringGauge: 60, lengthIn: 6.0, notes: 'Wide ring gauge increases coolness. More complex burn.' },
  { id: 'torpedo',   label: 'Torpedo',   desc: '6.5" × 52 ring', burnTime: '70–85 min',  drawFeel: 'Distinct', ringGauge: 52, lengthIn: 6.5, notes: 'Tapered head concentrates draw. Distinct opening character.' },
]

const ZONE_POS = [
  { x: 11.9, y: 23.8, w: 14.5, h: 22.0 },
  { x: 26.6, y: 23.8, w: 13.8, h: 22.0 },
  { x: 40.6, y: 23.8, w: 14.1, h: 22.0 },
  { x: 11.9, y: 46.1, w: 14.5, h: 20.9 },
  { x: 26.6, y: 46.1, w: 13.8, h: 20.9 },
  { x: 40.6, y: 46.1, w: 14.1, h: 20.9 },
]
const ZONES_FULL = FORMAT_ZONES.map((f, i) => ({ ...f, ...ZONE_POS[i] }))

const ACTIVITY_KEY = 'format'
// Deliberately scrambled starting order (not already correct) so the
// sequencing task is a real action, not a pre-solved default.
const SCRAMBLED_START = ['gordo', 'corona', 'torpedo', 'robusto', 'churchill', 'toro']

export default function Format({ onBack, onComplete } = {}) {
  const { awardSessionRewards, setSmokeCraftFormat, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { journey, setFormat } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Load from canonical journey state
  const [selected,   setSelected]   = useState(() => journey.format?.id || null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [done,       setDone]       = useState(false)

  // Required-Interaction Closure Package C: the player must sequence
  // the 6 real shapes from shortest to longest burn time — the server
  // independently owns the correct order (derived from each shape's own
  // real, already-documented burnTime range) and never trusts a
  // client-claimed "correct" flag.
  const [phase, setPhase] = useState('loading')
  const [order, setOrder] = useState(SCRAMBLED_START)
  const [draftVersion, setDraftVersion] = useState(0)
  const [draftLocked, setDraftLocked] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const activeFmt = ZONES_FULL.find(f => f.id === selected) || null

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) { setPhase('error'); return }
      const saved = result.draftData?.orderedIds
      if (Array.isArray(saved) && saved.length === 6) setOrder(saved)
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTastingDraft])

  function handleRetryLoad() {
    setPhase('loading')
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (!result.ok) { setPhase('error'); return }
      const saved = result.draftData?.orderedIds
      if (Array.isArray(saved) && saved.length === 6) setOrder(saved)
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      saveTastingDraft(ACTIVITY_KEY, { orderedIds: order }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setDraftLocked(true); return }
        if (result.conflict) { setOrder(result.current.draftData?.orderedIds || order); setDraftVersion(result.current.version); return }
        if (result.ok) setDraftVersion(result.current.version)
      })
    }, 900)
    return () => clearTimeout(t)
  }, [phase, order, done, draftVersion, draftLocked, saveTastingDraft])

  function moveItem(index, dir) {
    const target = index + dir
    if (target < 0 || target >= order.length) return
    triggerHaptic('light')
    setFeedback(null)
    setOrder(prev => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  // Auto-persist selection to canonical journey state
  useEffect(() => {
    const fmt = ZONES_FULL.find(f => f.id === selected)
    setFormat(fmt ? { id: fmt.id, label: fmt.label, desc: fmt.desc, burnTime: fmt.burnTime } : null)
    if (fmt) setSmokeCraftFormat({ id: fmt.id, name: fmt.label, desc: fmt.desc })
  }, [selected, setFormat, setSmokeCraftFormat])

  function handleSave() {
    if (!selected) return
    // setFormat already called via useEffect; confirm immediately (honest — real save happened)
    setSaveStatus('saved')
    triggerHaptic('light')
    setTimeout(() => setSaveStatus('idle'), 2500)
  }

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')

    const result = await submitSelectionAttempt('format', { orderedIds: order })
    if (!result.ok) {
      setDone(false)
      setFeedback({ correct: false, message: 'Unable to submit your sequence right now. Please try again.' })
      return
    }
    if (!result.data.correct) {
      setDone(false)
      setFeedback({ correct: false, message: 'Not quite the right order (shortest to longest burn time). Try again.' })
      return
    }
    setFeedback({ correct: true, message: 'Correct — ordered from shortest to longest burn time.' })

    // Secondary award kept as an internal side effect — the shared
    // completion service only knows about this screen's one primary
    // completionKey ('format'), same pattern as other screens with
    // extra XP/state effects beyond plain award+navigate.
    awardSessionRewards('wrapper-strength')
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('format')
    navigate('/smokecraft/request-purchase')
  }

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: 'rgba(229,226,225,0.7)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        Loading…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#050505', color: 'rgba(229,170,100,0.9)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        <p style={{ margin: 0 }}>Something went wrong loading this session.</p>
        <button type="button" onClick={handleRetryLoad} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.format}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Format — Shape, Size & Burn Time"
      >
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {ZONES_FULL.map(f => {
          const active = selected === f.id
          return (
            <button
              key={f.id}
              type="button"
              aria-label={`${f.label} — ${f.desc}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => { triggerHaptic('light'); setSelected(active ? null : f.id); setSaveStatus('idle') }}
              style={{
                position: 'absolute', left: `${f.x}%`, top: `${f.y}%`,
                width: `${f.w}%`, height: `${f.h}%`,
                pointerEvents: 'auto', background: 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', padding: 0, outline: 'none',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 4, right: 5, fontSize: 'clamp(9px,1.2vw,14px)',
                  fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Insight panel */}
        {activeFmt && (
          <div style={{ ...PANEL, left: '58%', top: '22%', width: '38%', height: 'auto',
            padding: 'clamp(8px,1vw,14px)', pointerEvents: 'none', zIndex: 3 }}>
            <div style={{ fontSize: 'clamp(10px,0.95vw,13px)', color: GOLD, fontWeight: 700, marginBottom: 6 }}>
              {activeFmt.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', marginBottom: 8 }}>
              {[['Shape', activeFmt.label], ['Length', `${activeFmt.lengthIn}"`], ['Ring Gauge', `${activeFmt.ringGauge}`],
                ['Draw Feel', activeFmt.drawFeel], ['Burn Time', activeFmt.burnTime]].map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                  <div style={{ fontSize: 'clamp(8px,0.72vw,10px)', color: 'rgba(229,226,225,0.82)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 'clamp(7px,0.65vw,9px)', color: 'rgba(229,226,225,0.55)', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 8 }}>
              {activeFmt.notes}
            </div>
            <div style={{ pointerEvents: 'auto' }}>
              <button
                type="button"
                aria-label="Save format selection"
                onClick={handleSave}
                style={{
                  padding: '4px 14px', borderRadius: 5,
                  border: `1px solid ${saveStatus === 'saved' ? 'rgba(233,193,118,0.5)' : GOLD}`,
                  background: saveStatus === 'saved' ? 'rgba(233,193,118,0.1)' : 'transparent',
                  color: GOLD, fontSize: 'clamp(8px,0.7vw,10px)', fontFamily: 'Georgia, serif',
                  fontWeight: 700, cursor: 'pointer', outline: 'none',
                }}
              >
                {saveStatus === 'saved' ? '✓ Format Saved' : 'Save Format'}
              </button>
            </div>
          </div>
        )}

        {/* Required sequencing interaction — order shortest to longest burn time */}
        <div style={{
          position: 'absolute', left: '3%', top: '69%', width: '94%', height: '18%',
          background: '#050505', border: '1px solid rgba(233,193,118,0.28)', borderRadius: 8,
          boxSizing: 'border-box', padding: 'clamp(5px,0.8vw,10px)', pointerEvents: 'auto',
          fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', gap: 5, zIndex: 3,
        }}>
          <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Required: Order these shapes from shortest to longest burn time
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 6, overflowX: 'auto' }}>
            {order.map((id, i) => {
              const fmt = ZONES_FULL.find(f => f.id === id)
              return (
                <li key={id} style={{
                  flexShrink: 0, minWidth: 92, border: '1px solid rgba(233,193,118,0.3)', borderRadius: 6,
                  padding: '4px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <span style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(229,226,225,0.4)' }}>#{i + 1}</span>
                  <span style={{ fontSize: 'clamp(8px,0.75vw,10px)', color: GOLD, fontWeight: 700 }}>{fmt?.label}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" aria-label={`Move ${fmt?.label} earlier`} disabled={i === 0}
                      onClick={() => moveItem(i, -1)}
                      style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid rgba(233,193,118,0.4)', background: 'transparent', color: GOLD, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.35 : 1, fontSize: 12, outline: 'none' }}
                    >↑</button>
                    <button type="button" aria-label={`Move ${fmt?.label} later`} disabled={i === order.length - 1}
                      onClick={() => moveItem(i, 1)}
                      style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid rgba(233,193,118,0.4)', background: 'transparent', color: GOLD, cursor: i === order.length - 1 ? 'not-allowed' : 'pointer', opacity: i === order.length - 1 ? 0.35 : 1, fontSize: 12, outline: 'none' }}
                    >↓</button>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftLessonInfoButton
        sessionNumber={5} totalSessions={TOTAL_SESSIONS} phase={1} totalPhases={TOTAL_VISITS}
        title="Shape, Size & Burn Time" whyItMatters={ENRICHMENT_5?.whyItMatters} goldenBox={ENRICHMENT_5?.goldenBox}
      />

      {feedback && (
        <div role="alert" style={{
          position: 'absolute', left: '3%', bottom: '17%', width: '94%', zIndex: 4,
          background: feedback.correct ? 'rgba(20,90,50,0.9)' : 'rgba(120,20,20,0.9)',
          border: `1px solid ${feedback.correct ? 'rgba(150,255,180,0.5)' : 'rgba(255,150,150,0.5)'}`,
          borderRadius: 6, padding: '6px 10px', color: feedback.correct ? '#d6ffe4' : '#ffdada',
          fontSize: 'clamp(9px,0.8vw,11px)', fontFamily: 'Georgia, serif',
        }}>
          {feedback.message}
        </div>
      )}

      <SmokeCraftNavBar
        primary={done ? 'Checking…' : 'Continue to Request / Purchase →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/terroir'))}
      />
    </>
  )
}
