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

      <div style={{
        position: 'fixed',
        top: 'clamp(150px, 18vh, 220px)',
        bottom: 110,
        left: 0,
        right: 0,
        zIndex: 400,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '0 12px 8px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          maxWidth: 700,
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              SmokeCraft 360
            </div>
            <div style={{
              fontSize: 18,
              fontFamily: 'Georgia, serif',
              color: '#e5e2e1',
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 4,
            }}>
              Choose up to 2 Mentors
            </div>
            {selected.length > 0 && (
              <div style={{
                fontSize: 14,
                color: GOLD,
                fontFamily: 'Georgia, serif',
                lineHeight: 1.4,
              }}>
                {selected.length === 1 ? '1 selected' : '2 selected — maximum reached'}
              </div>
            )}
          </div>

          {/* Card grid — 1 col on handheld, 2 col on tablet, 3 col on desktop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 10,
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
                    background: active ? 'rgba(233,193,118,0.14)' : 'rgba(5,3,1,0.90)',
                    border: `${active ? 2 : 1}px solid ${active ? GOLD : BORDER}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: maxed ? 'not-allowed' : 'pointer',
                    opacity: maxed ? 0.45 : 1,
                    touchAction: 'manipulation',
                    position: 'relative',
                    transition: 'border-color 0.15s, background 0.15s',
                    minHeight: 88,
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute',
                      top: 10, right: 10,
                      width: 22, height: 22,
                      borderRadius: '50%',
                      background: GOLD,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: DARK, fontWeight: 800,
                    }}>
                      ✓
                    </div>
                  )}

                  {/* Country */}
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: active ? GOLD : DIM,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 5,
                    lineHeight: 1.3,
                    fontFamily: 'Georgia, serif',
                  }}>
                    {m.origin}
                  </div>

                  {/* Name */}
                  <div style={{
                    fontSize: 18,
                    fontFamily: 'Georgia, serif',
                    fontWeight: 700,
                    color: active ? GOLD : '#e5e2e1',
                    marginBottom: 5,
                    lineHeight: 1.25,
                    paddingRight: active ? 28 : 0,
                  }}>
                    {m.name}
                  </div>

                  {/* Expertise */}
                  <div style={{
                    fontSize: 15,
                    color: DIM,
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1.45,
                    marginBottom: 6,
                  }}>
                    {m.expertise}
                  </div>

                  {/* Biography */}
                  <div style={{
                    fontSize: 15,
                    color: active ? 'rgba(229,226,225,0.85)' : 'rgba(229,226,225,0.60)',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}>
                    "{m.biography}"
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {m.tags.map(t => (
                      <span key={t} style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: active ? GOLD : DIM,
                        background: active ? 'rgba(233,193,118,0.1)' : 'rgba(229,226,225,0.06)',
                        border: `1px solid ${active ? 'rgba(233,193,118,0.35)' : 'rgba(229,226,225,0.12)'}`,
                        borderRadius: 4,
                        padding: '4px 8px',
                        lineHeight: 1.3,
                      }}>{t}</span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
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
