import OperationsStatusBadge from './OperationsStatusBadge.jsx'

const EVENT_COLOR = {
  po_approved:           'text-green-600',
  po_rejected:           'text-red-600',
  sync_event_retried:    'text-blue-600',
  sync_event_blocked:    'text-orange-600',
  receiving_confirmed:   'text-green-600',
  owner_signed_off:      'text-purple-600',
}

export default function OperationsAuditPanel({ events = [], persistenceMode = 'in_memory_only' }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Operations Audit Trail ({events.length})</p>
        <OperationsStatusBadge status={persistenceMode === 'real_database' ? 'operational' : 'degraded'} />
      </div>
      {events.length === 0 && <p className="text-xs text-gray-500">No audit events recorded.</p>}
      {events.slice(0, 8).map((e, i) => (
        <div key={e.audit_id ?? i} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
          <span className={`font-mono ${EVENT_COLOR[e.event_type] ?? 'text-gray-500'}`}>{e.event_type}</span>
          <span className="text-gray-400">{e.actor_role ?? '—'}</span>
        </div>
      ))}
      <p className="text-[10px] text-gray-400">
        {persistenceMode === 'real_database' ? 'audit_events_persisted' : 'audit_events_in_memory · database_required'}
      </p>
    </div>
  )
}
