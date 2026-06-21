/**
 * OperationsAlertPanel — recent operational alert events (low/out stock,
 * order-send-blocked, humidor unavailable) for E.A.T. Operations.
 */
import { Card, Pill } from './ui.jsx'

export default function OperationsAlertPanel({ alerts }) {
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Operational Alerts</div>
      {!alerts.length && <div style={{ color: '#8b95a3' }}>No active operational alerts.</div>}
      {alerts.map((a) => (
        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <Pill label={a.eventType} tone="critical" />
            <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{a.ticketId ? `${a.ticketId} · ` : ''}{new Date(a.createdAt).toLocaleTimeString()}</div>
          </div>
        </div>
      ))}
    </Card>
  )
}
