import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

const GOLD = '#E9C176'

// 6 READINESS CHECK rows (x≈10.3%, y≈72.5–93.0%)
const READINESS_ZONES = [
  { id: 'r1', label: 'Journey foundations reviewed',        x: 10.3, y: 72.5, w: 79.7, h: 3.4 },
  { id: 'r2', label: 'Flavor memory captured',             x: 10.3, y: 76.3, w: 79.7, h: 3.4 },
  { id: 'r3', label: 'Pairing preference confirmed',       x: 10.3, y: 80.1, w: 79.7, h: 3.4 },
  { id: 'r4', label: 'Mentor guidance acknowledged',       x: 10.3, y: 83.9, w: 79.7, h: 3.4 },
  { id: 'r5', label: 'Burn & draw quality noted',          x: 10.3, y: 87.7, w: 79.7, h: 3.4 },
  { id: 'r6', label: 'Ready to receive passport stamp',    x: 10.3, y: 91.5, w: 79.7, h: 3.4 },
]

export default function FinalReview() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setFinalReview } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(() => new Set(journey.finalReview?.checked || []))

  useEffect(() => {
    setFinalReview({ checked: [...checked] })
  }, [checked]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id) {
    triggerHaptic('light')
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleContinue() {
    awardSessionRewards('final-review')
    navigate('/smokecraft/session-complete')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.finalReview}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Final Review — Journey Readiness Check"
      >
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {READINESS_ZONES.map(zone => {
          const active = checked.has(zone.id)
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label}${active ? ' (checked)' : ''}`}
              aria-pressed={active}
              onClick={() => toggle(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 3,
                cursor: 'pointer',
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 2, right: 6,
                  fontSize: 'clamp(9px,1.0vw,12px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to Recommended Next Journey →"
        onPrimary={handleContinue}
      />
    </>
  )
}
