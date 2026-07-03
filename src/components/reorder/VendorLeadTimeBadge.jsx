export default function VendorLeadTimeBadge({ leadTimeDays }) {
  const days = leadTimeDays ?? 0
  const color = days <= 2 ? 'bg-green-100 text-green-700' : days <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {days}d lead time
    </span>
  )
}
