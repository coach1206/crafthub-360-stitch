/**
 * Prototype Provider — Phase 9
 * Fully functional demo data for the NOVEE Grand Lounge.
 * Returns realistic hospitality data. No API calls. No credentials needed.
 */

import {
  normalizeOrder         as _normalizeOrder,
  normalizeMenuItem      as _normalizeMenuItem,
  normalizeInventoryItem as _normalizeInventoryItem,
  normalizeTable         as _normalizeTable,
  normalizeStaffMember   as _normalizeStaffMember,
} from '../pos3Normalizer.js'

const PROVIDER = 'prototype'

// ── Static demo data ─────────────────────────────────────────

const RAW_MENU = [
  { id: 'ci-001', name: 'Arturo Fuente Opus X Belicoso',        category: 'Premium Cigars', subcategory: 'Dominican',   price: 62,  tags: ['full-body','earthy','cedar'],         available: true,  inventoryCount: 3  },
  { id: 'ci-002', name: 'Padron 1964 Anniversary Exclusivo',    category: 'Premium Cigars', subcategory: 'Nicaraguan',  price: 42,  tags: ['medium-body','chocolate','spice'],    available: true,  inventoryCount: 8  },
  { id: 'ci-003', name: 'Cohiba Behike 52',                     category: 'Premium Cigars', subcategory: 'Cuban',       price: 85,  tags: ['full-body','cream','wood'],           available: true,  inventoryCount: 2  },
  { id: 'ci-004', name: 'Romeo y Julieta Reserva Real Robusto', category: 'Premium Cigars', subcategory: 'Dominican',   price: 34,  tags: ['medium-body','coffee','floral'],      available: true,  inventoryCount: 12 },
  { id: 'ci-005', name: 'Rocky Patel Vintage 1992 Churchill',   category: 'Premium Cigars', subcategory: 'Honduran',    price: 38,  tags: ['medium-full','leather','pepper'],     available: true,  inventoryCount: 7  },
  { id: 'bo-001', name: "Pappy Van Winkle 15yr",                category: 'Bourbon',        subcategory: 'Kentucky',    price: 95,  tags: ['vanilla','caramel','oak'],            available: true,  inventoryCount: 4  },
  { id: 'bo-002', name: "Blanton's Original Single Barrel",     category: 'Bourbon',        subcategory: 'Kentucky',    price: 26,  tags: ['honey','citrus','warm-spice'],        available: true,  inventoryCount: 32 },
  { id: 'bo-003', name: 'Buffalo Trace',                        category: 'Bourbon',        subcategory: 'Kentucky',    price: 18,  tags: ['vanilla','toffee','mint'],            available: true,  inventoryCount: 48 },
  { id: 'bo-004', name: 'Woodford Reserve Double Oaked',        category: 'Bourbon',        subcategory: 'Kentucky',    price: 22,  tags: ['cherry','chocolate','toasted-oak'],   available: true,  inventoryCount: 24 },
  { id: 'wh-001', name: 'Macallan 18yr Sherry Oak',            category: 'Whiskey',        subcategory: 'Scotch',      price: 85,  tags: ['dried-fruit','spice','sherry'],       available: true,  inventoryCount: 6  },
  { id: 'wh-002', name: 'Glenfiddich 21yr Caribbean Rum Cask', category: 'Whiskey',        subcategory: 'Scotch',      price: 62,  tags: ['toffee','rum','exotic-wood'],         available: true,  inventoryCount: 10 },
  { id: 'wh-003', name: 'Lagavulin 16yr',                      category: 'Whiskey',        subcategory: 'Islay',       price: 48,  tags: ['peat','smoke','iodine'],              available: true,  inventoryCount: 14 },
  { id: 'co-001', name: 'The House Manhattan',                  category: 'Cocktails',      subcategory: 'Stirred',     price: 24,  tags: ['rye','sweet','cherry'],               available: true,  inventoryCount: null },
  { id: 'co-002', name: 'Lounge Old Fashioned',                 category: 'Cocktails',      subcategory: 'Stirred',     price: 22,  tags: ['bourbon','bitters','orange'],         available: true,  inventoryCount: null },
  { id: 'co-003', name: 'Smoke & Honey Mezcal',                 category: 'Cocktails',      subcategory: 'Shaken',      price: 28,  tags: ['mezcal','honey','smoke'],             available: true,  inventoryCount: null },
  { id: 'co-004', name: 'Velvet Sazerac',                       category: 'Cocktails',      subcategory: 'Stirred',     price: 26,  tags: ['rye','absinthe','bitters'],           available: true,  inventoryCount: null },
  { id: 'fp-001', name: 'Wagyu Charcuterie Board',              category: 'Small Plates',   subcategory: 'Shared',      price: 42,  tags: ['wagyu','truffle','paired'],           available: true,  inventoryCount: 5  },
  { id: 'fp-002', name: 'Black Truffle Crostini',               category: 'Small Plates',   subcategory: 'Shared',      price: 28,  tags: ['truffle','brioche','ricotta'],        available: true,  inventoryCount: 9  },
  { id: 'vp-001', name: 'Opus X + Pappy 15yr Pairing',         category: 'VIP Pairings',   subcategory: 'Cigar+Spirit', price: 149, tags: ['vip','featured','pairing'],          available: true,  inventoryCount: 3  },
  { id: 'vp-002', name: 'Cohiba Behike + Macallan Flight',      category: 'VIP Pairings',   subcategory: 'Cigar+Spirit', price: 168, tags: ['vip','featured','flight'],           available: true,  inventoryCount: 2  },
]

