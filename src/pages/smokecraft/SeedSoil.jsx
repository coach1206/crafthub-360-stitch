import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const SEED_TYPES = ['Criollo', 'Corojo', 'Habano', 'Connecticut']
const SOIL_TYPES = ['Sandy Loam', 'Clay Loam', 'Volcanic', 'Limestone']

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const active = value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { triggerHaptic('light'); onChange(active ? null : opt) }}
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
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SeedSoil() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [seedType, setSeedType] = useState(null)
  const [soilType, setSoilType] = useState(null)

  function handleContinue() {
    awardSessionRewards('seed-soil')
    navigate('/smokecraft/pairing-lab')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.seedSoil}
        alt="SmokeCraft Seed & Soil — The Origin of Your Cigar"
      />

      {/* Seed & soil selectors — real React state */}
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
          <ChipGroup label="Seed Type" options={SEED_TYPES} value={seedType} onChange={setSeedType} />
          <ChipGroup label="Soil Type" options={SOIL_TYPES} value={soilType} onChange={setSoilType} />
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Pairing Lab →"
        onPrimary={handleContinue}
      />
    </>
  )
}
