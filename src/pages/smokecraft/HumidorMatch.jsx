import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Request Purchase',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/request-purchase',
  },
]

export default function HumidorMatch() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-humidor-match.png"
      alt="Humidor Match"
      hotspots={HOTSPOTS}
      route="/smokecraft/humidor-match"
    />
  )
}
