import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const MENTORS = [
  { id: 'alejandro', name: 'Don Alejandro', origin: 'Dominican Republic' },
  { id: 'javier', name: 'Javier Estelí', origin: 'Nicaragua' },
  { id: 'jamastrán', name: 'Doña Jamastrán', origin: 'Honduras' },
  { id: 'mateo', name: 'Mateo San Andrés', origin: 'Mexico' },
  { id: 'rafael', name: 'Maestro Rafael', origin: 'Cuba' },
  { id: 'carlos', name: 'Carlos Mendoza', origin: 'Peru' },
  { id: 'blackwell', name: 'Thomas A. Blackwell', origin: 'USA' },
  { id: 'paulo', name: 'Paulo Oliveira', origin: 'Brazil' },
]

export default function Mentor() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])

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

      {/* Mentor selection chips — real React state, select up to 2 */}
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
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Select up to 2 Mentors
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {MENTORS.map(m => {
              const active = selected.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  style={{
                    background: active ? GOLD : 'transparent',
                    color: active ? DARK : GOLD,
                    border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.4)'}`,
                    borderRadius: 20,
                    padding: '11px 16px',
                    minHeight: 44,
                    fontSize: 14,
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
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Shape, Size & Burn →"
        onPrimary={handleContinue}
      />
    </>
  )
}
