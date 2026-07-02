import React from 'react'
import { BarChart2, AlertCircle } from 'lucide-react'

function PreviewRow({ label, value, note }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        {note && <p className="text-xs text-zinc-600">{note}</p>}
      </div>
      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{value}</span>
    </div>
  )
}

export default function NCIECommerceInsightPanel({ intelligence, venueId }) {
  if (!intelligence) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
        <BarChart2 className="mx-auto mb-2 text-zinc-600" size={20} />
        <p className="text-zinc-500 text-sm">Commerce signals loading…</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <BarChart2 size={16} className="text-amber-400" />
        <span className="text-sm font-medium text-white">Commerce Intelligence</span>
        <span className="ml-auto text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">preview</span>
      </div>

      <div className="p-4">
        <div className="bg-amber-900/10 border border-amber-700/20 rounded-lg px-3 py-2 flex items-start gap-2 mb-4">
          <AlertCircle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-zinc-400">
            Commerce signals are preview-only. No live order, inventory, or revenue data was queried.
            NOVEE OS does not hold venue or vendor funds.
          </p>
        </div>

        <PreviewRow label="Order Signals" value={intelligence.orderSignals?.orderSignalMode ?? 'commerce_preview'} />
        <PreviewRow label="Inventory Status" value={intelligence.inventorySignals?.inventoryStatus ?? 'inventory_unavailable'} />
        <PreviewRow label="Revenue Signals" value={intelligence.revenueSignals?.revenueSignalMode ?? 'commerce_preview'} note="No funds captured or held" />
        <PreviewRow label="Partner Signals" value={intelligence.partnerSignals?.partnerSignalMode ?? 'commerce_preview'} />
      </div>
    </div>
  )
}
