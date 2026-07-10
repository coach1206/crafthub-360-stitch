import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Scorecard() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    completeStep('scorecard')
    addXP(75)
    navigate('/smokecraft/final-review')
  }, [navigate, completeStep, addXP])

  const HOTSPOTS = [
    { label: 'Continue to Final Review', x: 10, y: 75, width: 80, height: 20, onClick: handleContinue },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-scorecard-ranking.png"
      alt="Scorecard"
      hotspots={HOTSPOTS}
      route="/smokecraft/scorecard"
    />
  )
}
