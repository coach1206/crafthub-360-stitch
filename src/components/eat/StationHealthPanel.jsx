/**
 * StationHealthPanel — kitchen/bar queue load summary for E.A.T. Operations.
 */
import { Card, Pill, KpiCard } from './ui.jsx'

export default function StationHealthPanel({ stationLoad }) {
  const { kitchen, bar } = stationLoad
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Station Health</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Kitchen Queue" value={`${kitchen.queueLength}/${kitchen.capacity}`} accent={kitchen.critical ? '#f0907f' : kitchen.busy ? '#d4a843' : undefined} />
        <KpiCard label="Bar Queue" value={`${bar.queueLength}/${bar.capacity}`} accent={bar.critical ? '#f0907f' : bar.busy ? '#d4a843' : undefined} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <Pill label={kitchen.critical ? 'Kitchen Critical' : kitchen.busy ? 'Kitchen Busy' : 'Kitchen Ready'} tone={kitchen.critical ? 'critical' : kitchen.busy ? 'warning' : 'open'} />
        <Pill label={bar.critical ? 'Bar Critical' : bar.busy ? 'Bar Busy' : 'Bar Ready'} tone={bar.critical ? 'critical' : bar.busy ? 'warning' : 'open'} />
      </div>
    </Card>
  )
}
