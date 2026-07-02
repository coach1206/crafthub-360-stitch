/**
 * NCIE Certification Paths
 * Defines the progression milestones for each Craft360 vertical.
 */

export const CERTIFICATION_LEVELS = ['apprentice', 'journeyman', 'artisan', 'master', 'grand_master']

export const SMOKECRAFT_CERTIFICATION_PATHS = [
  {
    pathId:       'smokecraft_apprentice',
    moduleId:     'smokecraft',
    level:        'apprentice',
    displayName:  'SmokeCraft Apprentice',
    xpRequired:   0,
    visitsRequired: 1,
    topicsRequired: ['anatomy', 'flavor_wheel'],
    description:  'Introduction to cigars — anatomy, flavor basics, and getting started.',
    badgeLabel:   'Apprentice Smoker',
    unlocksAt:    'enrollment',
  },
  {
    pathId:       'smokecraft_journeyman',
    moduleId:     'smokecraft',
    level:        'journeyman',
    displayName:  'SmokeCraft Journeyman',
    xpRequired:   250,
    visitsRequired: 3,
    topicsRequired: ['anatomy', 'flavor_wheel', 'filler_binder_wrapper', 'strength_body', 'humidor_basics'],
    description:  'Developing palate and foundational knowledge across blending, storage, and pairing basics.',
    badgeLabel:   'Journeyman Smoker',
    unlocksAt:    'visit_3',
  },
  {
    pathId:       'smokecraft_artisan',
    moduleId:     'smokecraft',
    level:        'artisan',
    displayName:  'SmokeCraft Artisan',
    xpRequired:   750,
    visitsRequired: 5,
    topicsRequired: ['blend_ratios', 'connecticut_wrapper', 'whiskey_pairing', 'aging_science', 'vitola_sizes'],
    description:  'Refined knowledge of origins, wrappers, and advanced pairing concepts.',
    badgeLabel:   'Artisan Smoker',
    unlocksAt:    'visit_5',
  },
  {
    pathId:       'smokecraft_master',
    moduleId:     'smokecraft',
    level:        'master',
    displayName:  'SmokeCraft Master',
    xpRequired:   2000,
    visitsRequired: 8,
    topicsRequired: ['ligero_seco_volado', 'cameroon_habano', 'rolling_techniques', 'blend_ratios', 'aging_science'],
    description:  'Expert-level mastery across all knowledge domains. Ready for grand master evaluation.',
    badgeLabel:   'Master Smoker',
    unlocksAt:    'visit_8',
  },
  {
    pathId:       'smokecraft_grand_master',
    moduleId:     'smokecraft',
    level:        'grand_master',
    displayName:  'SmokeCraft Grand Master',
    xpRequired:   5000,
    visitsRequired: 24,
    topicsRequired: ['all'],
    description:  'Complete mastery of the SmokeCraft 360 vertical. The pinnacle of the Craft Passport journey.',
    badgeLabel:   'Grand Master',
    unlocksAt:    'session_24',
  },
]

export const GENERIC_CERTIFICATION_PATH = (moduleId, displayName) => ([
  {
    pathId:        `${moduleId}_apprentice`,
    moduleId,
    level:         'apprentice',
    displayName:   `${displayName} Apprentice`,
    xpRequired:    0,
    visitsRequired: 1,
    topicsRequired: ['intro'],
    description:   `Introduction to ${displayName.toLowerCase()}.`,
    badgeLabel:    'Apprentice',
    unlocksAt:     'enrollment',
  },
  {
    pathId:        `${moduleId}_journeyman`,
    moduleId,
    level:         'journeyman',
    displayName:   `${displayName} Journeyman`,
    xpRequired:    250,
    visitsRequired: 3,
    topicsRequired: ['intro', 'history', 'key_terminology'],
    description:   `Foundational knowledge of ${displayName.toLowerCase()}.`,
    badgeLabel:    'Journeyman',
    unlocksAt:     'visit_3',
  },
  {
    pathId:        `${moduleId}_artisan`,
    moduleId,
    level:         'artisan',
    displayName:   `${displayName} Artisan`,
    xpRequired:    750,
    visitsRequired: 5,
    topicsRequired: ['core_techniques', 'quality_assessment'],
    description:   `Developing craft skills in ${displayName.toLowerCase()}.`,
    badgeLabel:    'Artisan',
    unlocksAt:     'visit_5',
  },
  {
    pathId:        `${moduleId}_master`,
    moduleId,
    level:         'master',
    displayName:   `${displayName} Master`,
    xpRequired:    2000,
    visitsRequired: 8,
    topicsRequired: ['advanced_methods'],
    description:   `Expert-level mastery of ${displayName.toLowerCase()}.`,
    badgeLabel:    'Master',
    unlocksAt:     'visit_8',
  },
])

const PATH_MAP = {
  smokecraft: SMOKECRAFT_CERTIFICATION_PATHS,
}

export function getCertificationPath(moduleId) {
  return PATH_MAP[moduleId] ?? GENERIC_CERTIFICATION_PATH(moduleId, moduleId)
}

export function getLevelForXP(moduleId, xp) {
  const paths = getCertificationPath(moduleId)
  const sorted = [...paths].sort((a, b) => b.xpRequired - a.xpRequired)
  return sorted.find(p => xp >= p.xpRequired) ?? paths[0]
}

export function getNextLevel(moduleId, currentLevel) {
  const paths    = getCertificationPath(moduleId)
  const idx      = paths.findIndex(p => p.level === currentLevel)
  return paths[idx + 1] ?? null
}
