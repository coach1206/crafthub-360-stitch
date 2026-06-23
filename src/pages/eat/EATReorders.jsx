import { useState } from 'react'
import { ManagementLayout, Pill, Table, Btn, useToast } from '../../components/eat/ui.jsx'
import { EAT_REORDERS } from '../../data/eat/seedData.js'

export default function EATReorders() {
  const toast = useToast()
  const [rows, setRows] = useState(EAT_REORDERS)

  function order(id) {
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: 'ordered' } : r))
    toast('Reorder marked as ordered (local only)')
  }

  return (
    <ManagementLayout title="Reorders" subtitle="Suggested and active purchase orders (demo data — pending live inventory integration)">
      <Table
        columns={[
          { key: 'name', label: 'Item' }, { key: 'suggestedQty', label: 'Qty' }, { key: 'supplier', label: 'Supplier' },
          { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '' },
        ]}
        rows={rows}
        renderCell={(r, k) => {
          if (k === 'priority') return <Pill label={r.priority} tone={r.priority === 'high' ? 'critical' : 'warning'} />
          if (k === 'status') return <Pill label={r.status} tone={r.status === 'ordered' ? 'sent' : 'pending'} />
          if (k === 'actions') return r.status === 'suggested'
            ? <Btn tone="orange" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => order(r.id)}>Place Order</Btn>
            : null
          return r[k]
        }}
      />
    </ManagementLayout>
  )
}
