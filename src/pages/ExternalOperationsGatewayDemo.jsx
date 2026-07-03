import LiveExternalOpsReadinessPanel from '../components/externalops/LiveExternalOpsReadinessPanel.jsx'
import ExternalPOSReadinessPanel from '../components/externalops/ExternalPOSReadinessPanel.jsx'
import ExternalPOSMappingPanel from '../components/externalops/ExternalPOSMappingPanel.jsx'
import ExternalPOSSyncStatusBadge from '../components/externalops/ExternalPOSSyncStatusBadge.jsx'
import VendorGatewayReadinessPanel from '../components/externalops/VendorGatewayReadinessPanel.jsx'
import DistributorConnectorStatusPanel from '../components/externalops/DistributorConnectorStatusPanel.jsx'
import ManufacturerConnectorStatusPanel from '../components/externalops/ManufacturerConnectorStatusPanel.jsx'
import PurchaseOrderSubmissionGatewayPanel from '../components/externalops/PurchaseOrderSubmissionGatewayPanel.jsx'
import OperationalSyncConsumerPanel from '../components/externalops/OperationalSyncConsumerPanel.jsx'
import AvailabilityPushReadinessPanel from '../components/externalops/AvailabilityPushReadinessPanel.jsx'
import CredentialRequiredNotice from '../components/externalops/CredentialRequiredNotice.jsx'
import PurchaseOrderNotSubmittedNotice from '../components/externalops/PurchaseOrderNotSubmittedNotice.jsx'
import ExternalSyncPendingNotice from '../components/externalops/ExternalSyncPendingNotice.jsx'
import VendorCatalogSyncPreviewPanel from '../components/externalops/VendorCatalogSyncPreviewPanel.jsx'
import POSProviderCapabilitiesPanel from '../components/externalops/POSProviderCapabilitiesPanel.jsx'
import LOCCExternalOpsPanel from '../components/externalops/LOCCExternalOpsPanel.jsx'

const DEMO_READINESS = {
  status: 'not_live_ready',
  databaseRequired: true,
  external_sync_not_live: true,
  real_time_push_pending: true,
  degradedMode: true,
  in_memory_only: true,
  external_pos_required: true,
  vendor_api_required: true,
}

const DEMO_POS_STATUS = {
  connectionStatus: 'credentials_required',
  external_pos_required: true,
  external_sync_not_live: true,
}

const DEMO_PO_READINESS = {
  canSubmitLive: false,
  submissionStatus: 'not_submitted',
  vendor_api_required: true,
  emailFallbackAvailable: false,
  databaseRequired: true,
  autoApprovalDisabled: true,
  approvalRequired: true,
}

const MISSING_CREDENTIALS = [
  'EXTERNAL_POS_API_KEY',
  'VENDOR_API_KEY',
  'DISTRIBUTOR_API_KEY',
  'MANUFACTURER_API_KEY',
  'WEBHOOK_SECRET',
]

export default function ExternalOperationsGatewayDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">External Operations Gateway Demo</h1>
          <p className="text-sm text-gray-500 mt-1">Phase 18 EOCG — Component proof page · Not final E.A.T. UI</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <ExternalPOSSyncStatusBadge status="external_sync_not_live" />
            <ExternalPOSSyncStatusBadge status="preview_only" />
            <ExternalPOSSyncStatusBadge status="real_time_push_pending" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LiveExternalOpsReadinessPanel readiness={DEMO_READINESS} />
          <ExternalPOSReadinessPanel status={DEMO_POS_STATUS} />
          <ExternalPOSMappingPanel mappings={[]} unmapped={{ unmappedCount: 0 }} />
          <VendorGatewayReadinessPanel status={{ connectionStatus: 'credentials_required' }} />
          <DistributorConnectorStatusPanel />
          <ManufacturerConnectorStatusPanel />
          <PurchaseOrderSubmissionGatewayPanel readiness={DEMO_PO_READINESS} />
          <OperationalSyncConsumerPanel readiness={{}} />
          <AvailabilityPushReadinessPanel readiness={{}} />
          <POSProviderCapabilitiesPanel />
          <VendorCatalogSyncPreviewPanel vendorId="demo-vendor" syncResult={{}} />
          <LOCCExternalOpsPanel summary={{ databaseRequired: true }} />
        </div>

        <div className="space-y-3">
          <CredentialRequiredNotice missing={MISSING_CREDENTIALS} />
          <PurchaseOrderNotSubmittedNotice reason="vendor_api_required · database_required" />
          <ExternalSyncPendingNotice />
        </div>

        <div className="rounded-lg border bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Honest Status Summary</p>
          <div className="text-[10px] font-mono space-y-0.5 text-gray-500">
            <p>database_required · in_memory_only · degraded_mode</p>
            <p>external_pos_required · external_pos_credentials_required</p>
            <p>vendor_api_required · vendor_credentials_required</p>
            <p>distributor_connection_required · manufacturer_connection_required</p>
            <p>reorder_not_submitted · purchase_order_not_submitted</p>
            <p>external_sync_not_live · real_time_push_pending · preview_only</p>
            <p>canSubmitLive: false · autoApprovalDisabled: true</p>
          </div>
        </div>
      </div>
    </div>
  )
}
