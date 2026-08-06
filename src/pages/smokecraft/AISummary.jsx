import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import SmokeCraftTactileCard from '../../components/smokecraft/SmokeCraftTactileCard.jsx'
import SmokeCraftImageSurface from '../../components/smokecraft/SmokeCraftImageSurface.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_21 = getEducationalEnrichment(21)

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

const NA = 'Not recorded this session.'

/**
 * ── AI integration seam ──────────────────────────────────────────────────
 * No real AI/LLM service is connected in this build. If/when one is, wire it
 * here: call the service with `buildSummaryInputs(journey)`, and only use its
 * response (clearly labeled "AI-Generated Summary") when the call actually
 * succeeds. On any failure/absence, fall through to the deterministic
 * `buildDeterministicSummary` below and keep the honest "Session Summary"
 * label — never mix the two labels, and never fabricate a response.
 */
async function fetchAIGeneratedSummary(/* inputs */) {
  // No AI_SUMMARY_SERVICE configured — real call intentionally not attempted.
  return null
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)))
}

function buildSummaryInputs(journey) {
  return {
    selectedCigar: journey.selectedCigar || null,
    meetYourCigar: journey.meetYourCigar || null,
    mentor: journey.mentor || null,
    terroir: journey.terroir || null,
    format: journey.format || null,
    cutToastLight: journey.cutToastLight || null,
    firstThird: journey.firstThird || null,
    flavorMemory: journey.flavorMemory || null,
    pairing: journey.pairing || null,
    secondThird: journey.secondThird || null,
    mentorCommentary: journey.mentorCommentary || null,
    knowledgeDrop: journey.knowledgeDrop || null,
    finalThird: journey.finalThird || null,
    scorecard: journey.scorecard || null,
  }
}

