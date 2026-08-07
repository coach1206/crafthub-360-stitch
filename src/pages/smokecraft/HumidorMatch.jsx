import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'

const ENRICHMENT_2 = getEducationalEnrichment(2)

// SmokeCraft Humidor Match — Emergency Repair.
//
// ROOT CAUSE of the production defect ("Virtual Humidor = Active" visibly
// shown, but Continue said "Select a storage environment before
// continuing."): this screen previously rendered an approved-looking
// mockup PNG (Humidor Match 1.png) as its entire visible surface — every
// card, the "Active" badge, the Continue/Back/Apply Settings buttons, the
// toggles, and a "STEP 6 OF 17" progress bar were BAKED PIXELS from an
// old AI-generated design mockup, permanently showing "Virtual Humidor
// Active" regardless of real state. The real interactive layer was a set
// of invisible, transparent hotspot buttons positioned on top of that
// artwork. A player never had to click anything to SEE "Active" — the
// artwork always said that — so pressing the real (invisible) Continue
// hotspot with no real selection made correctly failed client-side
// validation, producing a screen that looked selected and said it
// wasn't. The client-side selection state (`selectedEnv`) and the
// Continue validation were never actually out of sync with each other —
// both always read the same `selectedEnv` — the artwork was lying to the
// player about what `selectedEnv` was.
//
// Fix: replace the baked-mockup + invisible-hotspot rendering with real,
// live DOM — every card, control, badge, and button below is real React
// state and a real element. The lounge photography is gone from this
// screen entirely (it added no functional value and was the source of
// the defect); the navy/charcoal/champagne-gold identity is preserved
// via SmokeCraftScreenShell's `mode="live"` contract (already the
// established pattern for real-DOM SmokeCraft screens).
//
// "STEP 6 OF 17" was never real progression metadata — it was decorative
// text baked into that same mockup, unrelated to the canonical 27-session
// spine (src/constants/session.js: session 2 of 27, phase 1 of 6 — the
// exact values SmokeCraftLessonInfoButton below already renders from the
// real manifest). It is gone along with the rest of the baked artwork.

const GOLD    = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.55)'
const CREAM   = '#e5e2e1'
const BORDER  = 'rgba(233,193,118,0.22)'
const GLASS   = 'rgba(233,193,118,0.06)'
const GLASS_ACTIVE = 'rgba(233,193,118,0.12)'

