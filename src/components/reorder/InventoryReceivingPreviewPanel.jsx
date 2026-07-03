export default function InventoryReceivingPreviewPanel({ receiving, onConfirm }) {
  if (!receiving) return (
    <div className="rounded-lg border p-3 text-xs text-gray-500">
      No receiving preview. <span className="text-blue-500">receiving_pending</span>
    </div>
  )
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Inventory Receiving</p>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
          {receiving.receiving_status}
        </span>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p>Vendor: {receiving.vendor_name ?? 'Unknown'}</p>
        <p>Expected: {receiving.items_expected} items</p>
        <p>Received: {receiving.items_received} items</p>
      </div>
      <p className="text-[10px] text-gray-400">database_required · inventory not updated until confirmed</p>
      {onConfirm && (
        <button
          onClick={() => onConfirm(receiving)}
          className="w-full min-h-[44px] rounded bg-blue-600 text-white text-xs font-medium px-3 py-2 hover:bg-blue-700"
        >
          Confirm Receipt
        </button>
      )}
    </div>
  )
}
