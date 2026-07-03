const MODE_STYLE = {
  local_demo:          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  local_database:      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  staging_database:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  production_database: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  database_missing:    'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  degraded_mode:       'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
}

export default function EnvironmentModeBadge({ mode = 'local_demo' }) {
  const cls = MODE_STYLE[mode] ?? MODE_STYLE.local_demo
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${cls}`}>
      {mode}
    </span>
  )
}
