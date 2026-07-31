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

const ENRICHMENT_6 = getEducationalEnrichment(6)

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'

const CUT_METHODS = ['Straight Cut', 'V-Cut', 'Punch Cut']

const METHOD_TIPS = {
  'Straight Cut': 'Clean guillotine cut removes the cap in one motion. Produces an open, unrestricted draw. Best for Parejo shapes.',
  'V-Cut':        'Creates a wedge channel into the cap. Concentrates smoke through a focused point — enhances flavor intensity.',
  'Punch Cut':    'Circular punch removes a small plug. Minimal cut exposure, tight draw, excellent for Robusto and Toro formats.',
}

const METHOD_WHY = {
  'Straight Cut': 'The Straight Cut is the traditional choice because it removes the entire cap cleanly, opening the full diameter of the cigar for an unrestricted, even draw. It works on nearly every shape and is the most forgiving cut for beginners.',
  'V-Cut':        'The V-Cut is chosen when a taster wants to concentrate the smoke through a narrow channel, which intensifies the flavor at the point of the tongue. It suits cigars with a firm cap and is popular with tasters who prefer a more focused draw.',
  'Punch Cut':    'The Punch Cut is chosen to preserve the structural integrity of the cap while still opening a tight draw. It resists unraveling, making it a preferred method for Robusto and Toro vitolas smoked over a longer session.',
}

const BTN_W = 18.2
const BTN_H = 9.0
const BTN_GAP = 1.2
const CUT_ROW_Y = 42.0

