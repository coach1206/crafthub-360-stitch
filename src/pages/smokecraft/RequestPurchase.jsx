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

// 2 ordering path cards (x≈43.8–82.6%, y≈68.5–86.8%)
const ORDERING_ZONES = [
  { id: 'self',  label: 'Self-Order',              x: 43.8, y: 68.5, w: 19.0, h: 18.3 },
  { id: 'staff', label: 'Request Staff Assistance', x: 63.6, y: 68.5, w: 19.0, h: 18.3 },
]

export default function RequestPurchase() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setRequestPurchase } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [orderPath, setOrderPath] = useState(() => journey.requestPurchase?.orderPath || null)
  const [awarded, setAwarded] = useState(false)

  useEffect(() => {
    setRequestPurchase({
      orderPath,
      selectedCigar: journey.selectedCigar,
      selectedPairing: journey.pairing,
      savedAt: Date.now(),
    })
  }, [orderPath]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePath(id) {
    triggerHaptic('light')
    setOrderPath(prev => prev === id ? null : id)
  }

  function handleContinue() {
    if (awarded) return
    setAwarded(true)
    triggerHaptic('medium')
    awardSessionRewards('request-purchase')
    navigate('/smokecraft/cut-toast-light')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.requestPurchase}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Request Purchase — Choose Your Ordering Path"
      >
        {ORDERING_ZONES.map(zone => {
          const active = orderPath === zone.id
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => togglePath(zone.id)}
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
        primary="Continue to Cut, Toast & Light →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
