/**
 * POS360 Phase 4.9 — Floor Object Library + Venue Customization + Systems
 * Setup demo/seed data. All local-only; no backend exists for venue theming,
 * image storage, inventory provider sync, network telemetry, or device
 * registries yet — see venueSystemsService.js for the local-state layer.
 */

/** Floor Object Library — realistic furniture/zone types for the layout editor. */
export const FLOOR_OBJECT_TYPES = [
  { type: 'tabletop',        label: 'Tabletop',          icon: 'crop_square',      seats: 2, shape: 'square',  defaultSize: 56 },
  { type: 'roundTable',      label: 'Round Table',       icon: 'circle',           seats: 4, shape: 'round',   defaultSize: 64 },
  { type: 'rectangleTable',  label: 'Rectangle Table',   icon: 'rectangle',        seats: 6, shape: 'rect',    defaultSize: 80 },
  { type: 'highTop',         label: 'High Top',          icon: 'table_bar',        seats: 2, shape: 'round',   defaultSize: 46 },
  { type: 'booth',           label: 'Booth',             icon: 'weekend',          seats: 6, shape: 'booth',   defaultSize: 86 },
  { type: 'loungeChair',     label: 'Lounge Chair',      icon: 'chair',            seats: 1, shape: 'chair',   defaultSize: 42 },
  { type: 'sofa',            label: 'Sofa',              icon: 'living',           seats: 3, shape: 'booth',   defaultSize: 92 },
  { type: 'barStool',        label: 'Bar Stool',         icon: 'event_seat',       seats: 1, shape: 'round',   defaultSize: 34 },
  { type: 'vipSeat',         label: 'VIP Seat',          icon: 'workspace_premium', seats: 4, shape: 'round',  defaultSize: 70, vip: true },
  { type: 'patioSet',        label: 'Patio Set',         icon: 'deck',             seats: 4, shape: 'round',   defaultSize: 64 },
  { type: 'firepitSet',      label: 'Firepit Set',       icon: 'local_fire_department', seats: 6, shape: 'round', defaultSize: 90 },
  { type: 'hostStand',       label: 'Host Stand',        icon: 'storefront',       seats: 0, shape: 'square',  defaultSize: 48 },
  { type: 'serviceStation',  label: 'Service Station',   icon: 'kitchen',          seats: 0, shape: 'rect',    defaultSize: 70 },
  { type: 'humidorStation',  label: 'Humidor Station',   icon: 'inventory_2',      seats: 0, shape: 'rect',    defaultSize: 70 },
  { type: 'barZone',         label: 'Bar Zone',          icon: 'local_bar',        seats: 0, shape: 'rect',    defaultSize: 96 },
]
export const FLOOR_OBJECT_TYPE_MAP = Object.fromEntries(FLOOR_OBJECT_TYPES.map((o) => [o.type, o]))

/** Seed floor objects (non-table furniture) shown alongside POS3_TABLES on the floor canvas. Local-only. */
export const SEED_FLOOR_OBJECTS = [
  { id: 'FO1', objectType: 'loungeChair', section: 'Lounge', seats: 1, status: 'open', x: 14, y: 70, rotation: 0, locked: false, vip: false },
  { id: 'FO2', objectType: 'sofa',        section: 'Lounge', seats: 3, status: 'open', x: 28, y: 70, rotation: 0, locked: false, vip: false },
  { id: 'FO3', objectType: 'barStool',    section: 'Bar',    seats: 1, status: 'open', x: 60, y: 18, rotation: 0, locked: false, vip: false },
  { id: 'FO4', objectType: 'barStool',    section: 'Bar',    seats: 1, status: 'open', x: 68, y: 18, rotation: 0, locked: false, vip: false },
  { id: 'FO5', objectType: 'vipSeat',     section: 'Lounge', seats: 4, status: 'occupied', x: 84, y: 60, rotation: 0, locked: false, vip: true },
  { id: 'FO6', objectType: 'serviceStation', section: 'Lounge', seats: 0, status: 'open', x: 4, y: 8, rotation: 0, locked: true, vip: false },
  { id: 'FO7', objectType: 'hostStand',   section: 'Patio',  seats: 0, status: 'open', x: 6, y: 10, rotation: 0, locked: true, vip: false },
]

