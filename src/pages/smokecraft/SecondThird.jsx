import { useState } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function SecondThird() {
  const { awardSessionRewards, setSecondThirdTasting } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    // observe_confirm_step: guest confirmed they were present — no tasting input collected at this stage
    setSecondThirdTasting({
      status: 'observe_confirm_step',
      source: 'local_only',
      tasteProfileSource: 'not_collected',
      safeClaim: 'Guest confirmed observation — no tasting input captured',
      notesSelected: [],
      notesCount: 0,
      rating: null,
      hasRating: false,
      flavorDevelopment: null,
      strengthChange: null,
      bodyChange: null,
      ashQuality: null,
      pairingReaction: null,
      mentorTip: null,
      mentorName: null,
    })
    awardSessionRewards('second-third')
  }

  const hotspots = [
    {
      label: 'Continue to Flavor Memory',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleContinue,
      to: '/smokecraft/flavor-memory',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-second-third.png"
      alt="Second Third Tasting"
      hotspots={hotspots}
      route="/smokecraft/second-third"
    />
  )
}
