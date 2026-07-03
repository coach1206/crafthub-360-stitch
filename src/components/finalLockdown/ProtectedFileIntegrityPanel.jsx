export default function ProtectedFileIntegrityPanel({ report = {} }) {
  const files = report.existence?.files || []
  const allPresent = report.existence?.all_present ?? false
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Protected File Integrity</p>
      <p className={`text-xs ${allPresent ? 'text-green-600' : 'text-red-500'}`}>
        {allPresent ? 'All protected files intact' : 'Missing protected files'}
      </p>
      <div className="text-[10px] space-y-0.5 font-mono">
        {files.slice(0, 6).map((f, i) => (
          <p key={i} className={f.exists ? 'text-gray-500' : 'text-red-500'}>
            {f.exists ? '✓' : '✗'} {f.file.split('/').pop()}
          </p>
        ))}
        {files.length > 6 && <p className="text-gray-400">+{files.length - 6} more</p>}
      </div>
      <p className="text-[10px] text-gray-400">integrity_method: existence_and_contract_check</p>
    </div>
  )
}
