import { ManagementLayout, Pill, Table } from '../../components/eat/ui.jsx'
import { EAT_SECTIONS } from '../../data/eat/seedData.js'

export default function EATSections() {
  return (
    <ManagementLayout title="Sections" subtitle="Floor sections, table counts, and assigned servers">
      <Table
        columns={[
          { key: 'name', label: 'Section' }, { key: 'tables', label: 'Tables' }, { key: 'openTickets', label: 'Open Tickets' },
          { key: 'server', label: 'Server' }, { key: 'status', label: 'Status' },
        ]}
        rows={EAT_SECTIONS}
        renderCell={(r, k) => k === 'status' ? <Pill label={r.status} tone={r.status === 'active' ? 'open' : 'dirty'} /> : r[k]}
      />
    </ManagementLayout>
  )
}
