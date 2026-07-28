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
import { useSmokeCraftPairingEngine } from '../../hooks/useSmokeCraftPairingEngine.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'

const ENRICHMENT_11 = getEducationalEnrichment(11)

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'
const GLASS = '#050505' // was rgba(5,5,5,0.88) — non-opaque bg let baked image content bleed through, fixed
const BORDER = 'rgba(233,193,118,0.28)'

// ── Selector definitions ─────────────────────────────────────────
const CIGAR_SHAPES  = ['Robusto', 'Toro', 'Churchill', 'Figurado']
const WRAPPERS      = ['Connecticut', 'Habano', 'Maduro', 'Corojo']
const ORIGINS       = ['Dominican Republic', 'Nicaragua', 'Honduras', 'Cuba', 'Mexico']
const STRENGTHS     = ['Mild', 'Medium', 'Medium-Full', 'Full']
const PAIRING_TYPES = ['Whiskey', 'Rum', 'Coffee', 'Espresso', 'Chocolate', 'Nuts', 'Nonalcoholic']
const FLAVOR_NOTES  = ['Smooth', 'Bold', 'Creamy', 'Sweet', 'Smoky', 'Balanced', 'Rich']
const PAIRING_GOALS = ['Complement', 'Contrast', 'Soften', 'Brighten', 'Deepen Finish', 'Explore New Notes']

// 7 pairing icon zones at bottom of image (kept from original visual design)
const PAIRING_ZONES = [
  { id: 'Whiskey',      x:  3.0, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Rum',          x: 15.7, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Coffee',       x: 28.4, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Espresso',     x: 41.1, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Chocolate',    x: 53.8, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Nuts',         x: 66.5, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Nonalcoholic', x: 79.2, y: 70.0, w: 12.0, h: 17.0 },
]

// ── Pairing logic ────────────────────────────────────────────────
// buildRecommendation is imported from ../../utils/pairingEngine.js — this is
// the same rule-based engine reused (not re-derived) by Personalized Pairing
// Recommendations (S22, PairingRecommendations.jsx).

const EMPTY = {
  cigarShape: null,
  wrapper: null,
  origin: null,
  strength: null,
  pairingTypes: [],
  flavorNotes: [],
  pairingGoal: null,
}