const RAW_STAFF = [
  { id: 'st-001', displayName: 'Marcus Chen',     role: 'Head Barman',         active: true, assignedZone: 'Bar'         },
  { id: 'st-002', displayName: 'Sofia Reyes',     role: 'Floor Manager',       active: true, assignedZone: 'Main Lounge' },
  { id: 'st-003', displayName: 'James Whitfield', role: 'Cigar Sommelier',     active: true, assignedZone: 'VIP Alcove'  },
  { id: 'st-004', displayName: 'Aisha Okafor',    role: 'Cocktail Specialist', active: true, assignedZone: 'Patio'       },
]

const RAW_TABLES = [
  { id: 'T01', tableNumber: 'T01', zone: 'Main Lounge', seats: 4, status: 'available', assignedStaffId: 'st-002', activeOrderId: null      },
  { id: 'T02', tableNumber: 'T02', zone: 'Main Lounge', seats: 4, status: 'available', assignedStaffId: 'st-002', activeOrderId: null      },
  { id: 'T03', tableNumber: 'T03', zone: 'Main Lounge', seats: 4, status: 'occupied',  assignedStaffId: 'st-002', activeOrderId: 'ord-001' },
  { id: 'T04', tableNumber: 'T04', zone: 'Main Lounge', seats: 4, status: 'occupied',  assignedStaffId: 'st-002', activeOrderId: 'ord-003' },
  { id: 'T05', tableNumber: 'T05', zone: 'Main Lounge', seats: 4, status: 'reserved',  assignedStaffId: 'st-002', activeOrderId: null      },
  { id: 'T06', tableNumber: 'T06', zone: 'Main Lounge', seats: 4, status: 'available', assignedStaffId: 'st-002', activeOrderId: null      },
  { id: 'B01', tableNumber: 'B01', zone: 'Bar',         seats: 2, status: 'occupied',  assignedStaffId: 'st-001', activeOrderId: 'ord-002' },
  { id: 'B02', tableNumber: 'B02', zone: 'Bar',         seats: 2, status: 'occupied',  assignedStaffId: 'st-001', activeOrderId: 'ord-002' },
  { id: 'B03', tableNumber: 'B03', zone: 'Bar',         seats: 3, status: 'available', assignedStaffId: 'st-001', activeOrderId: null      },
  { id: 'B04', tableNumber: 'B04', zone: 'Bar',         seats: 2, status: 'available', assignedStaffId: 'st-001', activeOrderId: null      },
  { id: 'P01', tableNumber: 'P01', zone: 'Patio',       seats: 4, status: 'occupied',  assignedStaffId: 'st-004', activeOrderId: 'ord-003' },
  { id: 'P02', tableNumber: 'P02', zone: 'Patio',       seats: 6, status: 'available', assignedStaffId: 'st-004', activeOrderId: null      },
  { id: 'VIP-01', tableNumber: 'VIP-01', zone: 'VIP Alcove', seats: 8, status: 'occupied', assignedStaffId: 'st-003', activeOrderId: 'ord-004' },
]

