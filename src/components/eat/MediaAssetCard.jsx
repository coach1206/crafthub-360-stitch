import { Card, Pill } from './ui.jsx'

export default function MediaAssetCard({ asset, onAssign }) {
  return (
    <Card style={{ padding: 10 }}>
      <div style={{ width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', marginBottom: 8, background: '#0f1419' }}>
        {asset.previewUrl
          ? <img src={asset.previewUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b95a3', fontSize: 12 }}>No preview</div>}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{asset.name}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <Pill label={asset.type} tone="info" />
        <Pill label={asset.category} tone="pending" />
        <Pill label={asset.status} tone={asset.status === 'active' ? 'open' : 'dirty'} />
        {asset.sourceType === 'upload' && <Pill label="session-local" tone="warning" />}
      </div>
      <button type="button" onClick={() => onAssign(asset)} style={{
        width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid rgba(212,168,67,0.3)',
        background: 'transparent', color: '#d4a843', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>Assign to Target</button>
    </Card>
  )
}
