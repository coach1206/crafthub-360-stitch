/**
 * StationStatusCard — shows a single station's queue load (busy/ready) as
 * a touch-first card used atop Kitchen/Bar displays.
 */
import { Card, Pill, GOLD } from '../../eat/ui.jsx'

export default function StationStatusCard({ name, queueLength, queueCapacity, busyThreshold }) {
  const busy = queueLength >= busyThreshold
  const className = busy ? 'tactile-card station-backed-up' : 'tactile-card station-ready'
  return (
    <Card className={className} style={{ minWidth: 160 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: busy ? '#f0907f' : GOLD, marginTop: 6 }}>
        {queueLength}/{queueCapacity}
      </div>
      <Pill label={busy ? 'Backed Up' : 'Ready'} tone={busy ? 'critical' : 'open'} />
    </Card>
  )
}
