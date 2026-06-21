/**
 * StaffActivityPanel — dense table/list of recent staff activity events
 * (e.g. completed payments) derived from the shared ops bus.
 */
import { Card, Table } from './ui.jsx'

export default function StaffActivityPanel({ activity, activityCounts }) {
  const columns = [
    { key: 'staffId', label: 'Staff' },
    { key: 'activity', label: 'Activity' },
    { key: 'ticketId', label: 'Ticket' },
    { key: 'createdAt', label: 'When' },
  ]

  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Staff Activity</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 12, color: '#aab3bf', flexWrap: 'wrap' }}>
        {Object.entries(activityCounts).map(([staffId, count]) => (
          <span key={staffId}>{staffId}: <strong style={{ color: '#d4a843' }}>{count}</strong></span>
        ))}
        {!Object.keys(activityCounts).length && <span>No staff activity recorded yet.</span>}
      </div>
      <Table
        columns={columns}
        rows={activity.slice(0, 20)}
        renderCell={(row, key) => {
          if (key === 'activity') return row.payload?.activity || row.eventType
          if (key === 'createdAt') return new Date(row.createdAt).toLocaleTimeString()
          return row[key] ?? '—'
        }}
      />
    </Card>
  )
}
