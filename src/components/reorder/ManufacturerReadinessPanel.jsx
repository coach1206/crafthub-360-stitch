export default function ManufacturerReadinessPanel({ readiness }) {
  const hasManufacturers = (readiness?.manufacturerCount ?? 0) > 0
  return (
    <div className={`rounded-lg border p-3 text-sm ${hasManufacturers ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-gray-200 bg-gray-50 dark:bg-gray-800'}`}>
      <p className="font-semibold mb-1">Manufacturer Readiness</p>
      {hasManufacturers ? (
        <p className="text-xs text-green-700 dark:text-green-300">{readiness.manufacturerCount} manufacturer(s) registered</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">manufacturer_connection_required</p>
          <p className="text-xs text-gray-400 mt-1">Register a manufacturer vendor to enable direct order drafts.</p>
        </>
      )}
    </div>
  )
}
