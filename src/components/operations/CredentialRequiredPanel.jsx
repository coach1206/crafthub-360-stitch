export default function CredentialRequiredPanel({ credentials = [] }) {
  const missing = credentials.filter(c => c.status === 'missing' || c.status === 'not_configured')
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Credential Requirements</p>
        <span className={`text-xs font-semibold ${missing.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
          {missing.length} missing
        </span>
      </div>
      {credentials.map((c, i) => (
        <div key={c.credential ?? i} className="text-xs border-b dark:border-gray-700 pb-1 space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{c.credential}</span>
            <span className={`font-mono text-[10px] ${c.status === 'present' ? 'text-green-600' : 'text-orange-500'}`}>
              {c.status}
            </span>
          </div>
          <p className="text-[10px] text-gray-400">{c.enablesSystem}</p>
        </div>
      ))}
      <p className="text-[10px] text-gray-400">Credential values are never returned in API responses.</p>
    </div>
  )
}
