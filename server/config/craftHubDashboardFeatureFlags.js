// CraftHub Dashboard Feature Flags — Phase C.5
// contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

export const DEFAULT_CRAFTHUB_DASHBOARD_FLAGS = {
  // Module installer gates
  module_installed: false,
  module_activated: false,
  marketplace_purchase_completed: false,
  billing_connected: false,
  license_verified: false,
  provider_connected: false,
  launch_allowed: false,
  live_mode_enabled: false,

  // Module-specific flags
  pos360_live: false,
  smokecraft_live: false,
  pourcraft_live: false,
  eat_ai_live: false,
  passport_live: false,
  loyalty_live: false,
  venue_admin_live: false,
  inventory_live: false,
  reports_live: false,
  external_integrations_live: false,

  // Navigation shell
  sidebar_enabled: false,
  top_bar_enabled: false,
  breadcrumb_enabled: false,
  search_enabled: false,
  notification_center_enabled: false,
  quick_actions_enabled: false,

  // Premium hub
  premium_hub_enabled: false,
  ai_assistant_enabled: false,
  analytics_live: false,
  white_label_enabled: false,
  custom_domain_enabled: false,
  multi_venue_enabled: false,
  enterprise_sso_enabled: false,
  premium_support_enabled: false,

  // Marketplace
  marketplace_enabled: false,
  marketplace_purchases_enabled: false,
  live_purchase_enabled: false,

  // Widgets & dashboard
  widget_drag_drop_enabled: false,
  layout_save_enabled: false,
  live_activity_feed_enabled: false,
  live_health_monitoring_enabled: false,
  onboarding_checklist_enabled: false,

  // Connectors
  pos360_sync_enabled: false,
  smokecraft_sync_enabled: false,
  eat_ai_automation_enabled: false,
  stripe_billing_connector_enabled: false,

  // Security
  api_key_creation_enabled: false,
  feature_flag_override_enabled: false,

  // Data
  exposes_private_data: true,
  contains_secrets: false,
  stores_secrets: false,
  contains_ai_generated_content: false,
};

export function getCraftHubDashboardFlags(overrides = {}) {
  return { ...DEFAULT_CRAFTHUB_DASHBOARD_FLAGS, ...overrides };
}