const ACTIVITY_KEY = 'cut-toast-light'
// Real, distinct characteristic labels condensed directly from
// METHOD_TIPS above (not invented) — the matching task the player must
// complete.
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
  const { awardSessionRewards, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { journey, setCutToastLight } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [cutMethod, setCutMethod] = useState(() => journey.cutToastLight?.cut || null)
  const [learnWhyOpen, setLearnWhyOpen] = useState(false)

  // Required-Interaction Closure Package C: the player must match each
  // real cut method to its real defining characteristic — the server
  // independently owns the correct relationship map and never trusts a
  // client-claimed "correct" flag.
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
      if (!result.ok) { setPhase('error'); return }
      setMatches(result.draftData?.matches || {})
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
      setMatches(result.draftData?.matches || {})
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      saveTastingDraft(ACTIVITY_KEY, { matches }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setDraftLocked(true); return }
        if (result.conflict) { setMatches(result.current.draftData?.matches || {}); setDraftVersion(result.current.version); return }
        if (result.ok) setDraftVersion(result.current.version)
      })
    }, 900)
    return () => clearTimeout(t)
  }, [phase, matches, done, draftVersion, draftLocked, saveTastingDraft])

  function setMatch(itemId, categoryId) {
    triggerHaptic('light')
    setFeedback(null)
    setMatches(prev => ({ ...prev, [itemId]: categoryId || null }))
  }

  // Auto-persist to canonical journey state (Saved state)
  useEffect(() => {
    if (cutMethod) {
      setCutToastLight({ ...(journey.cutToastLight || {}), cut: cutMethod })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutMethod])

  function pick(method) {
    triggerHaptic('light')
    setCutMethod(prev => (prev === method ? null : method))
  }

  const tip = cutMethod ? METHOD_TIPS[cutMethod] : null
  const why = cutMethod ? METHOD_WHY[cutMethod] : null

  const allMatched = MATCH_ITEMS.every(item => matches[item.id])

  async function handleContinue() {
    if (done) return
    if (!cutMethod) return
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
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: 'rgba(229,226,225,0.7)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        Loading…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#050505', color: 'rgba(229,170,100,0.9)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        <p style={{ margin: 0 }}>Something went wrong loading this session.</p>
        <button type="button" onClick={handleRetryLoad} style={{ background: 'transparent', border: '1.5px solid #E9C176', borderRadius: 20, color: '#E9C176', fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.cutToastLight}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Choose Your Cut"
      >
        {CUT_METHODS.map((method, i) => {
          const active = cutMethod === method
          const x = 3.7 + i * (BTN_W + BTN_GAP)
          return (
            <button
              key={method}
              type="button"
              aria-label={method}
              aria-pressed={active}
              onClick={() => pick(method)}
              style={{
                position: 'absolute',
                left: `${x}%`, top: `${CUT_ROW_Y}%`,
                width: `${BTN_W}%`, height: `${BTN_H}%`,
                pointerEvents: 'auto',
                background: 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 3, right: 5,
                  fontSize: 'clamp(9px,1.0vw,12px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Learn Why toggle */}
        <button
          type="button"
          onClick={() => setLearnWhyOpen(prev => !prev)}
          aria-pressed={learnWhyOpen}
          style={{
            position: 'absolute',
            left: '3.7%', top: '56%', width: `${BTN_W}%`, height: '6%',
            pointerEvents: 'auto',
            background: 'transparent',
            border: `1.5px solid ${GOLD}`,
            borderRadius: 4,
            color: GOLD,
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(9px,0.9vw,12px)',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          {learnWhyOpen ? 'Hide Why ▲' : 'Learn Why ▼'}
        </button>

        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* Required matching interaction — accessible non-drag alternative (native selects) */}
        <div style={{
          position: 'absolute', left: '3%', top: '5%', width: '94%', height: '30%',
          background: '#050505', border: '1px solid rgba(233,193,118,0.28)', borderRadius: 8,
          boxSizing: 'border-box', padding: 'clamp(6px,1vw,12px)', pointerEvents: 'auto',
          fontFamily: 'Georgia, serif', zIndex: 3,
        }}>
          <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Required: Match each cut method to its characteristic
          </div>
          {MATCH_ITEMS.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <label htmlFor={`match-${item.id}`} style={{ fontSize: 'clamp(8px,0.75vw,10px)', color: GOLD, width: 92, flexShrink: 0 }}>{item.label}</label>
              <select
                id={`match-${item.id}`}
                aria-label={`Characteristic for ${item.label}`}
                value={matches[item.id] || ''}
                onChange={e => setMatch(item.id, e.target.value)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(233,193,118,0.3)',
                  borderRadius: 4, color: '#e5e2e1', fontSize: 'clamp(8px,0.72vw,10px)', padding: '4px 6px',
                  fontFamily: 'Georgia, serif', outline: 'none',
                }}
              >
                <option value="">— Select a characteristic —</option>
                {MATCH_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Learn Why panel */}
        {learnWhyOpen && (
          <div style={{
            position: 'absolute',
            left: '3%', top: '63%', width: '94%', height: '18%',
            background: 'rgba(5,5,5,0.94)',
            border: '1px solid rgba(233,193,118,0.3)',
            borderRadius: 5, boxSizing: 'border-box',
            padding: 'clamp(6px,1vw,12px) clamp(8px,1vw,14px)',
            overflow: 'auto',
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(8px,0.75vw,10px)',
            color: 'rgba(229,226,225,0.85)',
            lineHeight: 1.5,
            pointerEvents: 'auto',
          }}>
            {why || 'Select a cut above to learn why it is chosen.'}
          </div>
        )}

        {/* Instruction tip panel — bottom strip */}
        {tip && !learnWhyOpen && (
          <div style={{
            position: 'absolute',
            left: '3%', top: '83%', width: '94%', height: '12%',
            background: 'rgba(5,5,5,0.9)',
            border: '1px solid rgba(233,193,118,0.22)',
            borderRadius: 5, boxSizing: 'border-box',
            padding: 'clamp(5px,0.8vw,10px) clamp(8px,1vw,14px)',
            display: 'flex', alignItems: 'center', gap: 10,
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 'clamp(9px,1.1vw,14px)', color: GOLD, flexShrink: 0 }}>◦</span>
            <span style={{
              fontSize: 'clamp(8px,0.75vw,10px)',
              color: 'rgba(229,226,225,0.75)',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.4,
            }}>
              <strong style={{ color: GOLD, marginRight: 4 }}>{cutMethod}:</strong>
              {tip}
            </span>
          </div>
        )}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftLessonInfoButton
        sessionNumber={6} totalSessions={TOTAL_SESSIONS} phase={1} totalPhases={TOTAL_VISITS}
        title="Cut, Toast & Light" whyItMatters={ENRICHMENT_6?.whyItMatters} goldenBox={ENRICHMENT_6?.goldenBox}
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
        primary={done ? 'Checking…' : 'Continue to Lighting Tutorial →'}
        onPrimary={handleContinue}
        primaryDisabled={!cutMethod || done}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/request-purchase')}
      />
    </>
  )
}
