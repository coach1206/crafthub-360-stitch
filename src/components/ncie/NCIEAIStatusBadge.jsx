import React from 'react'
import { Bot, AlertCircle, CheckCircle } from 'lucide-react'

export default function NCIEAIStatusBadge({ aiStatus = 'ai_unavailable', compact = false }) {
  const isAvailable = aiStatus === 'ai_key_present' || aiStatus === 'ai_response_received'
  const isError     = aiStatus === 'ai_error'

  const config = isError
    ? { icon: AlertCircle, label: 'AI error', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700/30' }
    : isAvailable
      ? { icon: CheckCircle, label: 'AI preview', color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-700/30' }
      : { icon: Bot, label: 'AI unavailable', color: 'text-zinc-500', bg: 'bg-zinc-900', border: 'border-zinc-700' }

  const Icon = config.icon

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
        <Icon size={10} />
        {config.label}
      </span>
    )
  }

  return (
    <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${config.bg} ${config.border}`}>
      <Icon size={14} className={config.color} />
      <div>
        <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
        {!isAvailable && !isError && (
          <p className="text-xs text-zinc-600">Configure VITE_OPENAI_KEY to enable AI mentor personalization.</p>
        )}
        {isAvailable && (
          <p className="text-xs text-zinc-500">AI personalizes delivery. Internal outlines are the source of truth.</p>
        )}
        {isError && (
          <p className="text-xs text-zinc-500">AI request failed. Internal outline returned as fallback.</p>
        )}
      </div>
    </div>
  )
}
