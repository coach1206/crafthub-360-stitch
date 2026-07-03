import PersistenceStatusBadge from './PersistenceStatusBadge.jsx'

export default function ReceivingConfirmationPanel({ receiving, onConfirm, persistenceStatus }) {
  if (!receiving) return (
    <div className="rounded-lg border p-3 text-xs text-gray-500">
      No receiving record. <PersistenceStatusBadge status="receiving_preview_only" />
    </div>
  )
  const ps = persistenceStatus ?? (receiving.persisted ? 'receiving_persisted' : 'receiving_preview_only')
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Receiving Confirmation</p>
        <PersistenceStatusBadge status={ps} />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">Status: <strong>{receiving.receiving_status}</strong></p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Expected {receiving.items_expected} · Received {receiving.items_received}
      </p>
      {!receiving.persisted && (
        <p className="text-[10px] text-orange-500">inventory_not_persisted · adjusted_in_memory_only</p>
      )}
      {onConfirm && (
        <button onClick={() => onConfirm(receiving)} className="w-full min-h-[44px] rounded bg-blue-600 text-white text-xs font-medium px-3 py-2 hover:bg-blue-700">
          Confirm Receipt
        </button>
      )}
    </div>
  )
}
