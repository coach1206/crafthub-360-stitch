import PersistenceStatusBadge from './PersistenceStatusBadge.jsx'

const EVENT_COLORS = {
  inventory_adjusted: 'text-blue-600',
  product_marked_sold_out: 'text-red-600',
  checkout_blocked: 'text-red-500',
  purchase_order_approved: 'text-green-600',
  purchase_order_not_submitted: 'text-orange-600',
  receiving_confirmed: 'text-green-600',
}

export default function InventoryAuditTrailPanel({ events = [], persistenceStatus }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Audit Trail ({events.length})</p>
        <PersistenceStatusBadge status={persistenceStatus ?? 'in_memory_only'} />
      </div>
      {events.length === 0 && <p className="text-xs text-gray-500">No audit events recorded.</p>}
      {events.slice(0, 10).map((e, i) => (
        <div key={e.audit_id ?? i} className="text-xs border-b dark:border-gray-700 pb-1">
          <span className={`font-medium ${EVENT_COLORS[e.event_type] ?? 'text-gray-700 dark:text-gray-300'}`}>
            {e.event_type}
          </span>
          <span className="text-gray-400 ml-2">{e.actor_role} · {e.system}</span>
        </div>
      ))}
    </div>
  )
}
