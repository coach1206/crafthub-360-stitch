import OperationsStatusBadge from './OperationsStatusBadge.jsx'

export default function OperationsDashboardPanel({ report = {} }) {
  const { degradedSystems = [], operationalSystems = [], degradedMode, persistenceMode } = report.summary ?? report
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Live Operations Dashboard</p>
        <OperationsStatusBadge status={degradedMode ? 'degraded' : 'operational'} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-green-50 dark:bg-green-900 rounded p-2 text-center">
          <p className="font-bold text-green-700 text-lg">{operationalSystems.length}</p>
          <p className="text-gray-500">Operational</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900 rounded p-2 text-center">
          <p className="font-bold text-orange-600 text-lg">{degradedSystems.length}</p>
          <p className="text-gray-500">Degraded</p>
        </div>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Persistence</span>
          <span className={`font-mono font-semibold ${persistenceMode === 'real_database' ? 'text-green-600' : 'text-orange-500'}`}>
            {persistenceMode ?? 'in_memory_only'}
          </span>
        </div>
      </div>
      {degradedSystems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-orange-600 mb-1">Degraded Systems</p>
          {degradedSystems.slice(0, 6).map(s => (
            <p key={s} className="text-[10px] font-mono text-orange-500">{s}</p>
          ))}
        </div>
      )}
    </div>
  )
}