function buildDeterministicSummary(inputs) {
  const {
    selectedCigar, mentor, terroir, format, cutToastLight,
    firstThird, flavorMemory, pairing, secondThird, mentorCommentary,
    knowledgeDrop, finalThird, scorecard,
  } = inputs

  const mentorObj = Array.isArray(mentor) ? mentor[0] : mentor
  const cigarName = selectedCigar?.name || null

  // Session Overview
  const sessionOverview = cigarName
    ? `${cigarName}${selectedCigar.origin ? ` (${selectedCigar.origin})` : ''}${selectedCigar.wrapper ? `, ${selectedCigar.wrapper} wrapper` : ''}.${mentorObj ? ` Guided by ${mentorObj.name}.` : ''}${scorecard?.meta?.durationMinutes ? ` Session duration: ${scorecard.meta.durationMinutes} min.` : ''}`
    : NA

  // Flavor Profile Summary
  const allFlavorNotes = uniq([
    ...(firstThird?.notesSelected || []),
    ...(secondThird?.notesSelected || []),
    ...(finalThird?.notesSelected || []),
  ])
  const flavorProfileSummary = allFlavorNotes.length
    ? `Notes observed across the session: ${allFlavorNotes.join(', ')}.`
    : NA

  // Strength and Body Progression
  const focusNotes = finalThird?.focusSelected?.length ? finalThird.focusSelected.join(', ') : null
  const strengthBodyProgression = selectedCigar?.strength || selectedCigar?.body || focusNotes
    ? `Cataloged strength: ${selectedCigar?.strength || 'not recorded'}. Body: ${selectedCigar?.body || 'not recorded'}.${focusNotes ? ` Final-third focus areas tracked: ${focusNotes}.` : ''}`
    : NA

  // Construction Summary
  const constructionSummary = format || cutToastLight
    ? `${format?.label ? `Shape/size: ${format.label}. ` : ''}${cutToastLight?.cut ? `Cut: ${cutToastLight.cut}. ` : ''}${cutToastLight?.toast ? `Toast: ${cutToastLight.toast}. ` : ''}${cutToastLight?.light ? `Light: ${cutToastLight.light}.` : ''}`.trim() || NA
    : NA

  // Preferred Flavor Notes
  const preferredFlavorNotes = flavorMemory?.selectedFlavors?.length
    ? flavorMemory.selectedFlavors.join(', ')
    : NA

  // Best Tasting Stage — the stage with the most captured flavor notes
  const stages = [
    { label: 'First Third', count: firstThird?.notesSelected?.length || 0 },
    { label: 'Second Third', count: secondThird?.notesSelected?.length || 0 },
    { label: 'Final Third', count: finalThird?.notesSelected?.length || 0 },
  ]
  const topStage = stages.reduce((a, b) => (b.count > a.count ? b : a), stages[0])
  const bestTastingStage = topStage.count > 0
    ? `${topStage.label} (${topStage.count} flavor note${topStage.count === 1 ? '' : 's'} recorded)`
    : NA

  // Pairing Preferences
  const pairingPreferences = pairing?.recommendation
    ? `${pairing.recommendation}${pairing.compatScore != null ? ` — ${pairing.compatScore}% compatibility` : ''}${pairing.pairingGoal ? `. Goal: ${pairing.pairingGoal}` : ''}.`
    : NA

  // Mentor Insight Summary
  const mentorInsightSummary = mentorObj
    ? `${mentorObj.name}${mentorObj.origin ? ` (${mentorObj.origin})` : ''}.${mentorCommentary?.viewedSections?.length ? ` Commentary reviewed: ${mentorCommentary.viewedSections.length}/5 sections.` : ''}`
    : NA

  // Personal Preference Profile
  const prefParts = []
  if (flavorMemory?.selectedFlavors?.length) prefParts.push(`gravitates toward ${flavorMemory.selectedFlavors.slice(0, 3).join(', ')}`)
  if (pairing?.primary) prefParts.push(`prefers ${pairing.primary} pairings`)
  if (scorecard?.personalNotes) prefParts.push('left detailed personal notes this session')
  const personalPreferenceProfile = prefParts.length ? `This guest ${prefParts.join('; ')}.` : NA

  // Suggested Focus for the Next Journey
  let suggestedFocus = NA
  if (scorecard?.categories) {
    const rated = Object.entries(scorecard.categories).filter(([, v]) => v !== null && v !== undefined)
    if (rated.length) {
      const lowest = rated.reduce((a, b) => (b[1] < a[1] ? b : a), rated[0])
      suggestedFocus = `Consider focusing on "${lowest[0]}" next time (rated ${lowest[1]}/5 this session) — exploring a cigar with different construction or origin may help.`
    }
  }
  if (suggestedFocus === NA && knowledgeDrop?.viewedTopics?.length === 0) {
    suggestedFocus = 'Knowledge Drop has unexplored topics — reviewing them may deepen your next tasting.'
  }

  return {
    sessionOverview,
    flavorProfileSummary,
    strengthBodyProgression,
    constructionSummary,
    preferredFlavorNotes,
    bestTastingStage,
    pairingPreferences,
    mentorInsightSummary,
    personalPreferenceProfile,
    suggestedFocus,
    method: 'deterministic',
  }
}

const SECTION_ORDER = [
  ['sessionOverview', 'Session Overview'],
  ['flavorProfileSummary', 'Flavor Profile Summary'],
  ['strengthBodyProgression', 'Strength and Body Progression'],
  ['constructionSummary', 'Construction Summary'],
  ['preferredFlavorNotes', 'Preferred Flavor Notes'],
  ['bestTastingStage', 'Best Tasting Stage'],
  ['pairingPreferences', 'Pairing Preferences'],
  ['mentorInsightSummary', 'Mentor Insight Summary'],
  ['personalPreferenceProfile', 'Personal Preference Profile'],
  ['suggestedFocus', 'Suggested Focus for the Next Journey'],
]

