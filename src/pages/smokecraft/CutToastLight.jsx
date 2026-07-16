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

export default function CutToastLight() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setCutToastLight } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [cutMethod, setCutMethod] = useState(() => journey.cutToastLight?.cut || null)
  const [learnWhyOpen, setLearnWhyOpen] = useState(false)

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

  function handleContinue() {
    if (!cutMethod) return
    setCutToastLight({ ...(journey.cutToastLight || {}), cut: cutMethod })
    awardSessionRewards('cut-toast-light')
    navigate('/smokecraft/lighting-tutorial')
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

      <SmokeCraftNavBar
        primary="Continue to Lighting Tutorial →"
        onPrimary={handleContinue}
        primaryDisabled={!cutMethod}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
