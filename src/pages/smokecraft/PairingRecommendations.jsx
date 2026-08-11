import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import { useSmokeCraftPairingEngine } from '../../hooks/useSmokeCraftPairingEngine.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import {
  GOLD, GOLD_DIM, CREAM, BORDER, GLASS,
  heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'
import SmokeCraftOwnerHeroBackground from '../../components/smokecraft/SmokeCraftOwnerHeroBackground.jsx'

const ENRICHMENT_22 = getEducationalEnrichment(22)

/**
 * PairingRecommendations — /smokecraft/pairing-recommendations (S22)
 *
 * TWO-GENERATION MIGRATION — replaces SmokeCraftImageBoundsOverlay (the
 * whole visual foundation was an approved reference image with real
 * controls occluding its baked preference values, score donut,
 * recommendation cards, and alternates list) with the shared live-DOM
 * card system. No decorative image is used, consistent with the other
 * screens converted this pass.
 *
 * All logic preserved verbatim: the AI-Summary (S21) prerequisite
 * redirect, the server-authoritative pairing engine (requestRanking),
 * generate/retry, the no-cigar/loading/error/ready phases, idempotent
 * persistence of the engine input snapshot, promote-to-primary /
 * reject-alternate with journey persistence, save-recommendation,
 * offline detection, and haptics.
 */

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
    // Block 8 self-QA fix: pairingType was never included here, so every
    // call to the server-authoritative /rank and /recommend endpoints
    // 400'd with pairing_type_required — phase could never reach 'ready'
    // and Continue stayed disabled forever. pairing.pairingType is set by
    // Pairing Lab (S11); default to the first of pairingTypes if present.
    pairingType: pairing.pairingType || (pairing.pairingTypes && pairing.pairingTypes[0]) || null,
    cigarShape: pairing.cigarShape || journey.format?.label || null,
    wrapper: pairing.wrapper || cigar.wrapper || null,
    origin: pairing.origin || cigar.origin || null,
    strength: pairing.strength || cigar.strength || null,
    flavorNotes,
    pairingGoal: pairing.pairingGoal || null,
  }
}

