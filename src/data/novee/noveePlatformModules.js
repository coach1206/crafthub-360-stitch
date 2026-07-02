/**
 * NOVEE OS Platform Module Registry
 * NOVEE OS is the parent operating system.
 * Craft360 modules are vertical experiences powered by NOVEE OS.
 */

export const NOVEE_PLATFORM = {
  name:        'NOVEE OS',
  version:     '1.0',
  role:        'novee_parent_platform',
  description: 'Parent operating system for all Craft360 vertical experiences.',
}

export const NOVEE_MODULE_STATUSES = {
  REGISTERED:    'craft_vertical_registered',
  PREVIEW:       'preview_fallback',
  COMING_SOON:   'coming_soon',
  ACTIVE:        'active',
}

export const CRAFT_MODULES = [
  { moduleId: 'smokecraft',      displayName: 'SmokeCraft 360',     verticalType: 'cigar_tobacco',    status: 'active' },
  { moduleId: 'pourcraft',       displayName: 'PourCraft 360',      verticalType: 'spirits_whiskey',  status: 'craft_vertical_registered' },
  { moduleId: 'beercraft',       displayName: 'BeerCraft 360',      verticalType: 'beer_brewing',     status: 'craft_vertical_registered' },
  { moduleId: 'winecraft',       displayName: 'WineCraft 360',      verticalType: 'wine',             status: 'craft_vertical_registered' },
  { moduleId: 'coffeecraft',     displayName: 'CoffeeCraft 360',    verticalType: 'coffee',           status: 'craft_vertical_registered' },
  { moduleId: 'teacraft',        displayName: 'TeaCraft 360',       verticalType: 'tea',              status: 'craft_vertical_registered' },
  { moduleId: 'chocolatecraft',  displayName: 'ChocolateCraft 360', verticalType: 'chocolate',        status: 'craft_vertical_registered' },
  { moduleId: 'bbqcraft',        displayName: 'BBQCraft 360',       verticalType: 'bbq_grilling',     status: 'craft_vertical_registered' },
  { moduleId: 'steakcraft',      displayName: 'SteakCraft 360',     verticalType: 'steak_beef',       status: 'craft_vertical_registered' },
  { moduleId: 'chefcraft',       displayName: 'ChefCraft 360',      verticalType: 'culinary',         status: 'craft_vertical_registered' },
  { moduleId: 'mixologycraft',   displayName: 'MixologyCraft 360',  verticalType: 'mixology',         status: 'craft_vertical_registered' },
  { moduleId: 'cheesecraft',     displayName: 'CheeseCraft 360',    verticalType: 'cheese',           status: 'craft_vertical_registered' },
  { moduleId: 'dessertcraft',    displayName: 'DessertCraft 360',   verticalType: 'dessert',          status: 'craft_vertical_registered' },
  { moduleId: 'hospitalitycraft',displayName: 'HospitalityCraft 360',verticalType: 'hospitality',    status: 'craft_vertical_registered' },
]

export function getCraftModule(moduleId) {
  return CRAFT_MODULES.find(m => m.moduleId === moduleId) ?? null
}

export function getRegisteredModules() {
  return CRAFT_MODULES.filter(m => m.status !== 'coming_soon')
}
