/**
 * LiveTicketsPanel — dense management table of recent POS3 tickets, with
 * lifecycle status, item counts, and totals.
 */
import { Card, Pill, GOLD, Table } from './ui.jsx'

export default function LiveTicketsPanel({ tickets, ticketCounts }) {
  const columns = [
    { key: 'id', label: 'Ticket' },
    { key: 'tableId', label: 'Table' },
    { key: 'staffId', label: 'Staff' },
    { key: 'items', label: 'Items' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Live Tickets</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 12, color: '#aab3bf' }}>
        <span>Open: <strong style={{ color: GOLD }}>{ticketCounts.open}</strong></span>
        <span>Sent: <strong style={{ color: GOLD }}>{ticketCounts.sent}</strong></span>
        <span>Held: <strong style={{ color: GOLD }}>{ticketCounts.held}</strong></span>
        <span>Paid: <strong style={{ color: GOLD }}>{ticketCounts.paid}</strong></span>
      </div>
      <Table
        columns={columns}
        rows={tickets}
        renderCell={(row, key) => {
          if (key === 'items') return row.items?.length || 0
          if (key === 'status') return <Pill label={row.status} tone={row.status} />
          if (key === 'staffId') return row.staffId || row.server || '—'
          return row[key] ?? '—'
        }}
      />
    </Card>
  )
}