export default function PairingRecommendations({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { journey, setPairingRecommendations } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // PRESERVED: AI Summary (S21) must be completed first.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('ai-summary')) {
      navigate('/smokecraft/ai-summary', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Holistic Fix 5B-1: ranking is no longer computed client-side —
  // this screen now calls the shared, server-authoritative pairing
  // engine (POST /rank) for every category's compatibility score.
  const engine = useSmokeCraftPairingEngine()
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saved
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [showAlternates, setShowAlternates] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  // No alternate is selected by default. Journey-persisted, not a second
  // interaction-state store.
  const [manualPrimary, setManualPrimary] = useState(() => journey.pairingRecommendations?.manualPrimaryCategory || null)
  const [rejected, setRejected] = useState(() => new Set(journey.pairingRecommendations?.rejectedCategories || []))

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const engineContext = useMemo(() => buildEngineContext(journey), [journey])

  // phase mirrors the shared adapter's status onto this screen's own
  // pre-existing loading/no-cigar/error/ready vocabulary — no cigar
  // selected is checked locally first (a real precondition this screen
  // already enforced), everything after that is the server's real status.
  const phase = !journey.selectedCigar ? 'no-cigar'
    : (engine.status === 'idle' || engine.status === 'calculating') ? 'loading'
    : (engine.status === 'error' || engine.status === 'offline' || engine.status === 'session-expired') ? 'error'
    : 'ready'

  const generate = useCallback(() => {
    if (!journey.selectedCigar) return
    engine.requestRanking(engineContext, '/smokecraft/pairing-recommendations')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.selectedCigar, engineContext])

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Server results (pairingType/explanation/conflicts/servingSequence)
  // reshaped into this screen's existing display vocabulary
  // (primary/whyItWorks/possibleClashes/servingStyle) — no new numbers
  // computed here, purely a field-name adapter.
  const ranked = useMemo(() => (engine.ranked || []).map(r => ({
    primary: r.pairingType,
    compatScore: r.compatScore,
    recommendation: r.pairingType,
    whyItWorks: r.explanation,
    possibleClashes: r.conflicts.length > 0 ? r.conflicts.join(' ') : null,
    suggestedAdjustment: r.servingSequence,
    selectedFlavorNotes: r.flavorNotes,
    flavorHarmony: r.matchedFlavorNotes,
    servingStyle: r.servingSequence,
    ruleSetVersion: r.ruleSetVersion,
  })), [engine.ranked])

  // PRESERVED: idempotent persistence of engine input + primary/alternates.
  useEffect(() => {
    if (phase !== 'ready' || !ranked || !ranked.length) return
    const p = ranked[0]
    const alts = ranked.slice(1, 4)
    const snapshot = JSON.stringify(engineContext)
    if (journey.pairingRecommendations?.engineInputSnapshot === snapshot) return
    setPairingRecommendations({
      ...(journey.pairingRecommendations || {}),
      engineInput: engineContext,
      engineInputSnapshot: snapshot,
      primary: p,
      alternates: alts,
      generatedAt: Date.now(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ranked, engineContext])

  const visibleRanked = (ranked || []).filter(r => !rejected.has(r.primary))
  const primary = (manualPrimary && visibleRanked.find(r => r.primary === manualPrimary)) || visibleRanked[0] || null
  const alternates = visibleRanked.filter(r => r.primary !== primary?.primary).slice(0, 3)
  const noStrongMatch = primary && primary.compatScore < 50

  function chooseAsPrimary(category) {
    triggerHaptic('success')
    const next = manualPrimary === category ? null : category
    setManualPrimary(next)
    setPairingRecommendations({
      ...(journey.pairingRecommendations || {}),
      manualPrimaryCategory: next,
    })
  }

  function rejectCategory(category) {
    triggerHaptic('warning')
    setRejected(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category); else next.add(category)
      setPairingRecommendations({
        ...(journey.pairingRecommendations || {}),
        rejectedCategories: Array.from(next),
      })
      return next
    })
  }

  async function handleSave() {
    if (!primary) return
    triggerHaptic('light')
    // Holistic Fix 5B-1: persists server-side (smokecraft_pairing_saves),
    // owned by the server-verified identity — the journey-local mirror
    // below remains only as the fast local "what did I last save" UI
    // cache, it is no longer the system of record.
    const idempotencyKey = `pairing-save-${session?.sessionId || 'guest'}-${engineContext.cigarShape || 'x'}-${engineContext.wrapper || 'x'}-${engineContext.origin || 'x'}-${engineContext.strength || 'x'}-${primary.primary}`.slice(0, 200)
    const result = await engine.save({
      cigarShape: engineContext.cigarShape, wrapper: engineContext.wrapper, origin: engineContext.origin,
      strength: engineContext.strength, pairingType: primary.primary, flavorNotes: engineContext.flavorNotes,
      pairingGoal: engineContext.pairingGoal,
    }, idempotencyKey, null, null, '/smokecraft/pairing-recommendations')
    if (!result.ok) return
    setPairingRecommendations({
      ...(journey.pairingRecommendations || {}),
      savedRecommendation: { ...primary, savedAt: Date.now(), saveId: result.save?.id ?? null },
    })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function handleContinue() {
    triggerHaptic('medium')
    if (onComplete) { onComplete(); return }
    awardSessionRewards('pairing-recommendations')
    navigate('/smokecraft/passport-stamp')
  }

  const canContinue = phase === 'ready' && !!primary

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <SmokeCraftOwnerHeroBackground assetKey="ownerPairingRecommendationsHero" label="A cigar paired with a glass of whiskey" bgPosition="center top" bgSize="cover" />
      <div style={{ ...pageShellStyle, position: 'relative', zIndex: 2 }}>
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🥂</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Session 22</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Personalized Pairing Recommendations</h1>
            <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              Generated from your saved cigar, strength, and flavor notes — a real recommendation from the pairing engine, not a fixed example.
            </p>
          </div>
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Your Preferences</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 10 }}>
            {[
              { label: 'Flavor Notes', value: engineContext.flavorNotes.join(', ') },
              { label: 'Strength', value: engineContext.strength },
              { label: 'Recommended Type', value: primary?.primary },
              { label: 'Wrapper / Origin', value: engineContext.wrapper || engineContext.origin },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 10.5, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</div>
                <div style={{ fontSize: 13.5, color: f.value ? CREAM : 'rgba(229,226,225,0.45)', marginTop: 3 }}>{f.value || 'Not set'}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(240px,1fr)', gap: 16 }}>
          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                border: `3px solid ${primary ? GOLD : BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 20, color: GOLD, fontWeight: 700 }}>{primary ? `${primary.compatScore}%` : '—'}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.7)', lineHeight: 1.4 }}>
                {!primary
                  ? 'No pairing recommendation is available yet.'
                  : noStrongMatch
                    ? 'No strong match — add more tasting detail to sharpen this result.'
                    : 'Generated from your saved cigar, strength and flavour notes.'}
              </div>
            </div>

            {phase === 'loading' && (
              <div role="status" aria-live="polite" style={{ color: 'rgba(229,226,225,0.7)', fontSize: 14 }}>
                Generating your pairing recommendations…
              </div>
            )}

            {phase === 'no-cigar' && (
              <div data-testid="pr-no-cigar" style={{ color: 'rgba(229,226,225,0.7)', fontSize: 13.5, lineHeight: 1.6 }}>
                No cigar has been selected in this journey yet, so no pairing can be
                recommended. Choose a cigar first and this screen will fill in.
              </div>
            )}

            {phase === 'error' && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'rgba(229,170,100,0.9)' }}>
                  Something went wrong generating your recommendations.
                </p>
                <button type="button" onClick={() => { triggerHaptic('light'); generate() }} style={{
                  minHeight: 44, background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD,
                  fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer',
                }}>Retry</button>
              </div>
            )}

            {phase === 'ready' && !primary && (
              <div data-testid="pr-none" style={{ color: 'rgba(229,226,225,0.65)', fontSize: 13.5 }}>
                Every recommendation has been rejected. Restore one to see a pairing here.
              </div>
            )}

            {phase === 'ready' && primary && (
              <>
                {isOffline && (
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)', marginBottom: 8 }}>
                    Offline: generated from your locally saved journey data.
                  </div>
                )}
                <div style={{ fontSize: 22, color: GOLD, lineHeight: 1.2, fontWeight: 700 }} data-testid="pr-primary">
                  {primary.recommendation}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.6)', marginTop: 6 }}>
                  Compatibility {primary.compatScore}% · from your saved journey profile
                </div>
                <div style={{ fontSize: 13.5, color: CREAM, lineHeight: 1.55, marginTop: 10 }}>
                  {primary.whyItWorks}
                </div>
                {showWhy && primary.servingStyle && (
                  <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.7)', lineHeight: 1.5, marginTop: 8 }}>
                    Serving: {primary.servingStyle}
                  </div>
                )}
                {showWhy && primary.possibleClashes && (
                  <div style={{ fontSize: 12.5, color: 'rgba(229,170,100,0.85)', lineHeight: 1.5, marginTop: 8 }}>
                    {primary.possibleClashes}
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div data-testid="pr-saved" style={{ marginTop: 12, fontSize: 12.5, color: GOLD }}>
                    ✓ Saved to your pairings
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    data-testid="pr-view-alternate"
                    aria-pressed={showAlternates}
                    onClick={() => { triggerHaptic('light'); setShowAlternates(v => !v); if (alternates[0]) chooseAsPrimary(alternates[0].primary) }}
                    disabled={alternates.length === 0}
                    style={{ minHeight: 44, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: GOLD, fontFamily: 'Georgia, serif', fontSize: 12.5, cursor: alternates.length ? 'pointer' : 'not-allowed', opacity: alternates.length ? 1 : 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    View Alternate Pairing
                  </button>
                  <button
                    type="button"
                    data-testid="pr-save"
                    onClick={handleSave}
                    disabled={!primary}
                    style={{ minHeight: 44, padding: '0 16px', borderRadius: 8, border: `1px solid ${GOLD}`, background: 'rgba(233,193,118,0.1)', color: GOLD, fontFamily: 'Georgia, serif', fontSize: 12.5, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {saveStatus === 'saved' ? (engine.saveStatus === 'already-saved' ? 'Already Saved' : 'Saved') : 'Save To My Pairings'}
                  </button>
                  <button
                    type="button"
                    data-testid="pr-learn-more"
                    aria-expanded={showWhy}
                    onClick={() => { triggerHaptic('light'); setShowWhy(v => !v) }}
                    style={{ minHeight: 44, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: GOLD, fontFamily: 'Georgia, serif', fontSize: 12.5, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {showWhy ? 'Show Less' : 'Learn More'}
                  </button>
                </div>
              </>
            )}
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section style={{ ...cardStyle, padding: 'clamp(16px,2vw,22px)' }}>
              <div style={sectionLabelStyle}>You May Also Enjoy</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {alternates.length === 0 ? (
                  <span style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.5)' }}>No alternate pairings available.</span>
                ) : alternates.map(alt => (
                  <div key={alt.primary} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      data-testid={`pr-alt-${alt.primary}`}
                      aria-label={`Choose ${alt.primary} as your primary pairing`}
                      onClick={() => chooseAsPrimary(alt.primary)}
                      style={{
                        flex: 1, minHeight: 40, textAlign: 'left', background: 'transparent',
                        border: `1px solid ${BORDER}`, borderRadius: 8,
                        color: CREAM, fontFamily: 'Georgia, serif',
                        fontSize: 12.5, padding: '6px 10px', cursor: 'pointer',
                      }}
                    >
                      {alt.primary} · {alt.compatScore}%
                    </button>
                    <button
                      type="button"
                      data-testid={`pr-reject-${alt.primary}`}
                      aria-label={`Reject ${alt.primary}`}
                      onClick={() => rejectCategory(alt.primary)}
                      style={{
                        minWidth: 40, minHeight: 40, background: 'transparent', border: `1px solid ${BORDER}`,
                        borderRadius: 8, color: 'rgba(229,226,225,0.6)',
                        fontFamily: 'Georgia, serif', fontSize: 14, cursor: 'pointer',
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...cardStyle, padding: 'clamp(16px,2vw,22px)' }}>
              <div style={sectionLabelStyle}>Mentor Guidance</div>
              <div style={{ marginTop: 10 }}>
                <DynamicMentorPanel
                  context="pairing-recommendations"
                  pairingContext={primary ? { cigarShape: engineContext.cigarShape, wrapper: engineContext.wrapper, origin: engineContext.origin, strength: engineContext.strength, pairingType: primary.primary, flavorNotes: engineContext.flavorNotes, pairingGoal: engineContext.pairingGoal } : { pairingType: null }}
                />
              </div>
            </section>
          </div>
        </div>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftLessonInfoButton
        sessionNumber={22} totalSessions={TOTAL_SESSIONS} phase={5} totalPhases={TOTAL_VISITS}
        title="Personalized Pairing Recommendations" whyItMatters={ENRICHMENT_22?.whyItMatters} goldenBox={ENRICHMENT_22?.goldenBox}
      />

      <SmokeCraftNavBar
        primary="Continue Journey"
        onPrimary={handleContinue}
        primaryDisabled={!canContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate(-1))}
      />
    </SmokeCraftScreenShell>
  )
}
