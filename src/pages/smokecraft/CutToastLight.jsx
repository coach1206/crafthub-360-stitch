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

const CUT_METHODS   = ['Straight Cut', 'V-Cut', 'Punch Cut']
const TOAST_METHODS = ['Gentle Toast', 'Foot Toast', 'Full Toast']
const LIGHT_METHODS = ['Cedar Spill', 'Torch Lighter', 'Soft Flame']

const METHOD_TIPS = {
  'Straight Cut':  'Clean guillotine cut removes the cap in one motion. Produces an open, unrestricted draw. Best for Parejo shapes.',
  'V-Cut':         'Creates a wedge channel into the cap. Concentrates smoke through a focused point — enhances flavor intensity.',
  'Punch Cut':     'Circular punch removes a small plug. Minimal cut exposure, tight draw, excellent for Robusto and Toro formats.',
  'Gentle Toast':  'Rotate the foot slowly above flame. Warms the tobacco without burning — primes the blend before lighting.',
  'Foot Toast':    'Toast the full foot circumference evenly. Creates an even ember foundation for a consistent first third burn.',
  'Full Toast':    'Toast aggressively across the foot and edges. Faster ignition — recommended for Maduros and thick ring gauges.',
  'Cedar Spill':   'Ignite a cedar spill from a candle. The cedar aromatics complement tobacco naturally. Classic lounge method.',
  'Torch Lighter': 'Butane torch lights quickly and evenly. Best for outdoor use or when cedar isn\'t available. Keep flame moving.',
  'Soft Flame':    'Soft butane or match flame. Slower ignition preserves delicate top notes. Preferred for Connecticut wrappers.',
}

const STEP_GROUPS = [
  { id: 'cut',   methods: CUT_METHODS,   y: 30.5 },
  { id: 'toast', methods: TOAST_METHODS, y: 50.0 },
  { id: 'light', methods: LIGHT_METHODS, y: 69.0 },
]
const BTN_W = 18.2
const BTN_H = 9.0
const BTN_GAP = 1.2

export default function CutToastLight() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setCutToastLight } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [cutMethod,   setCutMethod]   = useState(() => journey.cutToastLight?.cut   || null)
  const [toastMethod, setToastMethod] = useState(() => journey.cutToastLight?.toast || null)
  const [lightMethod, setLightMethod] = useState(() => journey.cutToastLight?.light || null)

  // Auto-persist to canonical journey state
  useEffect(() => {
    if (cutMethod || toastMethod || lightMethod) {
      setCutToastLight({ cut: cutMethod, toast: toastMethod, light: lightMethod })
    }
  }, [cutMethod, toastMethod, lightMethod]) // eslint-disable-line react-hooks/exhaustive-deps

  function pick(step, val) {
    triggerHaptic('light')
    if (step === 'cut')   setCutMethod(prev   => prev === val ? null : val)
    if (step === 'toast') setToastMethod(prev => prev === val ? null : val)
    if (step === 'light') setLightMethod(prev => prev === val ? null : val)
  }

  function getValue(step) {
    if (step === 'cut')   return cutMethod
    if (step === 'toast') return toastMethod
    return lightMethod
  }

  const activeMethod = lightMethod || toastMethod || cutMethod
  const tip = activeMethod ? METHOD_TIPS[activeMethod] : null

  function handleContinue() {
    setCutToastLight({ cut: cutMethod, toast: toastMethod, light: lightMethod })
    awardSessionRewards('cut-toast-light')
    navigate('/smokecraft/first-third')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.cutToastLight}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Cut, Toast & Light — Preparation Methods"
      >
        {STEP_GROUPS.map(group =>
          group.methods.map((method, i) => {
            const active = getValue(group.id) === method
            const x = 3.7 + i * (BTN_W + BTN_GAP)
            return (
              <button
                key={`${group.id}-${method}`}
                type="button"
                aria-label={method}
                aria-pressed={active}
                onClick={() => pick(group.id, method)}
                style={{
                  position: 'absolute',
                  left: `${x}%`, top: `${group.y}%`,
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
          })
        )}

        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* Instruction tip panel — bottom strip */}
        {tip && (
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
              <strong style={{ color: GOLD, marginRight: 4 }}>{activeMethod}:</strong>
              {tip}
            </span>
          </div>
        )}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to First Third →"
        onPrimary={handleContinue}
        primaryDisabled={!cutMethod || !toastMethod || !lightMethod}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
