import OperationsStatusBadge from './OperationsStatusBadge.jsx'

export default function DegradedSystemsPanel({ systems = {}, degradedSystems = [] }) {
  const systemList = degradedSystems.length > 0
    ? degradedSystems
    : Object.entries(systems).filter(([, v]) => v.degraded).map(([k]) => k)

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Degraded Systems ({systemList.length})</p>
        <OperationsStatusBadge status={systemList.length > 0 ? 'degraded' : 'operational'} />
      </div>
      {systemList.length === 0 && <p className="text-xs text-green-600">All systems operational.</p>}
      {systemList.map(s => {
        const sys = systems[s]
        return (
          <div key={s} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
            <span className="font-mono text-gray-700 dark:text-gray-300">{s}</span>
            <span className="text-orange-500 text-[10px]">{sys?.reason ?? 'degraded'}</span>
          </div>
        )
      })}
    </div>
  )
}
