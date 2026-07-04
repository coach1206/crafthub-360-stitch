-- Phase B.16: POS360 Kitchen, Bar, Humidor Fulfillment, KDS Queues, Order Routing & Production Governance
-- CREATE TABLE IF NOT EXISTS only — safe, additive migration. No destructive changes.

-- Production station profiles
CREATE TABLE IF NOT EXISTS pos360_fulfillment_station_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  station_name TEXT NOT NULL,
  station_type TEXT NOT NULL CHECK (station_type IN ('kitchen','bar','humidor','expo','patio','pickup','delivery_placeholder','server_station','custom')),
  station_status TEXT NOT NULL DEFAULT 'draft' CHECK (station_status IN ('draft','active_placeholder','connected_external','disabled','unavailable')),
  printer_connected BOOLEAN NOT NULL DEFAULT FALSE,
  kds_connected BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  idempotency_key TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_station_profiles_venue ON pos360_fulfillment_station_profiles (venue_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_station_profiles_type ON pos360_fulfillment_station_profiles (station_type);

-- Station capabilities
CREATE TABLE IF NOT EXISTS pos360_fulfillment_station_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  station_id UUID NOT NULL,
  capability_key TEXT NOT NULL,
  capability_group TEXT NOT NULL CHECK (capability_group IN ('food','beverage','cigar','humidor','expo','pickup','patio','private_event','smokecraft','custom')),
  supported_status TEXT NOT NULL DEFAULT 'unknown' CHECK (supported_status IN ('unknown','not_supported','supported_placeholder','supported_external')),
  requires_staff_assignment BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, station_id, capability_key),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_station_caps_venue ON pos360_fulfillment_station_capabilities (venue_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_station_caps_station ON pos360_fulfillment_station_capabilities (station_id);

-- Item routing rules
CREATE TABLE IF NOT EXISTS pos360_item_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('category','item_tag','modifier','course','prep_area','service_area','table_section','private_event','order_type','fulfillment_priority','custom')),
  source_match_payload JSONB DEFAULT '{}',
  target_station_id UUID,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_item_routing_rules_venue ON pos360_item_routing_rules (venue_id);
CREATE INDEX IF NOT EXISTS idx_item_routing_rules_station ON pos360_item_routing_rules (target_station_id);

-- Order production tickets
CREATE TABLE IF NOT EXISTS pos360_order_production_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  order_id UUID,
  order_source TEXT NOT NULL DEFAULT 'manual' CHECK (order_source IN ('server','guest_self_order','external_pos_placeholder','manual','private_event','smokecraft','unavailable')),
  ticket_number TEXT,
  ticket_status TEXT NOT NULL DEFAULT 'received_placeholder' CHECK (ticket_status IN ('received_placeholder','routed','partially_preparing','preparing','partially_ready','ready','partially_served','served','cancelled','failed','unavailable')),
  table_id UUID,
  section_id UUID,
  reservation_id UUID,
  waitlist_entry_id UUID,
  private_event_id UUID,
  package_selection_id UUID,
  guest_profile_id UUID,
  customer_id UUID,
  payment_record_id UUID,
  staff_profile_id UUID,
  external_reference TEXT,
  generated_from_real_order BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_prod_tickets_venue ON pos360_order_production_tickets (venue_id);
CREATE INDEX IF NOT EXISTS idx_order_prod_tickets_order ON pos360_order_production_tickets (order_id);
CREATE INDEX IF NOT EXISTS idx_order_prod_tickets_table ON pos360_order_production_tickets (table_id);
CREATE INDEX IF NOT EXISTS idx_order_prod_tickets_reservation ON pos360_order_production_tickets (reservation_id);
CREATE INDEX IF NOT EXISTS idx_order_prod_tickets_private_event ON pos360_order_production_tickets (private_event_id);
CREATE INDEX IF NOT EXISTS idx_order_prod_tickets_status ON pos360_order_production_tickets (ticket_status);

