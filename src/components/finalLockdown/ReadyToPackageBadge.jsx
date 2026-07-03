export default function ReadyToPackageBadge({ status = 'needs_module_manifest' }) {
  const config = {
    ready_to_package: { label: 'Ready to Package', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    needs_module_manifest: { label: 'Needs Module Manifest', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    needs_install_hooks: { label: 'Needs Install Hooks', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    needs_license_gate: { label: 'Needs License Gate', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    future_module: { label: 'Future Module', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  }
  const { label, color } = config[status] || config.needs_module_manifest
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${color}`}>
      {label}
    </span>
  )
}
