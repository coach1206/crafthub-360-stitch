import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function GoldenBox() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    completeStep('golden-box')
    addXP(50)
    navigate('/smokecraft/mentor-selection')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    { label: 'Continue to Mentor Selection', x: 10, y: 75, width: 80, height: 20, onClick: handleContinue },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png"
      alt="Golden Box Rules"
      hotspots={HOTSPOTS}
      route="/smokecraft/golden-box"
    />
  )
}
