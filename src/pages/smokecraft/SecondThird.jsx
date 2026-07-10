import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const FLAVOR_NOTES = ['Dark Cocoa','Cedar','Leather','Toasted Almond','Black Pepper','Earth','Coffee','Cream','Dried Fruit','Oak','Tobacco','Sweet']
const RATINGS = [1, 2, 3, 4, 5]
const BODY_LABELS = ['Light','Light-Med','Medium','Med-Full','Full']

export default function SecondThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setSecondThirdTasting } = useGuestSession()
  const [notes, setNotes] = useState(new Set())
  const [rating, setRating] = useState(null)
  const [proceeded, setProceeded] = useState(false)

  const canContinue = notes.size > 0 && rating !== null

  const toggleNote = useCallback((note) => {
    triggerHaptic('light')
    setNotes(prev => { const n = new Set(prev); n.has(note) ? n.delete(note) : n.add(note); return n })
  }, [])

  const handleRating = useCallback((r) => {
    triggerHaptic('light')
    setRating(prev => prev === r ? null : r)
  }, [])

  const handleContinue = useCallback(() => {
    if (!canContinue || proceeded) return
    setProceeded(true)
    triggerHaptic('medium')
    const notesArr = Array.from(notes)
    setSecondThirdTasting({ notesSelected: notesArr, notesCount: notesArr.length, rating, hasRating: true })
    completeStep('second-third')
    addXP(50)
    navigate('/smokecraft/flavor-memory')
  }, [canContinue, proceeded, notes, rating, setSecondThirdTasting, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-second-third.png"
      alt="Second Third Tasting"
    >
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
        background: 'linear-gradient(180deg,rgba(5,3,1,0) 0%,rgba(5,3,1,0.86) 12%,rgba(5,3,1,0.96) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '0.75rem', padding: '0 5%', pointerEvents: 'none',
      }}>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.7)', margin: 0 }}>
          Second Third — Note the Flavor Development
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: '90%', pointerEvents: 'auto' }}>
          {FLAVOR_NOTES.map(note => {
            const sel = notes.has(note)
            return (
              <button key={note} aria-label={note} aria-pressed={sel} onClick={() => toggleNote(note)}
                style={{
                  padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', touchAction: 'manipulation',
                  background: sel ? 'rgba(233,193,118,0.22)' : 'rgba(0,0,0,0.55)',
                  border: sel ? '1px solid rgba(233,193,118,0.8)' : '1px solid rgba(233,193,118,0.25)',
                  color: sel ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.5)',
                  fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: sel ? 600 : 400,
                  backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                  transition: 'all 0.14s ease', outline: 'none', WebkitTapHighlightColor: 'transparent',
                }}>
                {note}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(8px,1vw,10px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.55)' }}>
            Body {rating ? `— ${BODY_LABELS[rating - 1]}` : ''}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {RATINGS.map(r => (
              <button key={r} aria-label={`Body rating ${r}`} aria-pressed={rating === r} onClick={() => handleRating(r)}
                style={{
                  width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', touchAction: 'manipulation',
                  background: rating === r ? 'rgba(233,193,118,0.9)' : 'rgba(0,0,0,0.55)',
                  border: rating === r ? 'none' : '1px solid rgba(233,193,118,0.3)',
                  color: rating === r ? '#0a0603' : 'rgba(233,193,118,0.6)',
                  fontFamily: 'Georgia,serif', fontSize: '13px', fontWeight: 700,
                  transition: 'all 0.14s ease', outline: 'none', WebkitTapHighlightColor: 'transparent',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleContinue} disabled={!canContinue || proceeded}
          aria-label="Continue to Flavor Memory"
          style={{
            width: '80%', padding: '3.5% 0',
            background: canContinue ? 'linear-gradient(135deg,rgba(233,193,118,.28),rgba(201,168,76,.18))' : 'rgba(0,0,0,0.4)',
            border: canContinue ? '1.5px solid rgba(233,193,118,0.75)' : '1.5px solid rgba(233,193,118,0.18)',
            borderRadius: '12px', cursor: canContinue ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
            touchAction: 'manipulation', opacity: canContinue ? 1 : 0.45, backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)', transition: 'all 0.2s ease', outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(9px,1.3vw,12px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: canContinue ? 'rgba(233,193,118,0.95)' : 'rgba(233,193,118,0.35)', fontWeight: 600 }}>
            {proceeded ? 'Continuing...' : canContinue ? 'Continue to Flavor Memory →' : `Select ${notes.size === 0 ? 'a flavor note' : 'a body rating'} to continue`}
          </span>
        </button>
      </div>
    </SmokeCraftAssetScreen>
  )
}
