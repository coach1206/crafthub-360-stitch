import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Visit 1 Complete — Return on your next visit',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/visit-complete',
  },
]

export default function Mentor() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-mentor-selection.png"
      alt="Mentor Selection"
      hotspots={HOTSPOTS}
      route="/smokecraft/mentor-selection"
    />
  )
}
