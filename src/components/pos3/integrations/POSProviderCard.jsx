import { Card, Pill, Btn, GOLD } from '../../eat/ui.jsx'

const STATE_TONE = {
  not_connected: 'info', needs_credentials: 'warning', connected: 'open',
  sync_active: 'open', error: 'critical', disabled: 'voided',
}

const STATE_LABEL = {
  not_connected: 'Not Connected', needs_credentials: 'Needs Credentials', connected: 'Connected',
  sync_active: 'Sync Active', error: 'Error', disabled: 'Disabled',
}

/** Card summarizing one provider's catalog info + current connection state. */
export default function POSProviderCard({ provider, status, onOpen }) {
  return (
    <Card onClick={() => onOpen?.(provider)} style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 170 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{provider.name}</div>
        <Pill label={STATE_LABEL[status] || 'Not Connected'} tone={STATE_TONE[status] || 'info'} />
      </div>
      <div style={{ fontSize: 12.5, color: '#8b95a3' }}>{provider.description}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
        {provider.whatItSyncs.map((w) => (
          <span key={w} style={{ fontSize: 10.5, color: GOLD, background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 999, padding: '2px 8px' }}>{w}</span>
        ))}
      </div>
      <Btn tone="gold" style={{ marginTop: 4 }} onClick={(e) => { e.stopPropagation(); onOpen?.(provider) }}>
        {status === 'not_connected' || !status ? 'Connect' : 'Manage'}
      </Btn>
    </Card>
  )
}
