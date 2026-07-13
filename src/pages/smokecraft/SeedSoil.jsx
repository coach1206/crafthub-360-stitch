import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'
const DIM  = 'rgba(229,226,225,0.55)'

const SEED_TYPES = [
  { id: 'Criollo',     notes: 'Native Cuban lineage. Earthy, complex, balanced strength.' },
  { id: 'Corojo',      notes: 'Vuelta Abajo royalty. Bold spice and aromatic depth.' },
  { id: 'Habano',      notes: 'Cuban heritage bred worldwide. Medium-full with pepper edge.' },
  { id: 'Connecticut', notes: 'Creamier, smoother character. Popular for milder profiles.' },
]

const SOIL_TYPES = [
  { id: 'Sandy Loam',  notes: 'Well-draining, warm. Produces lighter, aromatic leaf.' },
  { id: 'Clay Loam',   notes: 'Dense, mineral-rich. Builds body and structural strength.' },
  { id: 'Volcanic',    notes: 'Ash-enriched. Signature bold Nicaraguan terroir character.' },
  { id: 'Limestone',   notes: 'Calcium-rich. Refines flavor and creates bright, clean notes.' },
]

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 15, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => { triggerHaptic('light'); onChange(active ? null : opt.id) }}
              style={{
                background: active ? GOLD : 'transparent',
                color: active ? DARK : GOLD,
                border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.4)'}`,
                borderRadius: 20,
                padding: '12px 16px',
                minHeight: 48,
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {opt.id}
            </button>
          )
        })}
      </div>
      {value && (() => {
        const notes = options.find(o => o.id === value)?.notes
        return notes ? (
          <div style={{ fontSize: 14, color: DIM, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 5 }}>
            {notes}
          </div>
        ) : null
      })()}
    </div>
  )
}

export default function SeedSoil() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setSeedSoil } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [seedType, setSeedType] = useState(() => journey.seedSoil?.seedType || null)
  const [soilType, setSoilType] = useState(() => journey.seedSoil?.soilType || null)

  // Persist to journey state whenever selections change
  useEffect(() => {
    setSeedSoil(
      seedType || soilType
        ? { seedType: seedType || null, soilType: soilType || null }
        : null
    )
  }, [seedType, soilType, setSeedSoil])

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

      <div style={{
        position: 'fixed',
        bottom: 110, left: 0, right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(5,3,1,0.93)',
          border: '1px solid rgba(233,193,118,0.2)',
          borderRadius: 12,
          padding: '10px 14px',
          maxWidth: 560,
          margin: '0 auto',
        }}>
          <ChipGroup label="Seed Type" options={SEED_TYPES} value={seedType} onChange={setSeedType} />
          <ChipGroup label="Soil Type" options={SOIL_TYPES} value={soilType} onChange={setSoilType} />
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Pairing Lab →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
