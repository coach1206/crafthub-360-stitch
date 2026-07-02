import React from 'react'
import { Shield, Circle } from 'lucide-react'

const STATUS_DOTS = {
  active:          { color: 'bg-green-500', pulse: true },
  platform_preview: { color: 'bg-amber-500', pulse: false },
  preview:         { color: 'bg-zinc-500', pulse: false },
  pending:         { color: 'bg-zinc-600', pulse: false },
}

function StatusDot({ status }) {
  const config = STATUS_DOTS[status] ?? STATUS_DOTS.preview
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
  )
}

export default function NCIEPlatformStatusBar({ platform, hooks = [] }) {
  const criticals = hooks.filter(h => h.severity === 'critical')
  const warnings  = hooks.filter(h => h.severity === 'warning')

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Shield size={16} className="text-amber-400" />
        <span className="text-sm font-medium text-white">NOVEE OS Status</span>
        <span className="ml-auto flex items-center gap-1.5">
          <StatusDot status={platform?.platformStatus ?? 'platform_preview'} />
          <span className="text-xs text-zinc-500">{platform?.platformStatus ?? 'platform_preview'}</span>
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Platform</span>
          <span className="text-zinc-400">{platform?.platformName ?? 'NOVEE OS'} v{platform?.version ?? '1.0'}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Active Verticals</span>
          <span className="text-zinc-400">{platform?.activeModules?.length ?? 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Registered Verticals</span>
          <span className="text-zinc-400">{platform?.registeredModules?.length ?? 0}</span>
        </div>

        {(criticals.length > 0 || warnings.length > 0) && (
          <div className="pt-2 space-y-1">
            {criticals.map((h, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <Circle size={8} className="text-red-500 mt-0.5 fill-current flex-shrink-0" />
                <span className="text-red-400">{h.message}</span>
              </div>
            ))}
            {warnings.map((h, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <Circle size={8} className="text-amber-500 mt-0.5 fill-current flex-shrink-0" />
                <span className="text-amber-400">{h.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
