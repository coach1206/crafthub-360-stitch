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
import SmokeCraftHeroCrop from '../../components/smokecraft/SmokeCraftHeroCrop.jsx'
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

const ENRICHMENT_6 = getEducationalEnrichment(6)

const CUT_METHODS = ['Straight Cut', 'V-Cut', 'Punch Cut']

const METHOD_TIPS = {
  'Straight Cut': 'Clean guillotine cut removes the cap in one motion. Produces an open, unrestricted draw. Best for Parejo shapes.',
  'V-Cut': 'Creates a wedge channel into the cap. Concentrates smoke through a focused point — enhances flavor intensity.',
  'Punch Cut': 'Circular punch removes a small plug. Minimal cut exposure, tight draw, excellent for Robusto and Toro formats.',
}

const METHOD_WHY = {
  'Straight Cut': 'The Straight Cut is the traditional choice because it removes the entire cap cleanly, opening the full diameter of the cigar for an unrestricted, even draw. It works on nearly every shape and is the most forgiving cut for beginners.',
  'V-Cut': 'The V-Cut is chosen when a taster wants to concentrate the smoke through a narrow channel, which intensifies the flavor at the point of the tongue. It suits cigars with a firm cap and is popular with tasters who prefer a more focused draw.',
  'Punch Cut': 'The Punch Cut is chosen to preserve the structural integrity of the cap while still opening a tight draw. It resists unraveling, making it a preferred method for Robusto and Toro vitolas smoked over a longer session.',
}

const ACTIVITY_KEY = 'cut-toast-light'
const MATCH_ITEMS = [
  { id: 'straight-cut', label: 'Straight Cut' },
  { id: 'v-cut', label: 'V-Cut' },
  { id: 'punch-cut', label: 'Punch Cut' },
]
const MATCH_CATEGORIES = [
  { id: 'full-cap-removal', label: 'Removes the full cap cleanly' },
  { id: 'wedge-channel', label: 'Creates a wedge-shaped channel' },
  { id: 'circular-plug', label: 'Removes a small circular plug' },
]

