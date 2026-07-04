import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PoweredByNoveeOSBadge from '../../components/shared/PoweredByNoveeOSBadge.jsx'
import {
  CommandStatusBadge, CommandTouchButton, CommandGlassPanel,
  IVORY, IVORY_PANEL, NAVY, NAVY_SOFT, GOLD, GOLD_DEEP, SLATE, LINE,
} from '../../components/pos3/shell/CommandAppShell.jsx'
import {
  getTables, getTickets, getStaff, getLayoutSections,
  assignStaffToTable, updateTableStatus,
} from '../../services/pos3/pos3Service.js'
import {
  calculateTableIntelligenceScore, getGuestMemory, generatePairingRecommendations,
  generateExperienceAlerts, calculateStaffOwnership, detectRevenueLeaks, generateShiftCoachSummary,
} from '../../lib/pos360Intelligence.js'
import { FLOOR_OBJECT_TYPES, FLOOR_OBJECT_TYPE_MAP, FLOOR_PLAN_AREA_TYPES, FLOOR_PLAN_AREA_MAP } from '../../data/pos360VenueSystems.js'
import {
  getFloorObjects, addFloorObject, updateFloorObjectType, duplicateFloorObject,
  rotateFloorObject, lockFloorObject, deleteFloorObject, getInventoryConnections,
  getNetworkHealth, getDeviceHealth, moveFloorObject, toggleFloorObjectVip, assignStaffToFloorObject,
  getFloorPlans, setActiveFloorPlan, createFloorPlan, duplicateFloorPlan, renameFloorPlan,
  resetFloorPlan, deleteFloorPlan, assignBackgroundToFloorPlan, lockFloorPlan,
  getTablePositions, moveTablePosition,
} from '../../services/pos3/venueSystemsService.js'
import { getPendingApprovals, approveRequest, denyRequest, APPROVAL_HONESTY_NOTICE } from '../../services/pos3/approvalService.js'
import { getAuditEvents, AUDIT_HONESTY_NOTICE, recordAuditEvent, AUDIT_EVENT_TYPES } from '../../services/pos3/auditLogService.js'
import { canPerformAction, POS360_ACTIONS } from '../../modules/pos360Permissions.js'
import {
  getUpcomingReservations, getActiveWaitlist, createReservation, addWaitlistEntry,
  seatReservation, seatWaitlistEntry,
} from '../../services/pos3/reservationService.js'

const NAV_ITEMS = [
  ['Overview', '/pos3', 'dashboard'], ['Tables', '/pos3/venue-tables', 'table_restaurant'], ['Orders', '/pos3/orders', 'receipt_long'],
  ['Reservations', null, 'event'], ['Waitlist', null, 'how_to_reg'], ['Guests', null, 'group'], ['Staff', null, 'badge'],
  ['Menu & Inventory', null, 'inventory_2'], ['Integrations', '/pos3/integrations', 'sync'], ['Analytics', null, 'bar_chart'],
  ['Events & Promos', null, 'celebration'], ['Venue Customization', '/pos3/venue-systems', 'palette'], ['Settings', '/pos3/settings', 'settings'],
]
const CONNECTED_SYSTEMS = [
  ['POS3 Sync', 'sync'], ['Oracle Micros', 'point_of_sale'], ['Stripe Terminal', 'credit_card'],
  ['Kitchen Display', 'soup_kitchen'], ['Humidor Lock', 'lock'],
]

// Reference image: /smokecraft-pos360.png — approved POS360 SmokeCraft visual
// (left panel = Floor Management, right panel = Order Entry handheld view)
const STATUS_DOT = {
  open: '#2f9e5b', seated: '#3a6ea8', occupied: '#3a6ea8', busy: '#c9952c',
  reserved: '#7e57c2', needsService: '#c0443a', cleaning: '#6b7385', vip: '#c9952c',
}
const STATUS_CARD_BG = {
  open: 'rgba(20,54,34,0.92)', seated: 'rgba(20,38,68,0.92)', occupied: 'rgba(20,38,68,0.92)',
  busy: 'rgba(54,34,0,0.92)', reserved: 'rgba(40,28,80,0.92)',
  needsService: 'rgba(58,14,12,0.92)', cleaning: 'rgba(30,32,36,0.88)', vip: 'rgba(54,38,0,0.92)',
}
const STATUS_LABEL = {
  open: 'Available', seated: 'Seated', occupied: 'Seated', busy: 'Ordering',
  reserved: 'Reserved', needsService: 'Needs Assist.', cleaning: 'Check Req.', vip: 'VIP',
}
const STATUS_ICON = {
  open: 'check_circle', seated: 'table_bar', occupied: 'table_bar', busy: 'receipt_long',
  reserved: 'event_available', needsService: 'priority_high', cleaning: 'receipt', vip: 'star',
}
const isOccupied = (s) => s === 'seated' || s === 'busy' || s === 'occupied'

// Dark background color constants for the reference-aligned dark POS theme
const DARK_BG   = '#080604'
const DARK_CARD = 'rgba(20,15,8,0.88)'
const DARK_LINE = 'rgba(201,149,44,0.18)'
const DARK_TEXT = '#f3eee1'
const DARK_MUTE = 'rgba(243,238,225,0.5)'

const ZONE_ACCENT = { round: '#3a6ea8', square: '#5a6b80', rect: '#5a6b80', booth: '#7e57c2', chair: '#2f9e5b' }


const VENUE_IMAGE_CARDS = [
  { id: 'food', label: 'Food', count: '48 Images', icon: 'restaurant', img: null, accent: '#c0443a' },
  { id: 'liquor', label: 'Liquor & Cocktails', count: '63 Images', icon: 'local_bar', img: '/pourcraft.jpg', pos: 'center 35%', accent: GOLD_DEEP },
  { id: 'cigars', label: 'Cigars', count: '32 Images', icon: 'inventory_2', img: '/cigar-anatomy.png', pos: 'center', accent: '#8a5a2b' },
  { id: 'pairings', label: 'Pairings', count: '27 Images', icon: 'workspace_premium', img: '/SEED & PAIRING.11.png', pos: 'top left', accent: GOLD_DEEP },
  { id: 'loungeFloor', label: 'Lounge Floor', count: '12 Images', icon: 'weekend', img: '/background-lounge-airy.jpg', pos: 'center', accent: '#7e57c2' },
  { id: 'patioFloor', label: 'Patio Floor', count: '18 Images', icon: 'deck', img: null, accent: '#2f9e5b' },
  { id: 'barArea', label: 'Bar Area', count: '16 Images', icon: 'sports_bar', img: '/pourcraft.jpg', pos: 'center 70%', accent: '#3a6ea8' },
  { id: 'humidorArea', label: 'Humidor Area', count: '14 Images', icon: 'inventory', img: '/humidor match11.png', pos: 'top center', accent: '#8a5a2b' },
]

const UPCOMING_EVENTS = [
  { name: 'Whiskey Tasting', when: 'Tonight · 8:00 PM', seats: '22 / 30 Seats', status: 'Confirmed' },
  { name: 'Live Piano', when: 'Tomorrow · 7:00 PM', seats: '18 / 30 Seats', status: 'Confirmed' },
  { name: 'Cigar Pairing Dinner', when: 'Sat, May 17 · 9:00 PM', seats: '12 / 25 Seats', status: 'Limited' },
]

/** Colored rectangular table card matching the SMOKECRAFT POS360 reference design.
 *  Status = background color tier; number + elapsed time shown inside the card. */
