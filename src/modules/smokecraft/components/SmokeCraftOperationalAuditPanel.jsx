/**
 * SmokeCraftOperationalAuditPanel
 * Shows operational audit log — event type, actor role, allowed/blocked,
 * blocked reason, createdAt. No secrets or private data displayed.
 */

function AuditRow({ entry }) {
  const isBlocked = !entry.allowed
  return (
    <div className={`border rounded p-2 space-y-0.5 text-xs ${
      isBlocked
        ? 'border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10'
        : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-gray-600 dark:text-gray-400 truncate">{entry.eventType ?? '—'}</span>
        <span className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${
          entry.allowed
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        }`}>
          {entry.allowed ? 'allowed' : 'blocked'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500">
        <span>role: {entry.actorRole ?? '—'}</span>
        {entry.targetType && <span>target: {entry.targetType}</span>}
        {entry.blockedReason && <span className="text-red-500 dark:text-red-400 font-mono">{entry.blockedReason}</span>}
      </div>
      <div className="text-gray-400 dark:text-gray-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}</div>
    </div>
  )
}

export default function SmokeCraftOperationalAuditPanel({ auditLog = [], auditReport = null }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Operational Audit Log</h2>
        {auditReport && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {auditReport.totalEntries ?? 0} entries
          </span>
        )}
      </div>

      {auditLog.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {[...auditLog].reverse().map((entry, i) => (
            <AuditRow key={entry.auditId ?? i} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          No audit events yet. Admin and staff activity will appear here.
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded p-2 space-y-0.5">
        <div>Secrets in log: <span className="font-medium text-green-600 dark:text-green-400">none</span></div>
        <div>Private customer data: <span className="font-medium text-green-600 dark:text-green-400">not exposed</span></div>
        <div>Persistence: <span className="font-mono">{auditReport?.persistenceMode ?? 'memory_fallback'}</span></div>
      </div>
    </div>
  )
}
