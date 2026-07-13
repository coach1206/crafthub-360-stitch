import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const DIM    = 'rgba(229,226,225,0.70)'
const BORDER = 'rgba(233,193,118,0.22)'

const MENTORS = [
  {
    id: 'alejandro',
    name: 'Don Alejandro',
    origin: 'Dominican Republic',
    expertise: 'Aged blends & terroir depth',
    biography: 'The best cigar begins in how you treat the soil and the leaf over time.',
    tags: ['Complexity', 'Floral Notes'],
  },
  {
    id: 'javier',
    name: 'Javier Estelí',
    origin: 'Nicaragua',
    expertise: 'Bold ligero & volcanic soil',
    biography: 'Strength is not harshness. A full-bodied cigar must balance power with grace.',
    tags: ['Full Body', 'Strength'],
  },
  {
    id: 'jamastrán',
    name: 'Doña Jamastrán',
    origin: 'Honduras',
    expertise: 'Jamastrán valley leaf craft',
    biography: 'The Jamastrán valley teaches patience. Every leaf has its own pace.',
    tags: ['Rich Cedar', 'Corojo'],
  },
  {
    id: 'mateo',
    name: 'Mateo San Andrés',
    origin: 'Mexico',
    expertise: 'San Andrés maduro mastery',
    biography: 'Maduro is not just a color — it is a transformation of character.',
    tags: ['Dark Cocoa', 'Maduro Expert'],
  },
  {
    id: 'rafael',
    name: 'Maestro Rafael',
    origin: 'Cuba',
    expertise: 'Classic Vuelta Abajo traditions',
    biography: 'Tradition is not a limitation. It is the foundation on which mastery is built.',
    tags: ['Tradition', 'Balance'],
  },
  {
    id: 'carlos',
    name: 'Carlos Mendoza',
    origin: 'Peru',
    expertise: 'Emerging origin & binder work',
    biography: 'The world is full of undiscovered terroir. Curiosity is the finest blending tool.',
    tags: ['Emerging', 'Binder Craft'],
  },
  {
    id: 'blackwell',
    name: 'Thomas A. Blackwell',
    origin: 'USA',
    expertise: 'Boutique blending & education',
    biography: 'Education changes how people taste. Every session is an opportunity to elevate.',
    tags: ['Education', 'Service'],
  },
  {
    id: 'paulo',
    name: 'Paulo Oliveira',
    origin: 'Brazil',
    expertise: 'Arapiraca wrapper & fermentation',
    biography: 'Arapiraca is one of the world\'s great leaves. Few know it. That is about to change.',
    tags: ['Mata Fina', 'Research'],
  },
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
    const mentors = MENTORS.filter(m => selected.includes(m.id))
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
      <SmokeCraftAssetScreen
        src={SC_ASSETS.mentorSelection}
        alt="SmokeCraft Mentor Selection — Choose Your Guide"
        classification="DECORATIVE_BACKGROUND"
      />

      {/*
        Compact bottom selection strip — the MENTOR SELECTION1.png portrait grid
        is the primary visual. This strip provides only what the printed image cannot:
        interactive selection state, a selection counter, and selected mentor details.
      */}
      <div style={{
        position: 'fixed',
        bottom: 165,
        left: 0,
        right: 0,
        zIndex: 400,
        padding: '0 12px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(5,3,1,0.93)',
          border: '1px solid rgba(233,193,118,0.22)',
          borderRadius: 12,
          padding: '10px 14px',
          maxWidth: 680,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Choose up to 2 Mentors
            </div>
            {selected.length > 0 && (
              <div style={{ fontSize: 14, color: GOLD, fontFamily: 'Georgia, serif' }}>
                {selected.length === 2 ? '2 of 2 selected' : '1 of 2 selected'}
              </div>
            )}
          </div>

          {/* Horizontal scrolling mentor chips */}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 4,
          }}>
            {MENTORS.map(m => {
              const active = selected.includes(m.id)
              const maxed = selected.length >= 2 && !active
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => !maxed && toggle(m.id)}
                  style={{
                    background: active ? GOLD : 'rgba(10,6,3,0.85)',
                    color: active ? DARK : GOLD,
                    border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.38)'}`,
                    borderRadius: 24,
                    padding: '10px 16px',
                    minHeight: 44,
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: 'Georgia, serif',
                    cursor: maxed ? 'not-allowed' : 'pointer',
                    opacity: maxed ? 0.45 : 1,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    touchAction: 'manipulation',
                    transition: 'background 0.12s, border-color 0.12s',
                  }}
                >
                  {active ? `✓ ${m.name}` : m.name}
                </button>
              )
            })}
          </div>

          {/* Selected mentor detail strip */}
          {selected.length > 0 && (() => {
            const activeMentors = MENTORS.filter(m => selected.includes(m.id))
            return (
              <div style={{
                marginTop: 8,
                borderTop: '1px solid rgba(233,193,118,0.14)',
                paddingTop: 8,
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
              }}>
                {activeMentors.map(m => (
                  <div key={m.id} style={{ fontSize: 14, color: DIM, fontFamily: 'Georgia, serif' }}>
                    <span style={{ color: GOLD, fontWeight: 700 }}>{m.name}</span>
                    {' · '}<span style={{ color: 'rgba(233,193,118,0.60)' }}>{m.origin}</span>
                    {' — '}{m.expertise}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

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
