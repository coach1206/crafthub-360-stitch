export default function VendorConnectionStatusPanel({ readiness }) {
  if (!readiness) return (
    <div className="rounded-lg border p-4 text-xs text-gray-500">
      Loading vendor connection status… <span className="text-blue-500">pending_setup</span>
    </div>
  )
  const statusColor = readiness.connectionStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Vendor Connections</p>
        <span className={`text-xs font-medium ${statusColor}`}>{readiness.connectionStatus}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <p className="text-lg font-bold">{readiness.vendorCount ?? 0}</p>
          <p className="text-gray-500">Vendors</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900 rounded p-2">
          <p className="text-lg font-bold text-blue-700">{readiness.distributorCount ?? 0}</p>
          <p className="text-gray-500">Distributors</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 rounded p-2">
          <p className="text-lg font-bold text-purple-700">{readiness.manufacturerCount ?? 0}</p>
          <p className="text-gray-500">Manufacturers</p>
        </div>
      </div>
      {readiness.blockers?.map((b, i) => (
        <div key={i} className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
          {b.type}
        </div>
      ))}
      <p className="text-[10px] text-gray-400">{readiness.persistenceStatus}</p>
    </div>
  )
}
