/**
 * InventoryImpactPanel — dense table of recent POS3 inventory impact
 * entries (SKU depletions tied to tickets), plus voids/comps counters.
 */
import { Card, Table, KpiCard } from './ui.jsx'

export default function InventoryImpactPanel({ impacts, voidsAndComps }) {
  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'qtyDelta', label: 'Qty Δ' },
    { key: 'ticketId', label: 'Ticket' },
    { key: 'createdAt', label: 'When' },
  ]

  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Inventory Impact</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Voids" value={voidsAndComps.voids} accent="#f0907f" />
        <KpiCard label="Comps" value={voidsAndComps.comps} accent="#f0907f" />
      </div>
      <Table
        columns={columns}
        rows={impacts.slice(0, 20)}
        renderCell={(row, key) => {
          if (key === 'createdAt') return new Date(row.createdAt).toLocaleTimeString()
          return row[key] ?? '—'
        }}
      />
      {!impacts.length && <div style={{ color: '#8b95a3', padding: '10px 0' }}>No inventory impact recorded yet.</div>}
    </Card>
  )
}
