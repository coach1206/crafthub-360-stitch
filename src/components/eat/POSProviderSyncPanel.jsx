import { Card, Pill, Btn } from './ui.jsx'
import { getPosProviders } from '../../data/pos3/posProviders.js'
import { getAllConfigs } from '../../services/pos3/posIntegrationService.js'
import { Link } from 'react-router-dom'

const STATE_TONE = {
  not_connected: 'info', needs_credentials: 'warning', connected: 'open',
  sync_active: 'open', error: 'critical', disabled: 'voided',
}

/** E.A.T.-side read-only summary of POS3's external provider connections. */
export default function POSProviderSyncPanel() {
  const providers = getPosProviders()
  const configs = getAllConfigs()
  const connected = providers.filter((p) => configs[p.id]?.status === 'connected' || configs[p.id]?.status === 'sync_active')

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong>External POS Providers</strong>
        <Link to="/pos3/integrations" style={{ textDecoration: 'none' }}>
          <Btn tone="gold" style={{ padding: '6px 12px', fontSize: 12 }}>Open Integration Hub</Btn>
        </Link>
      </div>
      <div style={{ fontSize: 12.5, color: '#8b95a3', marginBottom: 10 }}>
        {connected.length} of {providers.length} providers connected.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {providers.map((p) => {
          const cfg = configs[p.id]
          return (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 13 }}>{p.name}</span>
              <Pill label={cfg?.status || 'not_connected'} tone={STATE_TONE[cfg?.status] || 'info'} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}
