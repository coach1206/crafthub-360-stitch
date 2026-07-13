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

const MENTORS = [
  { id: 'alejandro', name: 'Don Alejandro',       origin: 'Dominican Republic', expertise: 'Aged blends & terroir depth' },
  { id: 'javier',    name: 'Javier Estelí',        origin: 'Nicaragua',          expertise: 'Bold ligero & volcanic soil' },
  { id: 'jamastrán', name: 'Doña Jamastrán',       origin: 'Honduras',           expertise: 'Jamastrán valley leaf craft' },
  { id: 'mateo',     name: 'Mateo San Andrés',     origin: 'Mexico',             expertise: 'San Andrés maduro mastery' },
  { id: 'rafael',    name: 'Maestro Rafael',        origin: 'Cuba',               expertise: 'Classic Vuelta Abajo traditions' },
  { id: 'carlos',    name: 'Carlos Mendoza',        origin: 'Peru',               expertise: 'Emerging origin & binder work' },
  { id: 'blackwell', name: 'Thomas A. Blackwell',  origin: 'USA',                expertise: 'Boutique blending & education' },
  { id: 'paulo',     name: 'Paulo Oliveira',        origin: 'Brazil',             expertise: 'Arapiraca wrapper & fermentation' },
]

export default function Mentor() {
  const { awardSessionRewards, setSelectedMentor } = useGuestSession()
  const { journey, setMentor } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Restore from journey state
  const [selected, setSelected] = useState(() => {
    const saved = journey.mentor
    if (!saved) return []
    if (Array.isArray(saved)) return saved.map(m => m.id)
    return [saved.id]
  })

  // Persist to journey state whenever selection changes
  useEffect(() => {
    const mentors = MENTORS.filter(m => selected.includes(m.id))
    setMentor(mentors.length ? mentors : null)
    // Also write primary to GuestSessionContext
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

  const primaryMentor = MENTORS.find(m => selected[0] === m.id)

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.mentorSelection}
        alt="SmokeCraft Mentor Selection — Choose Your Guide"
        classification="DECORATIVE_BACKGROUND"
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
            Select up to 2 Mentors
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {MENTORS.map(m => {
              const active = selected.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(m.id)}
                  style={{
                    background: active ? GOLD : 'transparent',
                    color: active ? DARK : GOLD,
                    border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.4)'}`,
                    borderRadius: 20,
                    padding: '11px 16px',
                    minHeight: 44,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'Georgia, serif',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {m.name}
                </button>
              )
            })}
          </div>

          {/* Live selection summary */}
          {primaryMentor && (
            <div style={{
              borderTop: '1px solid rgba(233,193,118,0.15)',
              paddingTop: 8,
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Selected
              </div>
              <div style={{ fontSize: 14, color: '#e5e2e1', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                {primaryMentor.name}
              </div>
              <div style={{ fontSize: 11, color: DIM }}>{primaryMentor.origin} · {primaryMentor.expertise}</div>
              {selected.length === 2 && (() => {
                const m2 = MENTORS.find(m => m.id === selected[1])
                return m2 ? (
                  <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>
                    + {m2.name} · {m2.origin}
                  </div>
                ) : null
              })()}
            </div>
          )}
          {!primaryMentor && (
            <div style={{ fontSize: 11, color: DIM, paddingTop: 4 }}>
              No mentor selected — choose one to continue.
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Shape, Size & Burn →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