const HUMIDOR_ZONES = [
  { id: 'virtual_humidor', label: 'Virtual Humidor', desc: 'Classic humidor conditions for optimal balance.', temp: 70, humidity: 70, badge: 'Climate-controlled' },
  { id: 'dry_box',         label: 'Dry Box',         desc: 'Tighter draw, slower burn — ideal for long-term rest.', temp: 68, humidity: 62, badge: 'Passive storage' },
  { id: 'travel_case',     label: 'Travel Case',     desc: 'Sealed environment for field conditions.', temp: 69, humidity: 65, badge: 'Sealed, no climate control' },
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

function Stepper({ label, value, unit, onDec, onInc, min, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', width: 90, flexShrink: 0 }}>{label}</span>
      <button
        type="button" aria-label={`Decrease ${label}`}
        onClick={() => { triggerHaptic('light'); onDec() }}
        disabled={value <= min}
        style={{
          width: 44, height: 44, borderRadius: 8,
          border: `1px solid ${GOLD_DIM}`, background: 'transparent',
          color: GOLD, cursor: value <= min ? 'not-allowed' : 'pointer',
          fontSize: 18, lineHeight: 1, padding: 0, outline: 'none',
          opacity: value <= min ? 0.4 : 1, touchAction: 'manipulation',
        }}
      >−</button>
      <span style={{ fontSize: 15, color: GOLD, fontWeight: 700, minWidth: 56, textAlign: 'center' }}>
        {value}{unit}
      </span>
      <button
        type="button" aria-label={`Increase ${label}`}
        onClick={() => { triggerHaptic('light'); onInc() }}
        disabled={value >= max}
        style={{
          width: 44, height: 44, borderRadius: 8,
          border: `1px solid ${GOLD_DIM}`, background: 'transparent',
          color: GOLD, cursor: value >= max ? 'not-allowed' : 'pointer',
          fontSize: 18, lineHeight: 1, padding: 0, outline: 'none',
          opacity: value >= max ? 0.4 : 1, touchAction: 'manipulation',
        }}
      >+</button>
    </div>
  )
}

function Toggle({ label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, minHeight: 44 }}>
      <div>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.85)' }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.45)' }}>{sub}</div>}
      </div>
      <button
        type="button" role="switch" aria-checked={value} aria-label={label}
        onClick={() => { triggerHaptic('light'); onChange(!value) }}
        style={{
          width: 48, height: 28, borderRadius: 14, flexShrink: 0,
          border: `1px solid ${value ? GOLD : GOLD_DIM}`,
          background: value ? 'rgba(233,193,118,0.22)' : 'transparent',
          cursor: 'pointer', outline: 'none', position: 'relative', padding: 0,
          touchAction: 'manipulation',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: value ? 22 : 3,
          width: 20, height: 20, borderRadius: '50%',
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

  const savedCigar = journey.selectedCigar

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

  function pickEnv(zone) {
    triggerHaptic('light')
    const next = zone.id === selectedEnv ? null : zone.id
    setSelectedEnv(next)
    setFeedback(null)
    if (applyStatus === 'applied') setApplyStatus('idle')
    if (next) { setTemp(zone.temp); setHumidity(zone.humidity) }
  }

  function pickCigar(cigar) {
    triggerHaptic('light')
    const next = selectedCigar?.name === cigar.name ? null : cigar
    setLocalCigar(next)
  }

  function handleApply() {
    triggerHaptic('medium')
    // Apply Settings must never clear the selected environment — it only
    // confirms the current temp/humidity/seal/airflow values, which are
    // already persisted via the useEffect above regardless of this click.
    setApplyStatus('applied')
  }

  async function handleContinue() {
    if (done) return
    if (!selectedEnv) {
      setFeedback({ correct: false, message: 'Choose a storage environment to continue.' })
      return
    }
    setDone(true)
    triggerHaptic('medium')

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

  // Rendered inside SmokeCraftScreenRenderer's own `mode="live"`
  // SmokeCraftScreenShell (App.jsx routes /smokecraft/humidor-match
  // through SmokeCraftScreenRenderer screenId="session-2", which already
  // wraps every screen it renders) — no second shell wrap here, just the
  // loading/error states this screen needs on top of that.
  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(229,226,225,0.7)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        Loading…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: '60vh', color: 'rgba(229,170,100,0.9)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        <p style={{ margin: 0 }}>Something went wrong loading this session.</p>
        <button type="button" onClick={handleRetryLoad} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 44 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(16px,3vw,32px)', paddingBottom: 110 }}>

        {/* ── Instructional header (Part 3) — concise, premium, real DOM ── */}
        <div style={{
          background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
          padding: 'clamp(14px,2.5vw,22px)', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: GOLD_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            Session 2 of {TOTAL_SESSIONS} · Phase 1 of {TOTAL_VISITS}
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(20px,2.6vw,28px)', color: CREAM, fontFamily: 'Georgia, serif' }}>
            Humidor Match
          </h1>
          <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.5, color: 'rgba(229,226,225,0.75)' }}>
            Learn how storage temperature, humidity, airflow, and sealing affect a cigar before it's ever smoked.
          </p>
          <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12.5, lineHeight: 1.9, color: 'rgba(229,226,225,0.65)' }}>
            <li>Choose one storage environment below.</li>
            <li>Adjust or review its temperature, humidity, seal, and airflow.</li>
            <li>Apply the settings.</li>
            <li>Continue.</li>
          </ol>
        </div>

        {/* ── Environment cards — real selection, real "Active" state ── */}
        <div role="radiogroup" aria-label="Storage environment" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {HUMIDOR_ZONES.map(zone => {
            const active = selectedEnv === zone.id
            return (
              <button
                key={zone.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
                onClick={() => pickEnv(zone)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  textAlign: 'left', width: '100%', minHeight: 72,
                  padding: 'clamp(12px,1.8vw,18px)', borderRadius: 10,
                  background: active ? GLASS_ACTIVE : GLASS,
                  border: `1.5px solid ${active ? GOLD : BORDER}`,
                  cursor: 'pointer', outline: 'none', touchAction: 'manipulation',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: CREAM }}>{zone.label}</span>
                    {active && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0a0603', background: GOLD, borderRadius: 10, padding: '2px 8px', letterSpacing: '0.04em' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>{zone.desc}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right', fontSize: 11, color: GOLD_DIM }}>
                  {zone.temp}°F · {zone.humidity}% RH
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Environment controls — only meaningful once an environment is selected ── */}
        <div style={{
          background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
          padding: 'clamp(14px,2.5vw,20px)', marginBottom: 20,
          opacity: selectedEnv ? 1 : 0.5,
        }}>
          <div style={{ fontSize: 11, color: GOLD_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            {selectedEnv ? `Adjusting: ${HUMIDOR_ZONES.find(z => z.id === selectedEnv)?.label}` : 'Select an environment to adjust its settings'}
          </div>
          <fieldset disabled={!selectedEnv} style={{ border: 'none', padding: 0, margin: 0 }}>
            <Stepper label="Temperature" value={temp} unit="°F" min={60} max={80}
              onDec={() => setTemp(v => Math.max(60, v - 1))} onInc={() => setTemp(v => Math.min(80, v + 1))} />
            <Stepper label="Humidity" value={humidity} unit="%" min={55} max={80}
              onDec={() => setHumidity(v => Math.max(55, v - 1))} onInc={() => setHumidity(v => Math.min(80, v + 1))} />
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: '12px 0' }} />
            <Toggle label="Seal" sub="Maintains stable humidity" value={sealOn} onChange={setSealOn} />
            <Toggle label="Airflow" sub="Balances circulation" value={airflowOn} onChange={setAirflowOn} />
          </fieldset>
          <button
            type="button"
            aria-label="Apply humidor settings"
            onClick={handleApply}
            disabled={!selectedEnv}
            style={{
              width: '100%', minHeight: 48, marginTop: 14, borderRadius: 8,
              border: `1px solid ${applyStatus === 'applied' ? 'rgba(233,193,118,0.5)' : GOLD}`,
              background: applyStatus === 'applied' ? 'rgba(233,193,118,0.14)' : 'rgba(233,193,118,0.08)',
              color: GOLD, fontSize: 13, fontFamily: 'Georgia, serif', fontWeight: 700,
              letterSpacing: '0.05em', cursor: selectedEnv ? 'pointer' : 'not-allowed',
              outline: 'none', opacity: selectedEnv ? 1 : 0.5, touchAction: 'manipulation',
            }}
          >
            {applyStatus === 'applied' ? '✓ Settings Applied' : 'Apply Settings'}
          </button>
        </div>

        {/* ── Cigar picker — compact real chip grid ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: GOLD_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Choose a cigar for this session (optional)
          </div>
          <div role="radiogroup" aria-label="Cigar selection" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {CIGAR_PRESETS.map(cigar => {
              const active = selectedCigar?.name === cigar.name
              return (
                <button
                  key={cigar.name}
                  type="button" role="radio" aria-checked={active}
                  aria-label={`${cigar.name}${active ? ' (selected)' : ''}`}
                  onClick={() => pickCigar(cigar)}
                  style={{
                    textAlign: 'left', minHeight: 48, padding: '8px 10px', borderRadius: 8,
                    background: active ? GLASS_ACTIVE : 'transparent',
                    border: `1.5px solid ${active ? GOLD : BORDER}`,
                    color: active ? GOLD : 'rgba(229,226,225,0.75)',
                    fontSize: 11.5, cursor: 'pointer', outline: 'none', touchAction: 'manipulation',
                  }}
                >
                  {cigar.name}
                </button>
              )
            })}
          </div>
        </div>

        {feedback && (
          <div role="alert" style={{
            marginBottom: 90,
            background: feedback.correct ? 'rgba(20,90,50,0.9)' : 'rgba(120,20,20,0.9)',
            border: `1px solid ${feedback.correct ? 'rgba(150,255,180,0.5)' : 'rgba(255,150,150,0.5)'}`,
            borderRadius: 8, padding: '10px 14px', color: feedback.correct ? '#d6ffe4' : '#ffdada',
            fontSize: 13, fontFamily: 'Georgia, serif',
          }}>
            {feedback.message}
          </div>
        )}
      </div>

      <SmokeCraftLessonInfoButton
        sessionNumber={2} totalSessions={TOTAL_SESSIONS} phase={1} totalPhases={TOTAL_VISITS}
        title="Choose Your Cigar" whyItMatters={ENRICHMENT_2?.whyItMatters} goldenBox={ENRICHMENT_2?.goldenBox}
      />

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