const RAW_ORDERS = [
  {
    id: 'ord-001', tableNumber: 'T03', staffId: 'st-002', staffName: 'Sofia Reyes',
    status: 'open',
    items: [
      { id: 'ci-005', name: 'Rocky Patel Vintage 1992 Churchill', qty: 1, price: 38 },
      { id: 'bo-002', name: "Blanton's Original Single Barrel",   qty: 2, price: 26 },
    ],
    subtotal: 90, tax: 8.10, total: 98.10, currency: 'USD', openedAt: ago(42),
  },
  {
    id: 'ord-002', tableNumber: 'B01–B02', staffId: 'st-001', staffName: 'Marcus Chen',
    status: 'open',
    items: [
      { id: 'co-001', name: 'The House Manhattan',   qty: 1, price: 24 },
      { id: 'fp-002', name: 'Black Truffle Crostini', qty: 1, price: 28 },
    ],
    subtotal: 52, tax: 4.68, total: 56.68, currency: 'USD', openedAt: ago(18),
  },
  {
    id: 'ord-003', tableNumber: 'P01', staffId: 'st-004', staffName: 'Aisha Okafor',
    status: 'open',
    items: [
      { id: 'wh-001', name: 'Macallan 18yr Sherry Oak', qty: 2, price: 85 },
      { id: 'fp-001', name: 'Wagyu Charcuterie Board',  qty: 1, price: 42 },
      { id: 'co-003', name: 'Smoke & Honey Mezcal',     qty: 2, price: 28 },
    ],
    subtotal: 268, tax: 24.12, total: 292.12, currency: 'USD', openedAt: ago(67),
  },
  {
    id: 'ord-004', tableNumber: 'VIP-01', staffId: 'st-003', staffName: 'James Whitfield',
    status: 'open',
    items: [
      { id: 'vp-001', name: 'Opus X + Pappy 15yr Pairing',       qty: 2, price: 149 },
      { id: 'vp-002', name: 'Cohiba Behike + Macallan Flight',    qty: 2, price: 168 },
      { id: 'bo-001', name: "Pappy Van Winkle 15yr",              qty: 2, price: 95  },
    ],
    subtotal: 824, tax: 74.16, total: 898.16, currency: 'USD', openedAt: ago(91),
  },
]

const RAW_INVENTORY = [
  { id: 'ci-001', name: 'Arturo Fuente Opus X Belicoso',    category: 'Premium Cigars', currentStock: 3,  lowStockThreshold: 5,  locationId: 'humidor-main' },
  { id: 'ci-002', name: 'Padron 1964 Anniversary Exclusivo',category: 'Premium Cigars', currentStock: 8,  lowStockThreshold: 5,  locationId: 'humidor-main' },
  { id: 'ci-003', name: 'Cohiba Behike 52',                 category: 'Premium Cigars', currentStock: 2,  lowStockThreshold: 3,  locationId: 'humidor-vip'  },
  { id: 'ci-004', name: 'Romeo y Julieta Reserva Real',     category: 'Premium Cigars', currentStock: 12, lowStockThreshold: 5,  locationId: 'humidor-main' },
  { id: 'ci-005', name: 'Rocky Patel Vintage 1992',         category: 'Premium Cigars', currentStock: 7,  lowStockThreshold: 4,  locationId: 'humidor-main' },
  { id: 'bo-001', name: "Pappy Van Winkle 15yr",            category: 'Bourbon',        currentStock: 4,  lowStockThreshold: 4,  locationId: 'spirits-bar'  },
  { id: 'bo-002', name: "Blanton's Single Barrel",          category: 'Bourbon',        currentStock: 32, lowStockThreshold: 8,  locationId: 'spirits-bar'  },
  { id: 'bo-003', name: 'Buffalo Trace',                    category: 'Bourbon',        currentStock: 48, lowStockThreshold: 12, locationId: 'spirits-bar'  },
  { id: 'bo-004', name: 'Woodford Reserve Double Oaked',    category: 'Bourbon',        currentStock: 24, lowStockThreshold: 8,  locationId: 'spirits-bar'  },
  { id: 'wh-001', name: 'Macallan 18yr Sherry Oak',        category: 'Whiskey',        currentStock: 6,  lowStockThreshold: 6,  locationId: 'spirits-bar'  },
  { id: 'wh-002', name: 'Glenfiddich 21yr',                category: 'Whiskey',        currentStock: 10, lowStockThreshold: 6,  locationId: 'spirits-bar'  },
  { id: 'wh-003', name: 'Lagavulin 16yr',                  category: 'Whiskey',        currentStock: 14, lowStockThreshold: 6,  locationId: 'spirits-bar'  },
  { id: 'fp-001', name: 'Wagyu Charcuterie Board',         category: 'Small Plates',   currentStock: 5,  lowStockThreshold: 4,  locationId: 'kitchen'      },
  { id: 'fp-002', name: 'Black Truffle Crostini',          category: 'Small Plates',   currentStock: 9,  lowStockThreshold: 4,  locationId: 'kitchen'      },
  { id: 'vp-001', name: 'Opus X + Pappy Pairing',         category: 'VIP Pairings',   currentStock: 3,  lowStockThreshold: 3,  locationId: 'humidor-vip'  },
  { id: 'vp-002', name: 'Cohiba Behike + Macallan Flight',category: 'VIP Pairings',   currentStock: 2,  lowStockThreshold: 3,  locationId: 'humidor-vip'  },
]

