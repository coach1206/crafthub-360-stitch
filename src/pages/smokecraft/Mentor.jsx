import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

/*
 * Mentor Selection — /smokecraft/mentor-selection
 *
 * Three mentor card zones cover the image. Tapping a card visually selects
 * that mentor. A Proceed button at the bottom unlocks once a mentor is chosen.
 * Proceed routes to /smokecraft/seed-soil.
 *
 * Cards are identified by position (left / center / right) since this is an
 * image-overlay implementation. Selection state is tracked locally and saved
 * via completeStep('mentor') on proceed.
 */

const MENTOR_ZONES = [
  { id: 'left',   label: 'El Maestro',     x: 2,  y: 20, width: 30, height: 48 },
  { id: 'center', label: 'La Directora',   x: 35, y: 20, width: 30, height: 48 },
  { id: 'right',  label: 'The Cultivator', x: 68, y: 20, width: 30, height: 48 },
]

export default function Mentor() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [proceeded, setProceeded] = useState(false)

  const handleSelectMentor = useCallback((mentorId) => {
    triggerHaptic('light')
    setSelected(mentorId)
  }, [])

  const handleProceed = useCallback(() => {
    if (!selected || proceeded) return
    setProceeded(true)
    triggerHaptic('medium')
    completeStep('mentor')
    addXP(75)
    navigate('/smokecraft/seed-soil')
  }, [selected, proceeded, completeStep, addXP, navigate])

  const selectedMentor = MENTOR_ZONES.find(m => m.id === selected)

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-mentor-selection.png"
      alt="Mentor Selection"
    >
      {/* Inject global styles once */}
      <style>{`
        @keyframes sc-mentor-select-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(233,193,118,0); }
          50%      { box-shadow: 0 0 0 6px rgba(233,193,118,0.22); }
        }
      `}</style>

      {/* Mentor card tap zones */}
      {MENTOR_ZONES.map((zone) => {
        const isSelected = selected === zone.id
        return (
          <button
            key={zone.id}
            aria-label={`Select mentor: ${zone.label}`}
            aria-pressed={isSelected}
            onClick={() => handleSelectMentor(zone.id)}
            style={{
              position: 'absolute',
              left:   `${zone.x}%`,
              top:    `${zone.y}%`,
              width:  `${zone.width}%`,
              height: `${zone.height}%`,
              background: isSelected
                ? 'rgba(233,193,118,0.15)'
                : 'rgba(0,0,0,0)',
              border: isSelected
                ? '2px solid rgba(233,193,118,0.8)'
                : '2px solid rgba(233,193,118,0.0)',
              borderRadius: '12px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
              boxShadow: isSelected
                ? '0 0 0 4px rgba(233,193,118,0.18), inset 0 0 20px rgba(233,193,118,0.06)'
                : 'none',
              outline: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '8px',
            }}
            onFocus={e => { e.currentTarget.style.outline = '2px solid rgba(233,193,118,0.5)' }}
            onBlur={e => { e.currentTarget.style.outline = 'none' }}
          >
            {isSelected && (
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: '9px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(233,193,118,0.9)',
                background: 'rgba(0,0,0,0.7)',
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(233,193,118,0.4)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                Selected
              </span>
            )}
          </button>
        )
      })}

      {/* Selection name badge — shows above proceed button when selected */}
      {selectedMentor && (
        <div style={{
          position: 'absolute',
          left: '10%',
          bottom: '26%',
          width: '80%',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(233,193,118,0.85)',
            background: 'rgba(0,0,0,0.6)',
            padding: '4px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(233,193,118,0.3)',
          }}>
            {selectedMentor.label} — Selected
          </span>
        </div>
      )}

      {/* Proceed button — locked until a mentor is selected */}
      <button
        onClick={handleProceed}
        disabled={!selected || proceeded}
        aria-label="Proceed to Seed and Soil"
        style={{
          position: 'absolute',
          left: '10%',
          top: '75%',
          width: '80%',
          height: '18%',
          background: selected
            ? 'linear-gradient(135deg, rgba(233,193,118,0.28), rgba(201,168,76,0.18))'
            : 'rgba(0,0,0,0.45)',
          border: selected
            ? '1.5px solid rgba(233,193,118,0.75)'
            : '1.5px solid rgba(233,193,118,0.2)',
          borderRadius: '14px',
          cursor: selected ? 'pointer' : 'not-allowed',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: selected ? 1 : 0.5,
          outline: 'none',
          animation: selected ? 'sc-mentor-select-pulse 2.4s ease-in-out infinite' : 'none',
        }}
        onFocus={e => { if (selected) e.currentTarget.style.outline = '2px solid rgba(233,193,118,0.5)' }}
        onBlur={e => { e.currentTarget.style.outline = 'none' }}
      >
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: selected ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.4)',
          fontWeight: 600,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {proceeded ? 'Continuing...' : selected ? 'Proceed to Seed & Soil' : 'Select a Mentor to Continue'}
        </span>
      </button>
    </SmokeCraftAssetScreen>
  )
}
