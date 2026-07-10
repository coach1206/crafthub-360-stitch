import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles, hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const MEMORY_CHIPS = [
  'Campfire Evening','Old Library','Rainy Forest','Leather Chair','Morning Espresso',
  'Aged Whiskey','Cedar Chest','Dark Chocolate Box','Sea Breeze','Autumn Harvest',
  'Earthy Cellar','Tropical Spice',
]

const ANIM = `@keyframes sc-fm-glow{0%,100%{box-shadow:0 0 0 0 rgba(233,193,118,0)}50%{box-shadow:0 0 0 5px rgba(233,193,118,.22)}}`

export default function FlavorMemory() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [proceeded, setProceeded] = useState(false)
  const [pressedChip, setPressedChip] = useState(null)
  const [ctaPressed, setCtaPressed] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const handleSelect = useCallback((chip) => {
    setSelected(prev => prev === chip ? null : chip)
  }, [])

  const handleContinue = useCallback(() => {
    if (!selected || proceeded) return
    setProceeded(true)
    hapticTap('medium')
    completeStep('flavor-memory')
    addXP(75)
    navigate('/smokecraft/final-third')
  }, [selected, proceeded, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-flavor-memory.png"
      alt="Flavor Memory"
    >
      <style>{ANIM}</style>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.86) 12%,rgba(5,3,1,0.96) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '0.8rem', padding: '0 5%', pointerEvents: 'none',
      }}>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.7)', margin: 0 }}>
          Flavor Memory — Select One That Matches
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '92%', pointerEvents: 'auto' }}>
          {MEMORY_CHIPS.map(chip => {
            const isSel = selected === chip
            const isPressed = pressedChip === chip
            return (
              <button
                key={chip}
                aria-label={chip}
                aria-pressed={isSel}
                onPointerDown={() => { hapticTap('light'); setPressedChip(chip) }}
                onPointerUp={() => { setPressedChip(null); handleSelect(chip) }}
                onPointerLeave={() => setPressedChip(null)}
                onPointerCancel={() => setPressedChip(null)}
                style={{
                  padding: '7px 16px', borderRadius: '22px', cursor: 'pointer', touchAction: 'manipulation',
                  background: isSel ? 'linear-gradient(135deg,rgba(233,193,118,0.28),rgba(201,168,76,0.14))' : 'rgba(0,0,0,0.55)',
                  border: isSel ? '1.5px solid rgba(233,193,118,0.85)' : '1px solid rgba(233,193,118,0.22)',
                  color: isSel ? 'rgba(233,193,118,0.98)' : 'rgba(233,193,118,0.5)',
                  fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: isSel ? 700 : 400,
                  backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                  outline: 'none', WebkitTapHighlightColor: 'transparent',
                  animation: isSel ? 'sc-fm-glow 2.6s ease-in-out infinite' : 'none',
                  transform: isPressed ? 'scale(0.91)' : isSel ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: isPressed ? '0 0 0 3px rgba(233,193,118,0.4)' : 'none',
                  transition: isPressed ? 'transform 0.05s ease' : 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.14s, border-color 0.14s, color 0.14s',
                }}>
                {chip}
              </button>
            )
          })}
        </div>

        <button
          aria-label={selected ? 'Continue to Final Third' : 'Select a memory to continue'}
          disabled={!selected || proceeded}
          onPointerDown={() => { if (selected && !proceeded) { setCtaPressed(true); hapticTap('medium') } }}
          onPointerUp={() => { setCtaPressed(false); handleContinue() }}
          onPointerLeave={() => setCtaPressed(false)}
          onPointerCancel={() => setCtaPressed(false)}
          style={{
            width: '80%', padding: '3.5% 0',
            background: selected ? 'linear-gradient(135deg,rgba(233,193,118,.3),rgba(201,168,76,.18))' : 'rgba(0,0,0,0.4)',
            border: selected ? '1.5px solid rgba(233,193,118,0.8)' : '1.5px solid rgba(233,193,118,0.15)',
            borderRadius: '12px', cursor: selected ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
            touchAction: 'manipulation', opacity: selected ? 1 : 0.45, backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', outline: 'none', WebkitTapHighlightColor: 'transparent',
            transform: ctaPressed ? 'scale(0.95)' : 'scale(1)',
            boxShadow: ctaPressed ? '0 0 0 3px rgba(233,193,118,0.4)' : 'none',
            transition: ctaPressed ? 'transform 0.06s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), all 0.15s ease',
          }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: selected ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.35)', fontWeight: 600 }}>
            {proceeded ? 'Continuing...' : selected ? 'Continue to Final Third →' : 'Select a Memory to Continue'}
          </span>
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
