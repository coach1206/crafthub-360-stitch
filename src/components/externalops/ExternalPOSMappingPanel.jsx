export default function ExternalPOSMappingPanel({ mappings = [], unmapped = {} }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">POS Product Mapping</p>
        <span className="text-xs font-semibold text-orange-500">mapping_required</span>
      </div>
      <p className="text-xs text-orange-500">pos_product_mapping_required</p>
      <p className="text-xs text-gray-500">Mapped: {mappings.length} · Unmapped: {unmapped.unmappedCount ?? 0}</p>
      <p className="text-[10px] text-gray-400">external_pos_required · no live pos configured</p>
    </div>
  )
}
