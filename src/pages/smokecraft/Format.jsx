import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const FORMATS = [
  { id: 'robusto', label: 'Robusto', desc: '5" × 50 ring' },
  { id: 'toro', label: 'Toro', desc: '6" × 52 ring' },
  { id: 'churchill', label: 'Churchill', desc: '7" × 48 ring' },
  { id: 'corona', label: 'Corona', desc: '5.5" × 42 ring' },
  { id: 'gordo', label: 'Gordo', desc: '6" × 60 ring' },
  { id: 'torpedo', label: 'Torpedo', desc: '6.5" × 52 ring' },
]

export default function Format() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    // Award format AND wrapper-strength (S6) so session guard allows seed-soil (S7)
    awardSessionRewards('format')
    awardSessionRewards('wrapper-strength')
    navigate('/smokecraft/seed-soil')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-vitola.png"
        alt="SmokeCraft Format — Shape, Size & Burn Time"
      />

      {/* Format selector — real React state */}
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
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Choose Your Format
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FORMATS.map(f => {
              const active = selected === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-label={`${f.label} — ${f.desc}`}
                  aria-pressed={active}
                  onClick={() => { triggerHaptic('light'); setSelected(active ? null : f.id) }}
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
                  {f.label}
                </button>
              )
            })}
          </div>
          {selected && (
            <div style={{ marginTop: 6, fontSize: 14, color: 'rgba(233,193,118,0.7)', fontFamily: 'Georgia, serif' }}>
              {FORMATS.find(f => f.id === selected)?.desc}
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Continue to Seed & Soil →'}
        onPrimary={handleContinue}
      />
    </>
  )
}
