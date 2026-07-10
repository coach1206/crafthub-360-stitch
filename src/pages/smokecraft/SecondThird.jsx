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
