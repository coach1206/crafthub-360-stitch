import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Get Started',
    x: 10, y: 75, width: 80, height: 20,
    onClick: () => triggerHaptic('medium'),
    to: '/smokecraft/enroll',
  },
]

export default function HowItWorks() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-how-it-works.png"
      alt="How SmokeCraft Works"
      hotspots={HOTSPOTS}
      route="/smokecraft/how-it-works"
    />
  )
}
