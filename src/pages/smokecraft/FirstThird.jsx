import { useState } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function FirstThird() {
  const { completeStep, addXP, setFirstThirdTasting } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    setFirstThirdTasting({
      notesSelected: [],
      notesCount: 0,
      drawRating: null,
      hasDrawRating: false,
      strength: null,
      body: null,
      smokeOutput: null,
      burnQuality: null,
      pairingReaction: null,
      mentorTip: null,
      mentorName: null,
    })
    completeStep('first-third')
    addXP(5)
  }

  const hotspots = [
    {
      label: 'Visit 4 Complete — Return on your next visit',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleContinue,
      to: '/smokecraft/visit-complete',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-first-third.png"
      alt="First Third Tasting"
      hotspots={hotspots}
      route="/smokecraft/first-third"
    />
  )
}
