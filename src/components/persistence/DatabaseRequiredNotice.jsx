export default function DatabaseRequiredNotice({ context = '' }) {
  return (
    <div className="rounded border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-700 p-3 text-xs">
      <p className="font-semibold text-orange-800 dark:text-orange-200">database_required</p>
      <p className="text-orange-700 dark:text-orange-300 mt-0.5">
        {context || 'Data is held in memory only. Connect a database to enable durable persistence.'}
      </p>
    </div>
  )
}
