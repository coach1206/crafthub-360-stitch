import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'

const GOLD = '#E9C176'
const DARK = '#0a0603'
const DIM  = 'rgba(229,226,225,0.55)'

const PAIRING_OPTIONS = [
  { id: 'Whiskey',         category: 'spirits',     flavorNote: 'Oak, vanilla, caramel' },
  { id: 'Rum',             category: 'spirits',     flavorNote: 'Molasses, tropical, sweet' },
  { id: 'Cognac',          category: 'spirits',     flavorNote: 'Dried fruit, oak, floral' },
  { id: 'Coffee',          category: 'beverage',    flavorNote: 'Roast, bitter, earthy' },
  { id: 'Espresso',        category: 'beverage',    flavorNote: 'Concentrated, bold, slightly bitter' },
  { id: 'Red Wine',        category: 'wine',        flavorNote: 'Tannin, dark fruit, cedar' },
  { id: 'Dark Chocolate',  category: 'food',        flavorNote: 'Cocoa, bitter, smooth' },
  { id: 'Craft Beer',      category: 'beverage',    flavorNote: 'Malt, hops, varied' },
]

// Simple pairing recommendation generator from selections
function buildRecommendation(selections) {
  if (selections.length === 0) return null
  const primary = selections[0]
  const opt = PAIRING_OPTIONS.find(p => p.id === primary)
  const flavorHarmony = selections.length > 1
    ? `${primary} anchors the session, with ${selections[1]} extending the mid-palate.`
    : `${primary} provides a clean, focused complement.`

  const insight = {
    Whiskey:        'The barrel aging of whiskey mirrors the tobacco curing process — shared toasty, woody notes create harmony.',
    Rum:            'Rum\'s natural sweetness softens any pepper or spice, bringing out the leaf\'s hidden sugar tones.',
    Cognac:         'Cognac\'s dried fruit character bridges the gap between earthy tobacco and elegant finish.',
    Coffee:         'Coffee amplifies the roasted, nutty qualities in medium-to-full body blends.',
    Espresso:       'Espresso concentrates bitterness that balances full-bodied, ligero-forward sticks.',
    'Red Wine':     'Tannins in red wine engage with the cigar\'s structure — choose bold reds with full-bodied cigars.',
    'Dark Chocolate': 'Bittersweet cocoa creates a buttery, dessert-like finish when paired with medium blends.',
    'Craft Beer':   'Malt complexity and carbonation cleanse the palate between draws — especially effective with thick smoke.',
  }

  return {
    primary,
    selections,
    flavorHarmony,
    insight: insight[primary] || 'A considered pairing that will complement the session\'s flavor arc.',
    flavorNote: opt?.flavorNote || '',
    recommendation: `${primary}${selections.length > 1 ? ' + ' + selections[1] : ''}`,
    category: opt?.category || 'spirits',
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

  // Persist to journey state whenever selections change
  useEffect(() => {
    setPairing(recommendation)
  }, [selectedPairings]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePairing(p) {
    triggerHaptic('light')
    setSelectedPairings(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  function handleContinue() {
    awardSessionRewards('pairing-lab')
    navigate('/smokecraft/humidor-match')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.pairingLab}
        alt="SmokeCraft Pairing Lab — Build Your Pairing Profile"
      />

      <div style={{
        position: 'fixed',
        bottom: 110, left: 0, right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10,6,3,0.94)',
          border: '1px solid rgba(233,193,118,0.2)',
          borderRadius: 12,
          padding: '10px 12px',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Choose Your Pairing
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {PAIRING_OPTIONS.map(p => {
              const active = selectedPairings.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePairing(p.id)}
                  style={{
                    background: active ? GOLD : 'transparent',
                    color: active ? DARK : GOLD,
                    border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.4)'}`,
                    borderRadius: 20,
                    padding: '11px 16px',
                    minHeight: 44,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'Georgia, serif',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {p.id}
                </button>
              )
            })}
          </div>

          {/* Live pairing recommendation */}
          {recommendation ? (
            <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', paddingTop: 8 }}>
              <div style={{ fontSize: 9, color: GOLD, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                Pairing Recommendation
              </div>
              <div style={{ fontSize: 14, color: '#e5e2e1', fontFamily: 'Georgia, serif', fontWeight: 600, marginBottom: 3 }}>
                {recommendation.recommendation}
              </div>
              <div style={{ fontSize: 11, color: DIM, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {recommendation.flavorHarmony}
              </div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>
                {recommendation.insight}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: DIM, paddingTop: 4 }}>
              Select a pairing above to generate a recommendation.
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Humidor Match →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />

      <SmokeCraftMenuButton label="Order Pairing" />
    </>
  )
}
