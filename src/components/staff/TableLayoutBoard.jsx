/**
 * TableLayoutBoard
 * Real drag/drop via @dnd-kit/core (PointerSensor + KeyboardSensor).
 * Supports x/y positioning, snap-to-grid, rotate, undo, collision/boundary warnings.
 * Position updates are preview-only — returns layout_save_preview / layout_not_persisted.
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragOverlay, useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import TableCard from './TableCard.jsx'
import StaffStatusBadge from './StaffStatusBadge.jsx'
import {
  snapPositionToGrid,
  buildClientSideCollisionWarnings,
  buildClientSideBoundaryWarnings,
  buildOptimisticLayoutPreview,
  buildLayoutUndoStack,
  applyKeyboardMove as engineKeyboardMove,
  applyRotation,
} from '../../services/staff/tableDragDropEngine.js'
import { updateTableLayoutPosition } from '../../services/staff/staffOrderApi.js'

const CANVAS_W = 1200
const CANVAS_H = 800
const DEFAULT_GRID = 20

function DraggableTable({ table, selected, statusMap, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: table.table_id })
  const style = {
    position:  'absolute',
    left:      table.x_position ?? 0,
    top:       table.y_position ?? 0,
    width:     table.width ?? 100,
    height:    table.height ?? 80,
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.5 : 1,
    zIndex:    selected ? 10 : 1,
    touchAction: 'none',
  }
  if (table.rotation) style.transform = (style.transform ?? '') + ` rotate(${table.rotation}deg)`

  return (
    <div ref={setNodeRef} style={style} onClick={() => onSelect?.(table.table_id)} {...attributes}>
      <div {...listeners} style={{ cursor: 'grab' }}>
        <TableCard
          table={table}
          tableStatus={statusMap?.[table.table_id]}
          selected={selected}
        />
      </div>
    </div>
  )
}

export default function TableLayoutBoard({
  tables = [], statusMap = {}, selectedTableId, onSelectTable,
  venueId, onPositionUpdate,
}) {
  const [localTables, setLocalTables]     = useState(tables)
  const [snapEnabled, setSnapEnabled]     = useState(true)
  const [gridSize, setGridSize]           = useState(DEFAULT_GRID)
  const [activeId, setActiveId]           = useState(null)
  const [undoStack, setUndoStack]         = useState([])
  const [warnings, setWarnings]           = useState([])
  const [saveStatus, setSaveStatus]       = useState('layout_save_preview')
  const [sectionFilter, setSectionFilter] = useState(null)
  const dragStartPos = useRef({})

  // Keep in sync with props when parent refreshes
  React.useEffect(() => { setLocalTables(tables) }, [tables])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const getTable = id => localTables.find(t => t.table_id === id)

  function handleDragStart({ active }) {
    setActiveId(active.id)
    const t = getTable(active.id)
    if (t) dragStartPos.current = { x: t.x_position ?? 0, y: t.y_position ?? 0 }
  }

  const handleDragEnd = useCallback(({ active, delta }) => {
    setActiveId(null)
    const table = getTable(active.id)
    if (!table) return

    let newPos = {
      x_position: Math.max(0, (table.x_position ?? 0) + delta.x),
      y_position: Math.max(0, (table.y_position ?? 0) + delta.y),
      width:  table.width  ?? 100,
      height: table.height ?? 80,
      rotation: table.rotation ?? 0,
      table_id: table.table_id,
    }
    if (snapEnabled) newPos = snapPositionToGrid(newPos, gridSize)
    newPos.x_position = Math.min(newPos.x_position, CANVAS_W - newPos.width)
    newPos.y_position = Math.min(newPos.y_position, CANVAS_H - newPos.height)

    const allPos = localTables.map(t => ({ ...t, table_id: t.table_id }))
    const cols = buildClientSideCollisionWarnings(newPos, allPos)
    const bounds = buildClientSideBoundaryWarnings(newPos, { width: CANVAS_W, height: CANVAS_H })
    setWarnings([...cols, ...bounds])

    const prev = [...localTables]
    const updated = buildOptimisticLayoutPreview(localTables, { ...table, ...newPos })
    setUndoStack(s => [...s, buildLayoutUndoStack(prev, updated)])
    setLocalTables(updated)
    setSaveStatus('layout_save_preview')

    if (venueId) {
      updateTableLayoutPosition(venueId, table.table_id, newPos).then(r => {
        setSaveStatus(r.ok ? 'table_position_updated_preview' : 'layout_not_persisted')
        onPositionUpdate?.(table.table_id, newPos, r)
      })
    }
  }, [localTables, snapEnabled, gridSize, venueId, onPositionUpdate])

  function handleKeyboardMove(direction) {
    if (!selectedTableId) return
    const table = getTable(selectedTableId)
    if (!table) return
    const newPos = engineKeyboardMove({ x_position: table.x_position ?? 0, y_position: table.y_position ?? 0, width: table.width ?? 100, height: table.height ?? 80, rotation: table.rotation ?? 0 }, direction, gridSize)
    const allPos = localTables.map(t => ({ ...t }))
    setWarnings(buildClientSideCollisionWarnings({ ...newPos, table_id: selectedTableId }, allPos))
    const prev = [...localTables]
    const updated = buildOptimisticLayoutPreview(localTables, { ...table, ...newPos })
    setUndoStack(s => [...s, buildLayoutUndoStack(prev, updated)])
    setLocalTables(updated)
    setSaveStatus('layout_save_preview')
    if (venueId) updateTableLayoutPosition(venueId, selectedTableId, newPos).then(r => setSaveStatus(r.ok ? 'table_position_updated_preview' : 'layout_not_persisted'))
  }

  function handleRotate(deg) {
    if (!selectedTableId) return
    const table = getTable(selectedTableId)
    if (!table) return
    const newPos = applyRotation({ x_position: table.x_position ?? 0, y_position: table.y_position ?? 0, width: table.width ?? 100, height: table.height ?? 80, rotation: table.rotation ?? 0 }, deg)
    const prev = [...localTables]
    const updated = buildOptimisticLayoutPreview(localTables, { ...table, ...newPos })
    setUndoStack(s => [...s, buildLayoutUndoStack(prev, updated)])
    setLocalTables(updated)
    setSaveStatus('layout_save_preview')
  }

  function handleUndo() {
    if (!undoStack.length) return
    const last = undoStack[undoStack.length - 1]
    setLocalTables(last.previous)
    setUndoStack(s => s.slice(0, -1))
    setSaveStatus('layout_save_preview')
    setWarnings([])
  }

  function handleReset() {
    setLocalTables(tables)
    setUndoStack([])
    setWarnings([])
    setSaveStatus('layout_not_persisted')
  }

  const sections = [...new Set(localTables.map(t => t.section_id).filter(Boolean))]
  const visibleTables = sectionFilter
    ? localTables.filter(t => t.section_id === sectionFilter)
    : localTables

  const activeTable = activeId ? getTable(activeId) : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between flex-wrap gap-2">
        <span className="font-semibold text-sm">Floor Layout</span>
        <div className="flex items-center gap-2 flex-wrap">
          <StaffStatusBadge status="drag_drop_active" label="drag_drop_active" />
          <StaffStatusBadge status={saveStatus} />
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 bg-gray-50 border-b flex flex-wrap gap-2 items-center text-xs">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={snapEnabled} onChange={e => setSnapEnabled(e.target.checked)} />
          Snap {gridSize}px
        </label>
        <select className="border rounded px-1 py-0.5 text-xs" value={gridSize} onChange={e => setGridSize(+e.target.value)}>
          {[10,20,40,80].map(g => <option key={g} value={g}>{g}px grid</option>)}
        </select>
        {sections.length > 0 && (
          <select className="border rounded px-1 py-0.5 text-xs" value={sectionFilter ?? ''} onChange={e => setSectionFilter(e.target.value || null)}>
            <option value="">All sections</option>
            {sections.map(s => <option key={s} value={s}>{s.slice(0,8)}</option>)}
          </select>
        )}
        {selectedTableId && (
          <div className="flex gap-1">
            {['up','down','left','right'].map(d => (
              <button key={d} onClick={() => handleKeyboardMove(d)} className="min-w-[44px] min-h-[44px] border rounded px-2 py-1 text-xs font-mono" aria-label={`Move table ${d}`}>{d[0].toUpperCase()}</button>
            ))}
            <button onClick={() => handleRotate(-90)} className="min-w-[44px] min-h-[44px] border rounded px-2 text-xs" aria-label="Rotate table left">↺</button>
            <button onClick={() => handleRotate(90)}  className="min-w-[44px] min-h-[44px] border rounded px-2 text-xs" aria-label="Rotate table right">↻</button>
          </div>
        )}
        <button onClick={handleUndo}  disabled={!undoStack.length} className="min-h-[44px] px-2 border rounded text-xs disabled:opacity-40" aria-label="Undo last move">Undo</button>
        <button onClick={handleReset} className="min-h-[44px] px-2 border rounded text-xs" aria-label="Reset layout">Reset</button>
      </div>

      {/* Canvas */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          className="relative bg-gray-50 overflow-auto"
          style={{ width: '100%', height: 480, backgroundImage: snapEnabled ? `radial-gradient(circle, #d1d5db 1px, transparent 1px)` : 'none', backgroundSize: `${gridSize}px ${gridSize}px` }}
        >
          {visibleTables.map(t => (
            <DraggableTable
              key={t.table_id}
              table={t}
              selected={selectedTableId === t.table_id}
              statusMap={statusMap}
              onSelect={onSelectTable}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTable && (
            <div style={{ width: activeTable.width ?? 100, height: activeTable.height ?? 80, opacity: 0.8 }}>
              <TableCard table={activeTable} tableStatus={statusMap?.[activeTable.table_id]} selected />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="px-4 py-2 bg-orange-50 border-t">
          {warnings.map((w,i) => <div key={i} className="text-xs text-orange-700">{w.type}: {w.message}</div>)}
        </div>
      )}

      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
        floor_layout_preview · table_layout_preview · drag_drop_active · layout_not_persisted
      </div>
    </div>
  )
}
