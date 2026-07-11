import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles, hapticTap } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const ANIM = `
  @keyframes sc-lb-fadein { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
  @keyframes sc-lb-glow { 0%,100%{box-shadow:0 0 0 0 rgba(233,193,118,0)} 50%{box-shadow:0 0 0 5px rgba(233,193,118,0.2)} }
`

function usePress(onTap) {
  const [pressed, setPressed] = useState(false)
  return {
    pressed,
    onPointerDown: () => { hapticTap('light'); setPressed(true) },
    onPointerUp:   () => { setPressed(false); onTap?.() },
    onPointerLeave: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
  }
}

function NavBtn({ label, onTap }) {
  const { pressed, ...handlers } = usePress(onTap)
  return (
    <button
      aria-label={label}
      {...handlers}
      style={{
        flex: 1, padding: '10px 0', minHeight: 48,
        background: pressed ? 'rgba(233,193,118,0.15)' : 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(233,193,118,0.25)',
        borderRadius: '10px', cursor: 'pointer', touchAction: 'manipulation',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: pressed ? 'transform 0.06s ease' : 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: pressed ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.6)',
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  )
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const { session } = useGuestSession()

  useEffect(() => { injectScTouchStyles() }, [])

  const guest = {
    initials: session?.guestName
      ? session.guestName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'SG',
    name: session?.guestName || 'Smoke Guest',
    rank: session?.rank || 'New Guest',
    xp: session?.xp ?? 0,
    status: session?.status || 'Just Started',
  }

  const handleStartProfile = useCallback(() => {
    hapticTap('medium')
    navigate('/smokecraft/identity')
  }, [navigate])

  const handleViewChallenge = useCallback(() => {
    hapticTap('light')
    navigate('/smokecraft/event-challenge')
  }, [navigate])

  const handleStartSession = useCallback(() => {
    hapticTap('medium')
    navigate('/smokecraft/identity')
  }, [navigate])

  const handleBack = useCallback(() => {
    hapticTap('light')
    navigate('/smokecraft')
  }, [navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/batch-22/NEW DEMO LOUNG RANKING.png"
      alt="SmokeCraft Lounge Rankings"
      objectPosition="center top"
    >
      <style>{ANIM}</style>

      {/* Live guest badge — top right */}
      <div style={{
        position: 'absolute', top: '4%', right: '4%',
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(5,3,1,0.75)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(233,193,118,0.3)',
        borderRadius: '40px', padding: '8px 16px',
        animation: 'sc-lb-fadein 0.5s ease forwards',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg,rgba(233,193,118,0.35),rgba(201,168,76,0.2))',
          border: '1.5px solid rgba(233,193,118,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 700,
          color: 'rgba(233,193,118,0.95)',
        }}>
          {guest.initials}
        </div>
        <div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.2vw,11px)', color: 'rgba(233,193,118,0.9)', fontWeight: 600, letterSpacing: '0.08em' }}>
            {guest.name}
          </div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(7px,0.9vw,9px)', color: 'rgba(233,193,118,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {guest.rank} · {guest.xp.toLocaleString()} XP
          </div>
        </div>
      </div>

      {/* Bottom action panel */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.88) 18%,rgba(5,3,1,0.97) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 5% 80px', pointerEvents: 'none',
        gap: '10px',
      }}>
        {/* Status line */}
        <div style={{
          fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(233,193,118,0.5)', marginBottom: 4,
          animation: 'sc-lb-fadein 0.5s 0.1s ease both',
        }}>
          {guest.status}
        </div>

        {/* Action buttons row */}
        <div style={{
          display: 'flex', gap: '8px', width: '100%', maxWidth: 480,
          pointerEvents: 'auto',
          animation: 'sc-lb-fadein 0.5s 0.15s ease both',
        }}>
          <NavBtn label="Start Session" onTap={handleStartSession} />
          <NavBtn label="View Challenge" onTap={handleViewChallenge} />
        </div>

        {/* Primary CTA */}
        <StartProfileButton onTap={handleStartProfile} />

        {/* Back link */}
        <button
          aria-label="Back to SmokeCraft"
          onPointerDown={() => hapticTap('light')}
          onClick={handleBack}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'Georgia,serif', fontSize: 'clamp(7px,0.9vw,9px)',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(233,193,118,0.35)', pointerEvents: 'auto',
            outline: 'none', WebkitTapHighlightColor: 'transparent',
            padding: '4px 8px', touchAction: 'manipulation',
          }}
        >
          ← Back to SmokeCraft
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}

function StartProfileButton({ onTap }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      aria-label="Start Your SmokeCraft Profile"
      onPointerDown={() => { hapticTap('medium'); setPressed(true) }}
      onPointerUp={() => { setPressed(false); onTap?.() }}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        width: '100%', maxWidth: 480, padding: '3.5% 0', minHeight: 64,
        background: 'linear-gradient(135deg,rgba(233,193,118,0.28),rgba(201,168,76,0.18))',
        border: '1.5px solid rgba(233,193,118,0.75)',
        borderRadius: '12px', cursor: 'pointer', pointerEvents: 'auto',
        touchAction: 'manipulation', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)', outline: 'none',
        WebkitTapHighlightColor: 'transparent', userSelect: 'none',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        boxShadow: pressed ? '0 0 0 3px rgba(233,193,118,0.35)' : 'none',
        transition: pressed ? 'transform 0.06s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        animation: 'sc-lb-glow 2.8s ease-in-out infinite',
        fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)',
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(233,193,118,0.95)', fontWeight: 600,
      }}
    >
      Start Your SmokeCraft Profile →
    </button>
  )
}
