import { useState } from 'react'
import InventoryStatusBadge from '../../components/inventory/InventoryStatusBadge.jsx'
import ProductAvailabilityCard from '../../components/inventory/ProductAvailabilityCard.jsx'
import LowStockAlert from '../../components/inventory/LowStockAlert.jsx'
import SoldOutAlert from '../../components/inventory/SoldOutAlert.jsx'
import InventoryReadinessPanel from '../../components/inventory/InventoryReadinessPanel.jsx'
import VendorConnectionStatusPanel from '../../components/reorder/VendorConnectionStatusPanel.jsx'
import DistributorReadinessPanel from '../../components/reorder/DistributorReadinessPanel.jsx'
import ManufacturerReadinessPanel from '../../components/reorder/ManufacturerReadinessPanel.jsx'
import ReorderRecommendationCard from '../../components/reorder/ReorderRecommendationCard.jsx'
import ReorderUrgencyBadge from '../../components/reorder/ReorderUrgencyBadge.jsx'
import PurchaseOrderDraftPanel from '../../components/reorder/PurchaseOrderDraftPanel.jsx'
import ReorderApprovalPanel from '../../components/reorder/ReorderApprovalPanel.jsx'
import VendorLeadTimeBadge from '../../components/reorder/VendorLeadTimeBadge.jsx'
import MinimumOrderWarning from '../../components/reorder/MinimumOrderWarning.jsx'
import CasePackRuleNotice from '../../components/reorder/CasePackRuleNotice.jsx'
import ReorderDemandSignalPanel from '../../components/reorder/ReorderDemandSignalPanel.jsx'
import InventoryReceivingPreviewPanel from '../../components/reorder/InventoryReceivingPreviewPanel.jsx'
import EATReorderCommandPanel from '../../components/reorder/EATReorderCommandPanel.jsx'

const DEMO_VENUE_ID = 'demo-venue-phase14'

const DEMO_PRODUCTS = [
  { product_id: 'cigar-001', product_name: 'Cohiba Robusto', product_category: 'cigar', current_stock: 0, available_stock: 0, reserved_stock: 0, reorder_threshold: 5, reorder_quantity: 20, availability_status: 'sold_out', sync_status: 'inventory_sync_pending' },
  { product_id: 'cigar-002', product_name: 'Montecristo No. 2', product_category: 'cigar', current_stock: 3, available_stock: 3, reserved_stock: 0, reorder_threshold: 5, reorder_quantity: 15, availability_status: 'low_stock', sync_status: 'inventory_sync_pending' },
  { product_id: 'cigar-003', product_name: 'Arturo Fuente Gran Reserva', product_category: 'cigar', current_stock: 24, available_stock: 22, reserved_stock: 2, reorder_threshold: 5, reorder_quantity: 10, availability_status: 'in_stock', sync_status: 'inventory_sync_pending' },
  { product_id: 'whiskey-001', product_name: 'Pappy Van Winkle 23yr', product_category: 'spirits', current_stock: 2, available_stock: 2, reserved_stock: 0, reorder_threshold: 3, reorder_quantity: 6, availability_status: 'low_stock', sync_status: 'inventory_sync_pending' },
]

const DEMO_VENDOR_READINESS = {
  vendorCount: 2, distributorCount: 1, manufacturerCount: 1, connectedCount: 0,
  connectionStatus: 'pending_setup',
  blockers: [{ type: 'distributor_connection_required', severity: 'info' }],
  persistenceStatus: 'not_persisted',
}

const DEMO_RECOMMENDATIONS = [
  { recommendation_id: 'r1', product_name: 'Cohiba Robusto', product_id: 'cigar-001', current_stock: 0, reorder_threshold: 5, recommended_quantity: 20, urgency: 'critical', reorder_status: 'reorder_recommended', vendor_name: 'Premium Cigar Distributors LLC' },
  { recommendation_id: 'r2', product_name: 'Montecristo No. 2', product_id: 'cigar-002', current_stock: 3, reorder_threshold: 5, recommended_quantity: 15, urgency: 'high', reorder_status: 'reorder_recommended', vendor_name: 'Premium Cigar Distributors LLC' },
  { recommendation_id: 'r3', product_name: 'Pappy Van Winkle 23yr', product_id: 'whiskey-001', current_stock: 2, reorder_threshold: 3, recommended_quantity: 6, urgency: 'high', reorder_status: 'reorder_recommended', vendor_name: null },
]

