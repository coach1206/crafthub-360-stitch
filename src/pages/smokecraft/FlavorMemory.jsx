import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const MEMORY_CHIPS = [
  'Campfire Evening','Old Library','Rainy Forest','Leather Chair','Morning Espresso',
  'Aged Whiskey','Cedar Chest','Dark Chocolate Box','Sea Breeze','Autumn Harvest',
  'Earthy Cellar','Tropical Spice',
]

export default function FlavorMemory() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [proceeded, setProceeded] = useState(false)

  const handleSelect = useCallback((chip) => {
    triggerHaptic('light')
    setSelected(prev => prev === chip ? null : chip)
  }, [])

  const handleContinue = useCallback(() => {
    if (!selected || proceeded) return
    setProceeded(true)
    triggerHaptic('medium')
    completeStep('flavor-memory')
    addXP(75)
    navigate('/smokecraft/final-third')
  }, [selected, proceeded, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-flavor-memory.png"
      alt="Flavor Memory"
    >
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.86) 12%,rgba(5,3,1,0.96) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '0.85rem', padding: '0 5%', pointerEvents: 'none',
      }}>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.7)', margin: 0 }}>
          What does this cigar remind you of?
        </p>
        {selected && (
          <p style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(10px,1.4vw,13px)', color: 'rgba(233,193,118,0.85)', margin: 0, letterSpacing: '0.08em', fontStyle: 'italic' }}>
            "{selected}"
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'center', maxWidth: '90%', pointerEvents: 'auto' }}>
          {MEMORY_CHIPS.map(chip => {
            const isSel = selected === chip
            return (
              <button key={chip} aria-label={chip} aria-pressed={isSel} onClick={() => handleSelect(chip)}
                style={{
                  padding: '6px 16px', borderRadius: '24px', cursor: 'pointer', touchAction: 'manipulation',
                  background: isSel ? 'rgba(233,193,118,0.22)' : 'rgba(0,0,0,0.5)',
                  border: isSel ? '1.5px solid rgba(233,193,118,0.85)' : '1px solid rgba(233,193,118,0.22)',
                  color: isSel ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.5)',
                  fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', letterSpacing: '0.08em',
                  fontStyle: isSel ? 'italic' : 'normal', fontWeight: isSel ? 600 : 400,
                  backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                  transition: 'all 0.14s ease', outline: 'none', WebkitTapHighlightColor: 'transparent',
                  boxShadow: isSel ? '0 0 0 3px rgba(233,193,118,0.12)' : 'none',
                }}>
                {chip}
              </button>
            )
          })}
        </div>

        <button onClick={handleContinue} disabled={!selected || proceeded}
          aria-label="Continue to Final Third"
          style={{
            width: '80%', padding: '3.5% 0',
            background: selected ? 'linear-gradient(135deg,rgba(233,193,118,.28),rgba(201,168,76,.18))' : 'rgba(0,0,0,0.4)',
            border: selected ? '1.5px solid rgba(233,193,118,0.75)' : '1.5px solid rgba(233,193,118,0.18)',
            borderRadius: '12px', cursor: selected ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
            touchAction: 'manipulation', opacity: selected ? 1 : 0.45, backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', transition: 'all 0.2s ease', outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: selected ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.35)', fontWeight: 600 }}>
            {proceeded ? 'Saving Memory...' : selected ? 'Lock In Flavor Memory →' : 'Select a Flavor Memory to Continue'}
          </span>
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
