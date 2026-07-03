export default function ReorderDemandSignalPanel({ signals = [] }) {
  if (!signals.length) return (
    <div className="rounded-lg border p-3 text-xs text-gray-500">
      No demand signals. <span className="text-blue-500">no_demand_signals</span>
    </div>
  )
  const sourceColor = {
    checkout: 'bg-red-50 text-red-700',
    pos360:   'bg-purple-50 text-purple-700',
    ncie:     'bg-blue-50 text-blue-700',
    kds:      'bg-orange-50 text-orange-700',
    system:   'bg-gray-50 text-gray-600',
    staff:    'bg-green-50 text-green-700',
    manager:  'bg-yellow-50 text-yellow-700',
  }
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 space-y-2">
      <p className="font-semibold text-sm">Demand Signals ({signals.length})</p>
      {signals.slice(0, 8).map(s => (
        <div key={s.signal_id} className="flex items-center justify-between text-xs">
          <span className="truncate max-w-[140px]">{s.product_name}</span>
          <div className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${sourceColor[s.signal_source] ?? 'bg-gray-100 text-gray-500'}`}>
              {s.signal_source}
            </span>
            <span className="text-gray-400">×{s.times_blocked}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