const DEMO_PO = {
  purchase_order_id: 'po-demo-001', vendor_name: 'Premium Cigar Distributors LLC',
  approval_status: 'pending_manager_approval', submission_status: 'reorder_not_submitted',
  estimated_total: 85000, estimated_lead_time_days: 4, reorder_reason: 'low_stock',
  preview_only: true,
  items: [
    { product_name: 'Cohiba Robusto', recommended_quantity: 20 },
    { product_name: 'Montecristo No. 2', recommended_quantity: 15 },
  ],
}

const DEMO_SIGNALS = [
  { signal_id: 's1', product_name: 'Cohiba Robusto', signal_type: 'product_checkout_blocked_due_to_inventory', signal_source: 'checkout', signal_strength: 'urgent', times_blocked: 7 },
  { signal_id: 's2', product_name: 'Montecristo No. 2', signal_type: 'ncie_recommendation_unavailable', signal_source: 'ncie', signal_strength: 'normal', times_blocked: 3 },
  { signal_id: 's3', product_name: 'Pappy Van Winkle 23yr', signal_type: 'product_pos360_blocked_due_to_inventory', signal_source: 'pos360', signal_strength: 'normal', times_blocked: 2 },
]

const DEMO_RECEIVING = {
  receiving_id: 'recv-001', vendor_name: 'Premium Cigar Distributors LLC',
  receiving_status: 'receiving_pending', items_expected: 35, items_received: 0,
}

const DEMO_EAT_HOOKS = {
  getInventoryAvailabilityReadinessHooks: 'inventory_sync_pending',
  getProductAvailabilityReadinessHooks: 'availability_required',
  getDistributorReorderReadinessHooks: 'distributor_connection_required',
  getManufacturerReorderReadinessHooks: 'manufacturer_connection_required',
  getVendorConnectionReadinessHooks: 'pending_setup',
  getPurchaseOrderDraftReadinessHooks: 'reorder_not_submitted',
  getReorderApprovalReadinessHooks: 'pending_manager_approval',
  getInventoryReceivingReadinessHooks: 'receiving_pending',
}

const INVENTORY_READINESS = {
  productCount: 4, soldOutCount: 1, lowStockCount: 2,
  inventoryStatus: 'inventory_sync_pending', syncStatus: 'inventory_sync_pending',
  persistenceStatus: 'not_persisted',
  blockers: [
    { type: 'sold_out_products', count: 1, severity: 'critical' },
    { type: 'low_stock_products', count: 2, severity: 'warning' },
    { type: 'database_required', severity: 'warning' },
  ],
}

const DEMO_VENDOR = { vendor_name: 'Premium Cigar Distributors LLC', minimum_order_amount: 50000, lead_time_days: 4 }