function FloorTable({ table, selected, onSelect, editable, onDragStart }) {
  const statusColor  = STATUS_DOT[table.status]  || STATUS_DOT.open
  const cardBg       = STATUS_CARD_BG[table.status] || STATUS_CARD_BG.open
  const elapsed      = table.elapsedTime || table.elapsed || null

  return (
    <button
      type="button"
      className={selected ? 'floor-piece floor-piece--selected' : 'floor-piece'}
      onClick={() => onSelect(table.id)}
      onPointerDown={editable ? (e) => onDragStart(e, 'table', table.id) : undefined}
      title={`Table ${table.tableNumber} — ${STATUS_LABEL[table.status] || 'Available'}`}
      style={{
        position: 'absolute', left: `${table.x ?? 10}%`, top: `${table.y ?? 10}%`, zIndex: 1,
        width: 46, height: elapsed ? 50 : 42,
        transform: 'translate(-50%,-50%)',
        cursor: editable ? 'grab' : 'pointer', border: 'none', padding: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        touchAction: editable ? 'none' : 'auto',
        borderRadius: 9,
        background: selected ? `linear-gradient(160deg, ${statusColor}55, ${statusColor}22)` : cardBg,
        border: `2px solid ${selected ? GOLD : statusColor}`,
        boxShadow: selected
          ? `0 0 0 3px rgba(201,149,44,0.35), 0 0 12px ${statusColor}88, 0 2px 8px rgba(0,0,0,0.6)`
          : `0 0 8px ${statusColor}44, 0 2px 6px rgba(0,0,0,0.5)`,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.9)', letterSpacing: '0.01em' }}>
        {table.tableNumber}
      </span>
      {elapsed && (
        <span style={{ fontSize: 9.5, fontWeight: 600, color: statusColor, lineHeight: 1, marginTop: 2, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          {elapsed}
        </span>
      )}
      {table.vip && (
        <span className="material-symbols-outlined" style={{
          position: 'absolute', top: -5, right: -5, fontSize: 11, color: GOLD,
          background: '#0a0600', borderRadius: '50%', border: `1px solid ${GOLD}`, padding: 1.5, lineHeight: 1,
        }}>star</span>
      )}
    </button>
  )
}

/** Thin functional overlay chip for a floor object — icon + small label badge, selection glow, touch target. The real venue image underneath already shows the actual booth/bar/station furniture. */
function FloorObject({ obj, selected, onSelect, editable, onDragStart }) {
  const def = FLOOR_OBJECT_TYPE_MAP[obj.objectType] || FLOOR_OBJECT_TYPES[0]
  const accent = obj.vip ? GOLD : ZONE_ACCENT[def.shape] || SLATE
  const canDrag = editable && !obj.locked
  return (
    <button
      type="button"
      className={selected ? 'floor-piece floor-piece--selected' : 'floor-piece'}
      onClick={() => onSelect(obj.id)}
      onPointerDown={canDrag ? (e) => onDragStart(e, 'object', obj.id) : undefined}
      title={`${def.label}${obj.section ? ' — ' + obj.section : ''}${obj.locked ? ' (Locked)' : ''}`}
      style={{
        position: 'absolute', left: `${obj.x ?? 10}%`, top: `${obj.y ?? 10}%`, zIndex: 1,
        width: 36, height: 36, cursor: canDrag ? 'grab' : 'pointer', padding: 0, border: 'none', background: 'transparent',
        transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: canDrag ? 'none' : 'auto',
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%',
        border: `2px solid ${selected ? GOLD : accent}`,
        background: selected ? 'rgba(28,18,6,0.62)' : 'rgba(10,8,5,0.56)',
        boxShadow: selected ? `0 0 0 3px rgba(201,149,44,0.3), 0 0 8px rgba(201,149,44,0.5)` : '0 2px 5px rgba(0,0,0,0.45)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: selected ? GOLD : '#f3eee1' }}>{def.icon}</span>
      </span>
    </button>
  )
}

/** Dimensional furniture-render tile for the Floor Object Library grid — CSS-rendered, not a flat icon box. */
function ObjectLibraryTile({ def, onPlace }) {
  const accent = def.vip ? GOLD : ZONE_ACCENT[def.shape] || SLATE
  const renderShape = () => {
    if (def.shape === 'round') return { width: 54, height: 54, borderRadius: '50%' }
    if (def.shape === 'chair') return { width: 40, height: 50, borderRadius: '42% 42% 26% 26%' }
    if (def.shape === 'booth') return { width: 64, height: 38, borderRadius: 16 }
    return { width: 50, height: 38, borderRadius: 8 }
  }
  return (
    <button type="button" className="ch-touch-btn" onClick={() => onPlace(def.type)} title={def.label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      minHeight: 92, borderRadius: 12, border: `1px solid ${def.vip ? GOLD : LINE}`,
      background: def.vip ? 'linear-gradient(165deg,#fdf3dc,#f6e2ad)' : 'linear-gradient(165deg,#ffffff,#f7f3ea)',
      boxShadow: `0 3px 10px ${accent}22`, cursor: 'pointer', padding: 8,
    }}>
      <span style={{
        ...renderShape(), display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle at 32% 26%, ${accent}, ${GOLD_DEEP === accent ? '#7a5318' : accent}aa 85%)`,
        boxShadow: `inset 0 3px 5px rgba(255,255,255,0.35), inset 0 -4px 6px rgba(0,0,0,0.25), 0 3px 6px rgba(19,41,75,0.25)`,
        border: `1px solid ${accent}`,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>{def.icon}</span>
      </span>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: NAVY, textAlign: 'center', lineHeight: 1.15 }}>{def.label}</span>
    </button>
  )
}

/** Venue Image Library preview card — real image surface (cropped via object-position) or premium gradient placeholder, status badge + count. */
function VenueImageCard({ card, onAssign, onPreview }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE}`, boxShadow: '0 4px 12px rgba(19,41,75,0.16)', background: IVORY_PANEL }}>
      <div style={{
        height: 92, position: 'relative',
        background: card.img
          ? `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.55)), url('${card.img}') ${card.pos || 'center'}/cover`
          : `repeating-linear-gradient(45deg, ${card.accent}14 0px, ${card.accent}14 2px, transparent 2px, transparent 14px), linear-gradient(160deg, ${card.accent}22, ${card.accent}0c)`,
      }}>
        {!card.img && (
          <span className="material-symbols-outlined" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: card.accent }}>{card.icon}</span>
        )}
        <span style={{ position: 'absolute', top: 6, right: 6 }}>
          <CommandStatusBadge color={card.img ? '#2f9e5b' : SLATE} icon={card.img ? 'check' : 'hourglass_empty'}>{card.img ? 'Live' : 'Local Demo'}</CommandStatusBadge>
        </span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{card.label}</div>
        <div style={{ fontSize: 10.5, color: SLATE, marginBottom: 6 }}>{card.count}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          <button type="button" className="vault-touch-btn" disabled={!card.img} onClick={() => card.img && onAssign && onAssign(card)} title={card.img ? 'Assign this image to the active floor plan' : 'No image available to assign'} style={{
            minHeight: 28, fontSize: 10, fontWeight: 700, borderRadius: 7, border: `1px solid ${LINE}`,
            background: card.img ? IVORY : '#f1efe9', color: card.img ? NAVY : SLATE, cursor: card.img ? 'pointer' : 'not-allowed',
          }}>Assign to Layout</button>
          <button type="button" className="vault-touch-btn" disabled={!card.img} onClick={() => card.img && onPreview && onPreview(card)} title={card.img ? 'Preview image' : 'No image available to preview'} style={{
            minHeight: 28, fontSize: 10, fontWeight: 700, borderRadius: 7, border: `1px solid ${LINE}`,
            background: card.img ? IVORY : '#f1efe9', color: card.img ? NAVY : SLATE, cursor: card.img ? 'pointer' : 'not-allowed',
          }}>Preview</button>
        </div>
      </div>
    </div>
  )
}

let floorStylesInjected = false
function injectFloorStyles() {
  if (floorStylesInjected || typeof document === 'undefined') return
  floorStylesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .floor-piece { transition: box-shadow 0.18s, filter 0.15s, transform 0.15s; }
    .floor-piece:hover { filter: brightness(1.14); transform: translateY(-2px) scale(1.04); filter: drop-shadow(0 6px 8px rgba(0,0,0,0.5)) brightness(1.14); }
    .floor-piece:active { filter: brightness(0.92); transform: translateY(0) scale(0.97); }
    @keyframes floorPieceGlow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.12); } }
    .floor-piece--selected { animation: floorPieceGlow 1.8s ease-in-out infinite; }
    @keyframes dropTargetPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,149,44,0.4); } 50% { box-shadow: 0 0 0 8px rgba(201,149,44,0); } }
    .floor-piece--drop { animation: dropTargetPulse 1.2s ease-in-out infinite; }
    .vault-rail-link { transition: background 0.12s, color 0.12s; }
    .vault-panel { transition: box-shadow 0.15s, transform 0.1s; }
    .vault-panel:active { transform: translateY(1px); }
    @keyframes floorPlanFadeIn { from { opacity: 0; } to { opacity: 1; } }
    .floor-plan-canvas--fade { animation: floorPlanFadeIn 0.35s ease-out; }
    @keyframes saveTostPop { 0% { opacity: 0; transform: translate(-50%, 6px) scale(0.92); } 60% { opacity: 1; transform: translate(-50%, -2px) scale(1.03); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
    .save-toast--pop { animation: saveTostPop 0.3s ease-out; }
    @keyframes drawerSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .floor-plans-menu--slide, .object-library-drawer--slide { animation: drawerSlideIn 0.18s ease-out; }
    @keyframes statusBadgePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(192,68,58,0.45); } 50% { box-shadow: 0 0 0 5px rgba(192,68,58,0); } }
    .status-badge--pulse { animation: statusBadgePulse 1.6s ease-in-out infinite; }
    .ch-touch-btn, .vault-touch-btn { transition: transform 0.1s, filter 0.1s; }
    .ch-touch-btn:active, .vault-touch-btn:active { transform: scale(0.96); filter: brightness(0.94); }
    @media (prefers-reduced-motion: reduce) {
      .floor-piece--selected, .floor-piece--drop { animation: none !important; }
      .floor-piece:hover, .floor-piece:active { filter: none !important; transform: none !important; }
      .floor-plan-canvas--fade, .save-toast--pop, .floor-plans-menu--slide, .object-library-drawer--slide, .status-badge--pulse { animation: none !important; }
      .ch-touch-btn:active, .vault-touch-btn:active { transform: none !important; filter: none !important; }
    }
  `
  document.head.appendChild(style)
}

export default function POS360TableManagement() {
  injectFloorStyles()
  const navigate = useNavigate()
  const sections = getLayoutSections()
  const [section, setSection] = useState(sections[0])
  const [tables, setTables] = useState(() => getTables())
  const [floorObjects, setFloorObjects] = useState(() => getFloorObjects())
  const [selectedId, setSelectedId] = useState(() => getTables().find((t) => t.section === sections[0])?.id || null)
  const [selectedObjectId, setSelectedObjectId] = useState(null)
  const [libraryTab, setLibraryTab] = useState('Tables')

  // ── Multi-layout floor plans (Phase 4.14) — local/demo until backend persistence is connected ──
  const [floorPlans, setFloorPlans] = useState(() => getFloorPlans())
  const activeFloorPlan = floorPlans.find((p) => p.active) || floorPlans[0]
  const [tablePositions, setTablePositions] = useState(() => getTablePositions(activeFloorPlan.id))
  const [editMode, setEditMode] = useState(false)
  const [plansMenuOpen, setPlansMenuOpen] = useState(false)
  const [saveToast, setSaveToast] = useState(null)
  const [previewCard, setPreviewCard] = useState(null)

  // ── Ops drawer: approvals / audit log / reservations + waitlist (Phase 4.13) ──
  const [opsPanel, setOpsPanel] = useState(null) // null | 'approvals' | 'audit' | 'reservations'
  const [pendingApprovals, setPendingApprovals] = useState(() => getPendingApprovals())
  const [auditEvents, setAuditEvents] = useState(() => getAuditEvents())
  const [upcomingReservations, setUpcomingReservations] = useState(() => getUpcomingReservations())
  const [activeWaitlist, setActiveWaitlist] = useState(() => getActiveWaitlist())
  const currentStaffId = 'demo-manager'
  const currentStaffRole = 'manager'

  function refreshOpsData() {
    setPendingApprovals(getPendingApprovals())
    setAuditEvents(getAuditEvents())
    setUpcomingReservations(getUpcomingReservations())
    setActiveWaitlist(getActiveWaitlist())
  }

  function handleApprove(requestId) {
    approveRequest(requestId, { approvedBy: currentStaffId, approverRole: currentStaffRole })
    refreshOpsData()
  }
  function handleDeny(requestId) {
    denyRequest(requestId, { deniedBy: currentStaffId, approverRole: currentStaffRole })
    refreshOpsData()
  }
  function handleQuickAddWaitlist() {
    const guestName = window.prompt('Guest name for waitlist:')
    if (!guestName) return
    addWaitlistEntry({ guestName, partySize: 2 })
    refreshOpsData()
  }
  function handleSeatWaitlist(entryId) {
    seatWaitlistEntry(entryId)
    refreshOpsData()
  }
  function handleSeatReservation(reservationId) {
    seatReservation(reservationId)
    refreshOpsData()
  }
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const bgFileInputRef = useRef(null)
  const tablePositionsRef = useRef(tablePositions)
  tablePositionsRef.current = tablePositions
  const floorObjectsRef = useRef(floorObjects)
  floorObjectsRef.current = floorObjects

  function switchFloorPlan(id) {
    setFloorPlans(setActiveFloorPlan(id))
    setTablePositions(getTablePositions(id))
    setSelectedId(null); setSelectedObjectId(null); setPlansMenuOpen(false)
  }

  function handleCreateLayout(areaType) {
    const plan = createFloorPlan(FLOOR_PLAN_AREA_MAP[areaType]?.label, areaType)
    setFloorPlans(setActiveFloorPlan(plan.id))
    setTablePositions(getTablePositions(plan.id))
    setPlansMenuOpen(false)
  }

  function handleDuplicateLayout() {
    const copy = duplicateFloorPlan(activeFloorPlan.id)
    setFloorObjects(getFloorObjects())
    setFloorPlans(setActiveFloorPlan(copy.id))
    setTablePositions(getTablePositions(copy.id))
  }

  function handleRenameLayout() {
    const name = window.prompt('Rename this layout:', activeFloorPlan.name)
    if (name) setFloorPlans(renameFloorPlan(activeFloorPlan.id, name))
  }

  function handleResetLayout() {
    if (!window.confirm(`Reset "${activeFloorPlan.name}"? This clears its placed objects and table positions.`)) return
    setFloorPlans(resetFloorPlan(activeFloorPlan.id))
    setFloorObjects(getFloorObjects())
    setTablePositions({})
  }

  function handleDeleteLayout() {
    if (floorPlans.length <= 1) { window.alert('At least one floor plan must remain.'); return }
    if (!window.confirm(`Delete "${activeFloorPlan.name}"?`)) return
    const next = deleteFloorPlan(activeFloorPlan.id)
    setFloorPlans(next)
    const nowActive = next.find((p) => p.active) || next[0]
    setFloorObjects(getFloorObjects())
    setTablePositions(getTablePositions(nowActive.id))
  }

  function handleUploadBackground(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setFloorPlans(assignBackgroundToFloorPlan(activeFloorPlan.id, reader.result))
    reader.readAsDataURL(file)
  }

  function handleToggleLock() {
    setFloorPlans(lockFloorPlan(activeFloorPlan.id, !activeFloorPlan.locked))
  }

  function handleSaveLayout() {
    if (!canPerformAction(currentStaffRole, POS360_ACTIONS.LAYOUT_SAVE)) {
      window.alert(`${currentStaffRole} is not permitted to save the floor layout.`)
      return
    }
    setSaveToast(activeFloorPlan.name)
    setTimeout(() => setSaveToast(null), 1800)
    recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.FLOOR_LAYOUT_CHANGED,
      actorId: currentStaffId,
      actorRole: currentStaffRole,
      targetType: 'floor_plan',
      targetId: activeFloorPlan.id,
      summary: `Floor layout "${activeFloorPlan.name}" saved`,
    })
  }

  function handleAssignImageToLayout(card) {
    setFloorPlans(assignBackgroundToFloorPlan(activeFloorPlan.id, card.img))
  }

  function handlePreviewImage(card) {
    setPreviewCard(card)
  }

  function handleDragStart(e, kind, id) {
    if (!editMode || activeFloorPlan.locked) return
    if (!canPerformAction(currentStaffRole, POS360_ACTIONS.LAYOUT_OBJECT_MOVE)) {
      window.alert(`${currentStaffRole} is not permitted to move floor objects.`)
      return
    }
    e.preventDefault()
    dragRef.current = { kind, id }
    const onMove = (ev) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = Math.min(98, Math.max(2, ((ev.clientX - rect.left) / rect.width) * 100))
      const y = Math.min(98, Math.max(2, ((ev.clientY - rect.top) / rect.height) * 100))
      if (kind === 'table') {
        setTablePositions((prev) => ({ ...prev, [id]: { x, y } }))
      } else {
        setFloorObjects((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)))
      }
    }
    const onUp = (ev) => {
      onMove(ev)
      if (kind === 'table') {
        const pos = tablePositionsRef.current?.[id]
        if (pos) {
          moveTablePosition(activeFloorPlan.id, id, pos.x, pos.y)
          recordAuditEvent({
            eventType: AUDIT_EVENT_TYPES.FLOOR_LAYOUT_CHANGED,
            actorId: currentStaffId,
            actorRole: currentStaffRole,
            targetType: 'table_position',
            targetId: id,
            summary: `Table ${id} repositioned on "${activeFloorPlan.name}"`,
          })
        }
      } else {
        const obj = floorObjectsRef.current?.find((o) => o.id === id)
        if (obj) {
          moveFloorObject(obj.id, obj.x, obj.y)
          recordAuditEvent({
            eventType: AUDIT_EVENT_TYPES.FLOOR_LAYOUT_CHANGED,
            actorId: currentStaffId,
            actorRole: currentStaffRole,
            targetType: 'floor_object',
            targetId: obj.id,
            summary: `Floor object ${obj.id} repositioned on "${activeFloorPlan.name}"`,
          })
        }
      }
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  const [activity] = useState([
    { ts: '7:28 PM', label: 'Table T5 reserved by James Carter for 8:00 PM', tag: 'Reservation' },
    { ts: '7:15 PM', label: 'Order #5512 sent to Kitchen — Table B2', tag: 'Order' },
    { ts: '7:10 PM', label: 'Payment received — Table T3 · $132.75', tag: 'Payment' },
    { ts: '7:05 PM', label: 'Humidor access granted — Staff: Michael B.', tag: 'Security' },
  ])
  const staff = getStaff()
  const tickets = getTickets()
  const inventory = getInventoryConnections()
  const network = getNetworkHealth()
  const devHealth = getDeviceHealth()

  const LIBRARY_TABS = ['Tables', 'Booths', 'Lounge', 'Bar Seating', 'Stations', 'VIP Areas', 'Service Items', 'Decor & Plants']
  const TAB_SHAPE_FILTER = {
    Tables: (d) => ['tabletop', 'roundTable', 'rectangleTable', 'highTop'].includes(d.type),
    Booths: (d) => d.type === 'booth',
    Lounge: (d) => ['loungeChair', 'sofa'].includes(d.type),
    'Bar Seating': (d) => d.type === 'barStool' || d.type === 'barZone',
    Stations: (d) => ['hostStand', 'serviceStation', 'humidorStation'].includes(d.type),
    'VIP Areas': (d) => d.vip,
    'Service Items': (d) => d.type === 'serviceStation',
    'Decor & Plants': (d) => ['patioSet', 'firepitSet'].includes(d.type),
  }
  const libraryItems = FLOOR_OBJECT_TYPES.filter(TAB_SHAPE_FILTER[libraryTab] || (() => true))

  const sectionTables = tables
    .filter((t) => t.section === section)
    .map((t) => {
      const pos = tablePositions[t.id]
      return pos ? { ...t, x: pos.x, y: pos.y } : t
    })
  const sectionObjects = floorObjects.filter((o) => o.section === section && o.floorPlanId === activeFloorPlan.id)
  const selected = tables.find((t) => t.id === selectedId) || null
  const selectedObject = floorObjects.find((o) => o.id === selectedObjectId) || null
  const selectedTicket = selected ? tickets.find((k) => k.tableId === selected.id && k.status !== 'paid') : null

  const metrics = useMemo(() => {
    const open = tables.filter((t) => t.status === 'open').length
    const occupied = tables.filter((t) => isOccupied(t.status)).length
    return { total: tables.length, open, occupied }
  }, [tables])

  const tableIntel = selected ? calculateTableIntelligenceScore(selected) : null
  const guestMemory = selected ? getGuestMemory(selected.id) : null
  const pairing = generatePairingRecommendations(selectedTicket)[0] || null
  const tableAlerts = selected ? generateExperienceAlerts(selected.id) : []
  void calculateStaffOwnership; void detectRevenueLeaks; void generateShiftCoachSummary

  function handleAssign(staffName) {
    if (!selected) return
    if (!canPerformAction(currentStaffRole, POS360_ACTIONS.STAFF_REASSIGN)) {
      window.alert(`${currentStaffRole} is not permitted to reassign staff.`)
      return
    }
    setTables(assignStaffToTable(selected.id, staffName))
    recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.STAFF_REASSIGNED,
      actorId: currentStaffId,
      actorRole: currentStaffRole,
      targetType: 'table',
      targetId: selected.id,
      summary: `Table T${selected.tableNumber} reassigned to ${staffName}`,
    })
  }

  function handleStatus(action) {
    if (!selected) return
    if (action === 'Close Table') {
      setTables(updateTableStatus(selected.id, 'cleaning'))
      recordAuditEvent({
        eventType: AUDIT_EVENT_TYPES.TABLE_CLOSED,
        actorId: currentStaffId,
        actorRole: currentStaffRole,
        targetType: 'table',
        targetId: selected.id,
        summary: `Table T${selected.tableNumber} closed`,
      })
      return
    }
    window.alert(`${action} — local-only action for Table T${selected.tableNumber}. No backend endpoint connected yet.`)
  }

  function handleToggleEditMode() {
    if (!editMode && !canPerformAction(currentStaffRole, POS360_ACTIONS.FLOOR_EDIT_MODE)) {
      window.alert(`${currentStaffRole} is not permitted to enter floor edit mode.`)
      return
    }
    setEditMode((v) => !v)
  }

  function handlePlaceObject(objectType) {
    setFloorObjects(addFloorObject(objectType, section, 20 + Math.random() * 50, 20 + Math.random() * 50, activeFloorPlan.id))
  }

  // Floor edit actions are gated by canPerformAction(currentStaffRole, ...) —
  // local/demo only, since POS360 has no real per-staff session yet (see
  // pos360Permissions.js). Destructive ones (Delete) are also audit-logged.
  function handleObjectTool(tool) {
    if (!selectedObject) return
    if (!canPerformAction(currentStaffRole, POS360_ACTIONS.LAYOUT_OBJECT_MOVE)) {
      window.alert(`${currentStaffRole} is not permitted to edit floor objects.`)
      return
    }
    if (tool === 'Duplicate') setFloorObjects(duplicateFloorObject(selectedObject.id))
    if (tool === 'Rotate') setFloorObjects(rotateFloorObject(selectedObject.id, 45))
    if (tool === 'Lock') setFloorObjects(lockFloorObject(selectedObject.id, !selectedObject.locked))
    if (tool === 'Delete') {
      setFloorObjects(deleteFloorObject(selectedObject.id))
      recordAuditEvent({
        eventType: AUDIT_EVENT_TYPES.FLOOR_LAYOUT_CHANGED,
        actorId: currentStaffId,
        actorRole: currentStaffRole,
        targetType: 'floor_object',
        targetId: selectedObject.id,
        summary: `Floor object ${selectedObject.id} deleted from "${activeFloorPlan.name}"`,
      })
      setSelectedObjectId(null)
    }
    if (tool === 'VIP') setFloorObjects(toggleFloorObjectVip(selectedObject.id))
    if (tool === 'Save Layout') handleSaveLayout()
    if (tool === 'Open Table' || tool === 'Edit Object' || tool === 'Move Object') {
      window.alert(`${tool} — local-only action for this floor object. No backend endpoint connected yet.`)
    }
  }

  function handleNudgeObject(dx, dy) {
    if (!selectedObject) return
    if (!canPerformAction(currentStaffRole, POS360_ACTIONS.LAYOUT_OBJECT_MOVE)) {
      window.alert(`${currentStaffRole} is not permitted to move floor objects.`)
      return
    }
    const nx = Math.min(96, Math.max(0, (selectedObject.x || 0) + dx))
    const ny = Math.min(96, Math.max(0, (selectedObject.y || 0) + dy))
    setFloorObjects(moveFloorObject(selectedObject.id, nx, ny))
  }

  const KPI = [
    ['TODAY', '$8,770', 'Revenue', 'bar_chart', NAVY],
    ['COVERS', '72', '+13%', 'group', '#2f9e5b'],
    ['TABLES', `${metrics.open + metrics.occupied}/${metrics.total || 25}`, 'Open', 'table_restaurant', GOLD_DEEP],
    ['RESERVATIONS', String(upcomingReservations.length), 'Upcoming', 'event', '#7e57c2'],
    ['WAITLIST', String(activeWaitlist.length), 'Parties', 'how_to_reg', '#3a6ea8'],
    ['LIVE SERVICE', new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), 'Today', 'schedule', SLATE],
  ]

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', fontFamily: 'system-ui, sans-serif', background: DARK_BG }}>
      {/* LEFT RAIL */}
      <nav style={{
        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '18px 14px', overflowY: 'auto',
        background: `linear-gradient(190deg, #121008 0%, #0e0b06 60%, #080604 100%)`, borderRight: `1px solid ${DARK_LINE}`,
      }}>
        {/* Crown + POS360 + NOVEE OS — matches reference header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 4px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: GOLD }}>workspace_premium</span>
          <span style={{ color: GOLD, fontWeight: 800, fontSize: 17, letterSpacing: '0.04em' }}>POS360</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9.5, fontWeight: 700, padding: '1px 4px 16px', letterSpacing: '0.12em' }}>NOVEE OS</div>
        {NAV_ITEMS.map(([label, to, icon]) => {
          const active = label === 'Tables'
          return (
            <button key={label} type="button" className="vault-rail-link" disabled={!to} onClick={() => to && navigate(to)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 10,
              fontSize: 12.5, border: 'none', cursor: to ? 'pointer' : 'not-allowed', marginBottom: 1, minHeight: 38,
              color: active ? '#1c1206' : to ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.3)',
              background: active ? GOLD : 'transparent', fontWeight: active ? 700 : 500,
              boxShadow: active ? '0 0 14px rgba(201,149,44,0.5)' : 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>{label}
            </button>
          )
        })}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(201,149,44,0.22)' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9.5, fontWeight: 700, padding: '0 4px 8px', letterSpacing: '0.08em' }}>CONNECTED SYSTEMS</div>
          {CONNECTED_SYSTEMS.map(([label, icon]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{label}</div>
              </div>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2f9e5b', boxShadow: '0 0 6px #2f9e5b' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,149,44,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: GOLD }}>VL</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Vault Manager</div>
              <div style={{ fontSize: 10, color: '#7ddca0', fontWeight: 700 }}>● All Systems Operational</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}><PoweredByNoveeOSBadge variant="sidebar" compact /></div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', background: DARK_BG }}>
        <div style={{ padding: '14px 20px 28px' }}>
          {/* TOP BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 2 }}>FLOOR</div>
              {/* Zone pill tabs — matches reference horizontal zone selector */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {sections.map((s) => (
                  <button key={s} type="button" onClick={() => { setSection(s); setSelectedId(null); setSelectedObjectId(null) }} style={{
                    padding: '5px 12px', borderRadius: 20, border: `1px solid ${s === section ? GOLD : 'rgba(255,255,255,0.18)'}`,
                    background: s === section ? GOLD : 'rgba(255,255,255,0.06)',
                    color: s === section ? '#0a0600' : 'rgba(255,255,255,0.78)',
                    fontSize: 11.5, fontWeight: s === section ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.03em',
                  }}>{s.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CommandTouchButton style={{ minHeight: 46, padding: '0 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>receipt_long</span>
                Open Orders
                <span style={{ marginLeft: 8, background: GOLD, color: '#1c1206', borderRadius: 999, fontSize: 10.5, fontWeight: 800, padding: '1px 7px' }}>14</span>
              </CommandTouchButton>
              <CommandTouchButton onClick={() => navigate('/pos3/handheld')} style={{ minHeight: 46, padding: '0 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>support_agent</span>
                Staff Assist
              </CommandTouchButton>
              <CommandTouchButton active onClick={() => navigate('/pos3/integrations')} style={{ minHeight: 46, padding: '0 18px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>hub</span>
                Venue Command Hub
              </CommandTouchButton>
              <CommandTouchButton onClick={() => { setOpsPanel('reservations'); refreshOpsData() }} style={{ minHeight: 46, padding: '0 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>event</span>
                Reservations
              </CommandTouchButton>
              <CommandTouchButton onClick={() => { setOpsPanel('approvals'); refreshOpsData() }} style={{ minHeight: 46, padding: '0 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>fact_check</span>
                Approvals
                {pendingApprovals.length > 0 && (
                  <span style={{ marginLeft: 8, background: '#c0443a', color: '#fff', borderRadius: 999, fontSize: 10.5, fontWeight: 800, padding: '1px 7px' }}>{pendingApprovals.length}</span>
                )}
              </CommandTouchButton>
              <CommandTouchButton onClick={() => { setOpsPanel('audit'); refreshOpsData() }} style={{ minHeight: 46, padding: '0 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, verticalAlign: '-3px' }}>history</span>
                Audit Log
              </CommandTouchButton>
              <span style={{ position: 'relative', width: 46, height: 46, borderRadius: 12, background: IVORY_PANEL, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 19, color: NAVY }}>notifications</span>
                <span style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#c0443a', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
              </span>
            </div>
          </div>

          {/* KPI STRIP */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {KPI.map(([label, value, sub, icon, accent]) => (
              <div key={label} className="vault-panel" style={{
                flex: '1 1 140px', background: 'rgba(20,15,8,0.82)', border: `1px solid ${DARK_LINE}`, borderRadius: 12, padding: '9px 13px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 9,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: accent }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', color: DARK_MUTE, fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: DARK_TEXT }}>{value}</div>
                  <div style={{ fontSize: 9.5, color: DARK_MUTE }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FLOOR CANVAS + RIGHT DETAIL PANEL */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div ref={canvasRef} key={activeFloorPlan.id} className="floor-plan-canvas--fade" style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', height: 460,
                border: '1px solid rgba(0,0,0,0.3)',
                backgroundImage: activeFloorPlan.backgroundImage
                  ? `linear-gradient(165deg, rgba(20,15,9,0.18), rgba(10,8,5,0.32)), url('${activeFloorPlan.backgroundImage}')`
                  : 'linear-gradient(165deg, #2a2117, #14110c)',
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.3), 0 6px 22px rgba(19,41,75,0.25)',
              }}>
                {!activeFloorPlan.backgroundImage && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)', fontSize: 12, gap: 6, textAlign: 'center', padding: 20,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.6 }}>image</span>
                    No background image for "{activeFloorPlan.name}" yet — local/demo placeholder.<br />Use Upload Background to add one.
                  </div>
                )}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, zIndex: 3 }}>
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setPlansMenuOpen((v) => !v)} style={{
                      display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 10, padding: '6px 12px', color: '#f3eee1', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>layers</span>{activeFloorPlan.name}
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{plansMenuOpen ? 'expand_less' : 'expand_more'}</span>
                    </button>
                    {plansMenuOpen && (
                      <div className="floor-plans-menu--slide" style={{
                        position: 'absolute', top: '110%', left: 0, minWidth: 220, background: '#1c1206', border: `1px solid ${GOLD}`,
                        borderRadius: 10, padding: 6, zIndex: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}>
                        {floorPlans.map((p) => (
                          <button key={p.id} type="button" onClick={() => switchFloorPlan(p.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '6px 8px',
                            background: p.active ? 'rgba(201,149,44,0.18)' : 'transparent', border: 'none', borderRadius: 6,
                            color: '#f3eee1', fontSize: 12, fontWeight: p.active ? 700 : 500, cursor: 'pointer',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: p.active ? GOLD : '#f3eee1' }}>
                              {FLOOR_PLAN_AREA_MAP[p.areaType]?.icon || 'dashboard'}
                            </span>{p.name}{p.locked && <span className="material-symbols-outlined" style={{ fontSize: 13, marginLeft: 'auto' }}>lock</span>}
                          </button>
                        ))}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '6px 0' }} />
                        {FLOOR_PLAN_AREA_TYPES.map((a) => (
                          <button key={a.areaType} type="button" onClick={() => handleCreateLayout(a.areaType)} style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '5px 8px',
                            background: 'transparent', border: 'none', borderRadius: 6, color: 'rgba(243,238,225,0.65)', fontSize: 11, cursor: 'pointer',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>New {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleToggleEditMode} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: editMode ? GOLD : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '6px 12px',
                    color: editMode ? '#1c1206' : '#f3eee1', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>{editMode ? 'Editing Layout' : 'Edit Layout'}
                  </button>
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, zIndex: 3, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 320 }}>
                  {[
                    ['save', 'Save Layout', handleSaveLayout],
                    ['content_copy', 'Duplicate Layout', handleDuplicateLayout],
                    ['edit_note', 'Rename Layout', handleRenameLayout],
                    ['restart_alt', 'Reset Layout', handleResetLayout],
                    ['upload', 'Upload Background', () => bgFileInputRef.current?.click()],
                    [activeFloorPlan.locked ? 'lock' : 'lock_open', activeFloorPlan.locked ? 'Unlock Layout' : 'Lock Layout', handleToggleLock],
                    ['delete', 'Delete Layout', handleDeleteLayout],
                  ].map(([ic, label, fn]) => (
                    <button key={label} type="button" title={label} onClick={fn} style={{
                      width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f3eee1', cursor: 'pointer',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{ic}</span>
                    </button>
                  ))}
                </div>
                <input ref={bgFileInputRef} type="file" accept="image/*" onChange={handleUploadBackground} style={{ display: 'none' }} />
                {sectionTables.map((t) => (
                  <FloorTable key={t.id} table={t} selected={t.id === selectedId} editable={editMode && !activeFloorPlan.locked}
                    onDragStart={handleDragStart} onSelect={(id) => { setSelectedId(id); setSelectedObjectId(null) }} />
                ))}
                {sectionObjects.map((o) => (
                  <FloorObject key={o.id} obj={o} selected={o.id === selectedObjectId} editable={editMode && !activeFloorPlan.locked}
                    onDragStart={handleDragStart} onSelect={(id) => { setSelectedObjectId(id); setSelectedId(null) }} />
                ))}
                {!sectionTables.length && !sectionObjects.length && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>No tables in {section}.</div>
                )}
                {saveToast && (
                  <div className="save-toast--pop" style={{
                    position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 4,
                    background: 'rgba(28,18,6,0.92)', border: `1px solid ${GOLD}`, borderRadius: 10, padding: '7px 16px',
                    color: GOLD, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>"{saveToast}" layout saved
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 10, right: 12, zIndex: 3, fontSize: 9.5, color: 'rgba(255,255,255,0.45)',
                  fontWeight: 600, letterSpacing: '0.02em',
                }}>
                  Floor plan changes are local/demo until backend persistence is connected.
                </div>
              </div>
              {/* STATUS LEGEND — matches reference palette */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8,
                background: 'rgba(20,15,8,0.75)', border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: '7px 12px',
              }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[['Available','#2f9e5b'],['Seated','#3a6ea8'],['Ordering','#c9952c'],['Kitchen','#c0443a'],['Drinks','#7e57c2'],['Cigar Service','#8a5a2b'],['Check Req.','#6b7385'],['VIP',GOLD]].map(([label, color]) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: DARK_MUTE, fontWeight: 600 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}88` }} />{label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT FLOATING DETAIL PANEL — dark card matching reference */}
            <div style={{
              width: 304, flexShrink: 0, borderRadius: 18, background: 'linear-gradient(165deg,#141008,#0e0b06)',
              border: `1px solid ${DARK_LINE}`, boxShadow: '0 10px 30px rgba(0,0,0,0.55)', padding: 16, display: 'flex', flexDirection: 'column', gap: 0,
            }}>
              {selectedObject ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: DARK_TEXT }}>{FLOOR_OBJECT_TYPE_MAP[selectedObject.objectType]?.label || 'Floor Object'}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {selectedObject.vip && <CommandStatusBadge color={GOLD_DEEP} icon="workspace_premium">VIP</CommandStatusBadge>}
                      {selectedObject.locked && <CommandStatusBadge color={DARK_MUTE} icon="lock">Locked</CommandStatusBadge>}
                    </div>
                  </div>
                  <select value={selectedObject.objectType} onChange={(e) => setFloorObjects(updateFloorObjectType(selectedObject.id, e.target.value))} style={{
                    width: '100%', minHeight: 42, padding: '0 10px', borderRadius: 10, border: `1px solid ${DARK_LINE}`, background: '#1a1208', color: DARK_TEXT, fontSize: 12.5, fontWeight: 700, marginBottom: 10,
                  }}>
                    {FLOOR_OBJECT_TYPES.map((o) => <option key={o.type} value={o.type}>{o.label}</option>)}
                  </select>
                  {[
                    ['Floor Plan', activeFloorPlan.name],
                    ['Section', selectedObject.section || '—'],
                    ['Seats', selectedObject.seats ?? 0],
                    ['Status', selectedObject.status || 'open'],
                    ['Staff', selectedObject.assignedStaff || 'Unassigned'],
                    ['Position', `${Math.round(selectedObject.x)}%, ${Math.round(selectedObject.y)}%`],
                    ['Rotation', `${selectedObject.rotation || 0}°`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: DARK_MUTE, padding: '5px 0', borderTop: `1px solid ${DARK_LINE}` }}>
                      <span>{label}</span><strong style={{ color: DARK_TEXT }}>{value}</strong>
                    </div>
                  ))}
                  <select onChange={(e) => e.target.value && setFloorObjects(assignStaffToFloorObject(selectedObject.id, e.target.value))} value="" style={{
                    width: '100%', marginTop: 8, minHeight: 40, padding: '0 10px', borderRadius: 10, border: `1px solid ${DARK_LINE}`, background: '#1a1208', color: DARK_TEXT, fontSize: 12,
                  }}>
                    <option value="">Assign / Reassign Staff…</option>
                    {staff.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
                  </select>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 5, marginTop: 8 }}>
                    {[['arrow_upward', () => handleNudgeObject(0, -2)], ['arrow_downward', () => handleNudgeObject(0, 2)], ['arrow_back', () => handleNudgeObject(-2, 0)], ['arrow_forward', () => handleNudgeObject(2, 0)]].map(([ic, fn]) => (
                      <button key={ic} type="button" className="vault-touch-btn" onClick={fn} title="Move" style={{
                        minHeight: 32, borderRadius: 8, border: `1px solid ${DARK_LINE}`, background: '#1a1208', color: DARK_TEXT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{ic}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                    {['Open Table', 'Edit Object', 'Move Object', 'VIP', 'Duplicate', 'Rotate', 'Lock', 'Save Layout', 'Delete'].map((tool) => (
                      <button key={tool} type="button" onClick={() => handleObjectTool(tool)} style={{
                        minHeight: 38, fontSize: 11, borderRadius: 9, border: `1px solid ${tool === 'Delete' ? 'rgba(192,68,58,0.5)' : DARK_LINE}`,
                        background: tool === 'Delete' ? 'rgba(192,68,58,0.12)' : 'rgba(255,255,255,0.05)',
                        color: tool === 'Delete' ? '#c0443a' : DARK_TEXT, cursor: 'pointer', fontWeight: 600,
                      }}>{tool === 'VIP' ? (selectedObject.vip ? 'Unmark VIP' : 'Mark VIP') : tool === 'Lock' ? (selectedObject.locked ? 'Unlock' : 'Lock') : tool}</button>
                    ))}
                  </div>
                </>
              ) : !selected ? (
                /* No selection — show handheld POS reference panel */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', textAlign: 'center', textTransform: 'uppercase' }}>POS360 Reference</div>
                  <img
                    src="/smokecraft-pos360.png"
                    alt="SMOKECRAFT POS360 handheld reference — approved visual anchor"
                    style={{ width: '100%', borderRadius: 12, border: `1px solid ${DARK_LINE}`, objectFit: 'cover', maxHeight: 380, objectPosition: 'top' }}
                  />
                  <div style={{ fontSize: 10, color: DARK_MUTE, textAlign: 'center', lineHeight: 1.4 }}>
                    Tap any table to view guest intelligence and SmokeCraft journey.
                  </div>
                </div>
              ) : (
                <>
                  {/* TABLE HEADER — TABLE 28 ★ style */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: DARK_TEXT }}>TABLE {selected.tableNumber}</span>
                      {selected.vip && <span className="material-symbols-outlined" style={{ fontSize: 15, color: GOLD }}>star</span>}
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
                        background: `${STATUS_DOT[selected.status]}22`, border: `1px solid ${STATUS_DOT[selected.status]}`,
                        color: STATUS_DOT[selected.status],
                      }}>{STATUS_LABEL[selected.status] || 'Available'}</span>
                    </div>
                    <button type="button" onClick={() => setSelectedId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: DARK_MUTE }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>close</span>
                    </button>
                  </div>

                  {/* GUEST CARD — matches reference Alexander Martin / VIP / Loyalty: PLATINUM style */}
                  {guestMemory && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DARK_LINE}`, borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#8a5a1a)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#1c1206', flexShrink: 0,
                        }}>
                          {guestMemory.name?.charAt(0) || 'G'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: DARK_TEXT }}>{guestMemory.name || 'Guest'}</span>
                            {guestMemory.vip && (
                              <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(201,149,44,0.2)', border: `1px solid ${GOLD}`, color: GOLD, padding: '1px 6px', borderRadius: 5 }}>VIP</span>
                            )}
                          </div>
                          <div style={{ fontSize: 10.5, color: DARK_MUTE, marginTop: 1 }}>Loyalty: PLATINUM · {guestMemory.favoriteDrink && `Fav: ${guestMemory.favoriteDrink}`}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: DARK_MUTE }}>call</span>
                            <span style={{ fontSize: 8.5, color: DARK_MUTE }}>Call</span>
                          </button>
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: DARK_MUTE }}>description</span>
                            <span style={{ fontSize: 8.5, color: DARK_MUTE }}>Notes</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMOKECRAFT JOURNEY CARD — matches reference "SMOKECRAFT JOURNEY / Visit 5 • Session 14 of 24 / 58%" */}
                  <div style={{ background: 'rgba(201,149,44,0.06)', border: `1px solid rgba(201,149,44,0.22)`, borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: GOLD }}>workspace_premium</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.06em' }}>SMOKECRAFT JOURNEY</span>
                    </div>
                    {tableIntel ? (
                      <>
                        <div style={{ fontSize: 11, color: DARK_MUTE, marginBottom: 5 }}>
                          Visit {Math.max(1, Math.floor(tableIntel.score / 20) + 1)} &nbsp;•&nbsp; Session {Math.min(24, Math.floor(tableIntel.score / 5) + 1)} of 24
                        </div>
                        <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, tableIntel.score)}%`, borderRadius: 4, background: `linear-gradient(90deg,${GOLD},#e8d080)` }} />
                        </div>
                        <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, textAlign: 'right' }}>{tableIntel.score}%</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: DARK_MUTE }}>No active SmokeCraft session</div>
                    )}
                    {pairing && (
                      <div style={{ marginTop: 6, fontSize: 10.5, color: '#7ddca0', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: '-2px', marginRight: 3 }}>trending_up</span>
                        Pairing lift available: +${pairing.liftUsd}
                      </div>
                    )}
                  </div>

                  {/* CHECK TOTALS ROW — CHECK TOTAL / GUESTS / SERVER */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[
                      ['CHECK TOTAL', selected.checkTotal ? `$${selected.checkTotal.toFixed(2)}` : '$0.00', GOLD],
                      ['GUESTS', String(selected.guests || 0), DARK_TEXT],
                      ['SERVER', (selected.serverName || 'Unassigned').split(' ')[0], DARK_TEXT],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 8.5, color: DARK_MUTE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* ACTION BUTTONS — matches reference grid layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    {[
                      ['Open Table', '#2f9e5b'],
                      ['Transfer Table', null],
                      ['Merge Tables', null],
                      ['Split Table', null],
                    ].map(([label, accent]) => (
                      <button key={label} type="button" className="vault-touch-btn" onClick={() => handleStatus(label)} style={{
                        minHeight: 38, borderRadius: 9, border: `1px solid ${accent ? accent + '55' : DARK_LINE}`,
                        background: accent ? `${accent}18` : 'rgba(255,255,255,0.04)',
                        color: accent || DARK_TEXT, fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                      }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      ['Call Server', 'support_agent'],
                      ['Call Manager', 'manage_accounts'],
                      ['Req. Assist.', 'emergency'],
                      ['Seat Guests', 'chair'],
                      ['Add Note', 'edit_note'],
                      ['Close Table', 'table_restaurant'],
                    ].map(([label, icon]) => (
                      <button key={label} type="button" className="vault-touch-btn" onClick={() => handleStatus(label)} style={{
                        minHeight: 34, borderRadius: 9, border: `1px solid ${label === 'Close Table' ? 'rgba(192,68,58,0.4)' : DARK_LINE}`,
                        background: label === 'Close Table' ? 'rgba(192,68,58,0.10)' : 'rgba(255,255,255,0.04)',
                        color: label === 'Close Table' ? '#c0443a' : DARK_MUTE, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{icon}</span>{label}
                      </button>
                    ))}
                  </div>
                  <select onChange={(e) => e.target.value && handleAssign(e.target.value)} value="" style={{
                    width: '100%', marginTop: 8, minHeight: 38, padding: '0 10px', borderRadius: 10, border: `1px solid ${DARK_LINE}`, background: '#1a1208', color: DARK_TEXT, fontSize: 12,
                  }}>
                    <option value="">Assign / Reassign Staff…</option>
                    {staff.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
                  </select>
                  {tableAlerts.length > 0 && (
                    <div style={{ marginTop: 8, background: 'rgba(192,68,58,0.08)', border: '1px solid rgba(192,68,58,0.3)', borderRadius: 10, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#c0443a', marginBottom: 4, letterSpacing: '0.06em' }}>EXPERIENCE ALERTS</div>
                      {tableAlerts.map((a, i) => <div key={i} style={{ fontSize: 10.5, color: a.severity === 'high' ? '#c0443a' : GOLD, padding: '1px 0' }}>⚠ {a.message}</div>)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FLOOR OBJECT LIBRARY + VENUE IMAGE LIBRARY */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
            <div className="vault-panel" style={{
              flex: '0 0 42%', minWidth: 320, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 15,
              boxShadow: '0 3px 10px rgba(0,0,0,0.35)', padding: 13,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.06em' }}>FLOOR OBJECT LIBRARY</div>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: DARK_MUTE }}>swap_horiz</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, width: 100 }}>
                  {LIBRARY_TABS.map((t) => (
                    <button key={t} type="button" onClick={() => setLibraryTab(t)} style={{
                      textAlign: 'left', fontSize: 10.5, fontWeight: 700, padding: '6px 7px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: libraryTab === t ? 'rgba(201,149,44,0.14)' : 'transparent', color: libraryTab === t ? GOLD : DARK_MUTE,
                    }}>{t}</button>
                  ))}
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, alignContent: 'start' }}>
                  {libraryItems.map((def) => <ObjectLibraryTile key={def.type} def={def} onPlace={handlePlaceObject} />)}
                </div>
              </div>
            </div>

            <div className="vault-panel" style={{
              flex: 1, minWidth: 0, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 15,
              boxShadow: '0 3px 10px rgba(0,0,0,0.35)', padding: 13,
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.06em', marginBottom: 9 }}>VENUE IMAGE LIBRARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 9 }}>
                {VENUE_IMAGE_CARDS.map((c) => (
                  <VenueImageCard key={c.id} card={c} onAssign={handleAssignImageToLayout} onPreview={handlePreviewImage} />
                ))}
              </div>
            </div>
          </div>

          {previewCard && (
            <div onClick={() => setPreviewCard(null)} style={{
              position: 'fixed', inset: 0, background: 'rgba(10,8,5,0.72)', zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <div className="floor-plans-menu--slide" style={{
                width: 560, maxWidth: '90vw', borderRadius: 16, overflow: 'hidden', background: IVORY_PANEL,
                border: `1px solid ${LINE}`, boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              }}>
                <div style={{
                  height: 320, background: `url('${previewCard.img}') ${previewCard.pos || 'center'}/cover`,
                }} />
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{previewCard.label}</div>
                    <div style={{ fontSize: 10.5, color: SLATE }}>{previewCard.count}</div>
                  </div>
                  <CommandTouchButton onClick={() => setPreviewCard(null)} style={{ minHeight: 36, padding: '0 14px', fontSize: 11.5 }}>Close</CommandTouchButton>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM PANELS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="vault-panel" style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 13, padding: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.04em' }}>TODAY'S ACTIVITY</div>
                <CommandStatusBadge color="#2f9e5b" icon="podcasts" pulse>Live</CommandStatusBadge>
              </div>
              {activity.map((a, i) => (
                <div key={i} style={{ fontSize: 10.5, padding: '5px 0', borderTop: i ? `1px solid ${DARK_LINE}` : 'none' }}>
                  <div style={{ color: DARK_MUTE, fontSize: 9.5 }}>{a.ts} · {a.tag}</div>
                  <div style={{ color: DARK_TEXT }}>{a.label}</div>
                </div>
              ))}
            </div>

            <div className="vault-panel" style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 13, padding: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.04em' }}>INVENTORY SNAPSHOT</div>
                <CommandStatusBadge color="#2f9e5b" icon="podcasts" pulse>Live</CommandStatusBadge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {inventory.slice(0, 4).map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 9, color: DARK_MUTE, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: c.lowStock > 0 ? '#c0443a' : '#2f9e5b' }}>{Math.max(0, 100 - c.lowStock * 6)}%</div>
                    <div style={{ fontSize: 9, color: DARK_MUTE }}>{c.items - c.lowStock} / {c.items}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="vault-panel" style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 13, padding: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.04em' }}>SYSTEM HEALTH</div>
                <CommandStatusBadge color="#2f9e5b" icon="check_circle">OK</CommandStatusBadge>
              </div>
              {[['POS Sync Engine', true], ['Oracle Micros', true], ['Stripe Terminal', network.status === 'online'], ['Kitchen Display', true], ['Humidor Lock', devHealth.online === devHealth.total]].map(([label, ok]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, padding: '4px 0' }}>
                  <span style={{ color: DARK_TEXT }}>{label}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: ok ? '#2f9e5b' : '#c9952c' }}>{ok ? '● Healthy' : '⚠ Warning'}</span>
                </div>
              ))}
            </div>

            <div className="vault-panel" style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 13, padding: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.04em' }}>UPCOMING EVENTS</div>
                <span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>View All</span>
              </div>
              {UPCOMING_EVENTS.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: i ? `1px solid ${DARK_LINE}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: DARK_TEXT }}>{e.name}</div>
                    <div style={{ fontSize: 9.5, color: DARK_MUTE }}>{e.when} · {e.seats}</div>
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: e.status === 'Limited' ? '#c9952c' : '#2f9e5b' }}>{e.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 9.5, color: DARK_MUTE, marginTop: 12, textAlign: 'center', opacity: 0.65 }}>
            Floor layout, inventory snapshot, and event data are local/demo until backend persistence is connected.
          </div>
        </div>
      </div>

      {/* OPS DRAWER — approvals / audit log / reservations + waitlist (Phase 4.13) */}
      {opsPanel && (
        <div onClick={() => setOpsPanel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="object-library-drawer--slide" style={{
            width: 420, maxWidth: '92vw', height: '100%', background: '#0e0b06', borderLeft: `1px solid ${DARK_LINE}`,
            boxShadow: '-12px 0 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: `1px solid ${DARK_LINE}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: DARK_TEXT, textTransform: 'capitalize' }}>
                {opsPanel === 'approvals' ? 'Approval Queue' : opsPanel === 'audit' ? 'Audit Log' : 'Reservations & Waitlist'}
              </div>
              <button type="button" onClick={() => setOpsPanel(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: DARK_MUTE }}>close</span>
              </button>
            </div>

            <div style={{ padding: '10px 18px', fontSize: 10.5, color: '#c9952c', background: 'rgba(201,149,44,0.08)' }}>
              {opsPanel === 'approvals' && APPROVAL_HONESTY_NOTICE}
              {opsPanel === 'audit' && AUDIT_HONESTY_NOTICE}
              {opsPanel === 'reservations' && 'Reservations and waitlist are local/demo state — no backend reservations table is connected yet.'}
            </div>

            <div style={{ padding: 18, flex: 1 }}>
              {opsPanel === 'approvals' && (
                pendingApprovals.length === 0 ? (
                  <div style={{ fontSize: 12, color: DARK_MUTE }}>No pending approvals.</div>
                ) : pendingApprovals.map((r) => (
                  <div key={r.id} style={{ border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 12, marginBottom: 10, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: DARK_TEXT }}>{r.actionType.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: DARK_MUTE, marginTop: 2 }}>Requested by {r.requestedBy} ({r.requestedByRole}) — needs {r.requiredRole}</div>
                    {r.reason && <div style={{ fontSize: 11, color: DARK_MUTE, marginTop: 2 }}>Reason: {r.reason}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="button" onClick={() => handleApprove(r.id)} style={{ minHeight: 32, padding: '0 12px', fontSize: 11, borderRadius: 8, border: '1px solid #2f9e5b44', background: 'rgba(47,158,91,0.12)', color: '#2f9e5b', cursor: 'pointer', fontWeight: 700 }}>Approve</button>
                      <button type="button" onClick={() => handleDeny(r.id)} style={{ minHeight: 32, padding: '0 12px', fontSize: 11, borderRadius: 8, border: '1px solid rgba(192,68,58,0.4)', background: 'rgba(192,68,58,0.1)', color: '#c0443a', cursor: 'pointer', fontWeight: 700 }}>Deny</button>
                    </div>
                  </div>
                ))
              )}

              {opsPanel === 'audit' && (
                auditEvents.length === 0 ? (
                  <div style={{ fontSize: 12, color: DARK_MUTE }}>No audit events recorded yet.</div>
                ) : auditEvents.slice(0, 60).map((e) => (
                  <div key={e.id} style={{ fontSize: 10.5, padding: '7px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
                    <div style={{ color: DARK_MUTE, fontSize: 9.5 }}>{new Date(e.createdAt).toLocaleString()} · {e.eventType.replace(/_/g, ' ')}</div>
                    <div style={{ color: DARK_TEXT }}>{e.summary}</div>
                  </div>
                ))
              )}

              {opsPanel === 'reservations' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.05em' }}>UPCOMING RESERVATIONS</div>
                    <button type="button" onClick={() => {
                      const guestName = window.prompt('Guest name for reservation:')
                      if (!guestName) return
                      createReservation({ guestName, partySize: 2, reservationTime: new Date(Date.now() + 30 * 60000).toISOString() })
                      refreshOpsData()
                    }} style={{ border: 'none', background: 'transparent', color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
                  </div>
                  {upcomingReservations.length === 0 ? (
                    <div style={{ fontSize: 12, color: DARK_MUTE, marginBottom: 16 }}>No upcoming reservations.</div>
                  ) : upcomingReservations.map((r) => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: DARK_TEXT }}>{r.guestName}{r.vip ? ' · VIP' : ''}</div>
                        <div style={{ fontSize: 10.5, color: DARK_MUTE }}>Party of {r.partySize} · {new Date(r.reservationTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                      </div>
                      <button type="button" onClick={() => handleSeatReservation(r.id)} style={{ minHeight: 28, padding: '0 10px', fontSize: 10.5, borderRadius: 7, border: `1px solid ${DARK_LINE}`, background: 'rgba(255,255,255,0.06)', color: DARK_TEXT, cursor: 'pointer' }}>Seat</button>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: DARK_TEXT, letterSpacing: '0.05em' }}>ACTIVE WAITLIST</div>
                    <button type="button" onClick={handleQuickAddWaitlist} style={{ border: 'none', background: 'transparent', color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
                  </div>
                  {activeWaitlist.length === 0 ? (
                    <div style={{ fontSize: 12, color: DARK_MUTE }}>Waitlist is empty.</div>
                  ) : activeWaitlist.map((w) => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: DARK_TEXT }}>{w.guestName}</div>
                        <div style={{ fontSize: 10.5, color: DARK_MUTE }}>Party of {w.partySize} · ~{w.quotedWaitMinutes} min quoted</div>
                      </div>
                      <button type="button" onClick={() => handleSeatWaitlist(w.id)} style={{ minHeight: 28, padding: '0 10px', fontSize: 10.5, borderRadius: 7, border: `1px solid ${DARK_LINE}`, background: 'rgba(255,255,255,0.06)', color: DARK_TEXT, cursor: 'pointer' }}>Seat</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
