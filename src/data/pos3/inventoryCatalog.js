/**
 * POS 3 Inventory Catalog — per-SKU stock levels backing
 * inventoryAvailabilityService.js. Seeds localStorage on first run.
 */

export const INVENTORY_CATALOG = [
  { sku: 'SKU-CIG-PAD64MAD', name: 'Padrón 1964 Anniversary Maduro', quantityOnHand: 15, parLevel: 15, unitCost: 18.0, reorderNeeded: false },
  { sku: 'SKU-CIG-OPUSXROB', name: 'Arturo Fuente OpusX Robusto', quantityOnHand: 3, parLevel: 12, unitCost: 24.0, reorderNeeded: true },
  { sku: 'SKU-CIG-CHURCHRES', name: 'Hand-Rolled Churchill Reserve', quantityOnHand: 18, parLevel: 18, unitCost: 12.0, reorderNeeded: false },
  { sku: 'SKU-CIG-OLIVAVMEL', name: 'Oliva Serie V Melanio Toro', quantityOnHand: 20, parLevel: 20, unitCost: 9.0, reorderNeeded: false },
  { sku: 'SKU-RET-CEDARCUT', name: 'Cedar Cigar Cutter', quantityOnHand: 10, parLevel: 10, unitCost: 4.0, reorderNeeded: false },
  { sku: 'SKU-FOOD-WAGYURIB', name: 'Wagyu Ribeye, Medium Rare', quantityOnHand: 12, parLevel: 12, unitCost: 32.0, reorderNeeded: false },
  { sku: 'SKU-FOOD-CHARCBOARD', name: "Chef's Charcuterie & Cheese Board", quantityOnHand: 16, parLevel: 16, unitCost: 11.0, reorderNeeded: false },
  { sku: 'SKU-FOOD-CAESARLNG', name: 'Lounge Caesar Salad', quantityOnHand: 2, parLevel: 18, unitCost: 5.0, reorderNeeded: true },
  { sku: 'SKU-FOOD-RIBSLIDER', name: 'Bourbon-Glazed Short Rib Sliders', quantityOnHand: 20, parLevel: 20, unitCost: 7.0, reorderNeeded: false },
  { sku: 'SKU-BAR-MAC18', name: 'Macallan 18 Year', quantityOnHand: 10, parLevel: 10, unitCost: 22.0, reorderNeeded: false },
  { sku: 'SKU-BAR-OLDFASH', name: 'Barrel-Aged Old Fashioned', quantityOnHand: 24, parLevel: 24, unitCost: 6.0, reorderNeeded: false },
  { sku: 'SKU-BAR-NEGRONI', name: 'Classic Negroni', quantityOnHand: 24, parLevel: 24, unitCost: 5.5, reorderNeeded: false },
  { sku: 'SKU-BAR-CABRES', name: 'Cabernet Sauvignon, Reserve Pour', quantityOnHand: 30, parLevel: 30, unitCost: 8.0, reorderNeeded: false },
  { sku: 'SKU-NA-PELLEGRINO', name: 'San Pellegrino', quantityOnHand: 30, parLevel: 30, unitCost: 2.0, reorderNeeded: false },
  { sku: 'SKU-NA-ESPRESSO', name: 'Espresso, Double Shot', quantityOnHand: 40, parLevel: 40, unitCost: 1.0, reorderNeeded: false },
  { sku: 'SKU-NA-LAVLEMON', name: 'House Lavender Lemonade', quantityOnHand: 24, parLevel: 24, unitCost: 2.5, reorderNeeded: false },
  { sku: 'SKU-SVC-PRIVHOUR', name: 'Private Lounge Hour', quantityOnHand: 8, parLevel: 8, unitCost: 0, reorderNeeded: false },
  { sku: 'SKU-SVC-HUMLOCKER', name: 'Monthly Humidor Locker Rental', quantityOnHand: 8, parLevel: 8, unitCost: 0, reorderNeeded: false },
  { sku: 'SKU-SVC-SHOESHINE', name: 'Lounge Shoeshine Service', quantityOnHand: 10, parLevel: 10, unitCost: 0, reorderNeeded: false },
  { sku: 'SKU-RET-DUPONTLITE', name: 'S.T. Dupont Table Lighter', quantityOnHand: 6, parLevel: 6, unitCost: 40.0, reorderNeeded: false },
  { sku: 'SKU-RET-LEATHCASE', name: 'Leather Travel Cigar Case', quantityOnHand: 8, parLevel: 8, unitCost: 28.0, reorderNeeded: false },
  { sku: 'SKU-RET-CEDARHUMBOX', name: 'Spanish Cedar Humidor Box', quantityOnHand: 6, parLevel: 6, unitCost: 60.0, reorderNeeded: false },
]

export function getInventoryCatalog() { return INVENTORY_CATALOG }
export function getInventoryCatalogItem(sku) { return INVENTORY_CATALOG.find((i) => i.sku === sku) || null }
