/**
 * SessionComplete — Live Overlay (no baked image with stale progress text)
 *
 * Shows real-time data from context:
 *   - visit X / Y, session Z / W
 *   - XP earned this session
 *   - three optional action cards (Submit, Share, Follow-up) — multi-select
 *   - Complete Session CTA → /smokecraft
 *
 * This screen uses a dark obsidian gradient background rather than the
 * baked PNG which contained outdated progress text from the old 8-visit/24-session structure.
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'
import { injectScTouchStyles, useScPress, hapticTap } from '../../utils/scTouch.js'

const ACTION_CARDS = [
  {
    id: 'submit',
    icon: '📋',
    title: 'Submit Session to Venue Log',
    desc: 'Your tasting notes and score will be logged to the staff system.',
  },
  {
    id: 'share',
    icon: '✉️',
    title: 'Share Tasting Note with Staff',
    desc: 'A summary of your flavor profile will be forwarded to your host.',
  },
  {
    id: 'followup',
    icon: '🎩',
    title: 'Request Follow-up from Manager',
    desc: 'Request a personalised follow-up on your next visit.',
  },
]

const ANIM = `
  @keyframes sc-sc-fadeup { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
  @keyframes sc-sc-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(233,193,118,0)} 50%{box-shadow:0 0 0 5px rgba(233,193,118,0.22)} }
  @keyframes sc-sc-check  { from{transform:scale(0) rotate(-30deg)} to{transform:scale(1) rotate(0deg)} }
`

function ActionCard({ card, selected, onToggle }) {
  const { pressProps, pressed } = useScPress({
    onTap: onToggle,
    haptic: 'light',
    sound: false,
  })

  return (
    <button
      {...pressProps}
      aria-pressed={selected}
      aria-label={card.title}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        width: '100%', padding: '14px 16px',
        background: selected
          ? 'linear-gradient(135deg,rgba(233,193,118,0.18),rgba(201,168,76,0.1))'
          : 'rgba(0,0,0,0.52)',
        border: selected ? '1.5px solid rgba(233,193,118,0.75)' : '1.5px solid rgba(233,193,118,0.18)',
        borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        transition: 'border-color 0.15s, background 0.15s',
        animation: selected ? 'sc-sc-glow 2.8s ease-in-out infinite' : 'none',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent', outline: 'none', touchAction: 'manipulation',
      }}
    >
      {/* Radio circle */}
      <span style={{
        flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? 'rgba(233,193,118,0.9)' : 'transparent',
        border: selected ? 'none' : '1.5px solid rgba(233,193,118,0.35)',
        transition: 'all 0.15s',
      }}>
        {selected && (
          <span style={{ fontSize: 11, color: '#0a0603', fontWeight: 900, animation: 'sc-sc-check 0.15s ease forwards', display: 'block' }}>✓</span>
        )}
      </span>

      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.2vw,12px)',
          letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
          color: selected ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.55)',
          lineHeight: 1.3, marginBottom: 4,
        }}>
          {card.icon} {card.title}
        </div>
        {selected && (
          <div style={{
            fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)',
            color: 'rgba(233,193,118,0.5)', lineHeight: 1.5,
          }}>
            {card.desc}
          </div>
        )}
      </div>
    </button>
  )
}

function CompleteButton({ onPress, done }) {
  const { pressProps } = useScPress({ onTap: onPress, disabled: done, haptic: 'success', sound: false })

  return (
    <button
      {...pressProps}
      disabled={done}
      aria-label="Complete Session and return to SmokeCraft Hub"
      style={{
        width: '100%', padding: '16px 0',
        background: done
          ? 'rgba(0,0,0,0.3)'
          : 'linear-gradient(135deg,rgba(233,193,118,0.3),rgba(201,168,76,0.18))',
        border: done
          ? '1.5px solid rgba(233,193,118,0.15)'
          : '1.5px solid rgba(233,193,118,0.8)',
        borderRadius: '14px', cursor: done ? 'default' : 'pointer',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        transition: 'all 0.18s',
        WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', outline: 'none',
      }}
    >
      <span style={{
        fontFamily: 'Georgia,serif', fontSize: 'clamp(10px,1.4vw,13px)',
        letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700,
        color: done ? 'rgba(233,193,118,0.3)' : 'rgba(233,193,118,0.95)',
      }}>
        {done ? 'Returning to Hub...' : 'Complete Session →'}
      </span>
    </button>
  )
}

