import { useState } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function FlavorMemory() {
  const { completeStep, addXP } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('flavor-memory')
    addXP(75)
  }

  const hotspots = [
    {
      label: 'Continue to Final Third',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleContinue,
      to: '/smokecraft/final-third',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-flavor-memory.png"
      alt="Flavor Memory"
      hotspots={hotspots}
      route="/smokecraft/flavor-memory"
    />
  )
}