export default function PairingLab({ onBack, onComplete } = {}) {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setPairing } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [sel, setSel] = useState(() => {
    const saved = journey.pairing
    if (!saved) return { ...EMPTY }
    return {
      cigarShape:   saved.cigarShape   || null,
      wrapper:      saved.wrapper      || null,
      origin:       saved.origin       || null,
      strength:     saved.strength     || null,
      pairingTypes: saved.selections   || [],
      flavorNotes:  saved.flavorNotes  || [],
      pairingGoal:  saved.pairingGoal  || null,
    }
  })

  // Holistic Fix 5B-1: the compatibility score/explanation/conflicts are
  // no longer computed client-side — this screen now calls the shared,
  // server-authoritative pairing engine (via useSmokeCraftPairingEngine)
  // for every real answer this panel displays. The client only still
  // computes the trivial, non-authoritative display label
  // (pairingTypes.join(' + ')), never a score.
  const engine = useSmokeCraftPairingEngine()
  const primary = sel.pairingTypes[0] || null

  useEffect(() => {
    if (!primary) return
    engine.requestRecommendation({
      cigarShape: sel.cigarShape, wrapper: sel.wrapper, origin: sel.origin, strength: sel.strength,
      pairingType: primary, flavorNotes: sel.flavorNotes, pairingGoal: sel.pairingGoal,
    }, '/smokecraft/pairing-lab')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.cigarShape, sel.wrapper, sel.origin, sel.strength, primary, JSON.stringify(sel.flavorNotes), sel.pairingGoal])

  const engineResult = engine.result
  const rec = (primary && engineResult) ? {
    primary,
    pairingTypes: sel.pairingTypes,
    compatScore: engineResult.compatScore,
    recommendation: sel.pairingTypes.join(' + '),
    whyItWorks: engineResult.explanation,
    possibleClashes: engineResult.conflicts.length > 0 ? engineResult.conflicts.join(' ') : null,
    suggestedAdjustment: engineResult.servingSequence,
    selectedFlavorNotes: sel.flavorNotes,
    flavorHarmony: engineResult.matchedFlavorNotes,
  } : null

  // Holistic Fix 5B-1A: `rec` is a brand-new object literal every render
  // (derived from the async engineResult) — using it directly as a
  // useEffect dependency previously caused setPairing to fire on every
  // single render (a real, found infinite-update loop: setPairing wrote
  // to journey context -> re-render -> new `rec` identity -> effect
  // fires again), which visibly manifested as constantly re-mounting
  // chip buttons in the browser (Playwright: "element was detached from
  // the DOM, retrying"). Depending on the real underlying primitive
  // values instead (compatScore) makes this fire only when the
  // recommendation actually changes.
  useEffect(() => {
    if (rec) {
      setPairing({
        primary: rec.primary,
        selections: rec.pairingTypes,
        recommendation: rec.recommendation,
        flavorHarmony: rec.flavorHarmony.join(', '),
        compatScore: rec.compatScore,
        cigarShape: sel.cigarShape,
        wrapper: sel.wrapper,
        origin: sel.origin,
        strength: sel.strength,
        flavorNotes: sel.flavorNotes,
        pairingGoal: sel.pairingGoal,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.cigarShape, sel.wrapper, sel.origin, sel.strength, JSON.stringify(sel.pairingTypes), JSON.stringify(sel.flavorNotes), sel.pairingGoal, engineResult?.compatScore])

  function setOne(field, val) {
    triggerHaptic('light')
    setSel(prev => ({ ...prev, [field]: prev[field] === val ? null : val }))
  }
  function toggleArr(field, val) {
    triggerHaptic('light')
    setSel(prev => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter(x => x !== val) : [...prev[field], val],
    }))
  }

  function handleContinue() {
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('pairing-lab')
    navigate('/smokecraft/second-third')
  }

  const glassStyle = (extra = {}) => ({
    background: GLASS,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    ...extra,
  })

  const chipBtn = (active, label, onClick) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: '2px 6px',
        borderRadius: 10,
        border: `1.5px solid ${active ? GOLD : 'rgba(233,193,118,0.25)'}`,
        background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
        color: active ? GOLD : 'rgba(229,226,225,0.75)',
        fontSize: 'clamp(7px,0.68vw,9px)',
        fontFamily: 'Georgia, serif',
        cursor: 'pointer',
        fontWeight: active ? 700 : 400,
        outline: 'none',
        whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 3,
      }}
    >
      {active && <span style={{ fontSize: 9, lineHeight: 1 }}>✓</span>}
      {label}
    </button>
  )

  function SelectorGroup({ title, options, field, multi }) {
    return (
      <div style={{ marginBottom: 3 }}>
        <div style={{ fontSize: 8, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {options.map(opt => {
            const active = multi ? sel[field].includes(opt) : sel[field] === opt
            return chipBtn(active, opt, () => multi ? toggleArr(field, opt) : setOne(field, opt))
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.pairingLab}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Pairing Lab — Build Your Pairing Profile"
      >
        {/* Holistic Fix 5B-1A: single accessible page title — every other
            SmokeCraft screen has one, this screen was found missing it. */}
        <h1 style={{
          position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
          overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
        }}>SmokeCraft 360 — Pairing Lab</h1>

        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* ── Selector panel (left) ── */}
        <div style={{
          position: 'absolute',
          left: '7.66%', top: '35.92%', // exact-measured bounds of approved "Cigar Profile" box, source 1672x941 x:128-822 y:338-585
          width: '41.51%', height: '26.25%', overflow: 'hidden', overflowY: 'auto',
          ...glassStyle({ padding: '6px 10px', pointerEvents: 'auto' }),
        }}>
          <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            Cigar Profile
          </div>
          {/* Compact 2-column grid — the 4 selector groups don't fit in a
              single column within the approved panel's measured height
              (source box: 1672x941 x:128-822 y:338-585). Halves the
              vertical footprint versus stacking all 4 full-width. */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 10 }}>
            <SelectorGroup title="Shape"    options={CIGAR_SHAPES} field="cigarShape"  multi={false} />
            <SelectorGroup title="Wrapper"  options={WRAPPERS}     field="wrapper"     multi={false} />
            <SelectorGroup title="Origin"   options={ORIGINS}      field="origin"      multi={false} />
            <SelectorGroup title="Strength" options={STRENGTHS}    field="strength"    multi={false} />
          </div>
        </div>

        {/* ── Pairing options panel (center-right) ── */}
        <div style={{
          position: 'absolute',
          left: '7.66%', top: '71.52%', // exact-measured bounds of approved "Flavor Notes & Pairing Goal" box (stacked below Cigar Profile in the approved left column, not beside it), source x:128-822 y:673-825
          width: '41.51%', height: '16.15%', overflow: 'hidden', overflowY: 'auto',
          // Holistic Fix 5B-1A: this panel's measured bounds vertically
          // overlap the Pairing-type icon hotspots below (also
          // measured against the same approved image). Both were
          // unset-z-index (DOM-order stacking), so the icon buttons
          // — rendered later in JSX, transparent, but still hit-
          // testable — silently intercepted clicks meant for the
          // flavor-note/pairing-goal chips underneath (found live via
          // Playwright: "element intercepts pointer events"). A real
          // blocked-overlay defect, fixed with an explicit stacking
          // order; no visual change (the panel's own solid background
          // already painted over this area).
          zIndex: 3,
          ...glassStyle({ padding: '6px 10px', pointerEvents: 'auto' }),
        }}>
          <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 3 }}>
            Pairing Choices
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 10 }}>
            <SelectorGroup title="Flavor Notes" options={FLAVOR_NOTES}  field="flavorNotes"  multi={true}  />
            <SelectorGroup title="Pairing Goal" options={PAIRING_GOALS} field="pairingGoal"  multi={false} />
          </div>
        </div>

        {/* ── Calculating indicator — real server round-trip in flight ── */}
        {primary && !rec && (engine.status === 'calculating' || engine.status === 'idle') && (
          <div style={{
            position: 'absolute', left: '87%', top: '4%', width: '12%',
            ...glassStyle({ padding: '8px 10px', pointerEvents: 'none' }),
          }}>
            <div style={{ fontSize: 9, color: 'rgba(229,226,225,0.5)', fontFamily: 'Georgia, serif' }}>Calculating…</div>
          </div>
        )}
        {primary && (engine.status === 'error' || engine.status === 'offline') && (
          <div style={{
            position: 'absolute', left: '87%', top: '4%', width: '12%',
            ...glassStyle({ padding: '8px 10px', pointerEvents: 'auto' }),
          }}>
            <div style={{ fontSize: 9, color: 'rgba(229,170,100,0.85)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
              {engine.status === 'offline' ? "You're offline." : 'Couldn’t load your match.'}
            </div>
            <button type="button" onClick={() => engine.retry()} style={{ background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 10, color: GOLD, fontSize: 8, padding: '2px 6px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Retry</button>
          </div>
        )}

        {/* ── Mentor pairing guidance — Holistic Fix 5B-2A-1. Previously
            unused free space (below the Match badge, above the
            recommendation detail panel) — no baked artwork occluded. ── */}
        <div style={{ position: 'absolute', left: '63%', top: '16%', width: '36%', fontSize: 10 }}>
          <DynamicMentorPanel
            context="pairing-lab"
            pairingContext={primary ? { cigarShape: sel.cigarShape, wrapper: sel.wrapper, origin: sel.origin, strength: sel.strength, pairingType: primary, flavorNotes: sel.flavorNotes, pairingGoal: sel.pairingGoal } : { pairingType: null }}
          />
        </div>

        {/* ── Recommendation panel (right) ── */}
        {rec && (
          <div style={{
            position: 'absolute',
            left: '87%', top: '4%', // decorative compact score badge — stays in the top-right corner, does not collide with the two repositioned panels above
            width: '12%',
            ...glassStyle({ padding: '8px 10px', pointerEvents: 'none' }),
          }}>
            <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 6 }}>
              Match
            </div>
            <div style={{
              fontSize: 'clamp(18px,2.4vw,28px)',
              fontWeight: 700,
              color: rec.compatScore >= 80 ? GOLD : rec.compatScore >= 60 ? '#c8a84b' : 'rgba(229,226,225,0.7)',
              fontFamily: 'Georgia, serif',
              lineHeight: 1,
              marginBottom: 4,
            }}>
              {rec.compatScore}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(229,226,225,0.5)', fontFamily: 'Georgia, serif', marginBottom: 6 }}>
              {rec.compatScore >= 80 ? 'Excellent' : rec.compatScore >= 65 ? 'Good' : rec.compatScore >= 50 ? 'Fair' : 'Mixed'}
            </div>
          </div>
        )}

        {/* ── Recommendation detail panel ── */}
        {rec && (
          <div style={{
            position: 'absolute',
            left: '47%', top: '55%',
            width: '52%',
            ...glassStyle({ padding: '9px 11px', pointerEvents: 'none' }),
          }}>
            <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 5 }}>
              Pairing Recommendation
            </div>
            <div style={{ color: GOLD, fontWeight: 700, fontSize: 'clamp(10px,1.0vw,12px)', fontFamily: 'Georgia, serif', marginBottom: 5 }}>
              {rec.recommendation}
            </div>
            <div style={{ color: 'rgba(229,226,225,0.8)', fontSize: 'clamp(9px,0.85vw,10px)', fontFamily: 'Georgia, serif', lineHeight: 1.5, marginBottom: 5 }}>
              {rec.whyItWorks}
            </div>
            {rec.possibleClashes && (
              <div style={{ color: 'rgba(229,170,100,0.8)', fontSize: 'clamp(8px,0.78vw,9px)', fontFamily: 'Georgia, serif', lineHeight: 1.4, marginBottom: 4, fontStyle: 'italic' }}>
                ⚠ {rec.possibleClashes}
              </div>
            )}
            <div style={{ color: 'rgba(229,226,225,0.5)', fontSize: 'clamp(8px,0.75vw,9px)', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>
              {rec.suggestedAdjustment}
            </div>
            {rec.selectedFlavorNotes.length > 0 && (
              <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {rec.selectedFlavorNotes.map(n => (
                  <span key={n} style={{
                    fontSize: 8, color: rec.flavorHarmony.includes(n) ? GOLD : 'rgba(229,226,225,0.5)',
                    border: `1px solid ${rec.flavorHarmony.includes(n) ? GOLD : 'rgba(233,193,118,0.2)'}`,
                    borderRadius: 8, padding: '1px 5px', fontFamily: 'Georgia, serif',
                  }}>
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Pairing type icons (bottom visual layer — match printed image) ── */}
        {PAIRING_ZONES.map(p => {
          const active = sel.pairingTypes.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              aria-label={`${p.id} pairing${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => toggleArr('pairingTypes', p.id)}
              style={{
                position: 'absolute',
                left: `${p.x}%`, top: `${p.y}%`,
                width: `${p.w}%`, height: `${p.h}%`,
                pointerEvents: 'auto',
                background: 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '8%',
                outline: 'none',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  fontSize: 'clamp(8px,0.9vw,11px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
              <span style={{
                fontSize: 'clamp(6px,0.7vw,9px)',
                fontWeight: active ? 700 : 500,
                color: active ? GOLD : 'rgba(229,226,225,0.6)',
                fontFamily: 'Georgia, serif',
                pointerEvents: 'none',
                userSelect: 'none',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                {p.id}
              </span>
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftLessonInfoButton
        sessionNumber={11} totalSessions={TOTAL_SESSIONS} phase={2} totalPhases={TOTAL_VISITS}
        title="Suggested Pairings" whyItMatters={ENRICHMENT_11?.whyItMatters} goldenBox={ENRICHMENT_11?.goldenBox}
      />

      <SmokeCraftNavBar
        primary="Continue to Flavor Evolution →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/flavor-memory'))}
      />
    </>
  )
}
