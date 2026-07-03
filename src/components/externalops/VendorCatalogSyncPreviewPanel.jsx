export default function VendorCatalogSyncPreviewPanel({ vendorId, syncResult = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Vendor Catalog Sync</p>
        <span className="text-xs font-semibold text-blue-500">preview_only</span>
      </div>
      <p className="text-xs text-gray-500">Vendor: {vendorId ?? '—'}</p>
      <p className="text-xs text-orange-500">vendor_api_required · external_sync_not_live</p>
      <p className="text-[10px] text-gray-400">vendor_catalog_sync_preview_only · no live vendor api</p>
    </div>
  )
}
