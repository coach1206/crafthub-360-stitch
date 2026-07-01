/**
 * StaffActivityPanel — dense table/list of recent staff activity events
 * (e.g. completed payments) derived from the shared ops bus.
 */
import { EatCard, EatTable, L_NAVY } from './lightTheme.jsx'

export default function StaffActivityPanel({ activity, activityCounts }) {
  const columns = [
    { key: 'staffId', label: 'Staff' },
    { key: 'activity', label: 'Activity' },
    { key: 'ticketId', label: 'Ticket' },
    { key: 'createdAt', label: 'When' },
  ]

  return (
    <EatCard>
      <div style={{ fontWeight: 700, marginBottom: 12, color: L_NAVY }}>Staff Activity</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 12, color: '#6b7385', flexWrap: 'wrap' }}>
        {Object.entries(activityCounts).map(([staffId, count]) => (
          <span key={staffId}>{staffId}: <strong style={{ color: '#9c7320' }}>{count}</strong></span>
        ))}
        {!Object.keys(activityCounts).length && <span>No staff activity recorded yet.</span>}
      </div>
      <EatTable
        columns={columns}
        rows={activity.slice(0, 20)}
        renderCell={(row, key) => {
          if (key === 'activity') return row.payload?.activity || row.eventType
          if (key === 'createdAt') return new Date(row.createdAt).toLocaleTimeString()
          return row[key] ?? '—'
        }}
      />
    </EatCard>
  )
}
