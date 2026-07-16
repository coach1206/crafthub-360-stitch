import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { rankAllCategories } from '../../utils/pairingEngine.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)))
}

/** Builds the pairing engine's input context from canonical journey data — reuses
 * the same shape PairingLab (S11) already feeds into buildRecommendation. */
function buildEngineContext(journey) {
  const pairing = journey.pairing || {}
  const cigar = journey.selectedCigar || {}
  const flavorNotes = uniq([
    ...(pairing.flavorNotes || []),
  ])
  return {
    cigarShape: pairing.cigarShape || journey.format?.label || null,
    wrapper: pairing.wrapper || cigar.wrapper || null,
    origin: pairing.origin || cigar.origin || null,
    strength: pairing.strength || cigar.strength || null,
    flavorNotes,
    pairingGoal: pairing.pairingGoal || null,
  }
}

const CATEGORY_INITIAL = (name) => name.charAt(0)

function PairingIcon({ category }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(233,193,118,0.12)', border: `1.5px solid ${GOLD_DIM}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, color: GOLD, fontWeight: 700,
      }}
    >
      {CATEGORY_INITIAL(category)}
    </div>
  )
}

export default function PairingRecommendations() {
  const { awardSessionRewards, session } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { journey, setPairingRecommendations } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // AI Summary (S21) must be completed first.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('ai-summary')) {
      navigate('/smokecraft/ai-summary', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState('loading') // loading | no-cigar | error | ready
  const [ranked, setRanked] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saved
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const engineContext = useMemo(() => buildEngineContext(journey), [journey])

  const generate = useCallback(() => {
    setPhase('loading')
    try {
      if (!journey.selectedCigar) {
        setPhase('no-cigar')
        return
      }
      const all = rankAllCategories(engineContext)
      setRanked(all)
      setPhase('ready')
    } catch {
      setPhase('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.selectedCigar, engineContext])

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist engine input + primary/alternates once ranked (idempotent — same
  // input snapshot does not re-trigger unnecessary writes on every render).
  useEffect(() => {
    if (phase !== 'ready' || !ranked || !ranked.length) return
    const primary = ranked[0]
    const alternates = ranked.slice(1, 4)
    const snapshot = JSON.stringify(engineContext)
    if (journey.pairingRecommendations?.engineInputSnapshot === snapshot) return
    setPairingRecommendations({
      ...(journey.pairingRecommendations || {}),
      engineInput: engineContext,
      engineInputSnapshot: snapshot,
      primary,
      alternates,
      generatedAt: Date.now(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ranked, engineContext])

  const insufficientFlavorData = engineContext.flavorNotes.length === 0 && !engineContext.strength
  const primary = ranked?.[0] || null
  const alternates = ranked?.slice(1, 4) || []
  const noStrongMatch = primary && primary.compatScore < 50

  function handleSave() {
    if (!primary) return
    triggerHaptic('light')
    setPairingRecommendations({
      ...(journey.pairingRecommendations || {}),
      savedRecommendation: { ...primary, savedAt: Date.now() },
    })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function handleContinue() {
    awardSessionRewards('pairing-recommendations')
    navigate('/smokecraft/passport-stamp')
  }

  const canContinue = phase === 'ready' && !!primary

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
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Personalized Pairing Recommendations
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Your Pairing Recommendation
        </h1>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>
          Rule-based recommendation engine — not AI-generated.
          {isOffline && phase === 'ready' && ' Offline: showing your locally saved data.'}
        </div>
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(120px,16vh,160px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(28px,5vw,44px)', textAlign: 'center',
            }}>
              <div aria-hidden="true" style={{
                width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%',
                border: `3px solid ${BORDER}`, borderTopColor: GOLD,
                animation: 'sc-spin2 0.9s linear infinite',
              }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Calculating your pairing recommendation…</p>
              <style>{'@keyframes sc-spin2 { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'no-cigar' && (
            <div style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 'clamp(14px,1.6vw,16px)', color: 'rgba(229,226,225,0.75)', lineHeight: 1.6 }}>
                No cigar has been selected yet. Choose a cigar earlier in your journey to see a personalized pairing recommendation.
              </p>
            </div>
          )}

          {phase === 'error' && (
            <div style={{
              background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>
                Something went wrong building your pairing recommendation.
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

          {phase === 'ready' && primary && (
            <>
              {insufficientFlavorData && (
                <div style={{ background: 'rgba(233,193,118,0.08)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>
                  Insufficient flavor data was recorded this session — this recommendation is based on limited inputs. Complete Suggested Pairings (S11) for a more precise match.
                </div>
              )}
              {noStrongMatch && (
                <div style={{ background: 'rgba(229,170,100,0.08)', border: '1px solid rgba(229,170,100,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(229,170,100,0.85)' }}>
                  No strong pairing match was found — showing the closest available option.
                </div>
              )}

              {/* Primary Recommendation */}
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,2.4vw,24px)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Primary Recommendation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <PairingIcon category={primary.primary} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: CREAM }}>{primary.primary}</div>
                    <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)' }}>No dedicated pairing photography available — neutral icon shown</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div aria-label={`Compatibility score ${primary.compatScore} of 100`} style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: primary.compatScore >= 80 ? GOLD : primary.compatScore >= 60 ? '#c8a84b' : 'rgba(229,226,225,0.7)' }}>
                      {primary.compatScore}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compatibility</div>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Why It Works</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: CREAM }}>{primary.whyItWorks}</p>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Possible Clashes</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: primary.possibleClashes ? 'rgba(229,170,100,0.85)' : 'rgba(229,226,225,0.4)', fontStyle: primary.possibleClashes ? 'normal' : 'italic' }}>
                    {primary.possibleClashes || 'None identified.'}
                  </p>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Suggested Adjustments</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: CREAM }}>{primary.suggestedAdjustment}</p>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Matching Flavor Notes</div>
                  {primary.selectedFlavorNotes.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {primary.selectedFlavorNotes.map(n => (
                        <span key={n} style={{
                          fontSize: 11, color: primary.flavorHarmony.includes(n) ? GOLD : 'rgba(229,226,225,0.5)',
                          border: `1px solid ${primary.flavorHarmony.includes(n) ? GOLD : 'rgba(233,193,118,0.25)'}`,
                          borderRadius: 10, padding: '2px 8px',
                        }}>{n}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.4)', fontStyle: 'italic' }}>No flavor notes recorded this session.</p>
                  )}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Recommended Serving Style</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: CREAM }}>{primary.servingStyle}</p>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(233,193,118,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Venue Availability</div>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.45)', fontStyle: 'italic' }}>
                    Venue inventory data is not connected in this build — availability cannot be shown honestly, so none is displayed.
                  </p>
                </div>
              </div>

              {/* Alternate Recommendations */}
              {alternates.length > 0 && (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Alternate Recommendations
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alternates.map(alt => (
                      <div key={alt.primary} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <PairingIcon category={alt.primary} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: CREAM }}>{alt.primary}</div>
                          <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)' }}>{alt.whyItWorks}</div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: GOLD_DIM }}>{alt.compatScore}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { triggerHaptic('light'); navigate('/smokecraft/pairing-lab') }}
                  style={{
                    background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20,
                    color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13,
                    padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40,
                  }}
                >
                  Open Pairing Lab
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  aria-label="Save this pairing recommendation"
                  style={{
                    background: saveStatus === 'saved' ? 'rgba(233,193,118,0.18)' : 'transparent',
                    border: `1.5px solid ${GOLD}`, borderRadius: 20,
                    color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13,
                    padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40,
                  }}
                >
                  {saveStatus === 'saved' ? '✓ Saved' : 'Save Recommendation'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        primary={canContinue ? 'Continue to Passport Stamp →' : 'Preparing…'}
        primaryDisabled={!canContinue}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/ai-summary')}
      />
    </div>
  )
}
