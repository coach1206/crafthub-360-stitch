/**
 * ScTastingPanel — reusable tasting overlay layout for SmokeCraft tasting screens.
 *
 * Provides press-feedback on all chips and rating buttons via onPointerDown/Up handlers.
 *
 * Props:
 *   title        — section heading (e.g. "First Third — Select Flavors")
 *   flavorNotes  — string[]
 *   selectedNotes — Set<string>
 *   onToggleNote — (note: string) => void
 *   ratingLabel  — label above rating row (e.g. "Draw Quality")
 *   ratings      — number[] (e.g. [1,2,3,4,5])
 *   ratingLabels — string[] matching ratings
 *   selectedRating — number | null
 *   onSelectRating — (r: number) => void
 *   canContinue  — boolean
 *   proceeded    — boolean
 *   onContinue   — () => void
 *   continueLabel — string (e.g. "Continue to Second Third →")
 */

import { useState, useCallback } from 'react'
import { hapticTap } from '../../utils/scTouch.js'

function usePressId() {
  const [pressedId, setPressedId] = useState(null)
  const onDown = useCallback((id) => { hapticTap('light'); setPressedId(id) }, [])
  const onUp   = useCallback(() => setPressedId(null), [])
  return { pressedId, onDown, onUp }
}

export default function ScTastingPanel({
  title,
  flavorNotes,
  selectedNotes,
  onToggleNote,
  ratingLabel,
  ratings,
  ratingLabels,
  selectedRating,
  onSelectRating,
  canContinue,
  proceeded,
  onContinue,
  continueLabel,
  notReadyLabel,
}) {
  const notePressState = usePressId()
  const ratingPressState = usePressId()
  const [ctaPressed, setCtaPressed] = useState(false)

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%',
      background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.86) 12%,rgba(5,3,1,0.96) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '0.7rem', padding: '0 5% 76px', pointerEvents: 'none',
    }}>
      <p style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.7)', margin: 0 }}>
        {title}
      </p>

      {/* Flavor chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: '90%', pointerEvents: 'auto' }}>
        {flavorNotes.map(note => {
          const sel = selectedNotes.has(note)
          const isPressed = notePressState.pressedId === note
          return (
            <button
              key={note}
              aria-label={note}
              aria-pressed={sel}
              onPointerDown={() => notePressState.onDown(note)}
              onPointerUp={() => { notePressState.onUp(); onToggleNote(note) }}
              onPointerLeave={notePressState.onUp}
              onPointerCancel={notePressState.onUp}
              style={{
                padding: '5px 14px', minHeight: 40, borderRadius: '20px', cursor: 'pointer', touchAction: 'manipulation',
                background: sel ? 'rgba(233,193,118,0.22)' : 'rgba(0,0,0,0.55)',
                border: sel ? '1px solid rgba(233,193,118,0.8)' : '1px solid rgba(233,193,118,0.25)',
                color: sel ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.5)',
                fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontWeight: sel ? 600 : 400,
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
                transform: isPressed ? 'scale(0.91)' : 'scale(1)',
                boxShadow: isPressed ? '0 0 0 3px rgba(233,193,118,0.35), 0 0 12px rgba(233,193,118,0.18)' : sel ? '0 0 6px rgba(233,193,118,0.15)' : 'none',
                transition: isPressed ? 'transform 0.05s ease' : 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.14s, border-color 0.14s, color 0.14s, box-shadow 0.14s',
              }}>
              {note}
            </button>
          )
        })}
      </div>

      {/* Rating row */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.55)' }}>
          {ratingLabel}{selectedRating ? ` — ${ratingLabels[selectedRating - 1]}` : ''}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {ratings.map(r => {
            const isSel = selectedRating === r
            const isPressed = ratingPressState.pressedId === r
            return (
              <button
                key={r}
                aria-label={`${ratingLabel} rating ${r} — ${ratingLabels[r - 1]}`}
                aria-pressed={isSel}
                onPointerDown={() => ratingPressState.onDown(r)}
                onPointerUp={() => { ratingPressState.onUp(); onSelectRating(r) }}
                onPointerLeave={ratingPressState.onUp}
                onPointerCancel={ratingPressState.onUp}
                style={{
                  width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', touchAction: 'manipulation',
                  background: isSel ? 'rgba(233,193,118,0.9)' : 'rgba(0,0,0,0.55)',
                  border: isSel ? 'none' : '1px solid rgba(233,193,118,0.3)',
                  color: isSel ? '#0a0603' : 'rgba(233,193,118,0.6)',
                  fontFamily: 'Georgia,serif', fontSize: '13px', fontWeight: 700,
                  outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
                  transform: isPressed ? 'scale(0.88)' : isSel ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isPressed ? '0 0 0 3px rgba(233,193,118,0.4)' : isSel ? '0 0 12px rgba(233,193,118,0.4)' : 'none',
                  transition: isPressed ? 'transform 0.05s ease' : 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.14s, box-shadow 0.14s',
                }}>
                {r}
              </button>
            )
          })}
        </div>
      </div>

      {/* Continue button */}
      <button
        aria-label={canContinue ? continueLabel : notReadyLabel}
        disabled={!canContinue || proceeded}
        onPointerDown={() => { if (canContinue && !proceeded) { setCtaPressed(true); hapticTap('medium') } }}
        onPointerUp={() => { setCtaPressed(false); if (canContinue && !proceeded) onContinue() }}
        onPointerLeave={() => setCtaPressed(false)}
        onPointerCancel={() => setCtaPressed(false)}
        style={{
          width: '80%', padding: '3.5% 0', minHeight: 72,
          background: canContinue ? 'linear-gradient(135deg,rgba(233,193,118,.28),rgba(201,168,76,.18))' : 'rgba(0,0,0,0.4)',
          border: canContinue ? '1.5px solid rgba(233,193,118,0.75)' : '1.5px solid rgba(233,193,118,0.18)',
          borderRadius: '12px', cursor: canContinue ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
          touchAction: 'manipulation', opacity: canContinue ? 1 : 0.45, backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
          transform: ctaPressed ? 'scale(0.95)' : 'scale(1)',
          boxShadow: ctaPressed ? '0 0 0 3px rgba(233,193,118,0.4)' : 'none',
          transition: ctaPressed ? 'transform 0.06s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), all 0.15s ease',
        }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: canContinue ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.35)', fontWeight: 600 }}>
          {proceeded ? 'Continuing...' : canContinue ? continueLabel : notReadyLabel}
        </span>
      </button>
    </div>
  )
}
