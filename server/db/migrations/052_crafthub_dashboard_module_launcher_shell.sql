-- Safe migration: no destructive DDL, no truncation
-- Phase C.5 CraftHub Dashboard, Module Launcher, Navigation Shell & Premium Experience Hub
-- 22 tables

CREATE TABLE IF NOT EXISTS crafthub_dashboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  session_token TEXT NOT NULL,
  dashboard_layout JSONB DEFAULT '{}',
  active_modules JSONB DEFAULT '[]',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_module_launcher_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  module_key TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_category TEXT NOT NULL,
  module_status TEXT NOT NULL DEFAULT 'pending',
  is_installed BOOLEAN DEFAULT FALSE,
  is_activated BOOLEAN DEFAULT FALSE,
  install_source TEXT,
  marketplace_purchase_completed BOOLEAN DEFAULT FALSE,
  billing_connected BOOLEAN DEFAULT FALSE,
  license_verified BOOLEAN DEFAULT FALSE,
  launch_allowed BOOLEAN DEFAULT FALSE,
  live_mode_enabled BOOLEAN DEFAULT FALSE,
  activation_required BOOLEAN DEFAULT TRUE,
  placeholder_mode BOOLEAN DEFAULT TRUE,
  demo_mode BOOLEAN DEFAULT FALSE,
  local_preview BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_crafthub_module_launcher_tenant_key
  ON crafthub_module_launcher_registry(tenant_id, module_key);

