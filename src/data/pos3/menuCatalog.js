/**
 * POS 3 premium cigar lounge menu catalog — used by the touchscreen
 * ordering flow (POS3Handheld). Distinct from src/data/pos3/seedData.js's
 * POS3_MENU (kept for backward compatibility with existing tickets/orders
 * pages); this catalog adds richer structure (modifiers, destinations,
 * inventory SKUs, tax/age-restriction flags) needed by orderService.
 *
 * destination routes an item to a fulfillment station:
 *   kitchen | bar | humidor | retail
 */

export const MENU_CATEGORIES = ['Cigars', 'Food', 'Bar', 'Non-Alcohol Drinks', 'Lounge Services', 'Retail']

export const MENU_CATALOG = [
  // ── Cigars → humidor ──────────────────────────────────────────
  {
    id: 'cig_padron64',
    name: 'Padrón 1964 Anniversary Maduro',
    category: 'Cigars',
    price: 32.0,
    destination: 'humidor',
    modifiers: [
      { id: 'mod_torpedo', label: 'Torpedo', priceDelta: 0 },
      { id: 'mod_robusto', label: 'Robusto', priceDelta: -3 },
    ],
    inventorySku: 'SKU-CIG-PAD64MAD',
    taxable: true,
    ageRestricted: true,
  },
  {
    id: 'cig_opusx',
    name: 'Arturo Fuente OpusX Robusto',
    category: 'Cigars',
    price: 45.0,
    destination: 'humidor',
    modifiers: [],
    inventorySku: 'SKU-CIG-OPUSXROB',
    taxable: true,
    ageRestricted: true,
  },
  {
    id: 'cig_churchill',
    name: 'Hand-Rolled Churchill Reserve',
    category: 'Cigars',
    price: 24.0,
    destination: 'humidor',
    modifiers: [
      { id: 'mod_natural', label: 'Natural Wrapper', priceDelta: 0 },
      { id: 'mod_maduro', label: 'Maduro Wrapper', priceDelta: 2 },
    ],
    inventorySku: 'SKU-CIG-CHURCHRES',
    taxable: true,
    ageRestricted: true,
  },
  {
    id: 'cig_oliva_v',
    name: 'Oliva Serie V Melanio Toro',
    category: 'Cigars',
    price: 18.0,
    destination: 'humidor',
    modifiers: [],
    inventorySku: 'SKU-CIG-OLIVAVMEL',
    taxable: true,
    ageRestricted: true,
  },
  {
    id: 'cig_cutter',
    name: 'Cedar Cigar Cutter',
    category: 'Cigars',
    price: 12.0,
    destination: 'retail',
    modifiers: [],
    inventorySku: 'SKU-RET-CEDARCUT',
    taxable: true,
    ageRestricted: false,
  },

  // ── Food → kitchen ────────────────────────────────────────────
  {
    id: 'food_ribeye',
    name: 'Wagyu Ribeye, Medium Rare',
    category: 'Food',
    price: 68.0,
    destination: 'kitchen',
    modifiers: [
      { id: 'mod_temp_rare', label: 'Rare', priceDelta: 0 },
      { id: 'mod_temp_med', label: 'Medium', priceDelta: 0 },
      { id: 'mod_temp_well', label: 'Well Done', priceDelta: 0 },
    ],
    inventorySku: 'SKU-FOOD-WAGYURIB',
    taxable: true,
    ageRestricted: false,
  },
  {
    id: 'food_charcuterie',
    name: 'Chef’s Charcuterie & Cheese Board',
    category: 'Food',
    price: 26.0,
    destination: 'kitchen',
    modifiers: [
      { id: 'mod_add_truffle', label: 'Add Truffle Honey', priceDelta: 4 },
    ],
    inventorySku: 'SKU-FOOD-CHARCBOARD',
    taxable: true,
    ageRestricted: false,
  },
  {
    id: 'food_caesar',
    name: 'Lounge Caesar Salad',
    category: 'Food',
    price: 14.0,
    destination: 'kitchen',
    modifiers: [
      { id: 'mod_add_anchovy', label: 'Add Anchovy', priceDelta: 2 },
      { id: 'mod_add_chicken', label: 'Add Grilled Chicken', priceDelta: 6 },
    ],
    inventorySku: 'SKU-FOOD-CAESARLNG',
    taxable: true,
    ageRestricted: false,
  },
  {
    id: 'food_sliders',
    name: 'Bourbon-Glazed Short Rib Sliders',
    category: 'Food',
    price: 19.0,
    destination: 'kitchen',
    modifiers: [],
    inventorySku: 'SKU-FOOD-RIBSLIDER',
    taxable: true,
    ageRestricted: false,
  },

  // ── Bar → bar (liquor items age-restricted) ──────────────────
  {
    id: 'bar_macallan18',
    name: 'Macallan 18 Year',
    category: 'Bar',
    price: 42.0,
    destination: 'bar',
    modifiers: [
      { id: 'mod_neat', label: 'Neat', priceDelta: 0 },
      { id: 'mod_rocks', label: 'On the Rocks', priceDelta: 0 },
    ],
    inventorySku: 'SKU-BAR-MAC18',
    taxable: true,
    ageRestricted: true,
  },
  {
    id: 'bar_oldfashioned',
    name: 'Barrel-Aged Old Fashioned',
    category: 'Bar',
    price: 16.0,
    destination: 'bar',
    modifiers: [
      { id: 'mod_rye', label: 'Rye', priceDelta: 0 },
      { id: 'mod_bourbon', label: 'Bourbon', priceDelta: 0 },
    ],
    inventorySku: 'SKU-BAR-OLDFASH',
    taxable: true,
    ageRestricted: true,
  },
  {
    id: 'bar_negroni',
    name: 'Classic Negroni',
    category: 'Bar',
    price: 15.0,
    destination: 'bar',
    modifiers: [],
    inventorySku: 'SKU-BAR-NEGRONI',
    taxable: true,
    ageRestricted: true,
  },
  {
    id: 'bar_cab',
    name: 'Cabernet Sauvignon, Reserve Pour',
    category: 'Bar',
    price: 22.0,
    destination: 'bar',
    modifiers: [],
    inventorySku: 'SKU-BAR-CABRES',
    taxable: true,
    ageRestricted: true,
  },

  // ── Non-Alcohol Drinks → bar ──────────────────────────────────
  {
    id: 'na_pellegrino',
    name: 'San Pellegrino',
    category: 'Non-Alcohol Drinks',
    price: 6.0,
    destination: 'bar',
    modifiers: [],
    inventorySku: 'SKU-NA-PELLEGRINO',
    taxable: true,
    ageRestricted: false,
  },
  {
    id: 'na_espresso',
    name: 'Espresso, Double Shot',
    category: 'Non-Alcohol Drinks',
    price: 5.0,
    destination: 'bar',
    modifiers: [],
    inventorySku: 'SKU-NA-ESPRESSO',
    taxable: true,
    ageRestricted: false,
  },
  {
    id: 'na_lemonade',
    name: 'House Lavender Lemonade',
    category: 'Non-Alcohol Drinks',
    price: 7.0,
    destination: 'bar',
    modifiers: [],
    inventorySku: 'SKU-NA-LAVLEMON',
    taxable: true,
    ageRestricted: false,
  },

  // ── Lounge Services → retail ──────────────────────────────────
  {
    id: 'svc_privatehour',
    name: 'Private Lounge Hour',
    category: 'Lounge Services',
    price: 85.0,
    destination: 'retail',
    modifiers: [],
    inventorySku: 'SKU-SVC-PRIVHOUR',
    taxable: false,
    ageRestricted: false,
  },
  {
    id: 'svc_humidorlocker',
    name: 'Monthly Humidor Locker Rental',
    category: 'Lounge Services',
    price: 45.0,
    destination: 'retail',
    modifiers: [],
    inventorySku: 'SKU-SVC-HUMLOCKER',
    taxable: false,
    ageRestricted: false,
  },
  {
    id: 'svc_shoeshine',
    name: 'Lounge Shoeshine Service',
    category: 'Lounge Services',
    price: 15.0,
    destination: 'retail',
    modifiers: [],
    inventorySku: 'SKU-SVC-SHOESHINE',
    taxable: true,
    ageRestricted: false,
  },

  // ── Retail → retail ────────────────────────────────────────────
  {
    id: 'ret_lighter',
    name: 'S.T. Dupont Table Lighter',
    category: 'Retail',
    price: 95.0,
    destination: 'retail',
    modifiers: [],
    inventorySku: 'SKU-RET-DUPONTLITE',
    taxable: true,
    ageRestricted: false,
  },
  {
    id: 'ret_case',
    name: 'Leather Travel Cigar Case',
    category: 'Retail',
    price: 65.0,
    destination: 'retail',
    modifiers: [],
    inventorySku: 'SKU-RET-LEATHCASE',
    taxable: true,
    ageRestricted: false,
  },
  {
    id: 'ret_humidorbox',
    name: 'Spanish Cedar Humidor Box',
    category: 'Retail',
    price: 140.0,
    destination: 'retail',
    modifiers: [],
    inventorySku: 'SKU-RET-CEDARHUMBOX',
    taxable: true,
    ageRestricted: false,
  },
]

export function getMenuCatalog() { return MENU_CATALOG }
export function getCatalogItem(id) { return MENU_CATALOG.find((m) => m.id === id) || null }
export function getCatalogByCategory(category) { return MENU_CATALOG.filter((m) => m.category === category) }
