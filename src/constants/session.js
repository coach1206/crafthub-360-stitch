export const RANKS = [
  { name: 'Novice',      minXP: 0,    maxXP: 199,      icon: 'emoji_events',      color: '#9a8f80' },
  { name: 'Enthusiast',  minXP: 200,  maxXP: 499,      icon: 'star',              color: '#e9c176' },
  { name: 'Connoisseur', minXP: 500,  maxXP: 899,      icon: 'military_tech',     color: '#ffb95a' },
  { name: 'Aficionado',  minXP: 900,  maxXP: Infinity, icon: 'workspace_premium', color: '#e9c176' },
]

export function getRankFromXP(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i]
  }
  return RANKS[0]
}

export const XP_AWARDS = {
  PROFILE_COMPLETE:        50,
  GOLDEN_BOX_VIEWED:       25,
  MENTOR_SELECTED:         75,
  FORMAT_SELECTED:         25,
  ORIGINS_COMPLETE:       100,
  LEAVES_COMPLETE:         75,
  LEAF_CHALLENGE_PERFECT: 125,
  CULTIVATION_COMPLETE:    75,
  BLEND_CREATED:          150,
  FLAVOR_DNA_COMPLETE:    100,
  PAIRING_COMPLETE:        75,
  CIGAR_SELECTED:         100,
  POS_ORDERED:             25,
  SESSION_1_COMPLETE:     200,
  TERROIR_COMPLETE:       100,
  PAIRING_MASTERY:        100,
  VITOLA_COMPLETE:        100,
  IDENTITY_REVEAL:        250,
  PASSPORT_STAMP:          50,
}

export const SMOKECRAFT_FLOW = [
  { id: 'enroll',           route: '/smokecraft/enroll',           label: 'Profile Enrollment',        stitch: true  },
  { id: 'format',           route: '/smokecraft/format',           label: 'Shape, Size & Burn Time',   stitch: false },
  { id: 'seed-soil',        route: '/smokecraft/seed-soil',        label: 'Seed & Soil Pairing',       stitch: true  },
  { id: 'mentor',           route: '/smokecraft/mentor',           label: 'Select Master Mentor',      stitch: true  },
  { id: 'golden-box',       route: '/smokecraft/golden-box',       label: 'Gold Box Rules',            stitch: false },
  { id: 'humidor-match',    route: '/smokecraft/humidor-match',    label: 'Humidor Match',             stitch: true  },
  { id: 'request-purchase', route: '/smokecraft/request-purchase', label: 'Request or Purchase Cigar', stitch: true  },
  { id: 'cut-toast-light',  route: '/smokecraft/cut-toast-light',  label: 'Cut, Toast & Light',        stitch: true  },
  { id: 'first-third',      route: '/smokecraft/first-third',      label: 'First Third Tasting',       stitch: true  },
  { id: 'second-third',     route: '/smokecraft/second-third',     label: 'Second Third Tasting',      stitch: true  },
  { id: 'final-third',      route: '/smokecraft/final-third',      label: 'Final Third Tasting',       stitch: true  },
  { id: 'scorecard',        route: '/smokecraft/scorecard',        label: 'Scorecard',                 stitch: true  },
  { id: 'passport-stamp',   route: '/smokecraft/passport-stamp',   label: 'Passport Stamp',            stitch: true  },
  { id: 'connections',      route: '/smokecraft/connections',      label: '360 Passport Connections',  stitch: true  },
  { id: 'management-sync',  route: '/smokecraft/management-sync',  label: 'Venue / Management Sync',   stitch: false },
  { id: 'session-complete', route: '/smokecraft/session-complete', label: 'Session Closeout',          stitch: true  },
  // Legacy / supplemental steps (not in main flow order)
  { id: 'art',              route: '/smokecraft/art',              label: 'Art of the Cigar',          stitch: false },
  { id: 'origins',          route: '/smokecraft/origins',          label: 'Tobacco Origins',           stitch: true  },
  { id: 'leaves',           route: '/smokecraft/leaves',           label: 'Leaf Education',            stitch: false },
  { id: 'leaf-challenge',   route: '/smokecraft/leaf-challenge',   label: 'Leaf Recognition Game',     stitch: false },
  { id: 'cultivation',      route: '/smokecraft/cultivation',      label: 'Cultivation Experience',    stitch: false },
  { id: 'blend',            route: '/smokecraft/blend',            label: 'Blending Studio',           stitch: true  },
  { id: 'flavor-dna',       route: '/smokecraft/flavor-dna',       label: 'Flavor DNA Analysis',       stitch: true  },
  { id: 'pairing',          route: '/smokecraft/pairing',          label: 'Pairing Experience',        stitch: true  },
  { id: 'terroir',          route: '/smokecraft/terroir',          label: 'Tobacco Terroir',           stitch: false },
  { id: 'pairing-mastery',  route: '/smokecraft/pairing-mastery',  label: 'Spirit Pairing Mastery',    stitch: false },
  { id: 'vitola',           route: '/smokecraft/vitola',           label: 'Vitola Science',            stitch: false },
  { id: 'identity',         route: '/smokecraft/identity',         label: 'Master Blender Ceremony',   stitch: false },
  { id: 'leaderboard',      route: '/smokecraft/leaderboard',      label: 'Leaderboard',               stitch: false },
  { id: 'golden-box-status',route: '/smokecraft/golden-box/status',label: 'Golden Box Status',         stitch: false },
]

export function getNextSmokecraftRoute(completedSteps) {
  const next = SMOKECRAFT_FLOW.find(s => !completedSteps.includes(s.id))
  return next ? next.route : '/smokecraft/passport-stamp'
}

export function getLastSmokecraftRoute(currentStep) {
  const step = SMOKECRAFT_FLOW.find(s => s.id === currentStep)
  return step ? step.route : '/smokecraft/enroll'
}
