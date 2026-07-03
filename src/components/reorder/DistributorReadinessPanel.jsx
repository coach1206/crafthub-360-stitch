export default function DistributorReadinessPanel({ readiness }) {
  const hasDistributors = (readiness?.distributorCount ?? 0) > 0
  return (
    <div className={`rounded-lg border p-3 text-sm ${hasDistributors ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950'}`}>
      <p className="font-semibold mb-1">Distributor Readiness</p>
      {hasDistributors ? (
        <p className="text-xs text-green-700 dark:text-green-300">{readiness.distributorCount} distributor(s) registered</p>
      ) : (
        <>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">distributor_connection_required</p>
          <p className="text-xs text-gray-500 mt-1">Register a distributor vendor to enable reorder recommendations.</p>
        </>
      )}
    </div>
  )
}
