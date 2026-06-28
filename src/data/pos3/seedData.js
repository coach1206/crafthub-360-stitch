/**
 * POS 3 seed data — realistic but clearly DEMO data for the local-first
 * POS 3 prototype. Tables, tickets, menu items, staff.
 *
 * Routing stations: kitchen | bar | humidor
 */

export const POS3_STAFF = [
  { id: 'stf_jordan', name: 'Jordan Smith', role: 'Floor Supervisor', shift: 'PM', pinHint: '••••' },
  { id: 'stf_mara',   name: 'Mara Lopez',   role: 'Server',           shift: 'PM', pinHint: '••••' },
  { id: 'stf_dev',    name: 'Devon Park',   role: 'Bartender',        shift: 'PM', pinHint: '••••' },
]

/**
 * Layout sections available to the drag/drop floor planner (POS3 Tables +
 * E.A.T. Sections). x/y are percentage positions (0-100) within each
 * section's own canvas — independent per section so a table dragged in
 * Lounge has no effect on its position when viewed under Patio, etc.
 */
export const POS3_LAYOUT_SECTIONS = ['Lounge', 'Patio', 'Bar', 'VIP', 'Main Floor', 'Private Room']

/**
 * Venue table-management redesign (Phase 4): each table carries the richer
 * floor-plan/operations fields used by VenueTableObject + TableActionDrawer
 * (tableNumber, elapsedTime, reservationTime, serverName/serverInitials,
 * orderNumber, checkTotal, shape, needsService, vip) alongside the original
 * name/section/seats/guests/server/status/x/y fields, which stay populated
 * so POS3Home.jsx and POS3Handheld.jsx (out of this redesign's edit scope)
 * keep working unchanged. status values: open | seated | busy | reserved |
 * vip | needsService | cleaning.
 */
export const POS3_TABLES = [
  { id: 'T1', name: 'Table T1', tableNumber: 1, section: 'Lounge', seats: 4, status: 'open', guests: 0, server: null, serverName: null, serverInitials: null, shape: 'round', elapsedTime: null, reservationTime: null, orderNumber: null, checkTotal: null, needsService: false, vip: false, x: 18, y: 22 },
  { id: 'T2', name: 'Table T2', tableNumber: 2, section: 'Lounge', seats: 2, status: 'seated', guests: 2, server: 'Jordan Smith', serverName: 'Jordan Smith', serverInitials: 'JS', shape: 'booth', elapsedTime: '24m', reservationTime: null, orderNumber: 'TKT-1057', checkTotal: 186.62, needsService: false, vip: false, x: 60, y: 22 },
  { id: 'T3', name: 'Table T3', tableNumber: 3, section: 'Humidor', seats: 6, status: 'busy', guests: 5, server: 'Mara Lopez', serverName: 'Mara Lopez', serverInitials: 'ML', shape: 'rect', elapsedTime: '41m', reservationTime: null, orderNumber: null, checkTotal: null, needsService: false, vip: false, x: 30, y: 50 },
  { id: 'T4', name: 'Table T4', tableNumber: 4, section: 'Patio', seats: 4, status: 'open', guests: 0, server: null, serverName: null, serverInitials: null, shape: 'round', elapsedTime: null, reservationTime: null, orderNumber: null, checkTotal: null, needsService: false, vip: false, x: 20, y: 25 },
  { id: 'T5', name: 'Table T5', tableNumber: 5, section: 'Bar', seats: 8, status: 'busy', guests: 6, server: 'Devon Park', serverName: 'Devon Park', serverInitials: 'DP', shape: 'rect', elapsedTime: '12m', reservationTime: null, orderNumber: 'TKT-1058', checkTotal: 95.0, needsService: false, vip: false, x: 40, y: 30 },
  { id: 'T6', name: 'Table T6', tableNumber: 6, section: 'Patio', seats: 2, status: 'cleaning', guests: 0, server: null, serverName: null, serverInitials: null, shape: 'round', elapsedTime: null, reservationTime: null, orderNumber: null, checkTotal: null, needsService: true, vip: false, x: 62, y: 55 },
  { id: 'T7', name: 'Table T7', tableNumber: 7, section: 'VIP', seats: 6, status: 'reserved', guests: 4, server: 'Jordan Smith', serverName: 'Jordan Smith', serverInitials: 'JS', shape: 'booth', elapsedTime: null, reservationTime: '7:30 PM', orderNumber: null, checkTotal: null, needsService: false, vip: true, x: 25, y: 30 },
  { id: 'T8', name: 'Table T8', tableNumber: 8, section: 'VIP', seats: 4, status: 'needsService', guests: 2, server: 'Mara Lopez', serverName: 'Mara Lopez', serverInitials: 'ML', shape: 'rect', elapsedTime: '18m', reservationTime: null, orderNumber: null, checkTotal: null, needsService: true, vip: true, x: 65, y: 60 },
  { id: 'T9', name: 'Table T9', tableNumber: 9, section: 'Main Floor', seats: 4, status: 'open', guests: 0, server: null, serverName: null, serverInitials: null, shape: 'round', elapsedTime: null, reservationTime: null, orderNumber: null, checkTotal: null, needsService: false, vip: false, x: 22, y: 20 },
  { id: 'T10', name: 'Table T10', tableNumber: 10, section: 'Main Floor', seats: 4, status: 'seated', guests: 3, server: 'Devon Park', serverName: 'Devon Park', serverInitials: 'DP', shape: 'rect', elapsedTime: '6m', reservationTime: null, orderNumber: null, checkTotal: null, needsService: false, vip: false, x: 55, y: 45 },
  { id: 'T11', name: 'Table T11', tableNumber: 11, section: 'Private Room', seats: 10, status: 'reserved', guests: 8, server: 'Jordan Smith', serverName: 'Jordan Smith', serverInitials: 'JS', shape: 'booth', elapsedTime: null, reservationTime: '8:15 PM', orderNumber: null, checkTotal: null, needsService: false, vip: false, x: 35, y: 35 },
]

