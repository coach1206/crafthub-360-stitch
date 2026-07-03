import React, { useState } from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function ManagerApprovalPanel({ approvals = [], onApprove, onReject, onRequest }) {
  const [reason, setReason] = useState('')
  const [approvalType, setApprovalType] = useState('request_comp')

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Manager Approval</span>
        <StaffStatusBadge status="manager_approval_required" />
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">Request Approval</div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={approvalType}
              onChange={e => setApprovalType(e.target.value)}
            >
              {['request_comp','request_void','request_refund','request_discount','force_close_table','override_order_status','override_payment_status'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              className="flex-1 min-w-[120px] border rounded px-2 py-1 text-sm"
              placeholder="Reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <button
              onClick={() => onRequest?.({ approval_type: approvalType, reason })}
              className="min-h-[44px] px-3 bg-red-600 text-white rounded text-sm"
            >Request</button>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">Pending Approvals</div>
          {approvals.length === 0
            ? <div className="text-sm text-gray-400 py-2">No pending approvals.</div>
            : approvals.map(a => (
              <div key={a.approval_request_id} className="flex items-center gap-2 py-2 border-b border-gray-100 flex-wrap">
                <span className="text-xs font-mono text-gray-500">{a.approval_request_id?.slice(0,8)}</span>
                <span className="text-sm">{a.approval_type}</span>
                <StaffStatusBadge status={a.approval_status} />
                {a.approval_status === 'manager_approval_required' && (
                  <>
                    <button onClick={() => onApprove?.(a.approval_request_id)} className="min-h-[44px] px-2 bg-green-600 text-white rounded text-xs">Approve</button>
                    <button onClick={() => onReject?.(a.approval_request_id)} className="min-h-[44px] px-2 bg-red-500 text-white rounded text-xs">Reject</button>
                  </>
                )}
              </div>
            ))
          }
        </div>
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 bg-red-50 border-t">
        manager_approval_required · manager_approved_preview · not_persisted
      </div>
    </div>
  )
}
