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
  ORIGINS_COMPLETE:       100,
  LEAVES_COMPLETE:         75,
  LEAF_CHALLENGE_PERFECT: 125,
  CULTIVATION_COMPLETE:    75,
  BLEND_CREATED:          150,
  FLAVOR_DNA_COMPLETE:    100,
  PAIRING_COMPLETE:        75,
  POS_ORDERED:             25,
  SESSION_1_COMPLETE:     200,
  TERROIR_COMPLETE:       100,
  PAIRING_MASTERY:        100,
  VITOLA_COMPLETE:        100,
  IDENTITY_REVEAL:        250,
  PASSPORT_STAMP:          50,
}

export const SMOKECRAFT_FLOW = [
  { id: 'enroll',            route: '/smokecraft/enroll',            label: 'Profile Enrollment',     stitch: true  },
  { id: 'golden-box',        route: '/smokecraft/golden-box',        label: 'Golden Box Challenge',   stitch: false },
  { id: 'art',               route: '/smokecraft/art',               label: 'Art of the Cigar',       stitch: false },
  { id: 'mentor',            route: '/smokecraft/mentor',            label: 'Select Master Mentor',   stitch: true  },
  { id: 'origins',           route: '/smokecraft/origins',           label: 'Tobacco Origins',        stitch: true  },
  { id: 'leaves',            route: '/smokecraft/leaves',            label: 'Leaf Education',         stitch: false },
  { id: 'leaf-challenge',    route: '/smokecraft/leaf-challenge',    label: 'Leaf Recognition Game',  stitch: false },
  { id: 'cultivation',       route: '/smokecraft/cultivation',       label: 'Cultivation Experience', stitch: false },
  { id: 'blend',             route: '/smokecraft/blend',             label: 'Blending Studio',        stitch: true  },
  { id: 'flavor-dna',        route: '/smokecraft/flavor-dna',        label: 'Flavor DNA Analysis',    stitch: true  },
  { id: 'pairing',           route: '/smokecraft/pairing',           label: 'Pairing Experience',     stitch: true  },
  { id: 'available',         route: '/smokecraft/available',         label: "Tonight's Lounge",       stitch: false },
  { id: 'session-complete',  route: '/smokecraft/session-complete',  label: 'Session 1 Complete',     stitch: true  },
  { id: 'terroir',           route: '/smokecraft/terroir',           label: 'Tobacco Terroir',        stitch: false },
  { id: 'pairing-mastery',   route: '/smokecraft/pairing-mastery',   label: 'Spirit Pairing Mastery', stitch: false },
  { id: 'vitola',            route: '/smokecraft/vitola',            label: 'Vitola Science',         stitch: false },
  { id: 'identity',          route: '/smokecraft/identity',          label: 'Master Blender Ceremony',stitch: false },
  { id: 'leaderboard',       route: '/smokecraft/leaderboard',       label: 'Leaderboard',            stitch: false },
  { id: 'golden-box-status', route: '/smokecraft/golden-box/status', label: 'Golden Box Status',      stitch: false },
  { id: 'passport-stamp',    route: '/smokecraft/passport-stamp',    label: 'Passport Stamp',         stitch: true  },
]

export function getNextSmokecraftRoute(completedSteps) {
  const next = SMOKECRAFT_FLOW.find(s => !completedSteps.includes(s.id))
  return next ? next.route : '/smokecraft/passport-stamp'
}

export function getLastSmokecraftRoute(currentStep) {
  const step = SMOKECRAFT_FLOW.find(s => s.id === currentStep)
  return step ? step.route : '/smokecraft/enroll'
}
