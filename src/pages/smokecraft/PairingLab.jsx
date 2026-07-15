import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'
const GLASS = 'rgba(5,5,5,0.88)'
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
const STRENGTH_SCORE = { Mild: 1, Medium: 2, 'Medium-Full': 3, Full: 4 }
const TYPE_STRENGTH  = { Whiskey: 4, Rum: 3, Coffee: 2, Espresso: 3, Chocolate: 2, Nuts: 1, Nonalcoholic: 1 }
const HARMONY = {
  Whiskey:      { notes: ['Smoky', 'Rich', 'Bold'],    clashes: ['Sweet', 'Creamy'] },
  Rum:          { notes: ['Sweet', 'Rich', 'Smooth'],  clashes: ['Smoky'] },
  Coffee:       { notes: ['Bold', 'Balanced', 'Rich'], clashes: ['Sweet', 'Creamy'] },
  Espresso:     { notes: ['Bold', 'Rich', 'Smoky'],    clashes: ['Creamy', 'Sweet'] },
  Chocolate:    { notes: ['Sweet', 'Creamy', 'Smooth'],clashes: ['Smoky'] },
  Nuts:         { notes: ['Balanced', 'Smooth', 'Rich'],clashes: [] },
  Nonalcoholic: { notes: ['Smooth', 'Balanced', 'Sweet'], clashes: [] },
}
const GOAL_DESC = {
  Complement:        "Chosen flavors align with and reinforce the cigar's natural profile.",
  Contrast:          'The pairing provides a sharp counterpoint to sharpen perception.',
  Soften:            'The pairing rounds and mellows any harsh edges in the smoke.',
  Brighten:          'The pairing lifts and opens up lighter aromatic notes.',
  'Deepen Finish':   'Extends and enriches the finish after each draw.',
  'Explore New Notes':'Unlocks unexpected flavor dimensions through contrast.',
}
const ADJUSTMENT_MAP = {
  Mild:        'Keep draws short — mild cigars benefit from slow, deliberate puffs to preserve the light body.',
  Medium:      'Moderate pace — let the smoke sit briefly before exhaling for full expression.',
  'Medium-Full':'Allow 30–60 seconds between draws to prevent heat buildup.',
  Full:        'Extended rest between draws. Full-bodied cigars reward patience and cool smoke.',
}

function buildRecommendation(s) {
  const { cigarShape, wrapper, origin, strength, pairingTypes, flavorNotes, pairingGoal } = s
  if (pairingTypes.length === 0) return null

  const primary = pairingTypes[0]
  const harmony = HARMONY[primary] || { notes: [], clashes: [] }
  const flavorHits = flavorNotes.filter(n => harmony.notes.includes(n))
  const clashHits  = flavorNotes.filter(n => harmony.clashes.includes(n))

  const strScore = STRENGTH_SCORE[strength] || 2
  const typScore = TYPE_STRENGTH[primary] || 2
  const matchDiff = Math.abs(strScore - typScore)
  const baseScore = 100 - matchDiff * 12
  const flavorBonus = flavorHits.length * 6
  const clashPenalty = clashHits.length * 10
  const rawScore = Math.max(30, Math.min(100, baseScore + flavorBonus - clashPenalty))
  const compatScore = Math.round(rawScore)

  const whyLines = [
    flavorHits.length > 0
      ? `${flavorHits.join(' and ')} notes create direct harmony with ${primary}'s profile.`
      : `${primary} provides a clean complement to the selected strength.`,
    strength && pairingGoal
      ? `Goal: ${pairingGoal} — ${GOAL_DESC[pairingGoal] || ''}`
      : null,
    origin
      ? `${origin} leaf character ${strScore >= 3 ? 'holds up well' : 'shines cleanly'} against this pairing.`
      : null,
  ].filter(Boolean)

  const clashNote = clashHits.length > 0
    ? `Watch for tension between ${clashHits.join(' and ')} notes and ${primary}'s base character.`
    : null

  return {
    primary,
    pairingTypes,
    compatScore,
    recommendation: pairingTypes.join(' + '),
    whyItWorks: whyLines.join(' '),
    possibleClashes: clashNote,
    suggestedAdjustment: ADJUSTMENT_MAP[strength] || 'Take deliberate, unhurried draws.',
    selectedFlavorNotes: flavorNotes,
    flavorHarmony: flavorHits,
  }
}

const EMPTY = {
  cigarShape: null,
  wrapper: null,
  origin: null,
  strength: null,
  pairingTypes: [],
  flavorNotes: [],
  pairingGoal: null,
}

export default function PairingLab() {
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

  const rec = buildRecommendation(sel)

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
  }, [sel]) // eslint-disable-line react-hooks/exhaustive-deps

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
    awardSessionRewards('pairing-lab')
    navigate('/smokecraft/humidor-match')
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
        padding: '3px 8px',
        borderRadius: 12,
        border: `1.5px solid ${active ? GOLD : 'rgba(233,193,118,0.25)'}`,
        background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
        color: active ? GOLD : 'rgba(229,226,225,0.75)',
        fontSize: 'clamp(8px,0.75vw,10px)',
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
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
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
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* ── Selector panel (left) ── */}
        <div style={{
          position: 'absolute',
          left: '1%', top: '4%',
          width: '44%',
          ...glassStyle({ padding: '10px 12px', pointerEvents: 'auto' }),
        }}>
          <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
            Cigar Profile
          </div>
          <SelectorGroup title="Shape"    options={CIGAR_SHAPES} field="cigarShape"  multi={false} />
          <SelectorGroup title="Wrapper"  options={WRAPPERS}     field="wrapper"     multi={false} />
          <SelectorGroup title="Origin"   options={ORIGINS}      field="origin"      multi={false} />
          <SelectorGroup title="Strength" options={STRENGTHS}    field="strength"    multi={false} />
        </div>

        {/* ── Pairing options panel (center-right) ── */}
        <div style={{
          position: 'absolute',
          left: '47%', top: '4%',
          width: '38%',
          ...glassStyle({ padding: '10px 12px', pointerEvents: 'auto' }),
        }}>
          <div style={{ fontSize: 9, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8 }}>
            Pairing Choices
          </div>
          <SelectorGroup title="Flavor Notes" options={FLAVOR_NOTES}  field="flavorNotes"  multi={true}  />
          <SelectorGroup title="Pairing Goal" options={PAIRING_GOALS} field="pairingGoal"  multi={false} />
        </div>

        {/* ── Recommendation panel (right) ── */}
        {rec && (
          <div style={{
            position: 'absolute',
            left: '87%', top: '4%',
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

      <SmokeCraftNavBar
        primary="Continue to Humidor Match →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
