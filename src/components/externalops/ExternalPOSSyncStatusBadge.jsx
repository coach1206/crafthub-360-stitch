export default function ExternalPOSSyncStatusBadge({ status = 'external_sync_not_live' }) {
  const color = status === 'connected' ? 'text-green-600' : status === 'preview_only' ? 'text-blue-500' : 'text-orange-500'
  return <span className={`text-xs font-mono font-semibold ${color}`}>{status}</span>
}
