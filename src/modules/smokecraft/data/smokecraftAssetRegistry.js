/**
 * SmokeCraft Asset Naming Registry (R7)
 *
 * Canonical source of truth for all SmokeCraft background images.
 * Maps every screen to its canonical asset path, alternate paths
 * (legacy or alternate quality), and route usage.
 *
 * Status values:
 *   'active'     — in use, production-ready
 *   'legacy'     — superseded by canonical, kept for rollback
 *   'optimized'  — WebP-compressed copy (output of image-audit --fix)
 *   'missing'    — referenced but file not confirmed on disk
 *
 * NEVER delete entries. Set status to 'legacy' when superseding.
 */

export const SMOKECRAFT_ASSET_REGISTRY = Object.freeze([
  {
    id:        'sc-home',
    route:     '/smokecraft',
    label:     'SmokeCraft Home',
    canonical: '/assets/smokecraft/smokecraft-home.jpg',
    alternates: [
      '/smokecraft/images/smokecraft-home.jpg',
    ],
    status:    'active',
  },
  {
    id:        'sc-enroll',
    route:     '/smokecraft/enroll',
    label:     'Enroll',
    canonical: '/assets/smokecraft/smokecraft Intake.png',
    alternates: [
      '/smokecraft/images/smokecraft-intake.png',
    ],
    status:    'active',
  },
  {
    id:        'sc-golden-box',
    route:     '/smokecraft/golden-box',
    label:     'Golden Box',
    canonical: '/assets/smokecraft/GOLDEN BOX.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-art',
    route:     '/smokecraft/art',
    label:     'Art of the Cigar',
    canonical: '/assets/smokecraft/ART OF THE CIGAR.png',
    alternates: [
      '/smokecraft/images/art-of-the-cigar.png',
    ],
    status:    'active',
  },
  {
    id:        'sc-mentor',
    route:     '/smokecraft/mentor',
    label:     'Your Mentor',
    canonical: '/assets/smokecraft/YOUR MENTOR.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-format',
    route:     '/smokecraft/format',
    label:     'Choose Your Format',
    canonical: '/assets/smokecraft/CHOOSE YOUR FORMAT.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-origins',
    route:     '/smokecraft/origins',
    label:     'The Origins',
    canonical: '/assets/smokecraft/THE ORIGINS.png',
    alternates: [
      '/smokecraft/images/the-origins.png',
    ],
    status:    'active',
  },
  {
    id:        'sc-curation',
    route:     '/smokecraft/curation',
    label:     'The Curation',
    canonical: '/assets/smokecraft/THE CURATION.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-leaves',
    route:     '/smokecraft/leaves',
    label:     'The Leaves',
    canonical: '/assets/smokecraft/THE LEAVES.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-leaf-challenge',
    route:     '/smokecraft/leaf-challenge',
    label:     'Leaf Challenge',
    canonical: '/assets/smokecraft/LEAF CHALLENGE.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-cultivation',
    route:     '/smokecraft/cultivation',
    label:     'Cultivation',
    canonical: '/assets/smokecraft/CULTIVATION.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-blend',
    route:     '/smokecraft/blend',
    label:     'The Blend',
    canonical: '/assets/smokecraft/THE BLEND.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-flavor-dna',
    route:     '/smokecraft/flavor-dna',
    label:     'Flavor DNA',
    canonical: '/assets/smokecraft/FLAVOR DNA.png',
    alternates: [
      '/smokecraft/images/flavor-dna.png',
    ],
    status:    'active',
  },
  {
    id:        'sc-discover-profile',
    route:     '/smokecraft/flavor-dna',
    label:     'Discover Your Cigar Profile',
    canonical: '/assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-pairing',
    route:     '/smokecraft/pairing',
    label:     'Pairing',
    canonical: '/assets/smokecraft/PAIRING.png',
    alternates: [
      '/smokecraft/images/pairing.png',
    ],
    status:    'active',
  },
  {
    id:        'sc-available',
    route:     '/smokecraft/available',
    label:     'Available Tonight',
    canonical: '/assets/smokecraft/AVAILABLE TONIGHT.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-assistant',
    route:     '/smokecraft/assistant',
    label:     'Assistant',
    canonical: '/assets/smokecraft/YOUR SMOKECRAFT ASSISTANT.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-terroir',
    route:     '/smokecraft/terroir',
    label:     'Terroir',
    canonical: '/assets/smokecraft/TERROIR.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-pairing-mastery',
    route:     '/smokecraft/pairing-mastery',
    label:     'Pairing Mastery',
    canonical: '/assets/smokecraft/PAIRING MASTERY.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-vitola',
    route:     '/smokecraft/vitola',
    label:     'Vitola',
    canonical: '/assets/smokecraft/VITOLA.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-identity',
    route:     '/smokecraft/identity',
    label:     'Identity',
    canonical: '/assets/smokecraft/IDENTITY.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-seed-soil',
    route:     '/smokecraft/seed-soil',
    label:     'Seed & Soil',
    canonical: '/assets/smokecraft/SEED & PARING.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-humidor-match',
    route:     '/smokecraft/humidor-match',
    label:     'Humidor Match',
    canonical: '/smokecraft/images/cigar-shape-size.png',
    alternates: [
      '/assets/smokecraft/cigars/cigar-shape-size-master.png',
    ],
    status:    'active',
  },
  {
    id:        'sc-request-purchase',
    route:     '/smokecraft/request-purchase',
    label:     'Request Purchase',
    canonical: '/smokecraft/images/request-purchase.png',
    alternates: [
      '/assets/smokecraft/request-purchase.png',
    ],
    status:    'active',
  },
  {
    id:        'sc-cut-toast',
    route:     '/smokecraft/cut-toast-light',
    label:     'Cut Toast Light',
    canonical: '/assets/smokecraft/CUT TOAST LIGHT.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-first-third',
    route:     '/smokecraft/first-third',
    label:     'First Third',
    canonical: '/assets/smokecraft/FIRST THIRD.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-second-third',
    route:     '/smokecraft/second-third',
    label:     'Second Third',
    canonical: '/assets/smokecraft/SECOND THIRD.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-final-third',
    route:     '/smokecraft/final-third',
    label:     'Final Third',
    canonical: '/assets/smokecraft/FINAL THIRD.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-scorecard',
    route:     '/smokecraft/scorecard',
    label:     'Scorecard',
    canonical: '/assets/smokecraft/SCORECARD.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-session-complete',
    route:     '/smokecraft/session-complete',
    label:     'Session Complete',
    canonical: '/smokecraft/images/Your visit has been logged.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-passport-stamp',
    route:     '/smokecraft/passport-stamp',
    label:     'Passport Stamp',
    canonical: '/assets/smokecraft/PASSPORT STAMP.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-leaderboard',
    route:     '/smokecraft/leaderboard',
    label:     'Leaderboard',
    canonical: '/assets/smokecraft/LEADERBOARD.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-event-challenge',
    route:     '/smokecraft/event-challenge',
    label:     'Event Challenge',
    canonical: '/assets/smokecraft/EVENT CHALLENGE.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-connections',
    route:     '/smokecraft/connections',
    label:     'Connections',
    canonical: '/assets/smokecraft/CONNECTIONS.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-pairing-lab',
    route:     '/smokecraft/pairing-lab',
    label:     'Pairing Lab',
    canonical: '/assets/smokecraft/PAIRING LAB.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-flavor-memory',
    route:     '/smokecraft/flavor-memory',
    label:     'Flavor Memory',
    canonical: '/assets/smokecraft/FLAVOR MEMORY.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-final-review',
    route:     '/smokecraft/final-review',
    label:     'Final Review',
    canonical: '/assets/smokecraft/FINAL REVIEW.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-demo',
    route:     '/smokecraft/demo',
    label:     'Demo',
    canonical: '/assets/smokecraft/DEMO.png',
    alternates: [],
    status:    'active',
  },
  {
    id:        'sc-guest-pass',
    route:     '/smokecraft/guest-pass',
    label:     'Guest Pass',
    canonical: '/assets/smokecraft/GUEST PASS.png',
    alternates: [],
    status:    'active',
  },
])

/**
 * Returns the registry entry for a given route path, or null.
 */
export function getAssetForRoute(routePath) {
  return SMOKECRAFT_ASSET_REGISTRY.find(e => e.route === routePath) || null
}

/**
 * Returns all active registry entries.
 */
export function getActiveAssets() {
  return SMOKECRAFT_ASSET_REGISTRY.filter(e => e.status === 'active')
}

/**
 * Returns all entries with the given status.
 */
export function getAssetsByStatus(status) {
  return SMOKECRAFT_ASSET_REGISTRY.filter(e => e.status === status)
}
