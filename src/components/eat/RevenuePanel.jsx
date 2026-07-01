/**
 * RevenuePanel — management revenue KPIs derived from POS3 receipts.
 */
import { EatKpiCard, EatCard, L_NAVY } from './lightTheme.jsx'

export default function RevenuePanel({ revenueToday, destinationBreakdown }) {
  return (
    <EatCard>
      <div style={{ fontWeight: 700, marginBottom: 12, color: L_NAVY }}>Revenue (Today)</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <EatKpiCard label="Revenue Today" value={`$${revenueToday.revenue.toFixed(2)}`} />
        <EatKpiCard label="Tickets Paid" value={revenueToday.ticketCount} />
        <EatKpiCard label="Avg Ticket Size" value={`$${revenueToday.avgTicket.toFixed(2)}`} accent="#9c7320" />
      </div>
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: L_NAVY }}>Destination Breakdown (items)</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(destinationBreakdown).map(([dest, count]) => (
          <div key={dest} style={{ fontSize: 13, color: '#1c2230' }}>
            <span style={{ textTransform: 'capitalize', color: '#8b95a3' }}>{dest}:</span>{' '}
            <strong style={{ color: '#9c7320' }}>{count}</strong>
          </div>
        ))}
      </div>
    </EatCard>
  )
}
