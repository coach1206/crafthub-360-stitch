import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function GoldenBox() {
  const navigate = useNavigate()
  const { completeStep, awardSessionRewards } = useGuestSession()
  const { setGoldenBox } = useSmokeCraftJourney()

  const handleContinue = useCallback(() => {
    triggerHaptic('medium')
    setGoldenBox({ acknowledged: true })
    completeStep('golden-box')
    try { awardSessionRewards('golden-box') } catch (_) {}
    navigate('/smokecraft/mentor-selection')
  }, [navigate, completeStep, awardSessionRewards, setGoldenBox])

  const HOTSPOTS = [
    {
      label: 'Continue to Mentor Selection',
      x: 10,
      y: 75,
      width: 80,
      height: 20,
      onClick: handleContinue,
    },
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
