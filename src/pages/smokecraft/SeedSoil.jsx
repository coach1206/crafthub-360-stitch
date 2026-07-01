import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to Pairing Lab',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/pairing-lab',
  },
]

export default function SeedSoil() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-seed-soil.png"
      alt="Seed & Soil"
      hotspots={HOTSPOTS}
      route="/smokecraft/seed-soil"
    />
  )
}
