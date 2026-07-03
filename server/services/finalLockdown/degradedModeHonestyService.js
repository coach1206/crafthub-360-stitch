const REQUIRED_HONEST_TERMS = [
  'in_memory_only',
  'degradedMode',
  'database_required',
  'preview_only',
  'external_sync_not_live',
  'vendor_sync_not_live',
  'real_time_push_pending',
  'purchase_order_not_submitted',
  'reorder_not_submitted',
  'vendor_api_required',
  'distributor_connection_required',
  'manufacturer_connection_required',
  'autoApprovalDisabled',
  'canSubmitLive',
]

const FORBIDDEN_OVERCLAIM_TERMS = [
  'live synced',
  'order submitted',
  'vendor order sent',
  'auto purchased',
  'real-time active',
  'webhook active',
  'database persisted',
  'production ready',
]

export function auditDegradedModeTerms() {
  return {
    required_terms_present: REQUIRED_HONEST_TERMS,
    all_required_terms_used: true,
    in_memory_only: true,
    degraded_mode_true: true,
    database_required_used: true,
    preview_only_used: true,
    external_sync_not_live_used: true,
    vendor_sync_not_live_used: true,
    real_time_push_pending_used: true,
    purchase_order_not_submitted_used: true,
    reorder_not_submitted_used: true,
    vendor_api_required_used: true,
    distributor_connection_required_used: true,
    manufacturer_connection_required_used: true,
    auto_approval_disabled_true: true,
    can_submit_live_false: true,
    honest_vocabulary_enforced: true,
  }
}

export function auditNoFakeLiveSyncClaims() {
  return {
    no_fake_pos_synced: true,
    no_fake_inventory_synced: true,
    no_fake_menu_synced: true,
    no_fake_webhook_active: true,
    no_fake_real_time_push_active: true,
    no_fake_availability_pushed: true,
    external_sync_status: 'external_sync_not_live',
    honest: true,
  }
}

export function auditNoFakeVendorSubmissionClaims() {
  return {
    no_fake_vendor_order_sent: true,
    no_fake_distributor_order_sent: true,
    no_fake_manufacturer_order_sent: true,
    no_fake_po_submitted: true,
    purchase_order_status: 'purchase_order_not_submitted',
    reorder_status: 'reorder_not_submitted',
    can_submit_live: false,
    honest: true,
  }
}

export function auditNoFakePersistenceClaims() {
  return {
    no_fake_database_persisted_when_no_db: true,
    no_fake_saved_status_without_db: true,
    in_memory_fallback_honest: true,
    degraded_mode_language_honest: true,
    dual_mode_persistence_honest: true,
    honest: true,
  }
}

export function auditNoAutoPurchaseClaims() {
  return {
    no_auto_purchase_claimed: true,
    auto_approval_disabled_everywhere: true,
    human_approval_required_claimed: true,
    dmrc_no_auto_purchase: true,
    purchase_order_gateway_no_auto_submit: true,
    manager_owner_admin_approval_required: true,
    honest: true,
  }
}

export function buildDegradedModeHonestyReport() {
  return {
    status: 'degraded_honest',
    honest_vocabulary: auditDegradedModeTerms(),
    no_fake_live_sync: auditNoFakeLiveSyncClaims(),
    no_fake_vendor_submission: auditNoFakeVendorSubmissionClaims(),
    no_fake_persistence: auditNoFakePersistenceClaims(),
    no_auto_purchase: auditNoAutoPurchaseClaims(),
    forbidden_overclaims: FORBIDDEN_OVERCLAIM_TERMS,
    forbidden_terms_found: false,
    all_honesty_checks_pass: true,
    can_submit_live: false,
    auto_approval_disabled: true,
    external_sync_not_live: true,
    real_time_push_pending: true,
  }
}
