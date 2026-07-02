// Inventory statuses: available | low_stock | sold_out | paused | hidden
export const smokeCraftInventorySeed = {
  venueId: 'demo-venue-001',
  updatedAt: new Date().toISOString(),

  items: [
    {
      id: 'padron-1964',
      name: 'Padron 1964 Anniversary',
      type: 'cigar',
      source: 'venue',
      partnerId: null,
      quantityAvailable: 20,
      quantityReserved: 0,
      quantitySold: 0,
      lowInventoryThreshold: 5,
      status: 'available',
      allowOversell: false,
    },
    {
      id: 'old-fashioned',
      name: 'Old Fashioned',
      type: 'drink',
      source: 'venue',
      partnerId: null,
      quantityAvailable: 18,
      quantityReserved: 0,
      quantitySold: 0,
      lowInventoryThreshold: 4,
      status: 'available',
      allowOversell: false,
    },
    {
      id: 'smoked-wings',
      name: 'Smoked Wings',
      type: 'partner_food',
      source: 'partner_network',
      partnerId: 'smokehouse-bites',
      quantityAvailable: 12,
      quantityReserved: 0,
      quantitySold: 0,
      lowInventoryThreshold: 3,
      status: 'available',
      allowOversell: false,
    },
    {
      id: 'loaded-brisket-fries',
      name: 'Loaded Brisket Fries',
      type: 'partner_food',
      source: 'partner_network',
      partnerId: 'smokehouse-bites',
      quantityAvailable: 7,
      quantityReserved: 0,
      quantitySold: 0,
      lowInventoryThreshold: 3,
      status: 'available',
      allowOversell: false,
    },
  ],
}

export function getInventoryStatus(item) {
  if (!item) return 'hidden'
  if (item.status === 'paused' || item.status === 'hidden') return item.status
  if (item.quantityAvailable <= 0) return 'sold_out'
  if (item.quantityAvailable <= item.lowInventoryThreshold) return 'low_stock'
  return 'available'
}
