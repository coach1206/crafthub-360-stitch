/**
 * RevenuePanel — management revenue KPIs derived from POS3 receipts.
 */
import { KpiCard, Card, GOLD } from './ui.jsx'

export default function RevenuePanel({ revenueToday, destinationBreakdown }) {
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Revenue (Today)</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <KpiCard label="Revenue Today" value={`$${revenueToday.revenue.toFixed(2)}`} />
        <KpiCard label="Tickets Paid" value={revenueToday.ticketCount} />
        <KpiCard label="Avg Ticket Size" value={`$${revenueToday.avgTicket.toFixed(2)}`} accent={GOLD} />
      </div>
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Destination Breakdown (items)</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(destinationBreakdown).map(([dest, count]) => (
          <div key={dest} style={{ fontSize: 13, color: '#cdd5df' }}>
            <span style={{ textTransform: 'capitalize', color: '#8b95a3' }}>{dest}:</span>{' '}
            <strong style={{ color: GOLD }}>{count}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}
