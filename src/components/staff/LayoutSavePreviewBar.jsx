import React from 'react'
import StaffStatusBadge from './StaffStatusBadge.jsx'

export default function LayoutSavePreviewBar({
  hasUnsavedChanges, undoAvailable, onSavePreview, onReset, onUndo,
  saveStatus = 'layout_save_preview', persistenceStatus = 'layout_not_persisted',
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex-wrap">
      <div className="flex gap-2 flex-wrap">
        <StaffStatusBadge status={saveStatus} />
        <StaffStatusBadge status={persistenceStatus} />
      </div>
      {hasUnsavedChanges && (
        <span className="text-xs text-yellow-700 font-medium">Unsaved layout changes</span>
      )}
      <div className="flex gap-2 ml-auto">
        <button
          onClick={onUndo}
          disabled={!undoAvailable}
          className="min-h-[44px] px-3 border rounded text-sm disabled:opacity-40"
          aria-label="Undo last layout change"
        >Undo</button>
        <button
          onClick={onReset}
          className="min-h-[44px] px-3 border rounded text-sm"
          aria-label="Reset layout to default"
        >Reset</button>
        <button
          onClick={onSavePreview}
          className="min-h-[44px] px-4 bg-yellow-600 text-white rounded text-sm font-semibold"
          aria-label="Save layout preview"
        >Save Preview</button>
      </div>
      <div className="w-full text-xs text-yellow-600">
        Layout preview only. Not persisted. database_required for live save.
      </div>
    </div>
  )
}
