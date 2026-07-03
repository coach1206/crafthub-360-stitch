import React from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function ManualPOS360HandoffPanel({ handoffs = [], onCreateHandoff, sessionId }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Manual POS360 Handoff</span>
        <StaffStatusBadge status="manual_pos360_handoff" />
      </div>

      <div className="p-4 space-y-3">
        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
          POS sync has not occurred. Staff must enter this order into the POS manually.
        </div>
        <button
          onClick={() => onCreateHandoff?.()}
          className="min-h-[44px] w-full px-4 bg-yellow-600 text-white rounded text-sm font-semibold"
        >
          Create Manual POS360 Handoff
        </button>

        {handoffs.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500">Recent Handoffs</div>
            {handoffs.map(h => (
              <div key={h.handoff_id} className="flex items-center gap-2 text-xs flex-wrap">
                <span className="font-mono text-gray-400">{h.handoff_id?.slice(0,8)}</span>
                <StaffStatusBadge status={h.handoff_status} />
                <StaffStatusBadge status={h.pos_status} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 bg-yellow-50 border-t">
        manual_pos360_handoff · pos_sync_pending · not_persisted
      </div>
    </div>
  )
}
