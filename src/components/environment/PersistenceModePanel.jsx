export default function PersistenceModePanel({ mode = {} }) {
  const isDb = mode.persistenceMode === 'real_database'
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Persistence Mode</p>
        <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${isDb ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {mode.persistenceMode ?? 'in_memory_only'}
        </span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Can write</span>
          <span className={mode.canWrite ? 'text-green-600 font-medium' : 'text-gray-400'}>{mode.canWrite ? 'yes' : 'no'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">In-memory fallback</span>
          <span className={mode.inMemoryFallback ? 'text-orange-500 font-medium' : 'text-gray-400'}>{mode.inMemoryFallback ? 'active' : 'inactive'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Degraded mode</span>
          <span className={mode.degradedMode ? 'text-orange-500 font-medium' : 'text-green-600 font-medium'}>
            {mode.degradedMode ? 'true' : 'false'}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-gray-400">{mode.note}</p>
    </div>
  )
}