export default function CutToastLight({ onBack, onComplete } = {}) {
  const navigate = useNavigate()
  const { awardSessionRewards, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { journey, setCutToastLight } = useSmokeCraftJourney()

  const [cutMethod, setCutMethod] = useState(() => journey.cutToastLight?.cut || null)
  const [learnWhyOpen, setLearnWhyOpen] = useState(false)
  const [phase, setPhase] = useState('loading')
  const [matches, setMatches] = useState({})
  const [draftVersion, setDraftVersion] = useState(0)
  const [draftLocked, setDraftLocked] = useState(false)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) {
        setPhase('error')
        return
      }
      setMatches(result.draftData?.matches || {})
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
      setMatches(result.draftData?.matches || {})
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const timer = setTimeout(() => {
      saveTastingDraft(ACTIVITY_KEY, { matches }, draftVersion).then(result => {
        if (result.alreadyCompleted) {
          setDraftLocked(true)
          return
        }
        if (result.conflict) {
          setMatches(result.current.draftData?.matches || {})
          setDraftVersion(result.current.version)
          return
        }
        if (result.ok) setDraftVersion(result.current.version)
      })
    }, 900)
    return () => clearTimeout(timer)
  }, [phase, matches, done, draftVersion, draftLocked, saveTastingDraft])

  useEffect(() => {
    if (cutMethod) setCutToastLight({ ...(journey.cutToastLight || {}), cut: cutMethod })
  }, [cutMethod]) // eslint-disable-line react-hooks/exhaustive-deps

  function pick(method) {
    triggerHaptic('light')
    setCutMethod(prev => prev === method ? null : method)
  }

  function setMatch(itemId, categoryId) {
    triggerHaptic('light')
    setFeedback(null)
    setMatches(prev => ({ ...prev, [itemId]: categoryId || null }))
  }

  const tip = cutMethod ? METHOD_TIPS[cutMethod] : null
  const why = cutMethod ? METHOD_WHY[cutMethod] : null
  const allMatched = MATCH_ITEMS.every(item => matches[item.id])

  async function handleContinue() {
    if (done || !cutMethod) return
    if (!allMatched) {
      setFeedback({ correct: false, message: 'Match all 3 cut methods to their characteristic before continuing.' })
      return
    }

    setDone(true)
    triggerHaptic('medium')
    setCutToastLight({ ...(journey.cutToastLight || {}), cut: cutMethod })

    const result = await submitSelectionAttempt('cut-toast-light', { matches })
    if (!result.ok) {
      setDone(false)
      setFeedback({ correct: false, message: 'Unable to submit your matching right now. Please try again.' })
      return
    }
    if (!result.data.correct) {
      setDone(false)
      setFeedback({ correct: false, message: 'One or more matches are incorrect. Review and try again.' })
      return
    }

    setFeedback({ correct: true, message: 'Correct — all 3 cut methods matched.' })
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('cut-toast-light')
    navigate('/smokecraft/lighting-tutorial')
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
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#050505', color: '#e2aa64', fontFamily: 'Georgia, serif' }}>
        <p style={{ margin: 0 }}>Something went wrong loading this session.</p>
        <button type="button" onClick={handleRetryLoad} style={{ minHeight: 44, padding: '0 18px', borderRadius: 20, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  return (
    <>
      <SmokeCraftScreenShell mode="live" status="ready">
        <div style={pageShellStyle}>
        <SmokeCraftHeroCrop assetKey="cutToastLight" label="Cutting, toasting, and lighting a cigar" bgPosition="72% 0%" bgSize="250%" />
          <div style={heroBannerStyle}>
            <div aria-hidden="true" style={{ fontSize: 40 }}>✂️</div>
            <div>
              <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Preparation</div>
              <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Cut, Toast & Light</h1>
              <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
                Choose a cut method, understand why it changes the draw, then match each method to its defining characteristic.
              </p>
            </div>
          </div>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>1. Choose your cut</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
              {CUT_METHODS.map(method => {
                const active = cutMethod === method
                return (
                  <button
                    key={method}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pick(method)}
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
                    <div style={{ color: GOLD, fontWeight: 700, fontSize: 17 }}>{active ? '✓ ' : ''}{method}</div>
                    <p style={{ margin: '10px 0 0', color: 'rgba(229,226,225,.62)', lineHeight: 1.5, fontSize: 12.5 }}>{METHOD_TIPS[method]}</p>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setLearnWhyOpen(prev => !prev)}
              aria-expanded={learnWhyOpen}
              disabled={!cutMethod}
              style={{ minHeight: 44, marginTop: 14, padding: '0 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: cutMethod ? GOLD : 'rgba(229,226,225,.3)', cursor: cutMethod ? 'pointer' : 'not-allowed' }}
            >
              {learnWhyOpen ? 'Hide Why' : 'Learn Why'}
            </button>

            {learnWhyOpen && (
              <div style={{ marginTop: 12, padding: 14, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#0d1420', color: 'rgba(229,226,225,.72)', lineHeight: 1.55 }}>
                {why || 'Select a cut above to learn why it is chosen.'}
              </div>
            )}
          </section>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>2. Required Matching</div>
            <h2 style={{ margin: '8px 0 4px', color: CREAM, fontSize: 'clamp(18px,2.2vw,24px)' }}>Match each cut to its characteristic</h2>
            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              {MATCH_ITEMS.map(item => (
                <label key={item.id} htmlFor={`match-${item.id}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(130px,.6fr) minmax(220px,1.4fr)', gap: 12, alignItems: 'center', minHeight: 48 }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{item.label}</span>
                  <select
                    id={`match-${item.id}`}
                    aria-label={`Characteristic for ${item.label}`}
                    value={matches[item.id] || ''}
                    onChange={event => setMatch(item.id, event.target.value)}
                    style={{ minHeight: 46, width: '100%', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#0d1420', color: CREAM, padding: '0 12px', fontFamily: 'Georgia, serif' }}
                  >
                    <option value="">— Select a characteristic —</option>
                    {MATCH_CATEGORIES.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </label>
              ))}
            </div>

            {feedback && (
              <div role="alert" style={{ marginTop: 14, borderRadius: 9, padding: 12, border: `1px solid ${feedback.correct ? 'rgba(150,255,180,.45)' : 'rgba(255,150,150,.45)'}`, background: feedback.correct ? 'rgba(20,90,50,.35)' : 'rgba(120,20,20,.35)', color: feedback.correct ? '#d6ffe4' : '#ffdada' }}>
                {feedback.message}
              </div>
            )}
          </section>

          {tip && (
            <section style={{ ...cardStyle, padding: 'clamp(16px,2vw,22px)' }}>
              <div style={sectionLabelStyle}>Technique Tip</div>
              <p style={{ margin: '8px 0 0', color: 'rgba(229,226,225,.68)', lineHeight: 1.55 }}><strong style={{ color: GOLD }}>{cutMethod}:</strong> {tip}</p>
            </section>
          )}

          <div style={{ height: 90 }} aria-hidden="true" />
        </div>

        <SmokeCraftLessonInfoButton
          sessionNumber={6}
          totalSessions={TOTAL_SESSIONS}
          phase={1}
          totalPhases={TOTAL_VISITS}
          title="Cut, Toast & Light"
          whyItMatters={ENRICHMENT_6?.whyItMatters}
          goldenBox={ENRICHMENT_6?.goldenBox}
        />

        <SmokeCraftNavBar
          primary={done ? 'Checking…' : 'Continue to Lighting Tutorial →'}
          onPrimary={handleContinue}
          primaryDisabled={!cutMethod || done}
          secondary="← Back"
          onSecondary={onBack || (() => navigate('/smokecraft/request-purchase'))}
        />
      </SmokeCraftScreenShell>
    </>
  )
}
