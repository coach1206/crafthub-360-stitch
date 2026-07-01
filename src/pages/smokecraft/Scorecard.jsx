import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Scorecard() {
  const { completeStep, addXP } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Visit 6 Complete — Return on your next visit',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); completeStep('scorecard'); addXP(100) },
      to: '/smokecraft/visit-complete',
    },
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
