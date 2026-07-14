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

// 3 humidor environment rows (left-centre zone of image)
const HUMIDOR_ZONES = [
  { id: 'main_floor', label: 'Main Floor Humidor', x: 18.7, y: 24.3, w: 41.4, h: 12.3 },
  { id: 'walk_in',    label: 'Walk-In Humidor',    x: 18.7, y: 39.5, w: 41.4, h: 12.7 },
  { id: 'vip_lounge', label: 'VIP Lounge Humidor', x: 18.7, y: 54.9, w: 41.4, h: 12.6 },
]

// Cigar presets — brand names must match test filter: Oliva|Fuente|Padron|Macanudo|CAO|Romeo|Father|Cohiba
const CIGAR_PRESETS = [
  { name: 'Oliva Serie V',        origin: 'Nicaragua',          wrapper: 'Habano Maduro',   strength: 'Full',        body: 'Full',   tastingProfile: 'Dark chocolate, leather, espresso' },
  { name: 'Arturo Fuente Opus X', origin: 'Dominican Republic', wrapper: 'Dominican',       strength: 'Full',        body: 'Full',   tastingProfile: 'Spice, cedar, roasted coffee' },
  { name: 'Padron 1964 Series',   origin: 'Nicaragua',          wrapper: 'Natural Maduro',  strength: 'Medium-Full', body: 'Full',   tastingProfile: 'Cocoa, earth, toasted nuts' },
  { name: 'Macanudo Café',        origin: 'Dominican Republic', wrapper: 'Connecticut',     strength: 'Mild',        body: 'Light',  tastingProfile: 'Cream, cedar, mild spice' },
  { name: 'CAO Flathead',         origin: 'Nicaragua',          wrapper: 'Cameroon',        strength: 'Medium',      body: 'Medium', tastingProfile: 'Sweet oak, leather, black cherry' },
  { name: 'Romeo y Julieta 1875', origin: 'Dominican Republic', wrapper: 'Connecticut',     strength: 'Mild-Medium', body: 'Light',  tastingProfile: 'Toasted wood, hints of honey, smooth' },
  { name: 'My Father Le Bijou',   origin: 'Nicaragua',          wrapper: 'San Andrés',      strength: 'Full',        body: 'Full',   tastingProfile: 'Dark earth, pepper, dried fruit' },
  { name: 'Cohiba Siglo VI',      origin: 'Dominican Republic', wrapper: 'Ecuador Natural', strength: 'Medium',      body: 'Medium', tastingProfile: 'Floral, cedar, subtle pepper' },
]

// 8 cigar preset buttons in 2 rows of 4 (lower section of image, y≈70–90%)
const CIGAR_LAYOUT = CIGAR_PRESETS.map((c, i) => ({
  ...c,
  x: 1.5 + (i % 4) * 24.5,
  y: i < 4 ? 71.0 : 83.0,
  w: 23.0,
  h: 9.5,
}))

export default function HumidorMatch() {
  const { awardSessionRewards, setHumidorMatchSelection, setSelectedHumidorRecommendation } = useGuestSession()
  const { setSelectedCigar } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [selectedEnv,   setSelectedEnv]   = useState(() => localStorage.getItem('sc_humidor_env') || null)
  const [selectedCigar, setLocalCigar]    = useState(null)
  const [done, setDone] = useState(false)

  function pickEnv(envId) {
    triggerHaptic('light')
    const next = envId === selectedEnv ? null : envId
    setSelectedEnv(next)
    if (next) localStorage.setItem('sc_humidor_env', next)
    else localStorage.removeItem('sc_humidor_env')
  }

  function pickCigar(cigar) {
    triggerHaptic('light')
    const next = selectedCigar?.name === cigar.name ? null : cigar
    setLocalCigar(next)
    if (next) setSelectedCigar({ name: next.name, origin: next.origin, wrapper: next.wrapper, strength: next.strength, body: next.body, tastingProfile: next.tastingProfile })
    else setSelectedCigar(null)
  }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    if (selectedEnv) {
      const envLabel = HUMIDOR_ZONES.find(e => e.id === selectedEnv)?.label || selectedEnv
      setHumidorMatchSelection({ id: selectedEnv, label: envLabel, desc: `Environment: ${envLabel}` })
      setSelectedHumidorRecommendation({
        recommendationType: 'guest_selected',
        environment: selectedEnv,
        environmentLabel: envLabel,
        selectedCigarName: selectedCigar?.name || null,
      })
    }
    awardSessionRewards('humidor-match')
    navigate('/smokecraft/request-purchase')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.humidorMatch}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Humidor Match — Select Your Cigar"
      >
        {/* Environment zone selectors */}
        {HUMIDOR_ZONES.map(zone => {
          const active = selectedEnv === zone.id
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => pickEnv(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: active ? 'rgba(233,193,118,0.18)' : 'transparent',
                border: `2.5px solid ${active ? GOLD : 'transparent'}`,
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

        {/* Cigar preset selector buttons */}
        {CIGAR_LAYOUT.map(cigar => {
          const active = selectedCigar?.name === cigar.name
          return (
            <button
              key={cigar.name}
              type="button"
              aria-label={`${cigar.name}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => pickCigar(cigar)}
              style={{
                position: 'absolute',
                left: `${cigar.x}%`, top: `${cigar.y}%`,
                width: `${cigar.w}%`, height: `${cigar.h}%`,
                pointerEvents: 'auto',
                background: active ? 'rgba(233,193,118,0.22)' : 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <span style={{
                fontSize: 'clamp(7px,0.85vw,11px)',
                fontWeight: active ? 700 : 500,
                color: active ? GOLD : 'rgba(229,226,225,0.8)',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.02em',
                pointerEvents: 'none',
                userSelect: 'none',
                textAlign: 'center',
                lineHeight: 1.2,
                padding: '0 4px',
              }}>
                {cigar.name}
              </span>
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to Request Purchase →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
