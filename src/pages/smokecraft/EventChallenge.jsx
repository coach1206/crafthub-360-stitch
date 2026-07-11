import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles, hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function EventChallenge() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [proceeded, setProceeded] = useState(false)
  const [ctaPressed, setCtaPressed] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const handleAccept = useCallback(() => {
    if (proceeded) return
    setProceeded(true)
    hapticTap('success')
    completeStep('event-challenge')
    addXP(25)
    navigate('/smokecraft/identity')
  }, [proceeded, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-event-challenge.png"
      alt="SmokeCraft Event Challenge"
      objectPosition="center center"
    >
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.88) 20%,rgba(5,3,1,0.97) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 5% 80px', gap: '10px', pointerEvents: 'none',
      }}>
        <button
          aria-label={proceeded ? 'Entering Challenge...' : 'Accept the Challenge and Begin Your Profile'}
          disabled={proceeded}
          onPointerDown={() => { if (!proceeded) { setCtaPressed(true); hapticTap('medium') } }}
          onPointerUp={() => { setCtaPressed(false); handleAccept() }}
          onPointerLeave={() => setCtaPressed(false)}
          onPointerCancel={() => setCtaPressed(false)}
          style={{
            width: '80%', maxWidth: 480, padding: '3.5% 0', minHeight: 72,
            background: 'linear-gradient(135deg,rgba(233,193,118,0.28),rgba(201,168,76,0.18))',
            border: '1.5px solid rgba(233,193,118,0.75)',
            borderRadius: '12px', cursor: proceeded ? 'default' : 'pointer',
            pointerEvents: 'auto', touchAction: 'manipulation',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
            transform: ctaPressed ? 'scale(0.95)' : 'scale(1)',
            boxShadow: ctaPressed ? '0 0 0 3px rgba(233,193,118,0.4)' : 'none',
            transition: ctaPressed ? 'transform 0.06s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(233,193,118,0.95)', fontWeight: 600,
          }}
        >
          {proceeded ? 'Entering Challenge...' : 'Accept the Challenge →'}
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
