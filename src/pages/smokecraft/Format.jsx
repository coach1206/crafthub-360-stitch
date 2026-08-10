import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import {
  GOLD,
  GOLD_DIM,
  CREAM,
  BORDER,
  GLASS,
  heroBannerStyle,
  pageShellStyle,
  cardStyle,
  sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'
import SmokeCraftHeroCrop from '../../components/smokecraft/SmokeCraftHeroCrop.jsx'

const ENRICHMENT_5 = getEducationalEnrichment(5)

const FORMATS = [
  { id: 'robusto', label: 'Robusto', desc: '5" × 50 ring', burnTime: '45–60 min', drawFeel: 'Balanced', ringGauge: 50, lengthIn: 5.0, notes: 'The benchmark medium-size. Balanced and concentrated.' },
  { id: 'toro', label: 'Toro', desc: '6" × 52 ring', burnTime: '60–75 min', drawFeel: 'Open', ringGauge: 52, lengthIn: 6.0, notes: "Extra length opens up the blend's mid-section." },
  { id: 'churchill', label: 'Churchill', desc: '7" × 48 ring', burnTime: '75–90 min', drawFeel: 'Refined', ringGauge: 48, lengthIn: 7.0, notes: 'Ring gauge keeps it refined. Long smoke, elegant evolution.' },
  { id: 'corona', label: 'Corona', desc: '5.5" × 42 ring', burnTime: '35–45 min', drawFeel: 'Focused', ringGauge: 42, lengthIn: 5.5, notes: "Smaller ring focuses the wrapper's flavor front and center." },
  { id: 'gordo', label: 'Gordo', desc: '6" × 60 ring', burnTime: '90–120 min', drawFeel: 'Cool', ringGauge: 60, lengthIn: 6.0, notes: 'Wide ring gauge increases coolness. More complex burn.' },
  { id: 'torpedo', label: 'Torpedo', desc: '6.5" × 52 ring', burnTime: '70–85 min', drawFeel: 'Distinct', ringGauge: 52, lengthIn: 6.5, notes: 'Tapered head concentrates draw. Distinct opening character.' },
]

const ACTIVITY_KEY = 'format'
const SCRAMBLED_START = ['gordo', 'corona', 'torpedo', 'robusto', 'churchill', 'toro']

export default function Format({ onBack, onComplete } = {}) {
  const navigate = useNavigate()
  const { awardSessionRewards, setSmokeCraftFormat, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { journey, setFormat } = useSmokeCraftJourney()

  const [selected, setSelected] = useState(() => journey.format?.id || null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [done, setDone] = useState(false)
  const [phase, setPhase] = useState('loading')
  const [order, setOrder] = useState(SCRAMBLED_START)
  const [draftVersion, setDraftVersion] = useState(0)
  const [draftLocked, setDraftLocked] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const activeFmt = FORMATS.find(format => format.id === selected) || null

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) {
        setPhase('error')
        return
      }
      const saved = result.draftData?.orderedIds
      if (Array.isArray(saved) && saved.length === 6) setOrder(saved)
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
    return () => { cancelled = true }
  }, [loadTastingDraft])

  function handleRetryLoad() {
    setPhase('loading')
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (!result.ok) {
        setPhase('error')
        return
      }
      const saved = result.draftData?.orderedIds
      if (Array.isArray(saved) && saved.length === 6) setOrder(saved)
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const timer = setTimeout(() => {
      saveTastingDraft(ACTIVITY_KEY, { orderedIds: order }, draftVersion).then(result => {
        if (result.alreadyCompleted) {
          setDraftLocked(true)
          return
        }
        if (result.conflict) {
          setOrder(result.current.draftData?.orderedIds || order)
          setDraftVersion(result.current.version)
          return
        }
        if (result.ok) setDraftVersion(result.current.version)
      })
    }, 900)
    return () => clearTimeout(timer)
  }, [phase, order, done, draftVersion, draftLocked, saveTastingDraft])

  function moveItem(index, direction) {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    triggerHaptic('light')
    setFeedback(null)
    setOrder(prev => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  useEffect(() => {
    const format = FORMATS.find(item => item.id === selected)
    setFormat(format ? { id: format.id, label: format.label, desc: format.desc, burnTime: format.burnTime } : null)
    if (format) setSmokeCraftFormat({ id: format.id, name: format.label, desc: format.desc })
  }, [selected, setFormat, setSmokeCraftFormat])

  function handleSave() {
    if (!selected) return
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
      setFeedback({ correct: false, message: 'Not quite the right order. Arrange the shapes from shortest to longest burn time.' })
      return
    }

    setFeedback({ correct: true, message: 'Correct — ordered from shortest to longest burn time.' })
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
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#050505', color: 'rgba(229,226,225,.7)', fontFamily: 'Georgia, serif' }}>
        Loading…
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#050505', color: '#e2a664', fontFamily: 'Georgia, serif' }}>
        <p style={{ margin: 0 }}>Something went wrong loading this session.</p>
        <button type="button" onClick={handleRetryLoad} style={{ minHeight: 44, padding: '0 18px', borderRadius: 20, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  return (
    <>
      <SmokeCraftScreenShell mode="live" status="ready">
        <div style={pageShellStyle}>
        <SmokeCraftHeroCrop assetKey="formatHero" label="A cigar and lighter, ready to smoke" bgPosition="center" bgSize="cover" />
          <div style={heroBannerStyle}>
            <div aria-hidden="true" style={{ fontSize: 40 }}>📏</div>
            <div>
              <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Shape, Size & Burn Time</div>
              <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Choose Your Format</h1>
              <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
                Shape and ring gauge change burn time, draw, temperature, and how a blend develops. Pick a format, then complete the burn-time sequence.
              </p>
            </div>
          </div>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Select a cigar format</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
              {FORMATS.map(format => {
                const active = selected === format.id
                return (
                  <button
                    key={format.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => { triggerHaptic('light'); setSelected(active ? null : format.id); setSaveStatus('idle') }}
                    style={{
                      minHeight: 150,
                      padding: 16,
                      textAlign: 'left',
                      borderRadius: 12,
                      border: `1px solid ${active ? GOLD : BORDER}`,
                      background: active ? 'rgba(233,193,118,.12)' : GLASS,
                      color: CREAM,
                      cursor: 'pointer',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <strong style={{ color: GOLD, fontSize: 17 }}>{active ? '✓ ' : ''}{format.label}</strong>
                      <span style={{ fontSize: 12, color: GOLD_DIM }}>{format.desc}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14, fontSize: 12.5 }}>
                      <span>Burn: {format.burnTime}</span>
                      <span>Draw: {format.drawFeel}</span>
                      <span>Length: {format.lengthIn}"</span>
                      <span>Ring: {format.ringGauge}</span>
                    </div>
                    <p style={{ margin: '12px 0 0', color: 'rgba(229,226,225,.58)', lineHeight: 1.45, fontSize: 12.5 }}>{format.notes}</p>
                  </button>
                )
              })}
            </div>

            {activeFmt && (
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', background: '#0d1420', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
                <div>
                  <div style={{ color: GOLD, fontWeight: 700 }}>{activeFmt.label} selected</div>
                  <div style={{ marginTop: 4, color: 'rgba(229,226,225,.58)', fontSize: 12.5 }}>{activeFmt.notes}</div>
                </div>
                <button type="button" onClick={handleSave} style={{ minHeight: 44, padding: '0 16px', borderRadius: 8, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>
                  {saveStatus === 'saved' ? '✓ Format Saved' : 'Save Format'}
                </button>
              </div>
            )}
          </section>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Required Interaction</div>
            <h2 style={{ margin: '8px 0 4px', color: CREAM, fontSize: 'clamp(18px,2.2vw,24px)' }}>Order from shortest to longest burn time</h2>
            <p style={{ margin: '0 0 14px', color: 'rgba(229,226,225,.58)', fontSize: 12.5 }}>Use the arrow controls to move each format until the sequence is correct.</p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {order.map((id, index) => {
                const format = FORMATS.find(item => item.id === id)
                return (
                  <li key={id} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, background: GLASS, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(229,226,225,.42)' }}>#{index + 1}</div>
                    <div style={{ color: GOLD, fontWeight: 700, marginTop: 4 }}>{format?.label}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(229,226,225,.55)', marginTop: 3 }}>{format?.burnTime}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                      <button type="button" aria-label={`Move ${format?.label} earlier`} disabled={index === 0} onClick={() => moveItem(index, -1)} style={{ minWidth: 42, minHeight: 42, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#0d1420', color: GOLD, cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? .35 : 1 }}>↑</button>
                      <button type="button" aria-label={`Move ${format?.label} later`} disabled={index === order.length - 1} onClick={() => moveItem(index, 1)} style={{ minWidth: 42, minHeight: 42, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#0d1420', color: GOLD, cursor: index === order.length - 1 ? 'not-allowed' : 'pointer', opacity: index === order.length - 1 ? .35 : 1 }}>↓</button>
                    </div>
                  </li>
                )
              })}
            </ol>

            {feedback && (
              <div role="alert" style={{ marginTop: 14, borderRadius: 9, padding: 12, border: `1px solid ${feedback.correct ? 'rgba(150,255,180,.45)' : 'rgba(255,150,150,.45)'}`, background: feedback.correct ? 'rgba(20,90,50,.35)' : 'rgba(120,20,20,.35)', color: feedback.correct ? '#d6ffe4' : '#ffdada' }}>
                {feedback.message}
              </div>
            )}
          </section>

          <div style={{ height: 90 }} aria-hidden="true" />
        </div>

        <SmokeCraftLessonInfoButton
          sessionNumber={5}
          totalSessions={TOTAL_SESSIONS}
          phase={1}
          totalPhases={TOTAL_VISITS}
          title="Shape, Size & Burn Time"
          whyItMatters={ENRICHMENT_5?.whyItMatters}
          goldenBox={ENRICHMENT_5?.goldenBox}
        />

        <SmokeCraftNavBar
          primary={done ? 'Checking…' : 'Continue to Request / Purchase →'}
          onPrimary={handleContinue}
          primaryDisabled={done}
          secondary="← Back"
          onSecondary={onBack || (() => navigate('/smokecraft/terroir'))}
        />
      </SmokeCraftScreenShell>
    </>
  )
}
