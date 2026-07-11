import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles, hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const ANIM = `@keyframes sc-fr-pulse{0%,100%{box-shadow:0 0 0 0 rgba(233,193,118,0)}50%{box-shadow:0 0 0 6px rgba(233,193,118,.2),0 0 20px rgba(233,193,118,.12)}}`

export default function FinalReview() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [done, setDone] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  function handleContinue() {
    if (done) return
    setDone(true)
    hapticTap('medium')
    completeStep('final-review')
    addXP(100)
    navigate('/smokecraft/passport-stamp')
  }

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-final-review.png"
      alt="SmokeCraft Final Review"
    >
      <style>{ANIM}</style>
      {/* Full-screen tap zone */}
      <button
        aria-label="Continue to Passport Stamp"
        onPointerDown={() => { if (!done) { setPressed(true); hapticTap('medium') } }}
        onPointerUp={() => { setPressed(false); handleContinue() }}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          background: pressed ? 'rgba(233,193,118,0.04)' : 'transparent',
          border: 'none', cursor: done ? 'default' : 'pointer',
          touchAction: 'manipulation', outline: 'none', userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          transition: 'background 0.12s ease',
          pointerEvents: 'auto',
        }}
      />
      {/* Tap prompt — bottom centre */}
      <div style={{
        position: 'absolute', bottom: '12%', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <button
          tabIndex={-1}
          aria-hidden
          style={{
            padding: '12px 32px', borderRadius: '40px',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(233,193,118,0.55)',
            fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: done ? 'rgba(233,193,118,0.4)' : 'rgba(233,193,118,0.9)',
            fontWeight: 600, cursor: 'pointer',
            animation: done ? 'none' : 'sc-fr-pulse 2.4s ease-in-out infinite',
            transform: pressed ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.08s ease, color 0.15s',
            pointerEvents: 'none',
          }}>
          {done ? 'Continuing...' : 'Tap to Continue →'}
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
