import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const PAIRING_TYPES = [
  'Whiskey', 'Rum', 'Cognac', 'Coffee', 'Red Wine', 'Dark Chocolate', 'Craft Beer',
]

export default function PairingLab() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [selectedPairings, setSelectedPairings] = useState([])

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

      {/* Pairing type selector — real React chips */}
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
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Pairing Type
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PAIRING_TYPES.map(p => {
              const active = selectedPairings.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePairing(p)}
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
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Humidor Match →"
        onPrimary={handleContinue}
      />

      <SmokeCraftMenuButton label="Order Pairing" />
    </>
  )
}
