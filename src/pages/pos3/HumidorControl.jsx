import { useEffect, useState } from 'react'
import { Shell, SideNav, TopBar, KpiCard, Card, Pill } from '../../components/eat/ui.jsx'
import { subscribe } from '../../services/shared/opsEventBus.js'
import { getRequests, markPulled, markUnavailable, suggestSubstitution, markDelivered } from '../../services/pos3/humidorQueueService.js'
import { getHumidorInventory } from '../../data/pos3/humidorInventory.js'
import HumidorRequestCard from '../../components/pos3/stations/HumidorRequestCard.jsx'
import { successTap, warningTap } from '../../services/shared/haptics.js'

export default function HumidorControl() {
  const [requests, setRequests] = useState(() => getRequests())
  const inventory = getHumidorInventory()

  function refresh() { setRequests(getRequests()) }
  useEffect(() => subscribe(() => refresh()), [])

  function act(fn, id, ...args) {
    fn(id, ...args)
    try { successTap() } catch {}
    refresh()
  }

  const active = requests.filter((r) => r.status !== 'delivered')
  const alerts = inventory.filter((i) => i.humidityStatus !== 'ok' || i.tempStatus !== 'ok')

  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <TopBar system="POS3" title="Humidor Control" subtitle="Cigar pull requests + humidor health" />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Active Requests" value={active.length} />
              <KpiCard label="Humidor Alerts" value={alerts.length} accent={alerts.length ? '#f0907f' : undefined} />
            </div>

            {alerts.length > 0 && (
              <Card className="humidor-alert" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Humidor Health Alerts</div>
                {alerts.map((a) => (
                  <div key={a.sku} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 12 }}>{a.name} · {a.location}</span>
                    <span style={{ display: 'flex', gap: 6 }}>
                      <Pill label={`Humidity: ${a.humidityStatus}`} tone={a.humidityStatus !== 'ok' ? 'warning' : 'open'} />
                      <Pill label={`Temp: ${a.tempStatus}`} tone={a.tempStatus !== 'ok' ? 'warning' : 'open'} />
                    </span>
                  </div>
                ))}
              </Card>
            )}

            <Card>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Pull Requests ({active.length})</div>
              {!active.length && <div style={{ color: '#8b95a3', padding: '14px 0' }}>No active humidor requests.</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {active.map((r) => (
                  <HumidorRequestCard
                    key={r.id}
                    entry={r}
                    onPulled={(id) => act(markPulled, id)}
                    onUnavailable={(id) => { try { warningTap() } catch {}; act(markUnavailable, id, 'Out of stock') }}
                    onSuggestSub={(id) => act(suggestSubstitution, id, 'Oliva Serie V Melanio Toro')}
                    onDelivered={(id) => act(markDelivered, id)}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  )
}
