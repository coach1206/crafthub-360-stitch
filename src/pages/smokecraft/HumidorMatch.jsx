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

const ENRICHMENT_2 = getEducationalEnrichment(2)

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'
// Root-cause fix: this panel sits over a baked "Live Control" panel already
// drawn into the approved image. A non-opaque background (previously
// rgba(5,5,5,0.92)) let ~8% of the baked pixels bleed through, producing a
// ghosted double-text effect. Must be fully opaque — same class of bug
// found and fixed on Golden Box's masks earlier this session.
const PANEL = {
  background: '#050505',
  border: '1px solid rgba(233,193,118,0.28)',
  borderRadius: 8,
  position: 'absolute',
  boxSizing: 'border-box',
  fontFamily: 'Georgia, serif',
}

const HUMIDOR_ZONES = [
  { id: 'virtual_humidor', label: 'Virtual Humidor', x: 18.7, y: 24.3, w: 41.4, h: 12.3 },
  { id: 'dry_box',         label: 'Dry Box',         x: 18.7, y: 39.5, w: 41.4, h: 12.7 },
  { id: 'travel_case',     label: 'Travel Case',     x: 18.7, y: 54.9, w: 41.4, h: 12.6 },
]

const CIGAR_PRESETS = [
  { name: 'Oliva Serie V',        origin: 'Nicaragua',          wrapper: 'Habano Maduro',   strength: 'Full',        body: 'Full',   tastingProfile: 'Dark chocolate, leather, espresso' },
  { name: 'Arturo Fuente Opus X', origin: 'Dominican Republic', wrapper: 'Dominican',       strength: 'Full',        body: 'Full',   tastingProfile: 'Spice, cedar, roasted coffee' },
  { name: 'Padron 1964 Series',   origin: 'Nicaragua',          wrapper: 'Natural Maduro',  strength: 'Medium-Full', body: 'Full',   tastingProfile: 'Cocoa, earth, toasted nuts' },
  { name: 'Macanudo Café',        origin: 'Dominican Republic', wrapper: 'Connecticut',     strength: 'Mild',        body: 'Light',  tastingProfile: 'Cream, cedar, mild spice' },
  { name: 'CAO Flathead',         origin: 'Nicaragua',          wrapper: 'Cameroon',        strength: 'Medium',      body: 'Medium', tastingProfile: 'Sweet oak, leather, black cherry' },
  { name: 'Romeo y Julieta 1875', origin: 'Dominican Republic', wrapper: 'Connecticut',     strength: 'Mild-Medium', body: 'Light',  tastingProfile: 'Toasted wood, hints of honey, smooth' },
  { name: 'My Father Le Bijou',   origin: 'Nicaragua',          wrapper: 'San Andrés',      strength: 'Full',        body: 'Full',   tastingProfile: 'Dark earth, pepper, dried fruit' },
  { name: 'Cohiba Siglo VI',      origin: 'Dominican Republic', wrapper: 'Ecuador Natural', strength: 'Medium',      body: 'Medium', tastingProfile: 'Floral, cedar, subtle pepper' },
]

const CIGAR_LAYOUT = CIGAR_PRESETS.map((c, i) => ({
  ...c,
  x: 1.5 + (i % 4) * 24.5,
  y: i < 4 ? 71.0 : 83.0,
  w: 23.0,
  h: 9.5,
}))

function Stepper({ label, value, unit, onDec, onInc, min, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: 'rgba(229,226,225,0.6)', width: 62, flexShrink: 0 }}>{label}</span>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => { triggerHaptic('light'); onDec() }}
        disabled={value <= min}
        style={{
          width: 20, height: 20, borderRadius: 4,
          border: '1px solid rgba(233,193,118,0.4)', background: 'transparent',
          color: GOLD, cursor: value <= min ? 'not-allowed' : 'pointer',
          fontSize: 14, lineHeight: 1, padding: 0, outline: 'none',
          opacity: value <= min ? 0.4 : 1,
        }}
      >−</button>
      <span style={{ fontSize: 'clamp(9px,0.8vw,11px)', color: GOLD, fontWeight: 700, minWidth: 38, textAlign: 'center' }}>
        {value}{unit}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => { triggerHaptic('light'); onInc() }}
        disabled={value >= max}
        style={{
          width: 20, height: 20, borderRadius: 4,
          border: '1px solid rgba(233,193,118,0.4)', background: 'transparent',
          color: GOLD, cursor: value >= max ? 'not-allowed' : 'pointer',
          fontSize: 14, lineHeight: 1, padding: 0, outline: 'none',
          opacity: value >= max ? 0.4 : 1,
        }}
      >+</button>
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: 'rgba(229,226,225,0.6)' }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => { triggerHaptic('light'); onChange(!value) }}
        style={{
          width: 36, height: 18, borderRadius: 9,
          border: `1px solid ${value ? GOLD : 'rgba(233,193,118,0.3)'}`,
          background: value ? 'rgba(233,193,118,0.2)' : 'transparent',
          cursor: 'pointer', outline: 'none', position: 'relative', padding: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: value ? GOLD : 'rgba(229,226,225,0.4)',
          transition: 'left 0.15s, background 0.15s',
        }} />
      </button>
    </div>
  )
}

