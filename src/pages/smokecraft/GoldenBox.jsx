import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to Humidor Match',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/humidor-match',
  },
]

export default function GoldenBox() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png"
      alt="Golden Box"
      hotspots={HOTSPOTS}
      route="/smokecraft/golden-box"
    />
  )
}