export default function InventoryAndReorderDemo() {
  const [actorRole, setActorRole] = useState('manager')
  const [eventLog, setEventLog] = useState([])
  const [selectedPO, setSelectedPO] = useState(null)

  const log = (msg) => setEventLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)])

  const handleCreatePO = (rec) => {
    setSelectedPO({ ...DEMO_PO, product_name: rec.product_name })
    log(`Draft PO created for: ${rec.product_name} — reorder_not_submitted`)
  }

  const handleApprove = (po) => {
    log(`PO approved by ${actorRole} — approved_by_${actorRole === 'owner' ? 'owner' : 'manager'} · still reorder_not_submitted`)
    setSelectedPO({ ...po, approval_status: `approved_by_${actorRole}` })
  }

  const handleReject = (po) => {
    log(`PO rejected by ${actorRole} — rejected_by_${actorRole === 'owner' ? 'owner' : 'manager'}`)
    setSelectedPO({ ...po, approval_status: `rejected_by_${actorRole}` })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Phase 14 — Inventory &amp; Reorder Engine Demo
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">ISPAE + DMRC · preview_only · not_persisted · reorder_not_submitted</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Actor Role:</label>
            <select
              value={actorRole}
              onChange={e => setActorRole(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 min-h-[44px]"
            >
              {['manager','owner','admin','staff','server'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Readiness + Alerts */}
        <div className="grid md:grid-cols-2 gap-4">
          <InventoryReadinessPanel readiness={INVENTORY_READINESS} />
          <div className="space-y-3">
            <SoldOutAlert items={DEMO_PRODUCTS} />
            <LowStockAlert items={DEMO_PRODUCTS} onReorder={() => log('Navigating to reorder recommendations')} />
          </div>
        </div>

        {/* Product Availability */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Product Availability — <span className="text-blue-500">inventory_sync_pending</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {DEMO_PRODUCTS.map(p => <ProductAvailabilityCard key={p.product_id} product={p} />)}
          </div>
        </div>

        {/* Inventory Status Badges */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Availability Status Vocabulary</h2>
          <div className="flex flex-wrap gap-2">
            {['in_stock','low_stock','sold_out','availability_required','inventory_unavailable','inventory_sync_pending'].map(s => (
              <InventoryStatusBadge key={s} status={s} />
            ))}
          </div>
        </div>

        {/* Vendor Readiness */}
        <div className="grid md:grid-cols-3 gap-4">
          <VendorConnectionStatusPanel readiness={DEMO_VENDOR_READINESS} />
          <DistributorReadinessPanel readiness={DEMO_VENDOR_READINESS} />
          <ManufacturerReadinessPanel readiness={DEMO_VENDOR_READINESS} />
        </div>

        {/* Vendor meta badges */}
        <div className="flex flex-wrap gap-3 items-center">
          <VendorLeadTimeBadge leadTimeDays={1} />
          <VendorLeadTimeBadge leadTimeDays={4} />
          <VendorLeadTimeBadge leadTimeDays={10} />
          <MinimumOrderWarning vendor={DEMO_VENDOR} estimatedTotal={30000} />
          <CasePackRuleNotice casePackQuantity={5} recommendedQuantity={18} />
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Reorder Recommendations — <span className="text-orange-500">reorder_recommended</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {DEMO_RECOMMENDATIONS.map(r => (
              <ReorderRecommendationCard key={r.recommendation_id} rec={r} onCreatePO={handleCreatePO} />
            ))}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['critical','urgent','high','normal','low'].map(u => <ReorderUrgencyBadge key={u} urgency={u} />)}
          </div>
        </div>

        {/* Purchase Order + Approval */}
        <div className="grid md:grid-cols-2 gap-4">
          <PurchaseOrderDraftPanel
            po={selectedPO ?? DEMO_PO}
            onApprove={handleApprove}
            onReject={handleReject}
          />
          <ReorderApprovalPanel approvalReadiness={{ submissionStatus: 'reorder_not_submitted' }} actorRole={actorRole} />
        </div>

        {/* Demand Signals + Receiving */}
        <div className="grid md:grid-cols-2 gap-4">
          <ReorderDemandSignalPanel signals={DEMO_SIGNALS} />
          <InventoryReceivingPreviewPanel
            receiving={DEMO_RECEIVING}
            onConfirm={() => log('Confirm receiving — inventory_sync_pending until database connected')}
          />
        </div>

        {/* E.A.T. Hooks */}
        <EATReorderCommandPanel hooks={DEMO_EAT_HOOKS} />

        {/* Event log */}
        {eventLog.length > 0 && (
          <div className="rounded-lg border bg-gray-900 p-3">
            <p className="text-xs font-semibold text-gray-300 mb-2">Event Log</p>
            {eventLog.map((e, i) => (
              <p key={i} className="text-[11px] text-green-400 font-mono">{e}</p>
            ))}
          </div>
        )}

        {/* Footer disclaimer */}
        <div className="text-center text-[10px] text-gray-400 pb-4">
          Phase 14 Preview — No inventory persisted · No vendor API connected · No purchase order submitted · No automatic purchasing
        </div>
      </div>
    </div>
  )
}
