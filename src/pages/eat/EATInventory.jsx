import { ManagementLayout, Pill, Table } from '../../components/eat/ui.jsx'
import { EAT_INVENTORY } from '../../data/eat/seedData.js'

export default function EATInventory() {
  return (
    <ManagementLayout title="Inventory" subtitle="Stock on hand across humidor, bar, and kitchen (demo data — pending live inventory integration)">
      <Table
        columns={[
          { key: 'name', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'station', label: 'Station' },
          { key: 'onHand', label: 'On Hand' }, { key: 'par', label: 'Par' }, { key: 'unit', label: 'Unit' }, { key: 'cost', label: 'Unit Cost' },
        ]}
        rows={EAT_INVENTORY}
        renderCell={(r, k) => {
          if (k === 'station') return <Pill label={r.station} tone={r.station} />
          if (k === 'onHand') return <span style={{ color: r.onHand < r.par * 0.4 ? '#f0907f' : undefined, fontWeight: 600 }}>{r.onHand}</span>
          if (k === 'cost') return `$${r.cost.toFixed(2)}`
          return r[k]
        }}
      />
    </ManagementLayout>
  )
}