/** Floor Plan area types — selectable venue layout modes. */
export const FLOOR_PLAN_AREA_TYPES = [
  { areaType: 'lounge',  label: 'Lounge Floor',    icon: 'weekend' },
  { areaType: 'patio',   label: 'Patio',           icon: 'deck' },
  { areaType: 'bar',     label: 'Bar',             icon: 'local_bar' },
  { areaType: 'vip',     label: 'VIP Room',        icon: 'workspace_premium' },
  { areaType: 'private', label: 'Private Dining',  icon: 'dining' },
  { areaType: 'rooftop', label: 'Rooftop',         icon: 'roofing' },
  { areaType: 'event',   label: 'Event Setup',     icon: 'celebration' },
  { areaType: 'humidor', label: 'Humidor Area',    icon: 'inventory_2' },
  { areaType: 'custom',  label: 'Custom Layout',   icon: 'dashboard_customize' },
]
export const FLOOR_PLAN_AREA_MAP = Object.fromEntries(FLOOR_PLAN_AREA_TYPES.map((a) => [a.areaType, a]))

/**
 * Seed Venue Floor Plans — VenueFloorPlan { id, name, areaType, backgroundImage, active, createdAt, updatedAt }.
 * "Lounge Floor" ships with the approved real reference image as its background; "Bar" and "Humidor Area" reuse
 * real uploaded venue photos already used elsewhere in the app. Layouts with no matching real asset ship with
 * backgroundImage: null and render a clearly-labeled local/demo placeholder instead of a fake CSS floor map.
 */
export const SEED_FLOOR_PLANS = [
  { id: 'FP-LOUNGE', name: 'Lounge Floor', areaType: 'lounge', backgroundImage: '/pos360-floor-canvas-reference.png', locked: false, active: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'FP-PATIO',  name: 'Patio',        areaType: 'patio',  backgroundImage: null, locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'FP-BAR',    name: 'Bar',          areaType: 'bar',    backgroundImage: '/pourcraft.jpg', locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'FP-VIP',    name: 'VIP Room',     areaType: 'vip',    backgroundImage: null, locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'FP-PRIVATE', name: 'Private Dining', areaType: 'private', backgroundImage: null, locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'FP-ROOFTOP', name: 'Rooftop',     areaType: 'rooftop', backgroundImage: null, locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'FP-EVENT',  name: 'Event Setup',  areaType: 'event',  backgroundImage: null, locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'FP-HUMIDOR', name: 'Humidor Area', areaType: 'humidor', backgroundImage: '/humidor match11.png', locked: false, active: false, createdAt: Date.now(), updatedAt: Date.now() },
]

/** Venue Customization — theme presets. Local/demo until venue settings backend is connected. */
export const THEME_PRESETS = [
  { id: 'ivoryGold',  label: 'Ivory Gold',   accent: '#c9952c', rail: '#13294b', base: '#f7f3ea' },
  { id: 'navyGold',   label: 'Navy Gold',    accent: '#c9952c', rail: '#0e2040', base: '#eef1f6' },
  { id: 'slateBlue',  label: 'Slate Blue',   accent: '#3a6ea8', rail: '#1c3a64', base: '#f3f6fa' },
  { id: 'loungeWarm', label: 'Lounge Warm',  accent: '#b06a2c', rail: '#2b1f14', base: '#f8efe2' },
  { id: 'patioLight', label: 'Patio Light',  accent: '#2f9e5b', rail: '#13294b', base: '#f5f8f1' },
  { id: 'highContrast', label: 'High Contrast', accent: '#c9952c', rail: '#000000', base: '#ffffff' },
]

