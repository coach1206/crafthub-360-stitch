import { Card, Pill } from '../../eat/ui.jsx'

/** Shows counts of records imported by the last sync, per data type. */
export default function POSImportPreview({ importedCounts }) {
  if (!importedCounts || Object.keys(importedCounts).length === 0) return null
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Import Preview</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(importedCounts).map(([type, count]) => (
          <Pill key={type} label={`${type}: ${count} imported`} tone="open" />
        ))}
      </div>
    </Card>
  )
}
