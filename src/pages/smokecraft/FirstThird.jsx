import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import ScTastingPanel from '../../components/smokecraft/ScTastingPanel.jsx'

const FLAVOR_NOTES = ['Dark Cocoa','Cedar','Leather','Toasted Almond','Black Pepper','Earth','Coffee','Cream','Dried Fruit','Oak','Mineral','Spice']
const RATINGS = [1, 2, 3, 4, 5]
const RATING_LABELS = ['Tight','Slightly Tight','Perfect','Smooth','Effortless']

export default function FirstThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setFirstThirdTasting } = useGuestSession()
  const [notes, setNotes] = useState(new Set())
  const [drawRating, setDrawRating] = useState(null)
  const [proceeded, setProceeded] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const canContinue = notes.size > 0 && drawRating !== null

  const toggleNote = useCallback((note) => {
    setNotes(prev => { const n = new Set(prev); n.has(note) ? n.delete(note) : n.add(note); return n })
  }, [])

  const handleRating = useCallback((r) => {
    setDrawRating(prev => prev === r ? null : r)
  }, [])

  const handleContinue = useCallback(() => {
    if (!canContinue || proceeded) return
    setProceeded(true)
    const notesArr = Array.from(notes)
    setFirstThirdTasting({ notesSelected: notesArr, notesCount: notesArr.length, drawRating, hasDrawRating: true })
    completeStep('first-third')
    addXP(50)
    navigate('/smokecraft/second-third')
  }, [canContinue, proceeded, notes, drawRating, setFirstThirdTasting, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-first-third.png"
      alt="First Third Tasting"
    >
      <ScTastingPanel
        title="First Third — Select Flavors You Detect"
        flavorNotes={FLAVOR_NOTES}
        selectedNotes={notes}
        onToggleNote={toggleNote}
        ratingLabel="Draw Quality"
        ratings={RATINGS}
        ratingLabels={RATING_LABELS}
        selectedRating={drawRating}
        onSelectRating={handleRating}
        canContinue={canContinue}
        proceeded={proceeded}
        onContinue={handleContinue}
        continueLabel="Continue to Second Third →"
        notReadyLabel={`Select ${notes.size === 0 ? 'a flavor note' : 'a draw rating'} to continue`}
      />
    </SmokeCraftAssetScreen>
  )
}
