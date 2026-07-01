import SmokeCraftAssetRoute from '../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Start SmokeCraft',
    x: 10, y: 70, width: 80, height: 25,
    to: '/smokecraft/identity',
  },
]

export default function SmokeCraft() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-landing.png"
      alt="SmokeCraft"
      hotspots={HOTSPOTS}
      route="/smokecraft"
    />
  )
}
