import { ManagementLayout, Card, KpiCard } from '../../components/eat/ui.jsx'
import { getTickets, ticketTotals } from '../../services/pos3/pos3Service.js'

export default function EATReports() {
  const tickets = getTickets()
  const paid = tickets.filter((t) => t.status === 'paid')
  const revenue = paid.reduce((s, t) => s + ticketTotals(t).total, 0)
  const open = tickets.filter((t) => t.status !== 'paid')
  const avgTicket = paid.length ? revenue / paid.length : 0

  return (
    <ManagementLayout title="Reports" subtitle="Local session reporting — derived from current ops/POS3 state">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Checked-out Revenue" value={`$${revenue.toFixed(2)}`} />
        <KpiCard label="Paid Tickets" value={paid.length} />
        <KpiCard label="Open Tickets" value={open.length} />
        <KpiCard label="Avg Ticket" value={`$${avgTicket.toFixed(2)}`} />
      </div>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Note</div>
        <div style={{ fontSize: 13, color: '#8b95a3' }}>
          Figures are derived live from local POS 3 ticket data (localStorage), not a connected reporting backend.
          No historical rollups beyond the current session are persisted.
        </div>
      </Card>
    </ManagementLayout>
  )
}
