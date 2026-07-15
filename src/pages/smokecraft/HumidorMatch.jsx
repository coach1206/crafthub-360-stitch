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
const PANEL = {
  background: 'rgba(5,5,5,0.92)',
  border: '1px solid rgba(233,193,118,0.28)',
  borderRadius: 8,
  position: 'absolute',
  boxSizing: 'border-box',
  fontFamily: 'Georgia, serif',
}

const HUMIDOR_ZONES = [
  { id: 'virtual_humidor', label: 'Virtual Humidor', x: 18.7, y: 24.3, w: 41.4, h: 12.3 },
  { id: 'dry_box',         label: 'Dry Box',         x: 18.7, y: 39.5, w: 41.4, h: 12.7 },
  { id: 'travel_case',     label: 'Travel Case',     x: 18.7, y: 54.9, w: 41.4, h: 12.6 },
]

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

const CIGAR_LAYOUT = CIGAR_PRESETS.map((c, i) => ({
  ...c,
  x: 1.5 + (i % 4) * 24.5,
  y: i < 4 ? 71.0 : 83.0,
  w: 23.0,
  h: 9.5,
}))

function Stepper({ label, value, unit, onDec, onInc, min, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: 'rgba(229,226,225,0.6)', width: 62, flexShrink: 0 }}>{label}</span>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => { triggerHaptic('light'); onDec() }}
        disabled={value <= min}
        style={{
          width: 20, height: 20, borderRadius: 4,
          border: '1px solid rgba(233,193,118,0.4)', background: 'transparent',
          color: GOLD, cursor: value <= min ? 'not-allowed' : 'pointer',
          fontSize: 14, lineHeight: 1, padding: 0, outline: 'none',
          opacity: value <= min ? 0.4 : 1,
        }}
      >−</button>
      <span style={{ fontSize: 'clamp(9px,0.8vw,11px)', color: GOLD, fontWeight: 700, minWidth: 38, textAlign: 'center' }}>
        {value}{unit}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => { triggerHaptic('light'); onInc() }}
        disabled={value >= max}
        style={{
          width: 20, height: 20, borderRadius: 4,
          border: '1px solid rgba(233,193,118,0.4)', background: 'transparent',
          color: GOLD, cursor: value >= max ? 'not-allowed' : 'pointer',
          fontSize: 14, lineHeight: 1, padding: 0, outline: 'none',
          opacity: value >= max ? 0.4 : 1,
        }}
      >+</button>
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: 'rgba(229,226,225,0.6)' }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => { triggerHaptic('light'); onChange(!value) }}
        style={{
          width: 36, height: 18, borderRadius: 9,
          border: `1px solid ${value ? GOLD : 'rgba(233,193,118,0.3)'}`,
          background: value ? 'rgba(233,193,118,0.2)' : 'transparent',
          cursor: 'pointer', outline: 'none', position: 'relative', padding: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: value ? GOLD : 'rgba(229,226,225,0.4)',
          transition: 'left 0.15s, background 0.15s',
        }} />
      </button>
    </div>
  )
}

