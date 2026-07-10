import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

/*
 * Mentor Selection — /smokecraft/mentor-selection
 *
 * The image shows mentor cards in the upper/middle region.
 * Three hotspot zones cover the card area so tapping any mentor
 * card area proceeds to the next step. A fourth hotspot at the
 * bottom covers the visual Continue/Proceed CTA.
 *
 * All hotspots navigate to /smokecraft/visit-complete
 * (end of Visit 1 — guest returns on next venue trip).
 *
 * To calibrate zones for the actual image, enable debug mode:
 *   sessionStorage.setItem('smokecraft_hotspot_debug', '1')
 */
const HOTSPOTS = [
  // Mentor card zone — left card
  {
    label: 'Select Your Mentor',
    x: 2, y: 20, width: 30, height: 48,
    to: '/smokecraft/visit-complete',
  },
  // Mentor card zone — center card
  {
    label: 'Select Your Mentor',
    x: 35, y: 20, width: 30, height: 48,
    to: '/smokecraft/visit-complete',
  },
  // Mentor card zone — right card
  {
    label: 'Select Your Mentor',
    x: 68, y: 20, width: 30, height: 48,
    to: '/smokecraft/visit-complete',
  },
  // Bottom CTA — "Continue" or "Proceed" visual button area
  {
    label: 'Continue to Visit Complete',
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
