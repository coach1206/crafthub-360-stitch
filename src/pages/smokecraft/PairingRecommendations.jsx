import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { rankAllCategories } from '../../utils/pairingEngine.js'

const ENRICHMENT_22 = getEducationalEnrichment(22)

/**
 * PairingRecommendations — /smokecraft/pairing-recommendations  (S22)
 *
 * FINAL APPROVED SHELLS PASS — this file replaces the hand-built layout the
 * immediately-prior pass disclosed as still using the decorative-band pattern
 * ("Other non-landing screens still use the decorative-band pattern:
 * ... PairingRecommendations.jsx (S22) ... they are the same violation class
 * and should be converted").
 *
 * The approved asset `personlized pairing 222.png` (1536 x 1024) is now the
 * whole visual foundation, rendered intact at true aspect ratio through
 * SmokeCraftImageBoundsOverlay.
 *
 * What was removed
 * ----------------
 *   - the `clamp(...)` decorative header band that used the approved image as
 *     a cropped `background-size: cover` strip;
 *   - the generic dark gradient page and its entire <header>/<main> stack
 *     rendered beneath it (duplicate title, glass primary-recommendation
 *     card, alternates list, preferences card);
 *   - the SmokeCraftNavBar (the approved image has its own CONTINUE JOURNEY
 *     control).
 *
 * Baked values occluded (fabricated placeholders in the approved file)
 * -------------------------------------------------------------------
 *   preferences : "Bold & Rich", "Full", "Whiskey", "Spice, Cocoa, Oak"
 *   score       : "94%" / "EXCELLENT MATCH" and its caption
 *   cards       : "Liga Privada No. 9" (wrapper/origin/strength), "Woodford
 *                 Reserve Double Oaked" (profile/notes), the WHY IT WORKS
 *                 prose, the FLAVOR HARMONY radar
 *   alternates  : "Eagle Rare 10 Year 92%", "Glenfiddich 18 Year 91%",
 *                 "Ron Zacapa XO 90%"
 *
 * No baked cigar, drink, food, score or selected recommendation survives to
 * the DOM. Every replacement value comes from the SAME rule-based engine the
 * removed layout used — `rankAllCategories(buildEngineContext(journey))` over
 * canonical journey state (selected cigar, wrapper, origin, strength, flavor
 * notes, pairing goal). That logic is carried forward unchanged; only the
 * visual shell was at fault.
 *
 * All real behaviour preserved: the AI-Summary (S21) prerequisite redirect,
 * generate/retry, the no-cigar and error states, idempotent persistence of
 * the engine input snapshot, promote-to-primary / reject-alternate with
 * journey persistence, save-recommendation, offline detection, haptics, and
 * keyboard-accessible controls with visible focus.
 */

const NAT_W = 1536
const NAT_H = 1024

const GOLD  = '#E9C176'
const CREAM = '#e5e2e1'
const PANEL = '#0a111c'

const OPAQUE = {
  position: 'absolute',
  background: PANEL,
  display: 'flex',
  fontFamily: 'Georgia, serif',
  pointerEvents: 'none',
  overflow: 'hidden',
}

// Percentage coordinates measured against the approved image's own layout.
const Z = {
  prefFlavor:   { left: '25.5%', top: '41.4%', width: '12.0%', height: '3.1%' },
  prefStrength: { left: '37.3%', top: '41.4%', width: '8.2%',  height: '3.1%' },
  prefType:     { left: '49.5%', top: '41.4%', width: '11.0%', height: '3.1%' },
  prefNotes:    { left: '61.4%', top: '41.4%', width: '17.2%', height: '3.1%' },

  scoreDonut:   { left: '84.3%', top: '14.4%', width: '7.4%',  height: '10.9%' },
  scoreCaption: { left: '77.6%', top: '26.8%', width: '21.2%', height: '4.8%' },

  cards:        { left: '22.5%', top: '50.3%', width: '53.8%', height: '32.7%' },
  alternates:   { left: '77.6%', top: '53.5%', width: '21.4%', height: '29.0%' },
}

const ACTION_ROW = { top: '83.0%', height: '4.0%' }
const ACT = {
  alternate: { left: '22.9%', width: '17.7%' },
  save:      { left: '41.2%', width: '18.0%' },
  learn:     { left: '60.0%', width: '15.3%' },
}
const CONTINUE = { left: '77.6%', top: '87.2%', width: '21.4%', height: '7.0%' }

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

function Occlude({ zone, children, testid, style }) {
  return <div data-testid={testid} style={{ ...OPAQUE, ...zone, ...style }}>{children}</div>
}