export default function SessionComplete() {
  const navigate = useNavigate()
  const { session, addXP, completeStep, awardStamp, completeSmokeCraftSession, syncPos3Activity, syncEATActivity } = useGuestSession()
  const { currentVisit, currentSession, totalVisits, totalSessions } = useSmokeCraftProgress()

  const [selectedCards, setSelectedCards] = useState(new Set())
  const [done, setDone] = useState(false)

  useEffect(() => {
    injectScTouchStyles()
    const alreadyDone = session.completedSteps.includes('session-complete')
    if (!alreadyDone) {
      completeStep('session-complete')
      addXP(XP_AWARDS.SESSION_1_COMPLETE || 150)
      awardStamp('journey-complete', 'session-complete')
      hapticTap('success')
    }
    completeSmokeCraftSession({ tasteProfile: [] })
    syncPos3Activity()
    syncEATActivity()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleCard = useCallback((id) => {
    setSelectedCards(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleComplete = useCallback(() => {
    if (done) return
    setDone(true)
    hapticTap('success')
    setTimeout(() => navigate('/smokecraft'), 400)
  }, [done, navigate])

  const xpEarned = session?.xp ?? 0
  const visitLabel = `${currentVisit ?? totalVisits}/${totalVisits}`
  const sessionLabel = `${currentSession ?? totalSessions}/${totalSessions}`

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: '#090603',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      fontFamily: 'Georgia,serif',
      overflowY: 'auto',
      paddingBottom: 80, // room for bottom nav
    }}>
      {/* Approved SmokeCraft Complete background image */}
      <img
        src="/assets/smokecraft-reference/approved/batch-22/smokecraft comple 1.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: 'fixed', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center top',
          opacity: 0.22, pointerEvents: 'none', userSelect: 'none',
          zIndex: 0,
        }}
      />
      <style>{ANIM}</style>

      {/* Content layer sits above background image */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Header glow band */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, width: '100%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0.98) 0%,rgba(5,3,1,0.85) 100%)',
        borderBottom: '1px solid rgba(201,168,76,0.18)',
        padding: '20px 5% 14px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 4px', fontWeight: 600 }}>
          SmokeCraft 360
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)' }}>
            VISIT {visitLabel}
          </span>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)' }}>
            SESSION {sessionLabel}
          </span>
        </div>
      </div>

      {/* Trophy */}
      <div style={{
        marginTop: 36, marginBottom: 20,
        width: 88, height: 88, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.06))',
        border: '1.5px solid rgba(201,168,76,0.4)',
        boxShadow: '0 0 40px rgba(201,168,76,0.15)',
        animation: 'sc-sc-fadeup 0.6s ease forwards',
        flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(233,193,118,0.9)' }}>workspace_premium</span>
      </div>

      <p style={{
        fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.65)', fontWeight: 600, margin: '0 0 10px',
        animation: 'sc-sc-fadeup 0.65s 0.1s ease both',
      }}>
        Passport Completion
      </p>

      <h1 style={{
        fontSize: 'clamp(22px,4vw,38px)', color: '#f0e6cc', fontWeight: 700,
        lineHeight: 1.15, margin: '0 5% 8px', textAlign: 'center',
        animation: 'sc-sc-fadeup 0.65s 0.15s ease both',
      }}>
        SmokeCraft Complete
      </h1>

      <p style={{
        fontSize: 'clamp(13px,1.8vw,16px)', color: 'rgba(240,230,204,0.55)',
        lineHeight: 1.65, margin: '0 8% 8px', textAlign: 'center', maxWidth: 440,
        animation: 'sc-sc-fadeup 0.65s 0.2s ease both',
      }}>
        Your SmokeCraft 360 Passport has been stamped. Your journey is now part of the archive.
      </p>

      {/* XP + badge row */}
      <div style={{
        display: 'flex', gap: '16px', margin: '12px 0 24px',
        animation: 'sc-sc-fadeup 0.65s 0.25s ease both',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <div style={{
          padding: '8px 20px', borderRadius: '40px',
          background: 'rgba(233,193,118,0.08)',
          border: '1px solid rgba(233,193,118,0.28)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'rgba(233,193,118,0.8)' }}>bolt</span>
          <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.8)', fontWeight: 600 }}>
            {xpEarned.toLocaleString()} XP Earned
          </span>
        </div>
        <div style={{
          padding: '8px 20px', borderRadius: '40px',
          background: 'rgba(233,193,118,0.08)',
          border: '1px solid rgba(233,193,118,0.28)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'rgba(233,193,118,0.8)' }}>stars</span>
          <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.8)', fontWeight: 600 }}>
            Badge Awarded
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: '80%', maxWidth: 420, height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)',
        marginBottom: 20, animation: 'sc-sc-fadeup 0.65s 0.3s ease both',
      }} />

      {/* Action cards */}
      <div style={{
        width: '90%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', gap: '10px',
        animation: 'sc-sc-fadeup 0.65s 0.35s ease both', marginBottom: 20,
      }}>
        <p style={{
          fontFamily: 'Georgia,serif', fontSize: 9, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)',
          margin: '0 0 6px', textAlign: 'center',
        }}>
          Optional — Select Actions
        </p>
        {ACTION_CARDS.map(card => (
          <ActionCard
            key={card.id}
            card={card}
            selected={selectedCards.has(card.id)}
            onToggle={() => toggleCard(card.id)}
          />
        ))}
      </div>

      {/* CTA */}
      <div style={{
        width: '90%', maxWidth: 480, marginBottom: 16,
        animation: 'sc-sc-fadeup 0.65s 0.45s ease both',
      }}>
        <CompleteButton onPress={handleComplete} done={done} />
      </div>

      <p style={{
        fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.3)', textAlign: 'center', margin: '0 0 8px',
      }}>
        SmokeCraft 360 · Passport Logged
      </p>
      </div>{/* end content layer */}
    </div>
  )
}