export const POS3_MENU = [
  // Food → kitchen
  { id: 'm_ribeye',  name: 'Wagyu Ribeye',       category: 'Food',   station: 'kitchen', price: 68.0, modifier: 'Medium Rare', image: '/assets/smokecraft/cigars/toro.jpg' },
  { id: 'm_caesar',  name: 'Caesar Salad',       category: 'Food',   station: 'kitchen', price: 14.0, modifier: 'Add Anchovy',  image: '/assets/smokecraft/cigars/robusto.jpg' },
  { id: 'm_charc',   name: 'Charcuterie Board',  category: 'Food',   station: 'kitchen', price: 26.0, modifier: 'Chef Select',  image: '/assets/smokecraft/cigars/corona.jpg' },
  // Drinks → bar
  { id: 'm_oldfash', name: 'Old Fashioned',      category: 'Drinks', station: 'bar',     price: 16.0, modifier: 'Rye',          image: '/assets/smokecraft/cigars/churchill.jpg' },
  { id: 'm_mac18',   name: 'Macallan 18 Year',   category: 'Drinks', station: 'bar',     price: 42.0, modifier: 'Neat',         image: '/assets/smokecraft/cigars/gordo.jpg' },
  { id: 'm_negroni', name: 'Negroni',            category: 'Drinks', station: 'bar',     price: 15.0, modifier: 'Classic',      image: '/assets/smokecraft/cigars/torpedo-figurado.jpg' },
  // Cigars → humidor
  { id: 'm_padron',  name: 'Padrón 1964 Anniversary', category: 'Cigars', station: 'humidor', price: 32.0, modifier: 'Maduro',  image: '/assets/smokecraft/cigars/toro.jpg' },
  { id: 'm_oliva',   name: 'Oliva Serie V',           category: 'Cigars', station: 'humidor', price: 18.0, modifier: 'Toro',    image: '/assets/smokecraft/cigars/robusto.jpg' },
  { id: 'm_arturo',  name: 'Arturo Fuente OpusX',     category: 'Cigars', station: 'humidor', price: 45.0, modifier: 'Robusto', image: '/assets/smokecraft/cigars/corona.jpg' },
]

export const POS3_TICKETS = [
  {
    id: 'TKT-1057',
    tableId: 'T2',
    server: 'Jordan Smith',
    guests: 2,
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 12,
    items: [
      { id: 'li1', menuId: 'm_ribeye',  name: 'Wagyu Ribeye',            station: 'kitchen', price: 68.0, qty: 1, modifier: 'Medium Rare' },
      { id: 'li2', menuId: 'm_oldfash', name: 'Old Fashioned',           station: 'bar',     price: 16.0, qty: 1, modifier: 'Rye' },
      { id: 'li3', menuId: 'm_padron',  name: 'Padrón 1964 Anniversary', station: 'humidor', price: 32.0, qty: 1, modifier: 'Maduro' },
      { id: 'li4', menuId: 'm_caesar',  name: 'Caesar Salad',            station: 'kitchen', price: 14.0, qty: 1, modifier: '' },
      { id: 'li5', menuId: 'm_mac18',   name: 'Macallan 18 Year',        station: 'humidor', price: 42.0, qty: 1, modifier: 'Neat' },
    ],
  },
  {
    id: 'TKT-1058',
    tableId: 'T5',
    server: 'Devon Park',
    guests: 6,
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 4,
    items: [
      { id: 'li6', menuId: 'm_negroni', name: 'Negroni',     station: 'bar', price: 15.0, qty: 3, modifier: 'Classic' },
      { id: 'li7', menuId: 'm_charc',   name: 'Charcuterie Board', station: 'kitchen', price: 26.0, qty: 1, modifier: 'Chef Select' },
    ],
  },
]

export const TAX_RATE = 0.085
