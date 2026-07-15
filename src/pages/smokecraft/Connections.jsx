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

const CONNECTION_OPTIONS = [
  { id: 'instagram', label: 'Instagram',   x:  3.0, y: 65.0, w: 12.5, h: 14.0 },
  { id: 'facebook',  label: 'Facebook',    x: 16.5, y: 65.0, w: 12.5, h: 14.0 },
  { id: 'twitter',   label: 'Twitter',     x: 30.0, y: 65.0, w: 12.5, h: 14.0 },
  { id: 'whatsapp',  label: 'WhatsApp',    x: 43.5, y: 65.0, w: 12.5, h: 14.0 },
  { id: 'email',     label: 'Email',       x: 57.0, y: 65.0, w: 12.5, h: 14.0 },
  { id: 'sms',       label: 'SMS',         x: 70.5, y: 65.0, w: 12.5, h: 14.0 },
  { id: 'passport',  label: 'NoveePassport', x: 84.0, y: 65.0, w: 12.5, h: 14.0 },
]

export default function Connections() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setConnections } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [selected, setSelected] = useState(() => new Set(journey.connections?.selected || []))

  function toggle(id) {
    triggerHaptic('light')
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      setConnections({ selected: [...next] })
      return next
    })
  }

  function handleContinue() {
    triggerHaptic('medium')
    awardSessionRewards('connections')
    navigate('/smokecraft/management-sync')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.connections}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Connections — Share & Connect"
      >
        {CONNECTION_OPTIONS.map(opt => {
          const active = selected.has(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              aria-label={`${opt.label}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => toggle(opt.id)}
              style={{
                position: 'absolute',
                left: `${opt.x}%`, top: `${opt.y}%`,
                width: `${opt.w}%`, height: `${opt.h}%`,
                pointerEvents: 'auto',
                background: active ? 'rgba(233,193,118,0.18)' : 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 4, right: 5,
                  fontSize: 'clamp(9px,1.0vw,12px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to Management Sync →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
