import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function WrapperStrength() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('wrapper-strength')
    addXP(75)
    navigate('/smokecraft/visit-complete')
  }

  const HOTSPOTS = [
    {
      label: 'Visit 2 Complete — Return on your next visit',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleContinue,
      to: '/smokecraft/visit-complete',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/smokecraft-wrapper-strength.png"
      alt="Wrapper / Strength Education"
      hotspots={HOTSPOTS}
      route="/smokecraft/wrapper-strength"
    />
  )
}
