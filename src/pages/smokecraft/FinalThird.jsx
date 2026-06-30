import { useState } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function FinalThird() {
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
  }

  const hotspots = [
    {
      label: 'Continue to Scorecard',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleContinue,
      to: '/smokecraft/scorecard',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-final-third.png"
      alt="Final Third Tasting"
      hotspots={hotspots}
      route="/smokecraft/final-third"
    />
  )
}
