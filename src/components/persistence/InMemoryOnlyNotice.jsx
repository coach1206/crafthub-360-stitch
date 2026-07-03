export default function InMemoryOnlyNotice({ context = '' }) {
  return (
    <div className="rounded border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700 p-3 text-xs">
      <p className="font-semibold text-yellow-800 dark:text-yellow-200">in_memory_only</p>
      <p className="text-yellow-700 dark:text-yellow-300 mt-0.5">
        {context || 'This data is stored in memory only and will be lost on server restart. Database connection required for persistence.'}
      </p>
    </div>
  )
}
