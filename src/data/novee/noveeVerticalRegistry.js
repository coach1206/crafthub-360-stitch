/**
 * NOVEE OS Vertical Registry
 * Maps each Craft360 vertical to its NOVEE OS module identity, capabilities, and readiness state.
 */

import { CRAFT_MODULES } from './noveePlatformModules.js'

export const VERTICAL_CAPABILITY_FLAGS = {
  EDUCATION:          'ncie_education_enabled',
  MENTOR:             'ncie_mentor_enabled',
  DECISION:           'ncie_decision_enabled',
  RECOMMENDATION:     'ncie_recommendation_enabled',
  COMMERCE:           'ncie_commerce_enabled',
  ANALYTICS:          'ncie_analytics_enabled',
  PASSPORT:           'ncie_passport_enabled',
  XP_TRACKING:        'ncie_xp_tracking_enabled',
  MASTERY:            'ncie_mastery_enabled',
  KDS_ROUTING:        'kds_routing_preview',
  ORDER_LIFECYCLE:    'order_lifecycle_preview',
  TAX_COMPLIANCE:     'tax_compliance_preview',
  POS_SYNC:           'pos_sync_preview',
  PAYMENT_BRIDGE:     'payment_bridge_preview',
}

export const VERTICAL_REGISTRY = [
  {
    moduleId:          'smokecraft',
    displayName:       'SmokeCraft 360',
    verticalType:      'cigar_tobacco',
    parentPlatform:    'novee_os',
    launchStatus:      'active',
    ncieSupportLevel:  'full',
    capabilities:      Object.values(VERTICAL_CAPABILITY_FLAGS),
    primaryCategory:   'cigar',
    itemCategories:    ['cigar', 'tobacco', 'accessory', 'merchandise', 'beverage'],
    kdsStationDefault: 'humidor',
    passportEnabled:   true,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'pourcraft',
    displayName:       'PourCraft 360',
    verticalType:      'spirits_whiskey',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled', 'ncie_passport_enabled'],
    primaryCategory:   'alcohol',
    itemCategories:    ['alcohol', 'beverage', 'merchandise'],
    kdsStationDefault: 'bar',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'beercraft',
    displayName:       'BeerCraft 360',
    verticalType:      'beer_brewing',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled', 'ncie_passport_enabled'],
    primaryCategory:   'alcohol',
    itemCategories:    ['alcohol', 'beverage', 'merchandise'],
    kdsStationDefault: 'bar',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'winecraft',
    displayName:       'WineCraft 360',
    verticalType:      'wine',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled', 'ncie_passport_enabled'],
    primaryCategory:   'alcohol',
    itemCategories:    ['alcohol', 'beverage', 'merchandise'],
    kdsStationDefault: 'bar',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'coffeecraft',
    displayName:       'CoffeeCraft 360',
    verticalType:      'coffee',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'beverage',
    itemCategories:    ['beverage', 'food', 'merchandise'],
    kdsStationDefault: 'bar',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'teacraft',
    displayName:       'TeaCraft 360',
    verticalType:      'tea',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'beverage',
    itemCategories:    ['beverage', 'food', 'merchandise'],
    kdsStationDefault: 'bar',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'chocolatecraft',
    displayName:       'ChocolateCraft 360',
    verticalType:      'chocolate',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'food',
    itemCategories:    ['food', 'merchandise'],
    kdsStationDefault: 'kitchen',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'bbqcraft',
    displayName:       'BBQCraft 360',
    verticalType:      'bbq_grilling',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'food',
    itemCategories:    ['food', 'merchandise'],
    kdsStationDefault: 'kitchen',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'steakcraft',
    displayName:       'SteakCraft 360',
    verticalType:      'steak_beef',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'food',
    itemCategories:    ['food', 'merchandise'],
    kdsStationDefault: 'kitchen',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'chefcraft',
    displayName:       'ChefCraft 360',
    verticalType:      'culinary',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'food',
    itemCategories:    ['food', 'beverage', 'merchandise'],
    kdsStationDefault: 'kitchen',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'mixologycraft',
    displayName:       'MixologyCraft 360',
    verticalType:      'mixology',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'alcohol',
    itemCategories:    ['alcohol', 'beverage', 'merchandise'],
    kdsStationDefault: 'bar',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'cheesecraft',
    displayName:       'CheeseCraft 360',
    verticalType:      'cheese',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'food',
    itemCategories:    ['food', 'merchandise'],
    kdsStationDefault: 'kitchen',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'dessertcraft',
    displayName:       'DessertCraft 360',
    verticalType:      'dessert',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'food',
    itemCategories:    ['food', 'merchandise'],
    kdsStationDefault: 'kitchen',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
  {
    moduleId:          'hospitalitycraft',
    displayName:       'HospitalityCraft 360',
    verticalType:      'hospitality',
    parentPlatform:    'novee_os',
    launchStatus:      'craft_vertical_registered',
    ncieSupportLevel:  'preview',
    capabilities:      ['ncie_education_enabled', 'ncie_mentor_enabled'],
    primaryCategory:   'service_fee',
    itemCategories:    ['service_fee', 'ticket', 'event_admission', 'merchandise'],
    kdsStationDefault: 'expo',
    passportEnabled:   false,
    registrationDate:  '2024-01-01',
  },
]

export function getVerticalRegistration(moduleId) {
  return VERTICAL_REGISTRY.find(v => v.moduleId === moduleId) ?? null
}

export function getActiveVerticals() {
  return VERTICAL_REGISTRY.filter(v => v.launchStatus === 'active')
}

export function getRegisteredVerticals() {
  return VERTICAL_REGISTRY.filter(v => v.launchStatus === 'craft_vertical_registered')
}

export function getVerticalsByCategory(primaryCategory) {
  return VERTICAL_REGISTRY.filter(v => v.primaryCategory === primaryCategory)
}

export function getVerticalCapabilities(moduleId) {
  const v = getVerticalRegistration(moduleId)
  return v ? v.capabilities : []
}

export function hasCapability(moduleId, capabilityFlag) {
  return getVerticalCapabilities(moduleId).includes(capabilityFlag)
}
