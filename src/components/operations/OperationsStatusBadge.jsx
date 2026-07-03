const STATUS_STYLES = {
  operational:             'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  degraded:                'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  preview_only:            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  credential_required:     'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  database_required:       'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  vendor_setup_required:   'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  blocked:                 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  external_sync_not_live:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200',
  failed:                  'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
}

export default function OperationsStatusBadge({ status = 'degraded', size = 'sm' }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.degraded
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-semibold ${size === 'xs' ? 'text-[10px]' : 'text-xs'} ${cls}`}>
      {status}
    </span>
  )
}
