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

export const POS3_TABLES = [
  { id: 'T1', name: 'Table T1', section: 'Lounge',  seats: 4, status: 'open',     guests: 0, server: null },
  { id: 'T2', name: 'Table T2', section: 'Lounge',  seats: 2, status: 'occupied', guests: 2, server: 'Jordan Smith' },
  { id: 'T3', name: 'Table T3', section: 'Humidor', seats: 6, status: 'occupied', guests: 5, server: 'Mara Lopez' },
  { id: 'T4', name: 'Table T4', section: 'Patio',   seats: 4, status: 'open',     guests: 0, server: null },
  { id: 'T5', name: 'Table T5', section: 'Bar',     seats: 8, status: 'occupied', guests: 6, server: 'Devon Park' },
  { id: 'T6', name: 'Table T6', section: 'Patio',   seats: 2, status: 'dirty',    guests: 0, server: null },
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