CREATE TABLE IF NOT EXISTS crafthub_navigation_shell_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  shell_version TEXT NOT NULL DEFAULT '1.0.0',
  nav_items JSONB DEFAULT '[]',
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  top_bar_enabled BOOLEAN DEFAULT TRUE,
  breadcrumb_enabled BOOLEAN DEFAULT TRUE,
  notification_badge_enabled BOOLEAN DEFAULT TRUE,
  search_enabled BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark',
  locale TEXT DEFAULT 'en-US',
  custom_logo_url TEXT,
  custom_domain_active BOOLEAN DEFAULT FALSE,
  white_label_active BOOLEAN DEFAULT FALSE,
  live_mode_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_premium_experience_hub (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  hub_tier TEXT NOT NULL DEFAULT 'starter',
  features_unlocked JSONB DEFAULT '[]',
  ai_enabled BOOLEAN DEFAULT FALSE,
  analytics_enabled BOOLEAN DEFAULT FALSE,
  white_label_enabled BOOLEAN DEFAULT FALSE,
  custom_domain_enabled BOOLEAN DEFAULT FALSE,
  multi_venue_enabled BOOLEAN DEFAULT FALSE,
  enterprise_sso_enabled BOOLEAN DEFAULT FALSE,
  premium_support_enabled BOOLEAN DEFAULT FALSE,
  billing_plan TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  trial_active BOOLEAN DEFAULT FALSE,
  trial_expires_at TIMESTAMPTZ,
  live_mode_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  widget_key TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  widget_title TEXT,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT TRUE,
  data_source TEXT,
  live_data_enabled BOOLEAN DEFAULT FALSE,
  placeholder_mode BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_module_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_key TEXT NOT NULL UNIQUE,
  phase_name TEXT NOT NULL,
  phase_status TEXT NOT NULL DEFAULT 'pending',
  phase_order INTEGER NOT NULL,
  modules_included JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  target_date TIMESTAMPTZ,
  release_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crafthub_marketplace_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_key TEXT NOT NULL UNIQUE,
  listing_name TEXT NOT NULL,
  listing_category TEXT NOT NULL,
  listing_description TEXT,
  listing_price_cents INTEGER DEFAULT 0,
  listing_currency TEXT DEFAULT 'USD',
  listing_status TEXT DEFAULT 'available',
  publisher TEXT,
  is_core_module BOOLEAN DEFAULT FALSE,
  requires_billing BOOLEAN DEFAULT FALSE,
  requires_enterprise BOOLEAN DEFAULT FALSE,
  purchase_allowed BOOLEAN DEFAULT FALSE,
  live_purchase_enabled BOOLEAN DEFAULT FALSE,
  placeholder_mode BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crafthub_marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  listing_id UUID,
  listing_key TEXT NOT NULL,
  purchase_status TEXT DEFAULT 'pending',
  purchase_amount_cents INTEGER DEFAULT 0,
  purchase_currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  payment_completed BOOLEAN DEFAULT FALSE,
  license_key TEXT,
  license_issued BOOLEAN DEFAULT FALSE,
  activation_completed BOOLEAN DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  action_key TEXT NOT NULL,
  action_label TEXT NOT NULL,
  action_icon TEXT,
  action_route TEXT,
  action_handler TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  requires_module TEXT,
  requires_plan TEXT,
  sort_order INTEGER DEFAULT 0,
  live_mode_enabled BOOLEAN DEFAULT FALSE,
  placeholder_mode BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crafthub_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  actor_id TEXT,
  event_type TEXT NOT NULL,
  event_summary TEXT NOT NULL,
  event_payload JSONB DEFAULT '{}',
  module_key TEXT,
  entity_type TEXT,
  entity_id UUID,
  severity TEXT DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_notification_center (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  notification_type TEXT NOT NULL,
  notification_title TEXT NOT NULL,
  notification_body TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  delivered_via JSONB DEFAULT '[]',
  live_delivery_enabled BOOLEAN DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  search_text TEXT NOT NULL,
  search_vector TSVECTOR,
  metadata JSONB DEFAULT '{}',
  is_indexed BOOLEAN DEFAULT FALSE,
  live_search_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  checklist_version TEXT NOT NULL DEFAULT '1.0',
  steps_completed JSONB DEFAULT '[]',
  steps_total INTEGER DEFAULT 0,
  completion_percent INTEGER DEFAULT 0,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_key TEXT UNIQUE,
  title TEXT NOT NULL,
  body TEXT,
  cta_label TEXT,
  cta_url TEXT,
  announcement_type TEXT DEFAULT 'info',
  target_audience TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT FALSE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crafthub_module_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  module_key TEXT NOT NULL,
  check_type TEXT NOT NULL,
  check_status TEXT DEFAULT 'unknown',
  check_message TEXT,
  last_checked_at TIMESTAMPTZ,
  check_payload JSONB DEFAULT '{}',
  live_check_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crafthub_feature_flags_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  flag_key TEXT NOT NULL,
  flag_value BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  set_by TEXT,
  expires_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_crafthub_feature_flags_tenant_key
  ON crafthub_feature_flags_overrides(tenant_id, flag_key);

CREATE TABLE IF NOT EXISTS crafthub_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID NOT NULL UNIQUE,
  locale TEXT DEFAULT 'en-US',
  timezone TEXT DEFAULT 'UTC',
  dashboard_layout JSONB DEFAULT '{}',
  sidebar_pinned JSONB DEFAULT '[]',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_digest_enabled BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_module_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  module_key TEXT NOT NULL,
  entitlement_source TEXT NOT NULL DEFAULT 'platform',
  granted_by TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT FALSE,
  live_mode_enabled BOOLEAN DEFAULT FALSE,
  activation_required BOOLEAN DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_crafthub_module_entitlements_tenant_module
  ON crafthub_module_entitlements(tenant_id, module_key);

CREATE TABLE IF NOT EXISTS crafthub_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  live_mode_enabled BOOLEAN DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_integration_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  connector_key TEXT NOT NULL,
  connector_name TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  connection_status TEXT DEFAULT 'disconnected',
  provider_connected BOOLEAN DEFAULT FALSE,
  live_mode_enabled BOOLEAN DEFAULT FALSE,
  config_payload JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  activation_required BOOLEAN DEFAULT TRUE,
  placeholder_mode BOOLEAN DEFAULT TRUE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exposes_private_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crafthub_platform_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_key TEXT NOT NULL UNIQUE,
  component_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  message TEXT,
  last_checked_at TIMESTAMPTZ,
  uptime_percent NUMERIC(5,2),
  live_monitoring_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
