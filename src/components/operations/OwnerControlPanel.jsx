import OperationsStatusBadge from './OperationsStatusBadge.jsx'

export default function OwnerControlPanel({ readiness = {}, actorRole = 'guest' }) {
  const isOwner = actorRole === 'owner' || actorRole === 'admin'
  if (!isOwner) {
    return (
      <div className="rounded border border-red-200 bg-red-50 dark:bg-red-900 p-3 text-xs text-red-700">
        role_insufficient — Owner or admin role required to access this panel.
      </div>
    )
  }
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Owner Controls</p>
        <OperationsStatusBadge status={readiness.degradedMode ? 'degraded' : 'operational'} />
      </div>
      <div className="text-xs space-y-1">
        {(readiness.availableControls ?? []).slice(0, 6).map(c => (
          <div key={c} className="flex items-center gap-1">
            <span className="text-green-500">✓</span>
            <span className="font-mono text-gray-600 dark:text-gray-400">{c}</span>
          </div>
        ))}
      </div>
      {(readiness.ownerOnlyControls ?? []).length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-purple-600 mt-1">Owner-only</p>
          {readiness.ownerOnlyControls.map(c => (
            <p key={c} className="text-[10px] font-mono text-purple-500">{c}</p>
          ))}
        </div>
      )}
    </div>
  )
}
