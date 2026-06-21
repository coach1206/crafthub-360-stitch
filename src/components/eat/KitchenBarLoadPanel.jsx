/**
 * KitchenBarLoadPanel — inventory low/out lists for E.A.T. Operations.
 */
import { Card, Table } from './ui.jsx'
import InventoryWarningBadge from '../pos3/stations/InventoryWarningBadge.jsx'

export default function KitchenBarLoadPanel({ inventoryHealth }) {
  const rows = [...inventoryHealth.out.map((r) => ({ ...r, _status: 'out' })), ...inventoryHealth.low.map((r) => ({ ...r, _status: 'low' }))]
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Inventory Watchlist ({rows.length})</div>
      {!rows.length && <div style={{ color: '#8b95a3' }}>No low or out-of-stock SKUs.</div>}
      {rows.length > 0 && (
        <Table
          columns={[{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Name' }, { key: 'quantityOnHand', label: 'On Hand' }, { key: 'status', label: 'Status' }]}
          rows={rows}
          renderCell={(r, k) => k === 'status' ? <InventoryWarningBadge status={r._status} /> : r[k]}
        />
      )}
    </Card>
  )
}
