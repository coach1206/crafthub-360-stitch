import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'

// 3 humidor location rows (x≈18.7–60.1%)
const HUMIDOR_ZONES = [
  { id: 'main_floor',    label: 'Main Floor Humidor', x: 18.7, y: 24.3, w: 41.4, h: 12.3 },
  { id: 'walk_in',       label: 'Dry Box',            x: 18.7, y: 39.5, w: 41.4, h: 12.7 },
  { id: 'vip_lounge',   label: 'Travel Case',         x: 18.7, y: 54.9, w: 41.4, h: 12.6 },
]

export default function HumidorMatch() {
  const { awardSessionRewards, setHumidorMatchSelection, setSelectedHumidorRecommendation } = useGuestSession()
  const navigate = useNavigate()

  const [selectedEnv, setSelectedEnv] = useState(() =>
    localStorage.getItem('sc_humidor_env') || null
  )
  const [done, setDone] = useState(false)

  function selectEnvironment(envId) {
    triggerHaptic('light')
    setSelectedEnv(envId === selectedEnv ? null : envId)
    if (envId !== selectedEnv) {
      localStorage.setItem('sc_humidor_env', envId)
    } else {
      localStorage.removeItem('sc_humidor_env')
    }
  }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    if (selectedEnv) {
      const envLabel = HUMIDOR_ZONES.find(e => e.id === selectedEnv)?.label || selectedEnv
      setHumidorMatchSelection({ id: selectedEnv, label: envLabel, desc: `Environment: ${envLabel}` })
      setSelectedHumidorRecommendation({
        recommendationType: 'guest_selected',
        environment: selectedEnv,
        environmentLabel: envLabel,
      })
    }
    awardSessionRewards('humidor-match')
    navigate('/smokecraft/request-purchase')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.humidorMatch}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Humidor Match — Select Your Storage Environment"
      >
        {HUMIDOR_ZONES.map(zone => {
          const active = selectedEnv === zone.id
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => selectEnvironment(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
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
        primary="Continue to Request Purchase →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
