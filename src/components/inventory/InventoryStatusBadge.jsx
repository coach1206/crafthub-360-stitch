export default function InventoryStatusBadge({ status, count }) {
  const cfg = {
    in_stock:             { bg: 'bg-green-100 text-green-800',  label: 'In Stock' },
    low_stock:            { bg: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' },
    sold_out:             { bg: 'bg-red-100 text-red-800',      label: 'Sold Out' },
    availability_required: { bg: 'bg-gray-100 text-gray-600',  label: 'Availability Required' },
    inventory_unavailable: { bg: 'bg-red-100 text-red-800',    label: 'Unavailable' },
    inventory_sync_pending: { bg: 'bg-blue-100 text-blue-700', label: 'Sync Pending' },
  }
  const { bg, label } = cfg[status] ?? { bg: 'bg-gray-100 text-gray-500', label: status }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg}`}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </span>
  )
}
