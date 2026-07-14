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

// 6 EXPLORE header cards (single row, y≈25.1–36.1%)
const EXPLORE_ZONES = [
  { id: 'Aroma Opening', x:  3.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Draw Ease',     x: 19.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Body Start',    x: 35.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Flavor Notes',  x: 51.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Burn Line',     x: 67.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Ash Quality',   x: 83.0, y: 25.1, w: 14.5, h: 11.0 },
]

export default function FirstThird() {
  const { awardSessionRewards, setFirstThirdTasting } = useGuestSession()
  const { journey, setFirstThird } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(() => journey.firstThird?.notesSelected || [])
  const [done, setDone] = useState(false)

  function toggleItem(id) {
    triggerHaptic('light')
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleContinue() {
    if (done) return
    setDone(true)
    const payload = {
      status: 'observe_confirm_step',
      source: 'local_only',
      tasteProfileSource: checked.length > 0 ? 'guest_selected' : 'not_collected',
      safeClaim: checked.length > 0
        ? 'Guest confirmed observations — selections captured'
        : 'Guest confirmed observation — no tasting input captured',
      notesSelected: checked,
      notesCount: checked.length,
      drawRating: null, hasDrawRating: false,
      strength: null, body: null, smokeOutput: null,
      burnQuality: null, pairingReaction: null,
      mentorTip: null, mentorName: null,
    }
    setFirstThirdTasting(payload)
    setFirstThird(payload)
    awardSessionRewards('first-third')
    navigate('/smokecraft/second-third')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.firstThird}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft First Third — Discover the Opening Expression"
      >
        {EXPLORE_ZONES.map(zone => {
          const active = checked.includes(zone.id)
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.id}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => toggleItem(zone.id)}
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
                  position: 'absolute', top: 4, right: 5,
                  fontSize: 'clamp(9px,1.2vw,14px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to Second Third →"
        onPrimary={handleContinue}
      />
    </>
  )
}