export default function HumidorMatch() {
  const { awardSessionRewards, setHumidorMatchSelection, setSelectedHumidorRecommendation } = useGuestSession()
  const { journey, setSelectedCigar } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Load from canonical journey state
  const savedCigar = journey.selectedCigar

  const [selectedEnv,   setSelectedEnv]   = useState(() => savedCigar?.humidorEnv || null)
  const [selectedCigar, setLocalCigar]    = useState(() => savedCigar?.name ? savedCigar : null)
  const [temp,          setTemp]          = useState(() => savedCigar?.humidorTemp || 70)
  const [humidity,      setHumidity]      = useState(() => savedCigar?.humidorHumidity || 70)
  const [sealOn,        setSealOn]        = useState(() => savedCigar?.humidorSeal ?? false)
  const [airflowOn,     setAirflowOn]     = useState(() => savedCigar?.humidorAirflow ?? true)
  const [applyStatus,   setApplyStatus]   = useState('idle')
  const [done,          setDone]          = useState(false)

  // Persist all humidor state to canonical journey via selectedCigar
  useEffect(() => {
    if (selectedCigar) {
      setSelectedCigar({
        name:             selectedCigar.name,
        origin:           selectedCigar.origin,
        wrapper:          selectedCigar.wrapper,
        strength:         selectedCigar.strength,
        body:             selectedCigar.body,
        tastingProfile:   selectedCigar.tastingProfile,
        humidorEnv:       selectedEnv,
        humidorTemp:      temp,
        humidorHumidity:  humidity,
        humidorSeal:      sealOn,
        humidorAirflow:   airflowOn,
      })
    }
  }, [selectedCigar, selectedEnv, temp, humidity, sealOn, airflowOn]) // eslint-disable-line react-hooks/exhaustive-deps

  function pickEnv(envId) {
    triggerHaptic('light')
    const next = envId === selectedEnv ? null : envId
    setSelectedEnv(next)
    if (applyStatus === 'applied') setApplyStatus('idle')
  }

  function pickCigar(cigar) {
    triggerHaptic('light')
    const next = selectedCigar?.name === cigar.name ? null : cigar
    setLocalCigar(next)
  }

  function handleApply() {
    triggerHaptic('medium')
    // Persist settings through journey context (done via useEffect above)
    setApplyStatus('applied')
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
        settings: { temp, humidity, sealOn, airflowOn },
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
        {/* Nav mask — covers image-drawn navigation */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

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
                position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto', background: 'transparent',
                border: `2.5px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', padding: 0, outline: 'none',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 'clamp(9px,1.2vw,14px)',
                  fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Environment controls panel */}
        <div style={{ ...PANEL, left: '63%', top: '22%', width: '34%', height: '46%',
          padding: 'clamp(6px,1vw,14px)', pointerEvents: 'auto' }}>
          <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.55)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            ◦ Manual Mode — No Hardware Connected
          </div>
          {selectedEnv && (
            <div style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: GOLD, fontWeight: 700, marginBottom: 10, letterSpacing: '0.04em' }}>
              {HUMIDOR_ZONES.find(z => z.id === selectedEnv)?.label}
            </div>
          )}
          <Stepper label="Temperature" value={temp} unit="°F" min={60} max={80}
            onDec={() => setTemp(v => Math.max(60, v - 1))} onInc={() => setTemp(v => Math.min(80, v + 1))} />
          <Stepper label="Humidity" value={humidity} unit="%" min={55} max={80}
            onDec={() => setHumidity(v => Math.max(55, v - 1))} onInc={() => setHumidity(v => Math.min(80, v + 1))} />
          <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', margin: '10px 0 8px' }} />
          <Toggle label="Seal" value={sealOn} onChange={setSealOn} />
          <Toggle label="Airflow" value={airflowOn} onChange={setAirflowOn} />
          <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', margin: '10px 0 8px' }} />
          <button
            type="button"
            aria-label="Apply humidor settings"
            onClick={handleApply}
            style={{
              width: '100%', padding: '5px 0', borderRadius: 5,
              border: `1px solid ${applyStatus === 'applied' ? 'rgba(233,193,118,0.5)' : GOLD}`,
              background: applyStatus === 'applied' ? 'rgba(233,193,118,0.12)' : 'rgba(233,193,118,0.08)',
              color: GOLD, fontSize: 'clamp(8px,0.72vw,10px)', fontFamily: 'Georgia, serif',
              fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer', outline: 'none',
            }}
          >
            {applyStatus === 'applied' ? '✓ Settings Applied' : 'Apply Settings'}
          </button>
        </div>

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
                position: 'absolute', left: `${cigar.x}%`, top: `${cigar.y}%`,
                width: `${cigar.w}%`, height: `${cigar.h}%`,
                pointerEvents: 'auto', background: 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', outline: 'none',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 3, right: 5, fontSize: 'clamp(8px,0.9vw,11px)',
                  fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
              )}
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
