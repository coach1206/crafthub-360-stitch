import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function FinalThird() {
  const navigate = useNavigate()
  const { completeStep, addXP, setFinalThirdTasting } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    setFinalThirdTasting({
      notesSelected: [],
      notesCount: 0,
      overallRating: null,
      hasOverallRating: false,
      finalStrength: null,
      finalBody: null,
      heatHarshness: null,
      burnFinish: null,
      finalPairingReaction: null,
      wouldSmokeAgain: null,
      mentorTip: null,
      mentorName: null,
    })
    completeStep('final-third')
    addXP(5)
    navigate('/smokecraft/scorecard')
  }

  return (
    <div onClick={handleContinue} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-final-third.png"
        alt="Final Third Tasting"
      />
    </div>
  )
}
