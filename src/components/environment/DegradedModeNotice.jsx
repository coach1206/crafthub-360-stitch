export default function DegradedModeNotice({ active = true, reason = null }) {
  if (!active) return null
  return (
    <div className="rounded border border-red-200 bg-red-50 dark:bg-red-900 dark:border-red-700 p-2 text-xs text-red-800 dark:text-red-200">
      <p><strong>degraded_mode</strong> — {reason ?? 'DATABASE_URL not set. All persistence is in_memory_only and will not survive a server restart.'}</p>
      <p className="mt-0.5 text-[10px] text-red-500">database_required · in_memory_only · set DATABASE_URL to restore full persistence</p>
    </div>
  )
}
