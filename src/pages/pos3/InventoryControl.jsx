import { useEffect, useState } from 'react'
import { Shell, SideNav, TopBar, KpiCard, Card, Table } from '../../components/eat/ui.jsx'
import { subscribe } from '../../services/shared/opsEventBus.js'
import { getInventoryLevels, checkAvailability } from '../../services/pos3/inventoryAvailabilityService.js'
import InventoryWarningBadge from '../../components/pos3/stations/InventoryWarningBadge.jsx'

export default function InventoryControl() {
  const [levels, setLevels] = useState(() => getInventoryLevels())

  function refresh() { setLevels(getInventoryLevels()) }
  useEffect(() => subscribe(() => refresh()), [])

  const rows = levels.map((l) => ({ ...l, avail: checkAvailability(l.sku, 1) }))
  const low = rows.filter((r) => r.avail.status === 'low').length
  const out = rows.filter((r) => r.avail.status === 'out').length

  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <TopBar system="POS3" title="Inventory Control" subtitle="Live stock levels across all SKUs" />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Total SKUs" value={rows.length} />
              <KpiCard label="Low Stock" value={low} accent={low ? '#d4a843' : undefined} />
              <KpiCard label="Out of Stock" value={out} accent={out ? '#f0907f' : undefined} />
            </div>

            <Card style={{ padding: 0 }}>
              <Table
                columns={[
                  { key: 'sku', label: 'SKU' }, { key: 'name', label: 'Name' },
                  { key: 'quantityOnHand', label: 'On Hand' }, { key: 'parLevel', label: 'Par' },
                  { key: 'status', label: 'Status' },
                ]}
                rows={rows}
                renderCell={(r, k) => k === 'status' ? <InventoryWarningBadge status={r.avail.status} /> : r[k]}
              />
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  )
}
