/**
 * StationQueuePanel — generic queue list panel used by Kitchen/Bar
 * displays, rendering ticket cards via the `renderCard` prop.
 */
import { Card } from '../../eat/ui.jsx'

export default function StationQueuePanel({ title, entries, renderCard }) {
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>{title} ({entries.length})</div>
      {!entries.length && <div style={{ color: '#8b95a3', padding: '14px 0' }}>Queue is empty.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {entries.map((e) => renderCard(e))}
      </div>
    </Card>
  )
}
