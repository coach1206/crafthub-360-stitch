/**
 * NCIE Knowledge Taxonomy
 * Structured knowledge domains, levels, and topic nodes for all Craft360 verticals.
 */

export const KNOWLEDGE_LEVELS = {
  FOUNDATION: 'foundation',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  MASTER: 'master',
}

export const KNOWLEDGE_TOPIC_STATUS = {
  AVAILABLE:   'topic_available',
  LOCKED:      'topic_locked',
  COMPLETED:   'topic_completed',
  IN_PROGRESS: 'topic_in_progress',
}

export const SMOKECRAFT_TAXONOMY = {
  moduleId: 'smokecraft',
  domains: [
    {
      domainId:    'origins',
      displayName: 'Tobacco Origins',
      level:       'foundation',
      topics: [
        { topicId: 'new_world_origins',      displayName: 'New World Tobacco History',      level: 'foundation' },
        { topicId: 'cuba_dominicana',        displayName: 'Cuba and Dominican Traditions',  level: 'foundation' },
        { topicId: 'nicaragua_honduras',     displayName: 'Nicaragua and Honduras',         level: 'intermediate' },
        { topicId: 'connecticut_wrapper',    displayName: 'Connecticut Shade and Broadleaf', level: 'intermediate' },
        { topicId: 'cameroon_habano',        displayName: 'Cameroon and Habano Seeds',       level: 'advanced' },
      ],
    },
    {
      domainId:    'construction',
      displayName: 'Cigar Construction',
      level:       'foundation',
      topics: [
        { topicId: 'anatomy',               displayName: 'Anatomy of a Cigar',              level: 'foundation' },
        { topicId: 'filler_binder_wrapper', displayName: 'Filler, Binder, and Wrapper',     level: 'foundation' },
        { topicId: 'vitola_sizes',          displayName: 'Vitola and Size Guide',            level: 'foundation' },
        { topicId: 'rolling_techniques',    displayName: 'Rolling Techniques',               level: 'advanced' },
      ],
    },
    {
      domainId:    'blending',
      displayName: 'Blending and Flavor Profiles',
      level:       'intermediate',
      topics: [
        { topicId: 'flavor_wheel',          displayName: 'Cigar Flavor Wheel',              level: 'foundation' },
        { topicId: 'strength_body',         displayName: 'Strength vs. Body',               level: 'foundation' },
        { topicId: 'blend_ratios',          displayName: 'Blend Ratios and Balance',         level: 'intermediate' },
        { topicId: 'ligero_seco_volado',    displayName: 'Ligero, Seco, and Volado Leaves', level: 'advanced' },
      ],
    },
    {
      domainId:    'pairing',
      displayName: 'Cigar Pairing',
      level:       'intermediate',
      topics: [
        { topicId: 'whiskey_pairing',       displayName: 'Pairing with Whiskey',            level: 'foundation' },
        { topicId: 'rum_pairing',           displayName: 'Pairing with Rum',                level: 'foundation' },
        { topicId: 'coffee_pairing',        displayName: 'Pairing with Coffee',             level: 'foundation' },
        { topicId: 'wine_pairing',          displayName: 'Pairing with Wine',               level: 'intermediate' },
        { topicId: 'food_pairing',          displayName: 'Pairing with Food',               level: 'intermediate' },
      ],
    },
    {
      domainId:    'storage',
      displayName: 'Storage and Aging',
      level:       'intermediate',
      topics: [
        { topicId: 'humidor_basics',        displayName: 'Humidor Setup and Care',          level: 'foundation' },
        { topicId: 'humidity_temperature',  displayName: 'Humidity and Temperature',        level: 'foundation' },
        { topicId: 'aging_science',         displayName: 'Science of Cigar Aging',          level: 'advanced' },
        { topicId: 'travel_care',           displayName: 'Travel and Short-Term Storage',   level: 'foundation' },
      ],
    },
  ],
}

export const POURCRAFT_TAXONOMY = {
  moduleId: 'pourcraft',
  domains: [
    {
      domainId:    'distillation',
      displayName: 'Distillation Science',
      level:       'foundation',
      topics: [
        { topicId: 'pot_still_vs_column',   displayName: 'Pot Still vs. Column Still',      level: 'foundation' },
        { topicId: 'fermentation_basics',   displayName: 'Fermentation Basics',             level: 'foundation' },
        { topicId: 'cuts_and_congeners',    displayName: 'Heads, Hearts, Tails',            level: 'intermediate' },
      ],
    },
    {
      domainId:    'aging',
      displayName: 'Aging and Maturation',
      level:       'intermediate',
      topics: [
        { topicId: 'barrel_types',          displayName: 'Barrel Types and Char Levels',    level: 'foundation' },
        { topicId: 'angel_share',           displayName: "Angel's Share and Evaporation",  level: 'intermediate' },
        { topicId: 'solera_system',         displayName: 'Solera Aging System',             level: 'advanced' },
      ],
    },
  ],
}

export const GENERIC_TAXONOMY_TEMPLATE = {
  domains: [
    {
      domainId:    'foundations',
      displayName: 'Foundations',
      level:       'foundation',
      topics: [
        { topicId: 'intro',                 displayName: 'Introduction',                    level: 'foundation' },
        { topicId: 'history',               displayName: 'History and Traditions',          level: 'foundation' },
        { topicId: 'key_terminology',       displayName: 'Key Terminology',                 level: 'foundation' },
      ],
    },
    {
      domainId:    'craft_skills',
      displayName: 'Craft Skills',
      level:       'intermediate',
      topics: [
        { topicId: 'core_techniques',       displayName: 'Core Techniques',                 level: 'intermediate' },
        { topicId: 'quality_assessment',    displayName: 'Quality Assessment',              level: 'intermediate' },
        { topicId: 'advanced_methods',      displayName: 'Advanced Methods',                level: 'advanced' },
      ],
    },
  ],
}

const TAXONOMY_MAP = {
  smokecraft:  SMOKECRAFT_TAXONOMY,
  pourcraft:   POURCRAFT_TAXONOMY,
}

export function getTaxonomyForCraft(moduleId) {
  return TAXONOMY_MAP[moduleId] ?? { moduleId, ...GENERIC_TAXONOMY_TEMPLATE }
}

export function getDomainsForCraft(moduleId) {
  const taxonomy = getTaxonomyForCraft(moduleId)
  return taxonomy.domains ?? []
}

export function getTopicsForDomain(moduleId, domainId) {
  const domains = getDomainsForCraft(moduleId)
  const domain  = domains.find(d => d.domainId === domainId)
  return domain?.topics ?? []
}
