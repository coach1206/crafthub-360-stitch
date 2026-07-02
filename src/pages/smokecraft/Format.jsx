import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Format() {
  const navigate = useNavigate()
  const { completeStep } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('format')
    navigate('/smokecraft/wrapper-strength')
  }

  const HOTSPOTS = [
    {
      label: 'Continue to Wrapper & Strength',
      x: 10, y: 75, width: 80, height: 20,
      onClick: handleContinue,
      to: '/smokecraft/wrapper-strength',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-vitola.png"
      alt="Shape, Size & Burn Time"
      hotspots={HOTSPOTS}
      route="/smokecraft/format"
    />
  )
}