export const DEFAULT_VENUE_THEME = {
  presetId: 'ivoryGold', cardDensity: 'comfortable', fontSize: 'standard', touchTargetSize: 'large',
  hapticStrength: 'medium', animationLevel: 'full', highContrast: false,
}

/** Venue image areas — local preview only, no upload backend yet. */
export const VENUE_IMAGE_AREAS = [
  { id: 'loungeFloor',  label: 'Lounge Floor Background' },
  { id: 'patioFloor',   label: 'Patio Floor Background' },
  { id: 'barArea',      label: 'Bar Area' },
  { id: 'humidorArea',  label: 'Humidor Area' },
  { id: 'privateDining', label: 'Private Dining' },
  { id: 'rooftop',      label: 'Rooftop' },
  { id: 'eventSpace',   label: 'Event Space' },
  { id: 'brandLogo',    label: 'Brand Logo' },
  { id: 'heroImage',    label: 'Venue Hero Image' },
]

/** Inventory Connection — demo provider/category state. No backend provider connection exists yet. */
export const INVENTORY_CONNECTIONS = [
  { id: 'food',    label: 'Food Inventory',    connected: true,  provider: 'MarginEdge (demo)', lowStock: 2, items: 184 },
  { id: 'liquor',  label: 'Liquor Inventory',   connected: true,  provider: 'BinWise (demo)',    lowStock: 1, items: 96 },
  { id: 'humidor', label: 'Humidor / Cigar',    connected: true,  provider: 'Local POS360',      lowStock: 3, items: 58 },
  { id: 'wine',    label: 'Wine Cellar',        connected: false, provider: 'Not connected',     lowStock: 0, items: 0 },
  { id: 'merch',   label: 'Merch Inventory',    connected: false, provider: 'Not connected',     lowStock: 0, items: 0 },
  { id: 'event',   label: 'Event Inventory',    connected: false, provider: 'Not connected',     lowStock: 0, items: 0 },
]

/** Network / Wi-Fi — demo telemetry. No real device/network API connected yet. */
export const NETWORK_STATUS = {
  ssid: 'TheVaultLounge-Ops', status: 'online', latencyMs: 28, syncQueue: 0,
}

/** Connected device registry — demo telemetry. No real device-management API connected yet. */
export const CONNECTED_DEVICES = [
  { id: 'D1', name: 'Host Tablet 1',     role: 'POS Tablet',       location: 'Front Host Stand', online: true,  signal: 'strong', battery: 86, lastSync: '2 min ago', owner: 'Jordan Smith' },
  { id: 'D2', name: 'Handheld 3',        role: 'Handheld POS',     location: 'Lounge Floor',      online: true,  signal: 'strong', battery: 61, lastSync: '1 min ago', owner: 'Mara Lopez' },
  { id: 'D3', name: 'Kitchen Display A',  role: 'Kitchen Display',  location: 'Kitchen',           online: true,  signal: 'weak',   battery: null, lastSync: '4 min ago', owner: null },
  { id: 'D4', name: 'Bar Display 1',      role: 'Bar Display',      location: 'Main Bar',          online: true,  signal: 'strong', battery: null, lastSync: '1 min ago', owner: null },
  { id: 'D5', name: 'Humidor Station',    role: 'Humidor Station',  location: 'Humidor',           online: false, signal: 'offline', battery: null, lastSync: '38 min ago', owner: null },
  { id: 'D6', name: 'Payment Terminal 2', role: 'Payment Terminal', location: 'Bar',               online: true,  signal: 'strong', battery: null, lastSync: 'just now', owner: null },
  { id: 'D7', name: 'Router — Main',      role: 'Router / Gateway', location: 'Network Closet',    online: true,  signal: 'strong', battery: null, lastSync: 'just now', owner: null },
]