const LOCATIONS = [
  { id: 'loc-main',  name: 'Main Lounge', address: '1 Novee Grand Plaza', timezone: 'America/New_York' },
  { id: 'loc-bar',   name: 'Bar',         address: '1 Novee Grand Plaza', timezone: 'America/New_York' },
  { id: 'loc-patio', name: 'Patio',       address: '1 Novee Grand Plaza', timezone: 'America/New_York' },
  { id: 'loc-vip',   name: 'VIP Alcove',  address: '1 Novee Grand Plaza', timezone: 'America/New_York' },
]

// ── Adapter interface (exported functions) ────────────────────

export const getProviderName     = () => 'NOVEE Prototype'

export const getConnectionStatus = () => ({
  success:    true,
  provider:   PROVIDER,
  mode:       'prototype',
  liveReady:  true,
  connected:  true,
  lastSyncAt: new Date().toISOString(),
  message:    'Prototype provider active — no credentials required',
})

export const validateCredentials = () => ({
  success: true, provider: PROVIDER, mode: 'prototype', valid: true,
})

export const fetchLocations = () => ({
  success: true, provider: PROVIDER, locations: LOCATIONS,
})

export const fetchMenus = () => ({
  success: true,
  provider: PROVIDER,
  items: RAW_MENU.map(i => _normalizeMenuItem(i, PROVIDER)),
})

export const fetchInventory = () => ({
  success:        true,
  provider:       PROVIDER,
  inventory:      RAW_INVENTORY.map(i => _normalizeInventoryItem(i, PROVIDER)),
  lowStockCount:  RAW_INVENTORY.filter(i => i.currentStock <= i.lowStockThreshold).length,
})

export const fetchActiveOrders = () => ({
  success:  true,
  provider: PROVIDER,
  orders:   RAW_ORDERS.map(o => _normalizeOrder(o, PROVIDER)),
  count:    RAW_ORDERS.length,
})

export const fetchOrderById = (orderId) => {
  const raw = RAW_ORDERS.find(o => o.id === orderId)
  if (!raw) return { success: false, provider: PROVIDER, message: `Order ${orderId} not found` }
  return { success: true, provider: PROVIDER, order: _normalizeOrder(raw, PROVIDER) }
}

export const fetchTables = () => ({
  success:        true,
  provider:       PROVIDER,
  tables:         RAW_TABLES.map(t => _normalizeTable(t, PROVIDER)),
  occupiedCount:  RAW_TABLES.filter(t => t.status === 'occupied').length,
  availableCount: RAW_TABLES.filter(t => t.status === 'available').length,
})

export const fetchStaff = () => ({
  success:      true,
  provider:     PROVIDER,
  staff:        RAW_STAFF.map(s => _normalizeStaffMember(s, PROVIDER)),
  onShiftCount: RAW_STAFF.filter(s => s.active).length,
})

export const pushGuestSignal = (payload) => ({
  success: true, provider: PROVIDER, mode: 'prototype', received: true, sessionId: payload.sessionId || null,
})

export const pushPairingRecommendation = (payload) => ({
  success: true, provider: PROVIDER, mode: 'prototype', delivered: true,
  recommendationId: `rec-${Date.now()}`, payload,
})

export const pushUpsellRecommendation = (payload) => ({
  success: true, provider: PROVIDER, mode: 'prototype', delivered: true,
  recommendationId: `upsell-${Date.now()}`, payload,
})

export const receiveWebhook = (payload, _headers) => ({
  success: true, provider: PROVIDER, mode: 'prototype', processed: true,
  eventType: payload.type || 'prototype.event', payload,
})

export const normalizeOrder         = (raw) => _normalizeOrder(raw, PROVIDER)
export const normalizeMenuItem      = (raw) => _normalizeMenuItem(raw, PROVIDER)
export const normalizeInventoryItem = (raw) => _normalizeInventoryItem(raw, PROVIDER)
export const normalizeStaffMember   = (raw) => _normalizeStaffMember(raw, PROVIDER)
export const normalizeTable         = (raw) => _normalizeTable(raw, PROVIDER)

// ── Helpers ───────────────────────────────────────────────────
function ago(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}
