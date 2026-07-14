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

// 2 ordering path cards in the lower-right zone of the image
const ORDERING_ZONES = [
  { id: 'self',  label: 'Self-Order',              x: 43.8, y: 68.5, w: 19.0, h: 18.3 },
  { id: 'staff', label: 'Request Staff Assistance', x: 63.6, y: 68.5, w: 19.0, h: 18.3 },
]

export default function RequestPurchase() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setRequestPurchase } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const cigar   = journey.selectedCigar
  const pairing = journey.pairing

  const [orderPath, setOrderPath] = useState(() => journey.requestPurchase?.orderPath || null)
  const [awarded,   setAwarded]   = useState(false)

  useEffect(() => {
    setRequestPurchase({
      orderPath,
      selectedCigar: cigar,
      selectedPairing: pairing,
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
        {/* Selected cigar name — visible in the top info zone */}
        {cigar?.name && (
          <div style={{
            position: 'absolute',
            left: '4%', top: '8%',
            width: '60%',
            pointerEvents: 'none',
            fontSize: 'clamp(10px,1.2vw,16px)',
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            color: GOLD,
            letterSpacing: '0.03em',
            userSelect: 'none',
          }}>
            {cigar.name}
          </div>
        )}

        {/* Ordering path selectors */}
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
                background: active ? 'rgba(233,193,118,0.22)' : 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                gap: 4,
              }}
            >
              <span style={{
                fontSize: 'clamp(8px,0.95vw,12px)',
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
                {zone.label}
              </span>
              {active && (
                <span style={{
                  fontSize: 'clamp(8px,0.9vw,11px)',
                  color: GOLD,
                  fontWeight: 700,
                  pointerEvents: 'none',
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
