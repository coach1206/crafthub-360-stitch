import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function GoldenBox() {
  const { completeStep } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Mentor Selection',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); completeStep('golden-box') },
      to: '/smokecraft/mentor-selection',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png"
      alt="Golden Box"
      hotspots={HOTSPOTS}
      route="/smokecraft/golden-box"
    />
  )
}