/** A value cell over one of the image's own baked preference values. */
function Pref({ zone, value, testid }) {
  return (
    <Occlude zone={zone} testid={testid} style={{ alignItems: 'center' }}>
      <span style={{
        fontSize: 'clamp(8px,0.92vw,14px)', color: value ? CREAM : 'rgba(229,226,225,0.45)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {value || 'Not set'}
      </span>
    </Occlude>
  )
}

const ACTION_BTN = {
  position: 'absolute',
  background: PANEL,
  color: GOLD,
  border: `1px solid rgba(233,193,118,0.35)`,
  borderRadius: 6,
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(8px,0.88vw,13px)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  pointerEvents: 'auto',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
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

  const [phase, setPhase] = useState('loading') // loading | no-cigar | error | ready
  const [ranked, setRanked] = useState(null)
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
    triggerHaptic('medium')
    if (onComplete) { onComplete(); return }
    awardSessionRewards('pairing-recommendations')
    navigate('/smokecraft/passport-stamp')
  }

  const canContinue = phase === 'ready' && !!primary

  return (
    <>
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.pairingRecommendations}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — Personalized Pairing Recommendations"
      bottomOffset={0}
    >
      {/* Single accessible title — the approved image carries the visible
          "PERSONALIZED PAIRING RECOMMENDATIONS" wordmark. */}
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>SmokeCraft 360 — Personalized Pairing Recommendations</h1>

      {/* ── Baked "YOUR PREFERENCES" values → real engine input ─────────── */}
      <Pref testid="pr-pref-flavor"   zone={Z.prefFlavor}   value={engineContext.flavorNotes.join(', ')} />
      <Pref testid="pr-pref-strength" zone={Z.prefStrength} value={engineContext.strength} />
      <Pref testid="pr-pref-type"     zone={Z.prefType}     value={primary?.primary} />
      <Pref testid="pr-pref-notes"    zone={Z.prefNotes}    value={engineContext.wrapper || engineContext.origin} />

      {/* ── Baked "94% EXCELLENT MATCH" donut → real compatibility score ── */}
      <Occlude zone={Z.scoreDonut} testid="pr-score" style={{
        borderRadius: '50%', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: `3px solid ${primary ? GOLD : 'rgba(233,193,118,0.3)'}`,
      }}>
        <span style={{ fontSize: 'clamp(13px,1.7vw,27px)', color: GOLD, lineHeight: 1 }}>
          {primary ? `${primary.compatScore}%` : '—'}
        </span>
      </Occlude>
      <Occlude zone={Z.scoreCaption} style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 4%' }}>
        <span style={{ fontSize: 'clamp(7px,0.8vw,12px)', color: 'rgba(229,226,225,0.7)', lineHeight: 1.35 }}>
          {!primary
            ? 'No pairing recommendation is available yet.'
            : noStrongMatch
              ? 'No strong match — add more tasting detail to sharpen this result.'
              : 'Generated from your saved cigar, strength and flavour notes.'}
        </span>
      </Occlude>

      {/* ── Baked recommendation cards → the real engine result ─────────── */}
      <Occlude
        zone={Z.cards}
        testid="pr-cards"
        style={{
          flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start',
          border: '1px solid rgba(233,193,118,0.22)', borderRadius: 6,
          padding: 'clamp(8px,1.2vw,18px)', gap: 'clamp(4px,0.7vw,10px)',
          pointerEvents: 'auto',
        }}
      >
        {phase === 'loading' && (
          <div role="status" aria-live="polite" style={{ margin: 'auto', color: 'rgba(229,226,225,0.7)', fontSize: 'clamp(9px,1vw,15px)' }}>
            Generating your pairing recommendations…
          </div>
        )}

        {phase === 'no-cigar' && (
          <div data-testid="pr-no-cigar" style={{ margin: 'auto', textAlign: 'center', color: 'rgba(229,226,225,0.7)', fontSize: 'clamp(9px,1vw,15px)', lineHeight: 1.6, padding: '0 8%' }}>
            No cigar has been selected in this journey yet, so no pairing can be
            recommended. Choose a cigar first and this screen will fill in.
          </div>
        )}

        {phase === 'error' && (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px', fontSize: 'clamp(9px,1vw,15px)', color: 'rgba(229,170,100,0.9)' }}>
              Something went wrong generating your recommendations.
            </p>
            <button type="button" onClick={() => { triggerHaptic('light'); generate() }} style={{
              background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD,
              fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', minHeight: 40,
            }}>Retry</button>
          </div>
        )}

        {phase === 'ready' && !primary && (
          <div data-testid="pr-none" style={{ margin: 'auto', textAlign: 'center', color: 'rgba(229,226,225,0.65)', fontSize: 'clamp(9px,1vw,15px)', padding: '0 8%' }}>
            Every recommendation has been rejected. Restore one to see a pairing here.
          </div>
        )}

        {phase === 'ready' && primary && (
          <>
            {isOffline && (
              <div style={{ fontSize: 'clamp(7px,0.8vw,11px)', color: 'rgba(229,226,225,0.55)' }}>
                Offline: generated from your locally saved journey data.
              </div>
            )}
            <div style={{ fontSize: 'clamp(11px,1.35vw,22px)', color: GOLD, lineHeight: 1.2 }} data-testid="pr-primary">
              {primary.recommendation}
            </div>
            <div style={{ fontSize: 'clamp(8px,0.9vw,13px)', color: 'rgba(229,226,225,0.6)' }}>
              Compatibility {primary.compatScore}% · from your saved journey profile
            </div>
            <div style={{ fontSize: 'clamp(8px,0.92vw,14px)', color: CREAM, lineHeight: 1.5, overflow: 'hidden' }}>
              {showWhy ? primary.whyItWorks : primary.whyItWorks}
            </div>
            {showWhy && primary.servingStyle && (
              <div style={{ fontSize: 'clamp(8px,0.88vw,13px)', color: 'rgba(229,226,225,0.7)', lineHeight: 1.5 }}>
                Serving: {primary.servingStyle}
              </div>
            )}
            {showWhy && primary.possibleClashes && (
              <div style={{ fontSize: 'clamp(8px,0.88vw,13px)', color: 'rgba(229,170,100,0.85)', lineHeight: 1.5 }}>
                {primary.possibleClashes}
              </div>
            )}
            {saveStatus === 'saved' && (
              <div data-testid="pr-saved" style={{ marginTop: 'auto', fontSize: 'clamp(8px,0.85vw,12px)', color: GOLD }}>
                ✓ Saved to your pairings
              </div>
            )}
          </>
        )}
      </Occlude>

      {/* ── Baked "YOU MAY ALSO ENJOY" list → real alternates ───────────── */}
      <Occlude
        zone={Z.alternates}
        testid="pr-alternates"
        style={{
          flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start',
          padding: 'clamp(5px,0.9vw,14px)', gap: 'clamp(3px,0.5vw,8px)',
          pointerEvents: 'auto',
        }}
      >
        {alternates.length === 0 ? (
          <span style={{ margin: 'auto', fontSize: 'clamp(8px,0.85vw,12px)', color: 'rgba(229,226,225,0.5)', textAlign: 'center' }}>
            No alternate pairings available.
          </span>
        ) : alternates.map(alt => (
          <div key={alt.primary} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              data-testid={`pr-alt-${alt.primary}`}
              aria-label={`Choose ${alt.primary} as your primary pairing`}
              onClick={() => chooseAsPrimary(alt.primary)}
              style={{
                flex: 1, textAlign: 'left', background: 'transparent',
                border: '1px solid rgba(233,193,118,0.25)', borderRadius: 5,
                color: CREAM, fontFamily: 'Georgia, serif',
                fontSize: 'clamp(8px,0.85vw,12px)', padding: '4px 6px',
                cursor: 'pointer', pointerEvents: 'auto',
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
                background: 'transparent', border: '1px solid rgba(233,193,118,0.25)',
                borderRadius: 5, color: 'rgba(229,226,225,0.6)',
                fontFamily: 'Georgia, serif', fontSize: 'clamp(8px,0.85vw,12px)',
                padding: '4px 6px', cursor: 'pointer', pointerEvents: 'auto',
              }}
            >×</button>
          </div>
        ))}
      </Occlude>

      {/* ── The image's own three action controls, now live ─────────────── */}
      <button
        type="button"
        data-testid="pr-view-alternate"
        aria-pressed={showAlternates}
        onClick={() => { triggerHaptic('light'); setShowAlternates(v => !v); if (alternates[0]) chooseAsPrimary(alternates[0].primary) }}
        disabled={alternates.length === 0}
        style={{ ...ACTION_BTN, ...ACT.alternate, ...ACTION_ROW }}
      >
        View Alternate Pairing
      </button>
      <button
        type="button"
        data-testid="pr-save"
        onClick={handleSave}
        disabled={!primary}
        style={{ ...ACTION_BTN, ...ACT.save, ...ACTION_ROW }}
      >
        {saveStatus === 'saved' ? 'Saved' : 'Save To My Pairings'}
      </button>
      <button
        type="button"
        data-testid="pr-learn-more"
        aria-expanded={showWhy}
        onClick={() => { triggerHaptic('light'); setShowWhy(v => !v) }}
        style={{ ...ACTION_BTN, ...ACT.learn, ...ACTION_ROW }}
      >
        {showWhy ? 'Show Less' : 'Learn More'}
      </button>

      {/* ── The image's own CONTINUE JOURNEY control ────────────────────── */}
      <button
        type="button"
        data-testid="pr-continue"
        onClick={handleContinue}
        disabled={!canContinue}
        style={{
          position: 'absolute', ...CONTINUE,
          background: canContinue ? `linear-gradient(180deg, #F3D48E, ${GOLD})` : 'rgba(233,193,118,0.25)',
          color: canContinue ? '#241605' : 'rgba(36,22,5,0.55)',
          border: 'none', borderRadius: 6,
          fontFamily: 'Georgia, serif', fontWeight: 700,
          fontSize: 'clamp(9px,1.05vw,16px)', letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: canContinue ? 'pointer' : 'not-allowed',
          pointerEvents: 'auto', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Continue Journey
      </button>
    </SmokeCraftImageBoundsOverlay>

    <SmokeCraftLessonInfoButton
      sessionNumber={22} totalSessions={TOTAL_SESSIONS} phase={5} totalPhases={TOTAL_VISITS}
      title="Personalized Pairing Recommendations" whyItMatters={ENRICHMENT_22?.whyItMatters} goldenBox={ENRICHMENT_22?.goldenBox}
    />
    </>
  )
}
