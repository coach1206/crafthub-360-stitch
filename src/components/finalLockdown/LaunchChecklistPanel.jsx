const CHECKLIST = [
  { item: 'DATABASE_URL configured', done: false, required: true },
  { item: 'SESSION_SECRET configured', done: false, required: true },
  { item: 'STRIPE_SECRET_KEY configured', done: false, required: true },
  { item: 'Database migrations run', done: false, required: true },
  { item: 'Production build clean', done: true, required: true },
  { item: 'All 20 verification scripts pass', done: true, required: true },
  { item: 'EXTERNAL_POS_API_KEY (preview without)', done: false, required: false },
  { item: 'VENDOR_API_KEY (preview without)', done: false, required: false },
]

export default function LaunchChecklistPanel({ checklist = CHECKLIST }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Launch Checklist</p>
      <div className="text-[10px] space-y-0.5">
        {checklist.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={item.done ? 'text-green-500' : item.required ? 'text-red-400' : 'text-gray-400'}>
              {item.done ? '✓' : '✗'}
            </span>
            <span className={item.done ? 'text-gray-500' : item.required ? 'text-red-400' : 'text-gray-400'}>
              {item.item}
              {!item.required && ' (optional)'}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-orange-400">production_blocked until required items complete</p>
    </div>
  )
}
