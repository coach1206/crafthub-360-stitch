import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

// Natural dimensions of smokecraft-vitola.png
const NAT_W = 1586
const NAT_H = 992

const GOLD = '#E9C176'
const DARK = '#0a0603'

// Card zones as % of natural image dimensions (x, y, w, h)
const FORMAT_ZONES = [
  { id: 'robusto',   label: 'Robusto',   desc: '5" × 50 ring',   burnTime: '45–60 min',  notes: 'The benchmark medium-size. Balanced and concentrated.',                    x: 11.9, y: 23.8, w: 14.5, h: 22.0 },
  { id: 'toro',      label: 'Toro',      desc: '6" × 52 ring',   burnTime: '60–75 min',  notes: 'Extra length opens up the blend\'s mid-section.',                          x: 26.6, y: 23.8, w: 13.8, h: 22.0 },
  { id: 'churchill', label: 'Churchill', desc: '7" × 48 ring',   burnTime: '75–90 min',  notes: 'Ring gauge keeps it refined. Long smoke, elegant evolution.',               x: 40.6, y: 23.8, w: 14.1, h: 22.0 },
  { id: 'corona',    label: 'Corona',    desc: '5.5" × 42 ring', burnTime: '35–45 min',  notes: 'Smaller ring focuses the wrapper\'s flavor front and center.',             x: 11.9, y: 46.1, w: 14.5, h: 20.9 },
  { id: 'gordo',     label: 'Gordo',     desc: '6" × 60 ring',   burnTime: '90–120 min', notes: 'Wide ring gauge increases coolness. More complex burn.',                    x: 26.6, y: 46.1, w: 13.8, h: 20.9 },
  { id: 'torpedo',   label: 'Torpedo',   desc: '6.5" × 52 ring', burnTime: '70–85 min',  notes: 'Tapered head concentrates draw. Distinct opening character.',              x: 40.6, y: 46.1, w: 14.1, h: 20.9 },
]

export default function Format() {
  const { awardSessionRewards, setSmokeCraftFormat } = useGuestSession()
  const { journey, setFormat } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(() => journey.format?.id || null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const fmt = FORMAT_ZONES.find(f => f.id === selected)
    setFormat(fmt ? { id: fmt.id, label: fmt.label, desc: fmt.desc, burnTime: fmt.burnTime } : null)
    if (fmt) setSmokeCraftFormat({ id: fmt.id, name: fmt.label, desc: fmt.desc })
  }, [selected, setFormat, setSmokeCraftFormat])

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('format')
    awardSessionRewards('wrapper-strength')
    navigate('/smokecraft/seed-soil')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.format}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Format — Shape, Size & Burn Time"
      >
        {FORMAT_ZONES.map(f => {
          const active = selected === f.id
          return (
            <button
              key={f.id}
              type="button"
              aria-label={`${f.label} — ${f.desc}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => { triggerHaptic('light'); setSelected(active ? null : f.id) }}
              style={{
                position: 'absolute',
                left: `${f.x}%`,
                top: `${f.y}%`,
                width: `${f.w}%`,
                height: `${f.h}%`,
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
                  position: 'absolute',
                  top: 4,
                  right: 5,
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
        primary={done ? 'Continuing…' : 'Continue to Seed & Soil →'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
