/**
 * InventoryImpactPanel — dense table of recent POS3 inventory impact
 * entries (SKU depletions tied to tickets), plus voids/comps counters.
 */
import { EatCard, EatTable, EatKpiCard, L_NAVY } from './lightTheme.jsx'

export default function InventoryImpactPanel({ impacts, voidsAndComps }) {
  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'qtyDelta', label: 'Qty Δ' },
    { key: 'ticketId', label: 'Ticket' },
    { key: 'createdAt', label: 'When' },
  ]

  return (
    <EatCard>
      <div style={{ fontWeight: 700, marginBottom: 12, color: L_NAVY }}>Inventory Impact</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <EatKpiCard label="Voids" value={voidsAndComps.voids} accent="#b33b3b" />
        <EatKpiCard label="Comps" value={voidsAndComps.comps} accent="#b33b3b" />
      </div>
      <EatTable
        columns={columns}
        rows={impacts.slice(0, 20)}
        renderCell={(row, key) => {
          if (key === 'createdAt') return new Date(row.createdAt).toLocaleTimeString()
          return row[key] ?? '—'
        }}
      />
      {!impacts.length && <div style={{ color: '#8b95a3', padding: '10px 0' }}>No inventory impact recorded yet.</div>}
    </EatCard>
  )
}