const ACTIVITY_KEY = 'humidor-match'

export default function HumidorMatch({ onBack, onComplete } = {}) {
  const { awardSessionRewards, setHumidorMatchSelection, setSelectedHumidorRecommendation, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { journey, setSelectedCigar } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Load from canonical journey state
  const savedCigar = journey.selectedCigar

  // Required-Interaction Closure Package C: the environment zone
  // selection below (Virtual Humidor / Dry Box / Travel Case) is the
  // real, server-evaluated "image-based selection" interaction for this
  // session — the server independently knows which of the three is the
  // factually correct climate-controlled storage choice. The rest of
  // this screen's rich simulation (temp/humidity/seal/airflow, cigar
  // picker) is unchanged and still persisted locally as before.
  const [phase, setPhase] = useState('loading')
  const [draftVersion, setDraftVersion] = useState(0)
  const [selectedEnv,   setSelectedEnv]   = useState(null)
  const [selectedCigar, setLocalCigar]    = useState(() => savedCigar?.name ? savedCigar : null)
  const [temp,          setTemp]          = useState(() => savedCigar?.humidorTemp || 70)
  const [humidity,      setHumidity]      = useState(() => savedCigar?.humidorHumidity || 70)
  const [sealOn,        setSealOn]        = useState(() => savedCigar?.humidorSeal ?? false)
  const [airflowOn,     setAirflowOn]     = useState(() => savedCigar?.humidorAirflow ?? true)
  const [applyStatus,   setApplyStatus]   = useState('idle')
  const [done,          setDone]          = useState(false)
  const [draftLocked,   setDraftLocked]   = useState(false)
  const [feedback,      setFeedback]      = useState(null) // { correct: bool, message } | null

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) { setPhase('error'); return }
      setSelectedEnv(result.draftData?.selectedId || savedCigar?.humidorEnv || null)
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
      setSelectedEnv(result.draftData?.selectedId || null)
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      saveTastingDraft(ACTIVITY_KEY, { selectedId: selectedEnv }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setDraftLocked(true); return }
        if (result.conflict) { setSelectedEnv(result.current.draftData?.selectedId || null); setDraftVersion(result.current.version); return }
        if (result.ok) setDraftVersion(result.current.version)
      })
    }, 900)
    return () => clearTimeout(t)
  }, [phase, selectedEnv, done, draftVersion, draftLocked, saveTastingDraft])

  // Persist all humidor state to canonical journey via selectedCigar
  useEffect(() => {
    if (selectedCigar) {
      setSelectedCigar({
        name:             selectedCigar.name,
        origin:           selectedCigar.origin,
        wrapper:          selectedCigar.wrapper,
        strength:         selectedCigar.strength,
        body:             selectedCigar.body,
        tastingProfile:   selectedCigar.tastingProfile,
        humidorEnv:       selectedEnv,
        humidorTemp:      temp,
        humidorHumidity:  humidity,
        humidorSeal:      sealOn,
        humidorAirflow:   airflowOn,
      })
    }
  }, [selectedCigar, selectedEnv, temp, humidity, sealOn, airflowOn]) // eslint-disable-line react-hooks/exhaustive-deps

  function pickEnv(envId) {
    triggerHaptic('light')
    const next = envId === selectedEnv ? null : envId
    setSelectedEnv(next)
    setFeedback(null)
    if (applyStatus === 'applied') setApplyStatus('idle')
  }

  function pickCigar(cigar) {
    triggerHaptic('light')
    const next = selectedCigar?.name === cigar.name ? null : cigar
    setLocalCigar(next)
  }

  function handleApply() {
    triggerHaptic('medium')
    // Persist settings through journey context (done via useEffect above)
    setApplyStatus('applied')
  }

  async function handleContinue() {
    if (done) return
    if (!selectedEnv) {
      setFeedback({ correct: false, message: 'Select a storage environment before continuing.' })
      return
    }
    setDone(true)
    triggerHaptic('medium')

    // Required-Interaction Closure Package C: the server independently
    // evaluates which environment is the factually correct climate-
    // controlled storage choice — never a client-trusted claim.
    const result = await submitSelectionAttempt('humidor-match', { selectedId: selectedEnv })
    if (!result.ok) {
      setDone(false)
      setFeedback({ correct: false, message: 'Unable to submit your selection right now. Please try again.' })
      return
    }
    if (!result.data.correct) {
      setDone(false)
      setFeedback({ correct: false, message: 'Not quite — that environment does not offer real climate control. Try again.' })
      return
    }
    setFeedback({ correct: true, message: 'Correct — a real humidor keeps consistent temperature and humidity.' })

    const envLabel = HUMIDOR_ZONES.find(e => e.id === selectedEnv)?.label || selectedEnv
    setHumidorMatchSelection({ id: selectedEnv, label: envLabel, desc: `Environment: ${envLabel}` })
    setSelectedHumidorRecommendation({
      recommendationType: 'guest_selected',
      environment: selectedEnv,
      environmentLabel: envLabel,
      selectedCigarName: selectedCigar?.name || null,
      settings: { temp, humidity, sealOn, airflowOn },
    })
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('humidor-match')
    navigate('/smokecraft/meet-your-cigar')
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
        src={SC_ASSETS.humidorMatch}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Humidor Match — Select Your Cigar"
      >
        {/* Nav mask — covers image-drawn navigation */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {HUMIDOR_ZONES.map(zone => {
          const active = selectedEnv === zone.id
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => pickEnv(zone.id)}
              style={{
                position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto', background: 'transparent',
                border: `2.5px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', padding: 0, outline: 'none',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 'clamp(9px,1.2vw,14px)',
                  fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Environment controls panel */}
        <div style={{ ...PANEL, left: '63%', top: '22%', width: '34%', height: '46%',
          padding: 'clamp(6px,1vw,14px)', pointerEvents: 'auto' }}>
          <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.55)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            ◦ Manual Mode — No Hardware Connected
          </div>
          {selectedEnv && (
            <div style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: GOLD, fontWeight: 700, marginBottom: 10, letterSpacing: '0.04em' }}>
              {HUMIDOR_ZONES.find(z => z.id === selectedEnv)?.label}
            </div>
          )}
          <Stepper label="Temperature" value={temp} unit="°F" min={60} max={80}
            onDec={() => setTemp(v => Math.max(60, v - 1))} onInc={() => setTemp(v => Math.min(80, v + 1))} />
          <Stepper label="Humidity" value={humidity} unit="%" min={55} max={80}
            onDec={() => setHumidity(v => Math.max(55, v - 1))} onInc={() => setHumidity(v => Math.min(80, v + 1))} />
          <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', margin: '10px 0 8px' }} />
          <Toggle label="Seal" value={sealOn} onChange={setSealOn} />
          <Toggle label="Airflow" value={airflowOn} onChange={setAirflowOn} />
          <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', margin: '10px 0 8px' }} />
          <button
            type="button"
            aria-label="Apply humidor settings"
            onClick={handleApply}
            style={{
              width: '100%', padding: '5px 0', borderRadius: 5,
              border: `1px solid ${applyStatus === 'applied' ? 'rgba(233,193,118,0.5)' : GOLD}`,
              background: applyStatus === 'applied' ? 'rgba(233,193,118,0.12)' : 'rgba(233,193,118,0.08)',
              color: GOLD, fontSize: 'clamp(8px,0.72vw,10px)', fontFamily: 'Georgia, serif',
              fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer', outline: 'none',
            }}
          >
            {applyStatus === 'applied' ? '✓ Settings Applied' : 'Apply Settings'}
          </button>
        </div>

        {CIGAR_LAYOUT.map(cigar => {
          const active = selectedCigar?.name === cigar.name
          return (
            <button
              key={cigar.name}
              type="button"
              aria-label={`${cigar.name}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => pickCigar(cigar)}
              style={{
                position: 'absolute', left: `${cigar.x}%`, top: `${cigar.y}%`,
                width: `${cigar.w}%`, height: `${cigar.h}%`,
                pointerEvents: 'auto', background: 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', outline: 'none',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 3, right: 5, fontSize: 'clamp(8px,0.9vw,11px)',
                  fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
              )}
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftLessonInfoButton
        sessionNumber={2} totalSessions={TOTAL_SESSIONS} phase={1} totalPhases={TOTAL_VISITS}
        title="Choose Your Cigar" whyItMatters={ENRICHMENT_2?.whyItMatters} goldenBox={ENRICHMENT_2?.goldenBox}
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
        primary={done ? 'Checking…' : 'Continue to Meet Your Cigar →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft')}
      />
    </>
  )
}