-- Production ticket items
CREATE TABLE IF NOT EXISTS pos360_order_production_ticket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  order_item_id UUID,
  item_name TEXT NOT NULL,
  item_category TEXT,
  item_type TEXT NOT NULL DEFAULT 'food' CHECK (item_type IN ('food','drink','cigar','retail','service','package_item','custom')),
  item_status TEXT NOT NULL DEFAULT 'new' CHECK (item_status IN ('new','routed','acknowledged','preparing','ready','held','fired','served','cancelled','voided_external','unavailable')),
  station_id UUID,
  course_label TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  modifier_payload JSONB DEFAULT '{}',
  allergy_notes TEXT,
  prep_notes TEXT,
  inventory_item_id UUID,
  inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prod_ticket_items_venue ON pos360_order_production_ticket_items (venue_id);
CREATE INDEX IF NOT EXISTS idx_prod_ticket_items_ticket ON pos360_order_production_ticket_items (ticket_id);
CREATE INDEX IF NOT EXISTS idx_prod_ticket_items_station ON pos360_order_production_ticket_items (station_id);
CREATE INDEX IF NOT EXISTS idx_prod_ticket_items_status ON pos360_order_production_ticket_items (item_status);

-- KDS queue records
CREATE TABLE IF NOT EXISTS pos360_kds_queue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  station_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  ticket_item_id UUID,
  queue_type TEXT NOT NULL CHECK (queue_type IN ('kitchen','bar','humidor','expo','patio','pickup','delivery_placeholder','custom')),
  queue_status TEXT NOT NULL DEFAULT 'queued' CHECK (queue_status IN ('queued','acknowledged','preparing','ready','held','fired','served','cancelled','failed','unavailable')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','rush','delayed','hold','refire')),
  assigned_staff_profile_id UUID,
  acknowledged_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  external_sync_completed BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kds_queue_venue ON pos360_kds_queue_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_kds_queue_station ON pos360_kds_queue_records (station_id);
CREATE INDEX IF NOT EXISTS idx_kds_queue_ticket ON pos360_kds_queue_records (ticket_id);
CREATE INDEX IF NOT EXISTS idx_kds_queue_status ON pos360_kds_queue_records (queue_status);

-- KDS queue item status history
CREATE TABLE IF NOT EXISTS pos360_kds_queue_item_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  queue_record_id UUID NOT NULL,
  ticket_item_id UUID,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kds_status_history_venue ON pos360_kds_queue_item_status_history (venue_id);
CREATE INDEX IF NOT EXISTS idx_kds_status_history_record ON pos360_kds_queue_item_status_history (queue_record_id);

-- Course fire controls
CREATE TABLE IF NOT EXISTS pos360_course_fire_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  course_label TEXT NOT NULL,
  fire_status TEXT NOT NULL DEFAULT 'hold' CHECK (fire_status IN ('hold','fired','delayed','refire','rush','completed','cancelled')),
  requested_by_staff_profile_id UUID,
  approved_by_manager_profile_id UUID,
  fire_reason TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_course_fire_venue ON pos360_course_fire_controls (venue_id);
CREATE INDEX IF NOT EXISTS idx_course_fire_ticket ON pos360_course_fire_controls (ticket_id);

-- Station staff assignments
CREATE TABLE IF NOT EXISTS pos360_station_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  station_id UUID NOT NULL,
  staff_profile_id UUID,
  assignment_role TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_station_staff_assign_venue ON pos360_station_staff_assignments (venue_id);
CREATE INDEX IF NOT EXISTS idx_station_staff_assign_station ON pos360_station_staff_assignments (station_id);
CREATE INDEX IF NOT EXISTS idx_station_staff_assign_staff ON pos360_station_staff_assignments (staff_profile_id);

-- Production handoff records
CREATE TABLE IF NOT EXISTS pos360_production_handoff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  ticket_item_id UUID,
  handoff_type TEXT NOT NULL CHECK (handoff_type IN ('kitchen_to_expo','bar_to_server','humidor_to_server','expo_to_server','server_to_guest','pickup_ready','private_event_service','custom')),
  handoff_status TEXT NOT NULL DEFAULT 'pending' CHECK (handoff_status IN ('pending','acknowledged_placeholder','completed_placeholder','failed','unavailable')),
  from_staff_profile_id UUID,
  to_staff_profile_id UUID,
  private_event_id UUID,
  reservation_id UUID,
  table_id UUID,
  handoff_notes TEXT,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prod_handoff_venue ON pos360_production_handoff_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_prod_handoff_ticket ON pos360_production_handoff_records (ticket_id);

-- Item unavailable records
CREATE TABLE IF NOT EXISTS pos360_item_unavailable_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_item_id UUID,
  inventory_item_id UUID,
  unavailable_reason TEXT,
  unavailable_status TEXT NOT NULL DEFAULT 'reported' CHECK (unavailable_status IN ('reported','manager_review','confirmed_placeholder','resolved','cancelled')),
  reported_by_staff_profile_id UUID,
  manager_approved_by UUID,
  inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_item_unavailable_venue ON pos360_item_unavailable_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_item_unavailable_ticket_item ON pos360_item_unavailable_records (ticket_item_id);

-- Production manager overrides
CREATE TABLE IF NOT EXISTS pos360_production_manager_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  override_type TEXT NOT NULL CHECK (override_type IN ('cancel_item','void_item_external','refire_item','rush_item','delay_item','reroute_item','item_unavailable','station_reassignment','comp_item_external','custom')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  override_status TEXT NOT NULL DEFAULT 'pending_manager_approval' CHECK (override_status IN ('pending_manager_approval','approved','rejected','cancelled')),
  requested_by_staff_profile_id UUID,
  manager_approved_by UUID,
  reason TEXT,
  before_snapshot JSONB DEFAULT '{}',
  after_snapshot JSONB DEFAULT '{}',
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prod_manager_overrides_venue ON pos360_production_manager_overrides (venue_id);
CREATE INDEX IF NOT EXISTS idx_prod_manager_overrides_status ON pos360_production_manager_overrides (override_status);

-- Production refire records
CREATE TABLE IF NOT EXISTS pos360_production_refire_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  ticket_item_id UUID,
  station_id UUID,
  refire_reason TEXT,
  requested_by_staff_profile_id UUID,
  manager_approved_by UUID,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prod_refire_venue ON pos360_production_refire_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_prod_refire_ticket ON pos360_production_refire_records (ticket_id);

-- Production rush/delay records
CREATE TABLE IF NOT EXISTS pos360_production_rush_delay_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  ticket_item_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('rush','delay','hold','release')),
  reason TEXT,
  requested_by_staff_profile_id UUID,
  manager_approved_by UUID,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prod_rush_delay_venue ON pos360_production_rush_delay_records (venue_id);

-- Guest self-order handoff records
CREATE TABLE IF NOT EXISTS pos360_guest_self_order_handoff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  order_id UUID,
  ticket_id UUID,
  guest_profile_id UUID,
  customer_id UUID,
  table_id UUID,
  reservation_id UUID,
  handoff_status TEXT NOT NULL DEFAULT 'pending' CHECK (handoff_status IN ('pending','acknowledged_placeholder','completed_placeholder','failed','unavailable')),
  payment_record_id UUID,
  generated_from_real_order BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_guest_self_order_handoff_venue ON pos360_guest_self_order_handoff_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_guest_self_order_handoff_guest ON pos360_guest_self_order_handoff_records (guest_profile_id);

-- Server order handoff records
CREATE TABLE IF NOT EXISTS pos360_server_order_handoff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  order_id UUID,
  ticket_id UUID,
  staff_profile_id UUID,
  table_id UUID,
  section_id UUID,
  reservation_id UUID,
  waitlist_entry_id UUID,
  private_event_id UUID,
  package_selection_id UUID,
  payment_record_id UUID,
  handoff_status TEXT NOT NULL DEFAULT 'pending' CHECK (handoff_status IN ('pending','acknowledged_placeholder','completed_placeholder','failed','unavailable')),
  generated_from_real_order BOOLEAN NOT NULL DEFAULT FALSE,
  external_sync_completed BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_server_order_handoff_venue ON pos360_server_order_handoff_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_server_order_handoff_staff ON pos360_server_order_handoff_records (staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_server_order_handoff_table ON pos360_server_order_handoff_records (table_id);
CREATE INDEX IF NOT EXISTS idx_server_order_handoff_reservation ON pos360_server_order_handoff_records (reservation_id);
CREATE INDEX IF NOT EXISTS idx_server_order_handoff_private_event ON pos360_server_order_handoff_records (private_event_id);

-- Humidor fulfillment records
CREATE TABLE IF NOT EXISTS pos360_humidor_fulfillment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  ticket_item_id UUID NOT NULL,
  humidor_station_id UUID,
  staff_profile_id UUID,
  cigar_name TEXT NOT NULL,
  cigar_sku TEXT,
  pairing_recommendation_id UUID,
  smokecraft_session_id UUID,
  smokecraft_guest_link_id UUID,
  fulfillment_status TEXT NOT NULL DEFAULT 'queued' CHECK (fulfillment_status IN ('queued','picked_placeholder','presented_placeholder','served_placeholder','unavailable','cancelled')),
  inventory_item_id UUID,
  inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_humidor_fulfillment_venue ON pos360_humidor_fulfillment_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_humidor_fulfillment_ticket ON pos360_humidor_fulfillment_records (ticket_id);

-- Bar fulfillment records
CREATE TABLE IF NOT EXISTS pos360_bar_fulfillment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  ticket_item_id UUID NOT NULL,
  bar_station_id UUID,
  staff_profile_id UUID,
  drink_name TEXT NOT NULL,
  fulfillment_status TEXT NOT NULL DEFAULT 'queued' CHECK (fulfillment_status IN ('queued','preparing','ready','served_placeholder','unavailable','cancelled')),
  inventory_item_id UUID,
  inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bar_fulfillment_venue ON pos360_bar_fulfillment_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_bar_fulfillment_ticket ON pos360_bar_fulfillment_records (ticket_id);

-- Kitchen fulfillment records
CREATE TABLE IF NOT EXISTS pos360_kitchen_fulfillment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  ticket_item_id UUID NOT NULL,
  kitchen_station_id UUID,
  staff_profile_id UUID,
  food_item_name TEXT NOT NULL,
  fulfillment_status TEXT NOT NULL DEFAULT 'queued' CHECK (fulfillment_status IN ('queued','preparing','ready','served_placeholder','unavailable','cancelled')),
  allergy_notes TEXT,
  inventory_item_id UUID,
  inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kitchen_fulfillment_venue ON pos360_kitchen_fulfillment_records (venue_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_fulfillment_ticket ON pos360_kitchen_fulfillment_records (ticket_id);

-- External KDS provider profiles
CREATE TABLE IF NOT EXISTS pos360_external_kds_provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  provider_key TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_status TEXT NOT NULL DEFAULT 'not_connected' CHECK (provider_status IN ('not_connected','configured_placeholder','connected_external','disabled','error')),
  provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  kds_connected BOOLEAN NOT NULL DEFAULT FALSE,
  printer_connected BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  sync_run_id UUID,
  provider_profile_id UUID,
  capability_payload JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, provider_key),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_external_kds_provider_venue ON pos360_external_kds_provider_profiles (venue_id);

-- Production visibility insights
CREATE TABLE IF NOT EXISTS pos360_production_visibility_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('station_bottleneck','long_prep_time','item_unavailable','high_refire_rate','late_order','service_handoff_issue','humidor_delay','bar_delay','kitchen_delay','custom')),
  insight_payload JSONB DEFAULT '{}',
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  honest_state TEXT,
  source TEXT,
  idempotency_key TEXT,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id) WHERE idempotency_key IS NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prod_visibility_venue ON pos360_production_visibility_insights (venue_id);
CREATE INDEX IF NOT EXISTS idx_prod_visibility_type ON pos360_production_visibility_insights (insight_type);

-- Production offline queue
CREATE TABLE IF NOT EXISTS pos360_production_offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  area TEXT NOT NULL DEFAULT 'pos360-fulfillment-kds',
  operation TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prod_offline_queue_venue ON pos360_production_offline_queue (venue_id);
CREATE INDEX IF NOT EXISTS idx_prod_offline_queue_processed ON pos360_production_offline_queue (processed);

-- Production audit
CREATE TABLE IF NOT EXISTS pos360_production_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  before_snapshot JSONB DEFAULT '{}',
  after_snapshot JSONB DEFAULT '{}',
  reason TEXT,
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prod_audit_venue ON pos360_production_audit (venue_id);
CREATE INDEX IF NOT EXISTS idx_prod_audit_entity ON pos360_production_audit (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_prod_audit_created ON pos360_production_audit (created_at);
