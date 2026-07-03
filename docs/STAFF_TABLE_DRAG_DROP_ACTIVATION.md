# Staff Table Drag/Drop Activation

Real drag/drop layout behavior must be proven by an active drag/drop implementation or clearly reported as drag_drop_library_required. A coordinate data model alone is not proof of drag/drop.

## Drag/Drop Status

**Status: drag_drop_active**

- Library: `@dnd-kit/core` v6.x + `@dnd-kit/utilities` v3.x
- Sensors: `PointerSensor` (mouse + touch), `KeyboardSensor`
- Activation: pointer distance >= 4px to avoid accidental drags
- Position updates: integer math, NaN-safe, sent via `updateTableLayoutPosition` to `/api/staff`

## What is Real vs Preview-Only

| Feature | Status |
|---|---|
| Drag/drop via @dnd-kit | **Real — drag_drop_active** |
| Touch drag | **Real — touch_move_ready** |
| Keyboard move (UDLR) | **Real — keyboard_move_ready** |
| Snap-to-grid | **Real — snap_grid_ready** |
| Collision detection | **Real (client-side) — collision_warning** |
| Boundary warnings | **Real (client-side) — section_boundary_warning** |
| Undo stack | **Real (client-side) — undoAvailable** |
| Position update API call | **Real call, preview response — table_position_updated_preview** |
| Database persistence | **Not active — database_required** |
| Layout saved live | **Never claimed — layout_not_persisted** |
| POS sync | **Never claimed — pos_sync_pending** |

## Library

```
@dnd-kit/core ^6.3.1
@dnd-kit/utilities ^3.2.2
```

Installed. Not faked.

## Touch Movement Behavior

- `PointerSensor` handles both mouse and touch pointer events
- `touchAction: 'none'` on draggable elements prevents browser scroll interference
- `DragOverlay` shows ghost table during drag

## Keyboard Movement Behavior

- `KeyboardSensor` enables keyboard-driven drag in @dnd-kit
- Arrow key controls (Up/Down/Left/Right) available when a table is selected
- Step size matches grid size (default 20px)

## Snap-to-Grid Behavior

- Enabled by default (20px grid)
- Grid size selectable: 10, 20, 40, 80px
- Canvas shows dot-grid background when snap is enabled
- `buildSnapGridPosition` rounds to nearest grid unit

## Table Coordinate Model

```
x_position  — integer pixels from left edge of canvas
y_position  — integer pixels from top edge of canvas
width       — integer pixels (min 40)
height      — integer pixels (min 30)
rotation    — degrees 0–359
section_id  — UUID or null
device_mode — 'tablet' | 'desktop' | 'mobile'
```

## Section Boundary Warnings

- `buildClientSideBoundaryWarnings` checks x+width vs canvas width, y+height vs canvas height
- Returns `section_boundary_warning` array
- Shown inline in `LayoutWarningPanel`

## Collision/Overlap Warnings

- `buildClientSideCollisionWarnings` checks AABB overlap between moved table and all other tables
- Returns `collision_warning` array
- Shown inline in canvas and `LayoutWarningPanel`

## Save Preview Behavior

- All position changes are immediately applied optimistically to local state
- API call to `POST /api/staff/venue/:venueId/tables/:tableId/layout-position` is made after each drag
- Server responds with `table_position_updated_preview` and `layout_not_persisted`
- `LayoutSavePreviewBar` shows unsaved state and `layout_save_preview` button
- "Save Preview" confirms the in-memory snapshot — does not persist to database

## Reset / Undo Behavior

- **Undo**: reverts last optimistic layout change from client-side undo stack
- **Reset**: restores tables to their original position from props
- `resetTableLayoutPreview` API call wipes server-side in-memory positions

## Patio Layout Behavior

- `PatioLayoutPanel` filters tables with `section_type === 'patio'` or `metadata.is_patio`
- Embedded `TableLayoutBoard` with full drag/drop support
- Returns `patio_layout_preview` — no live reservation or weather claimed

## Manager Approval Visibility

- `ManagerApprovalPanel` present in demo and accessible from `TableActionMenu`
- `manager_approval_required` actions: comp, void, refund, discount, overrides
- Approval returns `manager_approved_preview` — not live

## Manual POS360 Visibility

- `ManualPOS360HandoffPanel` present in demo and accessible from `TableActionMenu`
- Returns `manual_pos360_handoff` + `pos_sync_pending` — staff must enter into POS manually

## Database Fallback Behavior

Without `DATABASE_URL`:
- All responses return `layout_not_persisted`
- In-memory Maps store layout positions
- `preview_fallback` returned on API errors

## What Remains for Future Production Hardening

1. Database persistence of layout positions (requires live DATABASE_URL)
2. Multi-user real-time layout sync (WebSocket / Supabase Realtime)
3. Conflict resolution for concurrent layout edits
4. Per-device layout save (separate tablet vs desktop layout)
5. Section boundary enforcement with real section shape polygons
6. Server-side collision enforcement (strictCollisionMode)
7. Live table status WebSocket updates
