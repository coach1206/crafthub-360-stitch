import { ManagementLayout, Pill, Table } from '../../components/eat/ui.jsx'
import { EAT_STAFF } from '../../data/eat/seedData.js'

export default function EATStaff() {
  return (
    <ManagementLayout title="Staff" subtitle="Current shift roster (demo data — pending live staff roster integration)">
      <Table
        columns={[
          { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'section', label: 'Section' },
          { key: 'status', label: 'Status' }, { key: 'clockIn', label: 'Clock In' },
        ]}
        rows={EAT_STAFF}
        renderCell={(r, k) => k === 'status'
          ? <Pill label={r.status} tone={r.status === 'on-shift' ? 'open' : r.status === 'on-break' ? 'warning' : 'dirty'} />
          : r[k]}
      />
    </ManagementLayout>
  )
}