// Canonical Runtime pass — accepts optional onBack/onComplete from
// SmokeCraftScreenRenderer (the migrated route). Falls back to its
// original, unchanged internal navigate()/awardSessionRewards() behavior
// when rendered without them, so this component keeps working exactly as
// before for any other consumer that isn't going through the renderer.
export default function AISummary({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { journey, setAiSummary } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const genToken = useRef(0)

  // Personal Notes (S20, hosted on Scorecard) must be completed first.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('scorecard')) {
      navigate('/smokecraft/scorecard', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState('loading') // loading | incomplete | ready | error | offline
  const [result, setResult] = useState(null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  // Tactile/Haptic Completion pass — each summary section is now a real
  // interactive review control (accept / dismiss / open explanation), not
  // passive text. State is journey-persisted (novee-canonical
  // SmokeCraftJourneyContext, same store, no second interaction-state
  // store) and starts empty — no section is pre-accepted or pre-dismissed.
  const [sectionStates, setSectionStates] = useState(() => journey.aiSummary?.sectionStates || {})
  const [openSection, setOpenSection] = useState(null)

  function reviewSection(key, verdict) {
    setSectionStates(prev => {
      const next = { ...prev, [key]: verdict }
      setAiSummary({ ...(journey.aiSummary || {}), sectionStates: next })
      return next
    })
  }

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const generate = useCallback(async () => {
    const myToken = ++genToken.current
    setPhase('loading')
    try {
      const inputs = buildSummaryInputs(journey)
      const snapshot = JSON.stringify(inputs)

      // Data incompleteness gate — no cigar and no scorecard means there is
      // nothing meaningful to summarize yet.
      if (!inputs.selectedCigar && !inputs.scorecard) {
        if (myToken === genToken.current) setPhase('incomplete')
        return
      }

      // Reuse the cached result if the underlying journey data has not
      // changed since it was last generated — refresh/Back/Continue/Resume
      // must not regenerate an inconsistent result without a real data change.
      if (journey.aiSummary && journey.aiSummary.sourceSnapshot === snapshot) {
        if (myToken === genToken.current) {
          setResult(journey.aiSummary.result)
          setPhase(isOffline ? 'offline' : 'ready')
        }
        return
      }

      const aiResult = await fetchAIGeneratedSummary(inputs)
      const finalResult = aiResult || buildDeterministicSummary(inputs)

      const record = {
        sourceSnapshot: snapshot,
        result: finalResult,
        completedAt: journey.aiSummary?.completedAt || Date.now(),
        generatedAt: Date.now(),
      }
      setAiSummary(record)
      if (myToken === genToken.current) {
        setResult(finalResult)
        setPhase(isOffline ? 'offline' : 'ready')
      }
    } catch (err) {
      if (myToken === genToken.current) setPhase('error')
    }
  }, [journey, setAiSummary, isOffline])

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleContinue() {
    if (result) {
      setAiSummary({
        ...(journey.aiSummary || {}),
        completedAt: journey.aiSummary?.completedAt || Date.now(),
      })
    }
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('ai-summary')
    navigate('/smokecraft/pairing-recommendations')
  }

  const canContinue = phase === 'ready' || phase === 'offline'

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual, reused as a decorative header band. */}
      <SmokeCraftImageSurface
        surface="cinematic-background"
        src={SC_ASSETS.aiSummary}
        alt="SmokeCraft AI Summary"
        decorative
        objectPosition="50% 30%"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}
      />

      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Session Summary
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Your Session Summary
        </h1>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>
          Rule-based summary generated from your saved journey data — not AI-generated.
          {isOffline && phase === 'offline' && ' Offline: showing your locally saved data.'}
        </div>
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(120px,16vh,160px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(28px,5vw,44px)', textAlign: 'center',
            }}>
              <div aria-hidden="true" style={{
                width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%',
                border: `3px solid ${BORDER}`, borderTopColor: GOLD,
                animation: 'sc-spin 0.9s linear infinite',
              }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Compiling your session summary…</p>
              <style>{'@keyframes sc-spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'incomplete' && (
            <div style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 12px', fontSize: 'clamp(14px,1.6vw,16px)', color: 'rgba(229,226,225,0.75)', lineHeight: 1.6 }}>
                Not enough journey data has been saved yet to build a meaningful summary.
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.5)' }}>
                Complete cigar selection and your scorecard, then return here.
              </p>
            </div>
          )}

          {phase === 'error' && (
            <div style={{
              background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>
                Something went wrong building your summary.
              </p>
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); generate() }}
                style={{
                  background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20,
                  color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13,
                  padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {(phase === 'ready' || phase === 'offline') && result && (
            <>
              {SECTION_ORDER.map(([key, label]) => {
                const verdict = sectionStates[key] || null // 'accepted' | 'dismissed' | null
                const isOpen = openSection === key
                return (
                  <div key={key} style={{
                    background: GLASS, border: `1px solid ${verdict === 'accepted' ? GOLD : BORDER}`, borderRadius: 12,
                    padding: 'clamp(14px,2.2vw,20px)',
                  }}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Collapse' : 'Open'} explanation for ${label}`}
                      onClick={() => { triggerHaptic('light'); setOpenSection(isOpen ? null : key) }}
                      style={{
                        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                        minHeight: 44,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {label}
                      </span>
                      <span aria-hidden="true" style={{ color: GOLD_DIM, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                    </button>
                    <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.6, color: result[key] === NA ? 'rgba(229,226,225,0.4)' : CREAM, fontStyle: result[key] === NA ? 'italic' : 'normal' }}>
                      {result[key]}
                    </p>
                    {isOpen && (
                      <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'rgba(229,226,225,0.6)' }}>
                        This insight is derived entirely from the choices and notes you saved during this session (never a fabricated conclusion) — accept it to keep it as part of your record, or dismiss it if it doesn't reflect your experience.
                      </p>
                    )}
                    {result[key] !== NA && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <SmokeCraftTactileCard
                          label={`Accept insight: ${label}`}
                          selected={verdict === 'accepted'}
                          onActivate={() => reviewSection(key, verdict === 'accepted' ? null : 'accepted')}
                          haptic="success"
                          style={{ minWidth: 0, minHeight: 40, flex: '0 0 auto', padding: '6px 14px', flexDirection: 'row', gap: 6, borderRadius: 999, fontSize: 12 }}
                        >
                          ✓ Accept
                        </SmokeCraftTactileCard>
                        <SmokeCraftTactileCard
                          label={`Dismiss insight: ${label}`}
                          selected={verdict === 'dismissed'}
                          onActivate={() => reviewSection(key, verdict === 'dismissed' ? null : 'dismissed')}
                          haptic="warning"
                          style={{ minWidth: 0, minHeight: 40, flex: '0 0 auto', padding: '6px 14px', flexDirection: 'row', gap: 6, borderRadius: 999, fontSize: 12 }}
                        >
                          ✕ Dismiss
                        </SmokeCraftTactileCard>
                      </div>
                    )}
                  </div>
                )
              })}

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: GOLD,
              }}>
                <span aria-hidden="true">✓</span>
                <span>Session Summary ready — sourced entirely from your saved journey data</span>
              </div>
            </>
          )}
        </div>
      </main>

      <SmokeCraftLessonInfoButton
        sessionNumber={21} totalSessions={TOTAL_SESSIONS} phase={5} totalPhases={TOTAL_VISITS}
        title="Session Summary" whyItMatters={ENRICHMENT_21?.whyItMatters} goldenBox={ENRICHMENT_21?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={canContinue ? 'Continue to Pairing Recommendations →' : 'Preparing…'}
        primaryDisabled={!canContinue}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/scorecard'))}
      />
    </div>
  )
}
