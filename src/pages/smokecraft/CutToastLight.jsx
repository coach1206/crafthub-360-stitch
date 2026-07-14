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

// Step rows as % of natural image dimensions
const STEP_ZONES = [
  { id: 'cut',   label: 'Cut the Cap',   x: 3.7, y: 26.3, w: 56.9, h: 18.7 },
  { id: 'toast', label: 'Toast the Foot', x: 3.7, y: 47.5, w: 56.9, h: 17.5 },
  { id: 'light', label: 'Light Evenly',  x: 3.7, y: 67.0, w: 56.9, h: 17.0 },
]

export default function CutToastLight() {
  const { awardSessionRewards } = useGuestSession()
  const { setCutToastLight } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const [done, setDone] = useState(() => new Set())

  function toggle(id) {
    triggerHaptic('light')
    setDone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleContinue() {
    setCutToastLight({
      cut:   done.has('cut')   ? 'done' : null,
      toast: done.has('toast') ? 'done' : null,
      light: done.has('light') ? 'done' : null,
    })
    awardSessionRewards('cut-toast-light')
    navigate('/smokecraft/first-third')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.cutToastLight}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Cut, Toast & Light — Preparation Steps"
      >
        {STEP_ZONES.map(step => {
          const active = done.has(step.id)
          return (
            <button
              key={step.id}
              type="button"
              aria-label={`${step.label}${active ? ' (done)' : ''}`}
              aria-pressed={active}
              onClick={() => toggle(step.id)}
              style={{
                position: 'absolute',
                left: `${step.x}%`, top: `${step.y}%`,
                width: `${step.w}%`, height: `${step.h}%`,
                pointerEvents: 'auto',
                background: active ? 'rgba(233,193,118,0.18)' : 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 4, right: 6,
                  fontSize: 'clamp(9px,1.2vw,14px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to First Third →"
        onPrimary={handleContinue}
      />
    </>
  )
}
