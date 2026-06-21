import { Card } from '../../eat/ui.jsx'

/** Read-only display of the default field mappings used for normalization. */
export default function POSFieldMapper({ mappings }) {
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Field Mapping (default)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Object.entries(mappings || {}).map(([type, fields]) => (
          <div key={type}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#8b95a3', marginBottom: 6, letterSpacing: '0.05em' }}>{type}</div>
            {Object.entries(fields).map(([target, source]) => (
              <div key={target} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#cdd5df' }}>{target}</span>
                <span style={{ color: '#8b95a3' }}>← {source}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
