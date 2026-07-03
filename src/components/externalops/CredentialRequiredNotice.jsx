export default function CredentialRequiredNotice({ missing = [] }) {
  return (
    <div className="rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-700 p-3 space-y-1">
      <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">credentials_required</p>
      {missing.map((key, i) => (
        <p key={i} className="text-[10px] font-mono text-orange-600 dark:text-orange-400">{key} · missing</p>
      ))}
      <p className="text-[10px] text-gray-400">Credential values are never returned in API responses.</p>
    </div>
  )
}
