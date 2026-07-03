export default function EATReorderCommandPanel({ hooks = {} }) {
  const entries = Object.entries(hooks)
  if (!entries.length) return (
    <div className="rounded-lg border p-3 text-xs text-gray-500">
      No E.A.T. reorder hooks registered.
    </div>
  )
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">E.A.T. Reorder Command Hub</p>
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400 font-mono truncate max-w-[60%]">{key}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            typeof val === 'string' && val.includes('required') ? 'bg-yellow-100 text-yellow-700' :
            typeof val === 'string' && val.includes('pending') ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>{typeof val === 'string' ? val : JSON.stringify(val)}</span>
        </div>
      ))}
    </div>
  )
}
