import { ManagementLayout, Pill, Table } from '../../components/eat/ui.jsx'
import { getTickets } from '../../services/pos3/pos3Service.js'
import { EAT_INVENTORY } from '../../data/eat/seedData.js'

export default function EATKitchen() {
  const tickets = getTickets().filter((t) => t.status !== 'paid')
  const kitchenItems = tickets.flatMap((t) => t.items.filter((i) => i.station === 'kitchen').map((i) => ({ ...i, ticketId: t.id, tableId: t.tableId })))
  const stock = EAT_INVENTORY.filter((i) => i.station === 'kitchen')

  return (
    <ManagementLayout title="Kitchen" subtitle="Active kitchen tickets and stock">
      <div style={{ marginBottom: 18, fontWeight: 700 }}>Active Kitchen Orders</div>
      <Table
        columns={[{ key: 'name', label: 'Item' }, { key: 'qty', label: 'Qty' }, { key: 'ticketId', label: 'Ticket' }, { key: 'tableId', label: 'Table' }]}
        rows={kitchenItems}
        renderCell={(r, k) => r[k]}
      />
      <div style={{ margin: '20px 0 10px', fontWeight: 700 }}>Kitchen Stock</div>
      <Table
        columns={[{ key: 'name', label: 'Item' }, { key: 'onHand', label: 'On Hand' }, { key: 'par', label: 'Par' }, { key: 'unit', label: 'Unit' }]}
        rows={stock}
        renderCell={(r, k) => k === 'onHand' ? <Pill label={String(r.onHand)} tone={r.onHand < r.par * 0.4 ? 'critical' : 'open'} /> : r[k]}
      />
    </ManagementLayout>
  )
}
