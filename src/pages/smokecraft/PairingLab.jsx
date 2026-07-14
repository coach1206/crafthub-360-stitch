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

// 7 pairing icon cards at the bottom of the image (y≈70–87%)
const PAIRING_ZONES = [
  { id: 'Whiskey',       category: 'spirits',   flavorNote: 'Oak, vanilla, caramel',            x:  3.0, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Rum',           category: 'spirits',   flavorNote: 'Molasses, tropical, sweet',         x: 15.7, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Coffee',        category: 'beverage',  flavorNote: 'Roast, bitter, earthy',             x: 28.4, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Espresso',      category: 'beverage',  flavorNote: 'Concentrated, bold, slightly bitter', x: 41.1, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Chocolate',     category: 'food',      flavorNote: 'Cocoa, bitter, smooth',             x: 53.8, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Nuts',          category: 'food',      flavorNote: 'Toasted, earthy, rich',             x: 66.5, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Nonalcoholic',  category: 'beverage',  flavorNote: 'Fresh, clean, varied',              x: 79.2, y: 70.0, w: 12.0, h: 17.0 },
]

const INSIGHT = {
  Whiskey:      'The barrel aging of whiskey mirrors the tobacco curing process — shared toasty, woody notes create harmony.',
  Rum:          "Rum's natural sweetness softens any pepper or spice, bringing out the leaf's hidden sugar tones.",
  Coffee:       'Coffee amplifies the roasted, nutty qualities in medium-to-full body blends.',
  Espresso:     'Espresso concentrates bitterness that balances full-bodied, ligero-forward sticks.',
  Chocolate:    'Bittersweet cocoa creates a buttery, dessert-like finish when paired with medium blends.',
  Nuts:         'Nutty accents bridge the earthy and sweet registers — ideal for Connecticut or natural wrappers.',
  Nonalcoholic: 'Sparkling water or cold brew cleanses the palate between draws — lets the wrapper speak.',
}

function buildRecommendation(selections) {
  if (selections.length === 0) return null
  const primary = selections[0]
  const zone = PAIRING_ZONES.find(p => p.id === primary)
  return {
    primary,
    selections,
    flavorHarmony: selections.length > 1
      ? `${primary} anchors the session, with ${selections[1]} extending the mid-palate.`
      : `${primary} provides a clean, focused complement.`,
    insight: INSIGHT[primary] || `${primary} creates a cohesive tasting session.`,
    flavorNote: zone?.flavorNote || '',
    recommendation: selections.join(' + '),
    category: zone?.category || 'beverage',
  }
}

export default function PairingLab() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setPairing } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [selectedPairings, setSelectedPairings] = useState(
    () => journey.pairing?.selections || []
  )

  const recommendation = buildRecommendation(selectedPairings)

  useEffect(() => {
    setPairing(recommendation)
  }, [selectedPairings]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePairing(id) {
    triggerHaptic('light')
    setSelectedPairings(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleContinue() {
    awardSessionRewards('pairing-lab')
    navigate('/smokecraft/humidor-match')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.pairingLab}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Pairing Lab — Build Your Pairing Profile"
      >
        {PAIRING_ZONES.map(p => {
          const active = selectedPairings.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              aria-label={`${p.id} pairing${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => togglePairing(p.id)}
              style={{
                position: 'absolute',
                left: `${p.x}%`, top: `${p.y}%`,
                width: `${p.w}%`, height: `${p.h}%`,
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
        primary="Continue to Humidor Match →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
