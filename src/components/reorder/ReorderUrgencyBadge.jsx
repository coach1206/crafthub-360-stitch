export default function ReorderUrgencyBadge({ urgency }) {
  const cfg = {
    critical: 'bg-red-100 text-red-800',
    urgent:   'bg-orange-100 text-orange-800',
    high:     'bg-yellow-100 text-yellow-800',
    normal:   'bg-blue-100 text-blue-700',
    low:      'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${cfg[urgency] ?? 'bg-gray-100 text-gray-500'}`}>
      {urgency ?? 'normal'}
    </span>
  )
}
