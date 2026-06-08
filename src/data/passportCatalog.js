/**
 * Passport Catalog — single source of truth for all stamp/seal definitions.
 * Every stamp awarded by a SmokeCraft screen must have a matching entry here.
 * Import STAMP_CATALOG wherever stamps are displayed, counted, or cross-referenced.
 *
 * Awarded stamp IDs by screen:
 *   Origins.jsx        → 'seed-soil'
 *   Blend.jsx          → 'master-blend'
 *   FlavorDNA.jsx      → 'taste-profile'
 *   Pairing.jsx        → 'pairing-specialist'
 *   SessionComplete.jsx→ 'journey-complete'
 *   PassportStamp.jsx  → 'passport-stamp'
 *   LeafChallenge.jsx  → 'leaf-recognition'
 *   GoldenBoxStatus.jsx→ 'golden-box'
 */

export const STAMP_CATALOG = [
  {
    id:       'seed-soil',
    name:     'Seed & Soil',
    icon:     'landscape',
    rotation: -3,
    shape:    'rect',
    desc:     'Completed the Tobacco Origins heritage pathway in SmokeCraft 360.',
    category: 'SmokeCraft',
  },
  {
    id:       'master-blend',
    name:     'Master Blend',
    icon:     'token',
    rotation: 8,
    shape:    'circle',
    desc:     'Crafted a signature blend at the Blending Studio session.',
    category: 'SmokeCraft',
  },
  {
    id:       'taste-profile',
    name:     'Flavor DNA',
    icon:     'stars',
    rotation: -5,
    shape:    'rect',
    desc:     'FlavorDNA analysis completed. Exceptional palate verified.',
    category: 'SmokeCraft',
  },
  {
    id:       'pairing-specialist',
    name:     'Pairing Specialist',
    icon:     'workspace_premium',
    rotation: 12,
    shape:    'rect',
    desc:     'Mastery of sensory synergy between rare botanicals and aged tobacco.',
    category: 'SmokeCraft',
  },
  {
    id:       'journey-complete',
    name:     'Journey Complete',
    icon:     'diamond',
    rotation: -2,
    shape:    'circle',
    desc:     'SmokeCraft Session I completed in full. Achievement authenticated.',
    category: 'SmokeCraft',
  },
  {
    id:       'passport-stamp',
    name:     'Passport Certified',
    icon:     'verified_user',
    rotation: 6,
    shape:    'rect',
    desc:     'Passport certified and registered in the 360 Grand Lounge network.',
    category: 'Passport',
  },
  {
    id:       'leaf-recognition',
    name:     'Leaf Recognition',
    icon:     'eco',
    rotation: -8,
    shape:    'circle',
    desc:     'Identified rare tobacco leaf varieties in the LeafChallenge assessment.',
    category: 'SmokeCraft',
  },
  {
    id:       'golden-box',
    name:     'Golden Box',
    icon:     'inventory_2',
    rotation: 4,
    shape:    'rect',
    desc:     'Claimed exclusive membership perks through the Golden Box status event.',
    category: 'SmokeCraft',
  },
]

/** Total stamps across all Passport seasons — used for the global progress ring. */
export const TOTAL_PASSPORT_STAMPS = 15
