import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles, hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const OPTIONS = [
  { id: 'request', label: 'Request from Humidor', desc: 'Staff will retrieve your cigar selection from our curated humidor.', icon: '🏛' },
  { id: 'have',    label: 'I Already Have My Cigar', desc: 'You brought your own — proceed to preparation.', icon: '🎋' },
]

const ANIM = `
  @keyframes sc-rp-glow{0%,100%{box-shadow:0 0 0 0 rgba(233,193,118,0)}50%{box-shadow:0 0 0 6px rgba(233,193,118,.2)}}
  @keyframes sc-rp-check{from{transform:scale(0) rotate(-20deg)}to{transform:scale(1) rotate(0deg)}}
`

function usePress() {
  const [pressed, setPressed] = useState(null)
  const onDown = useCallback((id) => { hapticTap('light'); setPressed(id) }, [])
  const onUp   = useCallback(() => setPressed(null), [])
  return { pressed, onDown, onUp }
}

export default function RequestPurchase() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [proceeded, setProceeded] = useState(false)
  const { pressed, onDown, onUp } = usePress()
  const [continuePressing, setContinuePressing] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const handleSelect = useCallback((id) => {
    setSelected(prev => prev === id ? null : id)
  }, [])

  const handleContinue = useCallback(() => {
    if (!selected || proceeded) return
    setProceeded(true)
    hapticTap('medium')
    completeStep('request-purchase')
    addXP(50)
    navigate('/smokecraft/cut-toast-light')
  }, [selected, proceeded, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-request-purchase.png"
      alt="Request Purchase"
    >
      <style>{ANIM}</style>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.88) 18%,rgba(5,3,1,0.96) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1rem', padding: '0 5% 76px', pointerEvents: 'none',
      }}>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.7)', margin: 0 }}>
          How would you like to proceed?
        </p>

        <div style={{ display: 'flex', gap: '4%', width: '100%', justifyContent: 'center', pointerEvents: 'auto' }}>
          {OPTIONS.map(opt => {
            const isSel = selected === opt.id
            const isPressed = pressed === opt.id
            return (
              <button
                key={opt.id}
                aria-label={opt.label}
                aria-pressed={isSel}
                onPointerDown={() => onDown(opt.id)}
                onPointerUp={() => { onUp(); handleSelect(opt.id) }}
                onPointerLeave={onUp}
                onPointerCancel={onUp}
                style={{
                  flex: '1 1 0', maxWidth: '44%', padding: '5% 4%',
                  background: isSel ? 'linear-gradient(135deg,rgba(233,193,118,.22),rgba(201,168,76,.12))' : 'rgba(0,0,0,0.55)',
                  border: isSel ? '1.5px solid rgba(233,193,118,0.8)' : '1.5px solid rgba(233,193,118,0.2)',
                  borderRadius: '14px', cursor: 'pointer', touchAction: 'manipulation',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  animation: isSel ? 'sc-rp-glow 2.4s ease-in-out infinite' : 'none',
                  outline: 'none', WebkitTapHighlightColor: 'transparent',
                  transform: isPressed ? 'scale(0.93)' : 'scale(1)',
                  boxShadow: isPressed ? '0 0 0 3px rgba(233,193,118,0.3)' : isSel ? '0 0 0 3px rgba(233,193,118,0.15)' : 'none',
                  transition: isPressed ? 'transform 0.06s ease, box-shadow 0.06s ease' : 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background 0.15s, border-color 0.15s',
                }}>
                {/* Radio dot */}
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  alignSelf: 'flex-end',
                  background: isSel ? 'rgba(233,193,118,0.9)' : 'transparent',
                  border: isSel ? 'none' : '1.5px solid rgba(233,193,118,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {isSel && <span style={{ fontSize: 9, color: '#0a0603', fontWeight: 900, animation: 'sc-rp-check 0.15s ease forwards' }}>✓</span>}
                </span>
                <span style={{ fontSize: 'clamp(20px,3vw,28px)' }}>{opt.icon}</span>
                <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.2vw,12px)', letterSpacing: '0.14em', textTransform: 'uppercase', color: isSel ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.55)', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>
                  {opt.label}
                </span>
                {isSel && (
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', color: 'rgba(233,193,118,0.65)', lineHeight: 1.5, textAlign: 'center' }}>{opt.desc}</span>
                )}
              </button>
            )
          })}
        </div>

        <button
          aria-label="Continue to Cut Toast and Light"
          disabled={!selected || proceeded}
          onPointerDown={() => { if (selected && !proceeded) { setContinuePressing(true); hapticTap('medium') } }}
          onPointerUp={() => { setContinuePressing(false); handleContinue() }}
          onPointerLeave={() => setContinuePressing(false)}
          onPointerCancel={() => setContinuePressing(false)}
          style={{
            width: '80%', padding: '3.5% 0',
            background: selected ? 'linear-gradient(135deg,rgba(233,193,118,.28),rgba(201,168,76,.18))' : 'rgba(0,0,0,0.4)',
            border: selected ? '1.5px solid rgba(233,193,118,0.75)' : '1.5px solid rgba(233,193,118,0.18)',
            borderRadius: '12px', cursor: selected ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
            touchAction: 'manipulation', opacity: selected ? 1 : 0.45, backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', transition: continuePressing ? 'transform 0.06s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), all 0.15s ease', outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            transform: continuePressing ? 'scale(0.95)' : 'scale(1)',
            boxShadow: continuePressing ? '0 0 0 3px rgba(233,193,118,0.35)' : 'none',
          }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: selected ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.35)', fontWeight: 600 }}>
            {proceeded ? 'Continuing...' : selected ? 'Continue to Preparation →' : 'Select an Option to Continue'}
          </span>
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
