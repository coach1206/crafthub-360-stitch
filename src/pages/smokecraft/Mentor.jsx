import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles, hapticTap } from '../../utils/scTouch.js'

const MENTORS = [
  {
    id: 'left',
    label: 'El Maestro',
    country: 'Dominican Republic',
    bio: 'Legendary torcedor with 40 years of artistry. Specializes in medium-bodied Coronas with cedar and dried-fruit complexity.',
    style: 'Medium · Cedar · Dried Fruit',
    x: 2, y: 10, width: 30, height: 58,
  },
  {
    id: 'center',
    label: 'La Directora',
    country: 'Nicaragua',
    bio: 'Master blender renowned for bold, full-bodied selections. Pepper, earth, and dark cocoa define her powerful profile.',
    style: 'Full · Pepper · Dark Cocoa',
    x: 35, y: 10, width: 30, height: 58,
  },
  {
    id: 'right',
    label: 'The Cultivator',
    country: 'Honduras',
    bio: 'Farm-to-leaf pioneer. Her cigars express pure terroir — Connecticut shade wrappers with cream, almond, and light spice.',
    style: 'Light-Med · Cream · Almond',
    x: 68, y: 10, width: 30, height: 58,
  },
]

const ANIM = `
  @keyframes sc-mentor-pulse{0%,100%{box-shadow:0 0 0 0 rgba(233,193,118,0)}50%{box-shadow:0 0 0 6px rgba(233,193,118,.22)}}
  @keyframes sc-mentor-in  {from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}
`

export default function Mentor() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [proceeded, setProceeded] = useState(false)
  const [pressedId, setPressedId] = useState(null)
  const [ctaPressed, setCtaPressed] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const handleSelect = useCallback((id) => {
    setSelected(prev => prev === id ? null : id)
  }, [])

  const handleProceed = useCallback(() => {
    if (!selected || proceeded) return
    setProceeded(true)
    hapticTap('medium')
    completeStep('mentor')
    addXP(75)
    navigate('/smokecraft/seed-soil')
  }, [selected, proceeded, completeStep, addXP, navigate])

  const selectedMentor = MENTORS.find(m => m.id === selected)

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-mentor-selection.png"
      alt="Mentor Selection"
    >
      <style>{ANIM}</style>

      {/* Tap zones over mentor card positions */}
      {MENTORS.map(m => {
        const isSel = selected === m.id
        const isPressed = pressedId === m.id
        return (
          <button
            key={m.id}
            aria-label={`Select mentor: ${m.label}`}
            aria-pressed={isSel}
            onPointerDown={() => { hapticTap('light'); setPressedId(m.id) }}
            onPointerUp={() => { setPressedId(null); handleSelect(m.id) }}
            onPointerLeave={() => setPressedId(null)}
            onPointerCancel={() => setPressedId(null)}
            style={{
              position: 'absolute',
              left: `${m.x}%`, top: `${m.y}%`,
              width: `${m.width}%`, height: `${m.height}%`,
              background: isPressed
                ? 'rgba(233,193,118,0.18)'
                : isSel
                  ? 'rgba(233,193,118,0.12)'
                  : 'transparent',
              border: isSel ? '2px solid rgba(233,193,118,0.8)' : '2px solid transparent',
              borderRadius: '12px', cursor: 'pointer', pointerEvents: 'auto',
              touchAction: 'manipulation',
              boxShadow: isPressed
                ? '0 0 0 4px rgba(233,193,118,0.35), inset 0 0 24px rgba(233,193,118,0.1)'
                : isSel
                  ? '0 0 0 3px rgba(233,193,118,0.14), inset 0 0 20px rgba(233,193,118,0.06)'
                  : 'none',
              outline: 'none', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '6px',
              animation: isSel && !isPressed ? 'sc-mentor-pulse 2.4s ease-in-out infinite' : 'none',
              transform: isPressed ? 'scale(0.97)' : 'scale(1)',
              transition: isPressed ? 'transform 0.06s ease, background 0.06s ease' : 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.18s, border-color 0.18s, box-shadow 0.18s',
            }}>
            {isSel && (
              <span style={{
                fontFamily: 'Georgia,serif', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(233,193,118,0.9)', background: 'rgba(0,0,0,0.72)',
                padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(233,193,118,0.4)',
                pointerEvents: 'none', userSelect: 'none',
                animation: 'sc-mentor-in 0.18s ease forwards',
              }}>
                ✓ Selected
              </span>
            )}
          </button>
        )
      })}

      {/* Bio panel */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: selectedMentor ? '44%' : '22%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.88) 16%,rgba(5,3,1,0.97) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        gap: '0.6rem', padding: '0 5% 1.5%',
        transition: 'height 0.28s ease',
        pointerEvents: 'none',
      }}>
        {selectedMentor && (
          <div style={{ textAlign: 'center', pointerEvents: 'none', animation: 'sc-mentor-in 0.2s ease forwards' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(11px,1.6vw,15px)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.95)', fontWeight: 700 }}>
              {selectedMentor.label}
            </div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)', marginTop: 2 }}>
              {selectedMentor.country} · {selectedMentor.style}
            </div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.1vw,11px)', color: 'rgba(240,230,204,0.7)', lineHeight: 1.55, marginTop: '0.5rem', maxWidth: '480px', fontStyle: 'italic' }}>
              {selectedMentor.bio}
            </div>
          </div>
        )}

        <button
          aria-label={selected ? `Proceed with ${selectedMentor?.label}` : 'Select a Mentor to Continue'}
          disabled={!selected || proceeded}
          onPointerDown={() => { if (selected && !proceeded) { setCtaPressed(true); hapticTap('medium') } }}
          onPointerUp={() => { setCtaPressed(false); handleProceed() }}
          onPointerLeave={() => setCtaPressed(false)}
          onPointerCancel={() => setCtaPressed(false)}
          style={{
            width: '80%', padding: '3.5% 0',
            background: selected ? 'linear-gradient(135deg,rgba(233,193,118,.28),rgba(201,168,76,.18))' : 'rgba(0,0,0,0.45)',
            border: selected ? '1.5px solid rgba(233,193,118,0.75)' : '1.5px solid rgba(233,193,118,0.2)',
            borderRadius: '14px', cursor: selected ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
            touchAction: 'manipulation', opacity: selected ? 1 : 0.5,
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            outline: 'none', WebkitTapHighlightColor: 'transparent',
            animation: selected && !ctaPressed ? 'sc-mentor-pulse 2.4s ease-in-out infinite' : 'none',
            transform: ctaPressed ? 'scale(0.95)' : 'scale(1)',
            boxShadow: ctaPressed ? '0 0 0 3px rgba(233,193,118,0.4)' : 'none',
            transition: ctaPressed ? 'transform 0.06s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), all 0.18s ease',
          }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: selected ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.4)', fontWeight: 600, pointerEvents: 'none' }}>
            {proceeded ? 'Continuing...' : selected ? `Proceed with ${selectedMentor?.label} →` : 'Select a Mentor to Continue'}
          </span>
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
