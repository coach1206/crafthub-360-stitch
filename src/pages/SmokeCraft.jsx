import SmokeCraftAssetRoute from '../components/smokecraft/SmokeCraftAssetRoute.jsx'

// Covers the "Start New SmokeCraft Session" CTA area in the landing image.
// Wide zone (full width, lower 30%) ensures it catches any tap on the visual button.
const HOTSPOTS = [
  {
    label: 'Start New SmokeCraft Session',
    x: 5, y: 65, width: 90, height: 30,
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
