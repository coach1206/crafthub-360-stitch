import PersistenceStatusBadge from './PersistenceStatusBadge.jsx'

export default function InventoryAdjustmentHistoryPanel({ records = [], persistenceStatus }) {
  if (!records.length) return (
    <div className="rounded-lg border p-3 text-xs text-gray-500">
      No adjustment history. <PersistenceStatusBadge status={persistenceStatus ?? 'in_memory_only'} />
    </div>
  )
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Adjustment History ({records.length})</p>
        <PersistenceStatusBadge status={persistenceStatus ?? 'in_memory_only'} />
      </div>
      {records.slice(0, 10).map((r, i) => (
        <div key={r.adjustment_id ?? i} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
          <span className="text-gray-600 dark:text-gray-400">{r.adjustment_type}</span>
          <span className={`font-mono font-semibold ${r.quantity_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {r.quantity_delta >= 0 ? '+' : ''}{r.quantity_delta}
          </span>
          <span className="text-gray-400">{r.source_system}</span>
        </div>
      ))}
    </div>
  )
}
