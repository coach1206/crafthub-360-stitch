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
  { id: 'Whiskey',      category: 'spirits',  flavorNote: 'Oak, vanilla, caramel',               x:  3.0, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Rum',          category: 'spirits',  flavorNote: 'Molasses, tropical, sweet',            x: 15.7, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Coffee',       category: 'beverage', flavorNote: 'Roast, bitter, earthy',                x: 28.4, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Espresso',     category: 'beverage', flavorNote: 'Concentrated, bold, slightly bitter',  x: 41.1, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Chocolate',    category: 'food',     flavorNote: 'Cocoa, bitter, smooth',                x: 53.8, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Nuts',         category: 'food',     flavorNote: 'Toasted, earthy, rich',                x: 66.5, y: 70.0, w: 12.0, h: 17.0 },
  { id: 'Nonalcoholic', category: 'beverage', flavorNote: 'Fresh, clean, varied',                 x: 79.2, y: 70.0, w: 12.0, h: 17.0 },
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
        {/* Pairing card selectors — label text is visible for DOM queries */}
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
                background: active ? 'rgba(233,193,118,0.22)' : 'transparent',
                border: `2.5px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '6%',
                overflow: 'hidden',
              }}
            >
              {/* Pairing name — always visible for test DOM queries and user confirmation */}
              <span style={{
                fontSize: 'clamp(7px,0.8vw,10px)',
                fontWeight: active ? 700 : 500,
                color: active ? GOLD : 'rgba(229,226,225,0.7)',
                fontFamily: 'Georgia, serif',
                pointerEvents: 'none',
                userSelect: 'none',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                {p.id}
              </span>
            </button>
          )
        })}

        {/* Recommendation result — shown in result zone after selection */}
        {recommendation && (
          <div style={{
            position: 'absolute',
            left: '3%', top: '58%',
            width: '60%',
            pointerEvents: 'none',
            fontSize: 'clamp(9px,1.0vw,13px)',
            fontFamily: 'Georgia, serif',
            fontWeight: 600,
            color: GOLD,
            letterSpacing: '0.03em',
            userSelect: 'none',
          }}>
            {recommendation.recommendation}
          </div>
        )}
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
