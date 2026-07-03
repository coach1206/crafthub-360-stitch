import React from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function StaffReadinessPanel({ readiness }) {
  if (!readiness) return null
  const { readinessScore = 0, blockers = [], staffOrderStatus, persistenceStatus } = readiness
  const scoreColor = readinessScore >= 80 ? 'text-green-600' : readinessScore >= 50 ? 'text-yellow-600' : 'text-red-600'
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Staff Order Readiness</span>
        <span className={`text-xl font-bold ${scoreColor}`}>{readinessScore}/100</span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <StaffStatusBadge status={staffOrderStatus ?? 'staff_order_preview'} />
          <StaffStatusBadge status={persistenceStatus ?? 'not_persisted'} />
        </div>
        {blockers.length > 0 && (
          <div className="space-y-1">
            {blockers.map((b, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded ${b.severity === 'critical' ? 'bg-red-50 text-red-700' : b.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-600'}`}>
                {b.type}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
