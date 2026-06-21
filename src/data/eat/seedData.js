/**
 * E.A.T. management seed data — inventory, staff, sections, reorders, alerts.
 * Realistic but clearly DEMO data.
 */

export const EAT_INVENTORY = [
  { id: 'inv_padron',  name: 'Padrón 1964 Anniversary', category: 'Cigars',  station: 'humidor', onHand: 12, par: 20, unit: 'sticks', cost: 18.0 },
  { id: 'inv_oliva',   name: 'Oliva Serie V',           category: 'Cigars',  station: 'humidor', onHand: 4,  par: 24, unit: 'sticks', cost: 9.5 },
  { id: 'inv_opusx',   name: 'Arturo Fuente OpusX',     category: 'Cigars',  station: 'humidor', onHand: 2,  par: 12, unit: 'sticks', cost: 28.0 },
  { id: 'inv_mac18',   name: 'Macallan 18 Year',        category: 'Spirits', station: 'bar',     onHand: 1,  par: 3,  unit: 'bottles', cost: 320.0 },
  { id: 'inv_rye',     name: 'Rittenhouse Rye',         category: 'Spirits', station: 'bar',     onHand: 6,  par: 6,  unit: 'bottles', cost: 24.0 },
  { id: 'inv_ribeye',  name: 'Wagyu Ribeye',            category: 'Food',    station: 'kitchen', onHand: 8,  par: 15, unit: 'portions', cost: 38.0 },
  { id: 'inv_anchovy', name: 'White Anchovy',           category: 'Food',    station: 'kitchen', onHand: 3,  par: 10, unit: 'tins', cost: 6.0 },
]

export const EAT_STAFF = [
  { id: 'stf_jordan', name: 'Jordan Smith', role: 'Floor Supervisor', section: 'Lounge',  status: 'on-shift', clockIn: '16:00' },
  { id: 'stf_mara',   name: 'Mara Lopez',   role: 'Server',           section: 'Humidor', status: 'on-shift', clockIn: '16:30' },
  { id: 'stf_dev',    name: 'Devon Park',   role: 'Bartender',        section: 'Bar',     status: 'on-shift', clockIn: '15:00' },
  { id: 'stf_kim',    name: 'Kim Trent',    role: 'Sous Chef',        section: 'Kitchen', status: 'on-break', clockIn: '14:00' },
  { id: 'stf_ray',    name: 'Ray Okafor',   role: 'Server',           section: 'Patio',   status: 'off',      clockIn: '—' },
]

export const EAT_SECTIONS = [
  { id: 'sec_lounge',  name: 'Lounge',  tables: 2, openTickets: 1, server: 'Jordan Smith', status: 'active' },
  { id: 'sec_humidor', name: 'Humidor', tables: 1, openTickets: 1, server: 'Mara Lopez',   status: 'active' },
  { id: 'sec_bar',     name: 'Bar',     tables: 1, openTickets: 1, server: 'Devon Park',   status: 'active' },
  { id: 'sec_patio',   name: 'Patio',   tables: 2, openTickets: 0, server: '—',            status: 'idle' },
  { id: 'sec_kitchen', name: 'Kitchen', tables: 0, openTickets: 0, server: 'Kim Trent',    status: 'active' },
]

export const EAT_REORDERS = [
  { id: 'ro_opusx', itemId: 'inv_opusx', name: 'Arturo Fuente OpusX', suggestedQty: 10, supplier: 'Fuente Distribution', status: 'suggested', priority: 'high' },
  { id: 'ro_oliva', itemId: 'inv_oliva', name: 'Oliva Serie V',       suggestedQty: 20, supplier: 'Oliva Cigar Co.',     status: 'suggested', priority: 'high' },
  { id: 'ro_mac18', itemId: 'inv_mac18', name: 'Macallan 18 Year',    suggestedQty: 2,  supplier: 'Premier Spirits',     status: 'ordered',   priority: 'medium' },
]

export const EAT_ALERTS = [
  { id: 'al_1', level: 'critical', message: 'OpusX below par (2 of 12)', system: 'EAT',  at: Date.now() - 1000 * 60 * 8 },
  { id: 'al_2', level: 'warning',  message: 'Macallan 18 single bottle remaining', system: 'EAT', at: Date.now() - 1000 * 60 * 25 },
  { id: 'al_3', level: 'info',     message: 'Kim Trent on break', system: 'POS3', at: Date.now() - 1000 * 60 * 3 },
]
