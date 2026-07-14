import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

// Natural dimensions of SEED & SOIL.png
const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'

// Card zones as % of natural image dimensions (x, y, w, h)
const SEED_ZONES = [
  { id: 'Criollo',     group: 'seed', x:  7.77, y: 43.0, w: 32.9, h: 6.9 },
  { id: 'Corojo',      group: 'seed', x:  7.77, y: 50.2, w: 32.9, h: 6.9 },
  { id: 'Habano',      group: 'seed', x:  7.77, y: 57.4, w: 32.9, h: 6.9 },
  { id: 'Connecticut', group: 'seed', x:  7.77, y: 64.6, w: 32.9, h: 8.5 },
]
const SOIL_ZONES = [
  { id: 'Sandy Loam', group: 'soil', x: 41.9, y: 43.0, w: 44.7, h: 6.9 },
  { id: 'Clay Loam',  group: 'soil', x: 41.9, y: 50.2, w: 44.7, h: 6.9 },
  { id: 'Volcanic',   group: 'soil', x: 41.9, y: 57.4, w: 44.7, h: 6.9 },
  { id: 'Limestone',  group: 'soil', x: 41.9, y: 64.6, w: 44.7, h: 8.5 },
]
const ALL_ZONES = [...SEED_ZONES, ...SOIL_ZONES]

export default function SeedSoil() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setSeedSoil } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [seedType, setSeedType] = useState(() => journey.seedSoil?.seedType || null)
  const [soilType, setSoilType] = useState(() => journey.seedSoil?.soilType || null)

  useEffect(() => {
    setSeedSoil(
      seedType || soilType
        ? { seedType: seedType || null, soilType: soilType || null }
        : null
    )
  }, [seedType, soilType, setSeedSoil])

  function handleToggle(zone) {
    triggerHaptic('light')
    if (zone.group === 'seed') {
      setSeedType(prev => prev === zone.id ? null : zone.id)
    } else {
      setSoilType(prev => prev === zone.id ? null : zone.id)
    }
  }

  function handleContinue() {
    awardSessionRewards('seed-soil')
    navigate('/smokecraft/pairing-lab')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.seedSoil}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Seed & Soil — The Origin of Your Cigar"
      >
        {ALL_ZONES.map(zone => {
          const active = zone.group === 'seed' ? seedType === zone.id : soilType === zone.id
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.id}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => handleToggle(zone)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.w}%`,
                height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 3,
                cursor: 'pointer',
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute',
                  top: 3,
                  right: 6,
                  fontSize: 'clamp(9px,1.2vw,14px)',
                  fontWeight: 700,
                  color: GOLD,
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}>
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to Pairing Lab →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
