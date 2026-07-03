export default function PersistenceStatusBadge({ status, degradedMode }) {
  const cfg = {
    persisted:         { bg: 'bg-green-100 text-green-800',  label: 'Persisted' },
    in_memory_only:    { bg: 'bg-yellow-100 text-yellow-800', label: 'In Memory Only' },
    database_required: { bg: 'bg-orange-100 text-orange-800', label: 'DB Required' },
    database_unavailable: { bg: 'bg-red-100 text-red-800',  label: 'DB Unavailable' },
    preview_only:      { bg: 'bg-gray-100 text-gray-600',   label: 'Preview Only' },
    persistence_failed: { bg: 'bg-red-100 text-red-800',    label: 'Persistence Failed' },
    persistence_pending: { bg: 'bg-blue-100 text-blue-700', label: 'Pending' },
    degraded_mode:     { bg: 'bg-yellow-100 text-yellow-800', label: 'Degraded Mode' },
  }
  const key = degradedMode ? 'degraded_mode' : (status ?? 'database_required')
  const { bg, label } = cfg[key] ?? { bg: 'bg-gray-100 text-gray-500', label: key }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${bg}`}>
      {label}
    </span>
  )
}
