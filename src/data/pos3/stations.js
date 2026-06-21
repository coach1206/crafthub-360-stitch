/**
 * POS 3 Station Definitions — kitchen/bar/humidor/retail fulfillment
 * stations used by stationRoutingService.js to route ticket items.
 */

export const STATIONS = [
  { id: 'kitchen_main', name: 'Main Kitchen', type: 'kitchen', queueCapacity: 12 },
  { id: 'bar_main', name: 'Main Bar', type: 'bar', queueCapacity: 10 },
  { id: 'humidor_main', name: 'Humidor Counter', type: 'humidor', queueCapacity: 8 },
  { id: 'retail_main', name: 'Retail Counter', type: 'retail', queueCapacity: 8 },
]

export function getStations() { return STATIONS }
export function getStationByType(type) { return STATIONS.find((s) => s.type === type) || null }
