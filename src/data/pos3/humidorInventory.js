/**
 * POS 3 Humidor Inventory — per-cigar-SKU bin/location and
 * humidity/temp health status, used by humidorQueueService.js and
 * HumidorControl.jsx / HumidorHealthPanel.jsx.
 */

export const HUMIDOR_INVENTORY = [
  { sku: 'SKU-CIG-PAD64MAD', name: 'Padrón 1964 Anniversary Maduro', quantityOnHand: 15, location: 'Bin A-3', humidityStatus: 'ok', tempStatus: 'ok' },
  { sku: 'SKU-CIG-OPUSXROB', name: 'Arturo Fuente OpusX Robusto', quantityOnHand: 3, location: 'Bin B-1', humidityStatus: 'low', tempStatus: 'ok' },
  { sku: 'SKU-CIG-CHURCHRES', name: 'Hand-Rolled Churchill Reserve', quantityOnHand: 18, location: 'Bin A-7', humidityStatus: 'ok', tempStatus: 'ok' },
  { sku: 'SKU-CIG-OLIVAVMEL', name: 'Oliva Serie V Melanio Toro', quantityOnHand: 20, location: 'Bin C-2', humidityStatus: 'ok', tempStatus: 'high' },
]

export function getHumidorInventory() { return HUMIDOR_INVENTORY }
export function getHumidorItem(sku) { return HUMIDOR_INVENTORY.find((i) => i.sku === sku) || null }
