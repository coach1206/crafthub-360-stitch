import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { injectScTouchStyles } from '../../utils/scTouch.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import ScTastingPanel from '../../components/smokecraft/ScTastingPanel.jsx'

const FLAVOR_NOTES = ['Char','Caramel','Toast','Woodsmoke','Sweet','Bitter','Mineral','Leather','Dark Fruit','Spice','Coffee','Earth']
const RATINGS = [1, 2, 3, 4, 5]
const RATING_LABELS = ['Poor','Fair','Good','Very Good','Exceptional']

export default function FinalThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setFinalThirdTasting } = useGuestSession()
  const [notes, setNotes] = useState(new Set())
  const [overallRating, setOverallRating] = useState(null)
  const [proceeded, setProceeded] = useState(false)

  useEffect(() => { injectScTouchStyles() }, [])

  const canContinue = notes.size > 0 && overallRating !== null

  const toggleNote = useCallback((note) => {
    setNotes(prev => { const n = new Set(prev); n.has(note) ? n.delete(note) : n.add(note); return n })
  }, [])

  const handleRating = useCallback((r) => {
    setOverallRating(prev => prev === r ? null : r)
  }, [])

  const handleContinue = useCallback(() => {
    if (!canContinue || proceeded) return
    setProceeded(true)
    const notesArr = Array.from(notes)
    setFinalThirdTasting({ notesSelected: notesArr, notesCount: notesArr.length, overallRating, hasOverallRating: true })
    completeStep('final-third')
    addXP(75)
    navigate('/smokecraft/scorecard')
  }, [canContinue, proceeded, notes, overallRating, setFinalThirdTasting, completeStep, addXP, navigate])

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft-reference/approved/smokecraft-final-third.png"
      alt="Final Third Tasting"
    >
      <ScTastingPanel
        title="Final Third — Overall Impression"
        flavorNotes={FLAVOR_NOTES}
        selectedNotes={notes}
        onToggleNote={toggleNote}
        ratingLabel="Overall Score"
        ratings={RATINGS}
        ratingLabels={RATING_LABELS}
        selectedRating={overallRating}
        onSelectRating={handleRating}
        canContinue={canContinue}
        proceeded={proceeded}
        onContinue={handleContinue}
        continueLabel="Continue to Scorecard →"
        notReadyLabel={`Select ${notes.size === 0 ? 'a flavor note' : 'an overall rating'} to continue`}
      />
    </SmokeCraftAssetScreen>
  )
}
