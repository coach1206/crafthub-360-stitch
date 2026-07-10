import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import ScTastingPanel from '../../components/smokecraft/ScTastingPanel.jsx'

const FLAVOR_NOTES = ['Dark Cocoa','Cedar','Leather','Toasted Almond','Black Pepper','Earth','Coffee','Cream','Dried Fruit','Oak','Tobacco','Sweet']
const RATINGS = [1, 2, 3, 4, 5]
const BODY_LABELS = ['Light','Light-Med','Medium','Med-Full','Full']

export default function SecondThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setSecondThirdTasting } = useGuestSession()
  const [notes, setNotes] = useState(new Set())
  const [rating, setRating] = useState(null)
  const [proceeded, setProceeded] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const canContinue = notes.size > 0 && rating !== null

  const toggleNote = useCallback((note) => {
    setNotes(prev => { const n = new Set(prev); n.has(note) ? n.delete(note) : n.add(note); return n })
  }, [])

  const handleRating = useCallback((r) => {
    setRating(prev => prev === r ? null : r)
  }, [])

  const handleContinue = useCallback(() => {
    if (!canContinue || proceeded) return
    setProceeded(true)
    const notesArr = Array.from(notes)
    setSecondThirdTasting({ notesSelected: notesArr, notesCount: notesArr.length, bodyRating: rating, hasBodyRating: true })
    completeStep('second-third')
    addXP(50)
    navigate('/smokecraft/flavor-memory')
  }, [canContinue, proceeded, notes, rating, setSecondThirdTasting, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-second-third.png"
      alt="Second Third Tasting"
    >
      {/* Cover strip — hides stale "ROUND 3 OF 3 · VISIT 7 OF 8 · SESSION 17 OF 24"
          baked into the top ~44px of the approved image. */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        background: 'rgba(5,3,1,0.97)', zIndex: 10, pointerEvents: 'none',
      }} />
      <ScTastingPanel
        title="Second Third — Flavor Evolution"
        flavorNotes={FLAVOR_NOTES}
        selectedNotes={notes}
        onToggleNote={toggleNote}
        ratingLabel="Body Strength"
        ratings={RATINGS}
        ratingLabels={BODY_LABELS}
        selectedRating={rating}
        onSelectRating={handleRating}
        canContinue={canContinue}
        proceeded={proceeded}
        onContinue={handleContinue}
        continueLabel="Continue to Flavor Memory →"
        notReadyLabel={`Select ${notes.size === 0 ? 'a flavor note' : 'a body rating'} to continue`}
      />
    </SmokeCraftAssetScreen>
  )
}
