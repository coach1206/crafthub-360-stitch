import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function Mentor() {
  const { completeStep } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Visit 1 Complete — Return on your next visit',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); completeStep('mentor') },
      to: '/smokecraft/visit-complete',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-mentor-selection.png"
      alt="Mentor Selection"
      hotspots={HOTSPOTS}
      route="/smokecraft/mentor-selection"
    />
  )
}
