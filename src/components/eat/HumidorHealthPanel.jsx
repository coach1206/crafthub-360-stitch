/**
 * HumidorHealthPanel — humidor bin humidity/temp status + active pull
 * requests for E.A.T. Operations.
 */
import { Card, Pill, KpiCard } from './ui.jsx'

export default function HumidorHealthPanel({ humidorHealth }) {
  const { inventory, activeRequests, alerts } = humidorHealth
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Humidor Health</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <KpiCard label="Active Requests" value={activeRequests.length} />
        <KpiCard label="Bin Alerts" value={alerts.length} accent={alerts.length ? '#f0907f' : undefined} />
      </div>
      {inventory.map((i) => (
        <div key={i.sku} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 12 }}>{i.name} · {i.location}</span>
          <span style={{ display: 'flex', gap: 6 }}>
            <Pill label={i.humidityStatus} tone={i.humidityStatus !== 'ok' ? 'warning' : 'open'} />
            <Pill label={i.tempStatus} tone={i.tempStatus !== 'ok' ? 'warning' : 'open'} />
          </span>
        </div>
      ))}
    </Card>
  )
}
