import SmokeCraftAssetRoute from '../components/smokecraft/SmokeCraftAssetRoute.jsx'

/*
 * SmokeCraft landing page — /smokecraft
 *
 * Hotspot positions are image-relative percentages (x/y/width/height as % of image).
 * The SmokeCraftAssetScreen coordinate-fix ensures these map exactly to the visual
 * button areas in smokecraft-landing.png on any viewport/device size.
 *
 * Positions cover the standard SmokeCraft landing image layout:
 *   – Primary CTA (Start New SmokeCraft Session): lower third of image
 *   – Secondary nav row: middle band
 *   – Bottom nav items: bottom strip
 *
 * If the image layout differs, enable debug mode to fine-tune:
 *   sessionStorage.setItem('smokecraft_hotspot_debug', '1')
 */
const HOTSPOTS = [
  // ── Primary CTA ───────────────────────────────────────────────────────────
  {
    label: 'Start New SmokeCraft Session',
    x: 5, y: 62, width: 90, height: 20,
    to: '/smokecraft/identity',
  },
  // ── Secondary navigation ──────────────────────────────────────────────────
  {
    label: 'Continue Previous Session',
    x: 5, y: 46, width: 90, height: 14,
    to: '/smokecraft/enroll',
  },
  {
    label: 'Enter Event Challenge',
    x: 5, y: 33, width: 42, height: 11,
    to: '/smokecraft/smokecraft-challenge',
  },
  {
    label: 'Browse Humidor',
    x: 53, y: 33, width: 42, height: 11,
    to: '/smokecraft/humidor-match',
  },
  {
    label: 'View My Passport',
    x: 5, y: 22, width: 42, height: 9,
    to: '/smokecraft/passport-stamp',
  },
  {
    label: 'How It Works',
    x: 53, y: 22, width: 42, height: 9,
    to: '/smokecraft/how-it-works',
  },
  // ── Bottom nav (if image has bottom nav strip) ────────────────────────────
  {
    label: 'View Pairing',
    x: 5, y: 84, width: 20, height: 12,
    to: '/smokecraft/pairing-lab',
  },
  {
    label: 'Demo Experience',
    x: 75, y: 84, width: 20, height: 12,
    to: '/smokecraft/golden-box',
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
