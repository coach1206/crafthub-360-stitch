/**
 * LiveTicketsPanel — dense management table of recent POS3 tickets, with
 * lifecycle status, item counts, and totals.
 */
import { EatCard, EatTable, LightPill, L_NAVY } from './lightTheme.jsx'

export default function LiveTicketsPanel({ tickets, ticketCounts }) {
  const columns = [
    { key: 'id', label: 'Ticket' },
    { key: 'tableId', label: 'Table' },
    { key: 'staffId', label: 'Staff' },
    { key: 'items', label: 'Items' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <EatCard>
      <div style={{ fontWeight: 700, marginBottom: 12, color: L_NAVY }}>Live Tickets</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 12, color: '#6b7385' }}>
        <span>Open: <strong style={{ color: '#9c7320' }}>{ticketCounts.open}</strong></span>
        <span>Sent: <strong style={{ color: '#9c7320' }}>{ticketCounts.sent}</strong></span>
        <span>Held: <strong style={{ color: '#9c7320' }}>{ticketCounts.held}</strong></span>
        <span>Paid: <strong style={{ color: '#9c7320' }}>{ticketCounts.paid}</strong></span>
      </div>
      <EatTable
        columns={columns}
        rows={tickets}
        renderCell={(row, key) => {
          if (key === 'items') return row.items?.length || 0
          if (key === 'status') return <LightPill tone={row.status === 'paid' || row.status === 'open' ? 'green' : row.status === 'held' ? 'navy' : 'gold'}>{row.status}</LightPill>
          if (key === 'staffId') return row.staffId || row.server || '—'
          return row[key] ?? '—'
        }}
      />
    </EatCard>
  )
}
