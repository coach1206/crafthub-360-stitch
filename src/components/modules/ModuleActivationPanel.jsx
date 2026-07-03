export default function ModuleActivationPanel({ report }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Module Activation</h2>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Status:</span> <span className="text-blue-600 dark:text-blue-400">{report?.activationStatus ?? 'activation_ready'}</span></div>
        <div><span className="font-medium">Requirements:</span> <span>{report?.requirementsStatus ?? 'activation_ready'}</span></div>
        <div><span className="font-medium">DB Required:</span> <span className="text-yellow-600 dark:text-yellow-400">{report?.database_required ? 'yes' : 'no'}</span></div>
      </div>
      <div className="text-xs text-amber-600 dark:text-amber-400">activation_preview · no code installed</div>
    </div>
  )
}
