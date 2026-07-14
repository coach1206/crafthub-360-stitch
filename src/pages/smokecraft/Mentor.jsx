import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

// Natural dimensions of MENTOR SELECTION1.png
const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'

// Card zones as % of natural image dimensions (x, y, w, h)
const MENTOR_ZONES = [
  { id: 'alejandro',  name: 'Don Alejandro',         origin: 'Dominican Republic', expertise: 'Aged blends & terroir depth',        x:  7.77, y: 39.85, w: 19.62, h: 17.85 },
  { id: 'javier',    name: 'Javier Estelí',          origin: 'Nicaragua',          expertise: 'Bold ligero & volcanic soil',          x: 27.45, y: 39.85, w: 19.50, h: 17.85 },
  { id: 'jamastrán', name: 'Doña Jamastrán',         origin: 'Honduras',           expertise: 'Jamastrán valley leaf craft',           x: 47.07, y: 39.85, w: 19.62, h: 17.85 },
  { id: 'mateo',     name: 'Mateo San Andrés',       origin: 'Mexico',             expertise: 'San Andrés maduro mastery',             x: 66.75, y: 39.85, w: 19.65, h: 17.85 },
  { id: 'rafael',    name: 'Maestro Rafael',         origin: 'Cuba',               expertise: 'Classic Vuelta Abajo traditions',       x:  7.77, y: 58.24, w: 19.62, h: 18.17 },
  { id: 'carlos',    name: 'Carlos Mendoza',         origin: 'Peru',               expertise: 'Emerging origin & binder work',         x: 27.45, y: 58.24, w: 19.50, h: 18.17 },
  { id: 'blackwell', name: 'Thomas A. Blackwell',    origin: 'USA',                expertise: 'Boutique blending & education',         x: 47.07, y: 58.24, w: 19.62, h: 18.17 },
  { id: 'paulo',     name: 'Paulo Oliveira',         origin: 'Brazil',             expertise: 'Arapiraca wrapper & fermentation',      x: 66.75, y: 58.24, w: 19.65, h: 18.17 },
]

export default function Mentor() {
  const { awardSessionRewards, setSelectedMentor } = useGuestSession()
  const { journey, setMentor } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [selected, setSelected] = useState(() => {
    const saved = journey.mentor
    if (!saved) return []
    if (Array.isArray(saved)) return saved.map(m => m.id)
    return [saved.id]
  })

  useEffect(() => {
    const mentors = MENTOR_ZONES.filter(m => selected.includes(m.id))
    setMentor(mentors.length ? mentors : null)
    if (mentors.length) setSelectedMentor(mentors[0].id, mentors[0].origin)
  }, [selected, setMentor, setSelectedMentor])

  function toggle(id) {
    triggerHaptic('light')
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 2 ? [...prev, id] : prev
    )
  }

  function handleContinue() {
    awardSessionRewards('mentor')
    navigate('/smokecraft/format')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.mentorSelection}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Mentor Selection — Choose Your Guide"
      >
        {MENTOR_ZONES.map(m => {
          const active = selected.includes(m.id)
          const maxed = selected.length >= 2 && !active
          return (
            <button
              key={m.id}
              type="button"
              aria-label={`${m.name} — ${m.origin} — ${m.expertise}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => !maxed && toggle(m.id)}
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: `${m.w}%`,
                height: `${m.h}%`,
                pointerEvents: 'auto',
                background: active ? 'rgba(233,193,118,0.18)' : 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 4,
                cursor: maxed ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 6,
                  fontSize: 'clamp(10px,1.4vw,16px)',
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
        primary="Continue to Shape, Size & Burn"
        onPrimary={handleContinue}
        primaryDisabled={selected.length === 0}
        secondary="Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
