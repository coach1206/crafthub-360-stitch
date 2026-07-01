import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to First Third',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/first-third',
  },
]

export default function CutToastLight() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png"
      alt="Cut Toast Light"
      hotspots={HOTSPOTS}
      route="/smokecraft/cut-toast-light"
    />
  )
}
