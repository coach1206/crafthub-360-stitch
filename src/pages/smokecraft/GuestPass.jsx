import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to Enroll',
    x: 10, y: 75, width: 80, height: 20,
    onClick: () => triggerHaptic('medium'),
    to: '/smokecraft/enroll',
  },
]

export default function GuestPass() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-guest-pass.png"
      alt="SmokeCraft Guest Pass"
      hotspots={HOTSPOTS}
      route="/smokecraft/guest-pass"
    />
  )
}
