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
const DIM    = 'rgba(229,226,225,0.55)'
const BORDER = 'rgba(233,193,118,0.22)'

const MENTORS = [
  { id: 'alejandro', name: 'Don Alejandro',      origin: 'Dominican Republic', flag: '🇩🇴', expertise: 'Aged blends & terroir depth',        tags: ['Complexity', 'Floral Notes'] },
  { id: 'javier',    name: 'Javier Estelí',       origin: 'Nicaragua',          flag: '🇳🇮', expertise: 'Bold ligero & volcanic soil',         tags: ['Full Body', 'Strength'] },
  { id: 'jamastrán', name: 'Doña Jamastrán',      origin: 'Honduras',           flag: '🇭🇳', expertise: 'Jamastrán valley leaf craft',         tags: ['Rich Cedar', 'Corojo'] },
  { id: 'mateo',     name: 'Mateo San Andrés',    origin: 'Mexico',             flag: '🇲🇽', expertise: 'San Andrés maduro mastery',           tags: ['Dark Cocoa', 'Maduro Expert'] },
  { id: 'rafael',    name: 'Maestro Rafael',       origin: 'Cuba',               flag: '🇨🇺', expertise: 'Classic Vuelta Abajo traditions',    tags: ['Tradition', 'Balance'] },
  { id: 'carlos',    name: 'Carlos Mendoza',       origin: 'Peru',               flag: '🇵🇪', expertise: 'Emerging origin & binder work',      tags: ['Emerging', 'Binder Craft'] },
  { id: 'blackwell', name: 'Thomas A. Blackwell', origin: 'USA',                flag: '🇺🇸', expertise: 'Boutique blending & education',      tags: ['Education', 'Service'] },
  { id: 'paulo',     name: 'Paulo Oliveira',       origin: 'Brazil',             flag: '🇧🇷', expertise: 'Arapiraca wrapper & fermentation',   tags: ['Mata Fina', 'Research'] },
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

      {/* Scrollable card grid — positioned below the upper branding area of the image */}
      <div style={{
        position: 'fixed',
        top: 'clamp(140px, 18vh, 200px)',
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
          {/* Instruction header */}
          <div style={{
            textAlign: 'center',
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>
              SmokeCraft 360
            </div>
            <div style={{ fontSize: 'clamp(13px,2vw,16px)', fontFamily: 'Georgia, serif', color: '#e5e2e1', fontWeight: 700 }}>
              Choose up to 2 Mentors
            </div>
            {selected.length > 0 && (
              <div style={{ fontSize: 11, color: GOLD, marginTop: 2, fontFamily: 'Georgia, serif' }}>
                {selected.length === 1 ? '1 selected' : '2 selected — maximum reached'}
              </div>
            )}
          </div>

          {/* 2-column card grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(140px,28vw,200px), 1fr))',
            gap: 8,
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
                    background: active
                      ? 'rgba(233,193,118,0.14)'
                      : 'rgba(5,3,1,0.88)',
                    border: `${active ? 2 : 1}px solid ${active ? GOLD : BORDER}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: maxed ? 'not-allowed' : 'pointer',
                    opacity: maxed ? 0.45 : 1,
                    touchAction: 'manipulation',
                    position: 'relative',
                    transition: 'border-color 0.15s, background 0.15s',
                    minHeight: 80,
                  }}
                >
                  {/* Selected indicator */}
                  {active && (
                    <div style={{
                      position: 'absolute',
                      top: 8, right: 8,
                      width: 18, height: 18,
                      borderRadius: '50%',
                      background: GOLD,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: DARK, fontWeight: 800,
                    }}>
                      ✓
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{m.flag}</span>
                    <span style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {m.origin}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(12px,1.8vw,14px)',
                    fontFamily: 'Georgia, serif',
                    fontWeight: 700,
                    color: active ? GOLD : '#e5e2e1',
                    marginBottom: 3,
                    lineHeight: 1.2,
                  }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 10, color: DIM, fontFamily: 'Georgia, serif', lineHeight: 1.4, marginBottom: 5 }}>
                    {m.expertise}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {m.tags.map(t => (
                      <span key={t} style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: active ? GOLD : DIM,
                        background: active ? 'rgba(233,193,118,0.1)' : 'rgba(229,226,225,0.06)',
                        border: `1px solid ${active ? 'rgba(233,193,118,0.35)' : 'rgba(229,226,225,0.12)'}`,
                        borderRadius: 4,
                        padding: '2px 5px',
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
        primary="Continue to Shape, Size & Burn →"
        onPrimary={handleContinue}
        primaryDisabled={selected.length === 0}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
