import { useState } from 'react'
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

// Three method groups positioned in their printed step rows (left column, x 3.7–62%)
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
                  background: active ? 'rgba(233,193,118,0.22)' : 'transparent',
                  border: `2px solid ${active ? GOLD : 'transparent'}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <span style={{
                  fontSize: 'clamp(8px,1.05vw,13px)',
                  fontWeight: active ? 700 : 500,
                  color: active ? GOLD : 'rgba(229,226,225,0.82)',
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '0.02em',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  padding: '0 4px',
                }}>
                  {method}
                </span>
              </button>
            )
          })
        )}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to First Third →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
