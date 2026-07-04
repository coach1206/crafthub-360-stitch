-- 043_pos360_reports_analytics_decision_layer.sql
-- Phase B.13 Prompt Z: POS360 Reports, Analytics, Daily Closeout Intelligence,
-- Executive Dashboards & E.A.T. Decision Layer
-- CREATE TABLE IF NOT EXISTS only — safe, additive migration. No destructive changes.

CREATE TABLE IF NOT EXISTS pos360_report_definitions (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER,
  report_key          VARCHAR(120) NOT NULL,
  report_name         VARCHAR(255) NOT NULL,
  report_type         VARCHAR(60) NOT NULL CHECK (report_type IN (
                        'executive','daily_operations','closeout','payments','staff',
                        'guests','loyalty','inventory','reservations','private_events',
                        'event_packages','smokecraft','eat','custom')),
  description         TEXT,
  default_sections    JSONB,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  system_defined      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata            JSONB,
  created_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos360_report_kpi_definitions (
  id                      SERIAL PRIMARY KEY,
  venue_id                INTEGER,
  kpi_key                 VARCHAR(120) NOT NULL,
  kpi_name                VARCHAR(255) NOT NULL,
  kpi_group               VARCHAR(60) NOT NULL CHECK (kpi_group IN (
                            'revenue','payments','closeout','labor','staff','guests',
                            'loyalty','reservations','inventory','private_events',
                            'smokecraft','eat','risk','custom')),
  calculation_source      TEXT,
  calculation_description TEXT,
  requires_real_data      BOOLEAN NOT NULL DEFAULT TRUE,
  active                  BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos360_report_kpi_thresholds (
  id                      SERIAL PRIMARY KEY,
  venue_id                INTEGER NOT NULL,
  kpi_key                 VARCHAR(120) NOT NULL,
  threshold_type          VARCHAR(30) NOT NULL CHECK (threshold_type IN ('warning','critical','goal','floor','ceiling')),
  threshold_value         NUMERIC(18,4) NOT NULL,
  comparison_operator     VARCHAR(10) NOT NULL CHECK (comparison_operator IN ('gt','gte','lt','lte','eq','neq')),
  active                  BOOLEAN NOT NULL DEFAULT TRUE,
  manager_configured_by   INTEGER,
  idempotency_key         VARCHAR(255),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_report_snapshots (
  id                        SERIAL PRIMARY KEY,
  venue_id                  INTEGER NOT NULL,
  report_definition_id      INTEGER,
  report_type               VARCHAR(60) NOT NULL,
  report_name               VARCHAR(255) NOT NULL,
  report_date               DATE,
  date_range_start          DATE,
  date_range_end            DATE,
  snapshot_status           VARCHAR(40) NOT NULL DEFAULT 'draft' CHECK (snapshot_status IN (
                              'draft','generated_placeholder','locked','exported_placeholder','unavailable')),
  generated_from_real_data  BOOLEAN NOT NULL DEFAULT FALSE,
  contains_estimates        BOOLEAN NOT NULL DEFAULT FALSE,
  snapshot_payload          JSONB,
  locked_by                 INTEGER,
  locked_at                 TIMESTAMPTZ,
  created_by                INTEGER,
  idempotency_key           VARCHAR(255),
  exposes_private_data      BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_report_snapshot_sections (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER NOT NULL,
  report_snapshot_id  INTEGER NOT NULL REFERENCES pos360_report_snapshots(id),
  section_key         VARCHAR(120) NOT NULL,
  section_title       VARCHAR(255),
  section_payload     JSONB,
  display_order       INTEGER NOT NULL DEFAULT 0,
  idempotency_key     VARCHAR(255),
  created_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_dashboard_profiles (
  id               SERIAL PRIMARY KEY,
  venue_id         INTEGER NOT NULL,
  dashboard_name   VARCHAR(255) NOT NULL,
  dashboard_type   VARCHAR(40) NOT NULL CHECK (dashboard_type IN (
                     'owner','executive','manager','staff','operations',
                     'finance','inventory','guest','event','eat','custom')),
  layout_payload   JSONB,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_by       INTEGER,
  idempotency_key  VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_dashboard_widgets (
  id                    SERIAL PRIMARY KEY,
  venue_id              INTEGER NOT NULL,
  dashboard_profile_id  INTEGER NOT NULL REFERENCES pos360_dashboard_profiles(id),
  widget_key            VARCHAR(120) NOT NULL,
  widget_type           VARCHAR(40) NOT NULL CHECK (widget_type IN (
                          'kpi_card','trend_chart','table','alert_list','closeout_summary',
                          'staff_summary','guest_summary','inventory_summary',
                          'event_summary','eat_decision','custom')),
  widget_title          VARCHAR(255),
  data_source           VARCHAR(120),
  requires_real_data    BOOLEAN NOT NULL DEFAULT TRUE,
  widget_config         JSONB,
  display_order         INTEGER NOT NULL DEFAULT 0,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key       VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_dashboard_view_events (
  id                    SERIAL PRIMARY KEY,
  venue_id              INTEGER NOT NULL,
  dashboard_profile_id  INTEGER,
  actor_user_id         INTEGER,
  dashboard_type        VARCHAR(40),
  view_payload          JSONB,
  idempotency_key       VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_daily_operations_reports (
  id                          SERIAL PRIMARY KEY,
  venue_id                    INTEGER NOT NULL,
  report_date                 DATE NOT NULL,
  total_orders_amount         NUMERIC(18,4),
  total_payments_amount       NUMERIC(18,4),
  total_cash_amount           NUMERIC(18,4),
  total_card_external_amount  NUMERIC(18,4),
  total_tips_amount           NUMERIC(18,4),
  total_refunds_amount        NUMERIC(18,4),
  total_voids_amount          NUMERIC(18,4),
  total_comps_amount          NUMERIC(18,4),
  total_house_account_amount  NUMERIC(18,4),
  labor_minutes               INTEGER,
  labor_cost_amount           NUMERIC(18,4),
  reservation_count           INTEGER,
  waitlist_count              INTEGER,
  private_event_count         INTEGER,
  inventory_alert_count       INTEGER,
  generated_from_real_data    BOOLEAN NOT NULL DEFAULT FALSE,
  honest_state                VARCHAR(60) NOT NULL DEFAULT 'placeholder',
  idempotency_key             VARCHAR(255),
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                  INTEGER,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_daily_closeout_report_links (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER NOT NULL,
  report_snapshot_id  INTEGER REFERENCES pos360_report_snapshots(id),
  daily_closeout_id   INTEGER,
  server_closeout_id  INTEGER,
  shift_closeout_id   INTEGER,
  cash_drawer_id      INTEGER,
  report_date         DATE,
  link_payload        JSONB,
  idempotency_key     VARCHAR(255),
  created_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_staff_performance_report_links (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER NOT NULL,
  report_snapshot_id  INTEGER REFERENCES pos360_report_snapshots(id),
  staff_profile_id    INTEGER,
  date_range_start    DATE,
  date_range_end      DATE,
  link_payload        JSONB,
  idempotency_key     VARCHAR(255),
  created_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_guest_intelligence_report_links (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER NOT NULL,
  report_snapshot_id  INTEGER REFERENCES pos360_report_snapshots(id),
  customer_id         INTEGER,
  guest_profile_id    INTEGER,
  date_range_start    DATE,
  date_range_end      DATE,
  link_payload        JSONB,
  idempotency_key     VARCHAR(255),
  created_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_inventory_health_report_links (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER NOT NULL,
  report_snapshot_id  INTEGER REFERENCES pos360_report_snapshots(id),
  inventory_item_id   INTEGER,
  vendor_id           INTEGER,
  date_range_start    DATE,
  date_range_end      DATE,
  link_payload        JSONB,
  idempotency_key     VARCHAR(255),
  created_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_event_package_report_links (
  id                    SERIAL PRIMARY KEY,
  venue_id              INTEGER NOT NULL,
  report_snapshot_id    INTEGER REFERENCES pos360_report_snapshots(id),
  private_event_id      INTEGER,
  package_selection_id  INTEGER,
  reservation_id        INTEGER,
  waitlist_entry_id     INTEGER,
  date_range_start      DATE,
  date_range_end        DATE,
  link_payload          JSONB,
  idempotency_key       VARCHAR(255),
  created_by            INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_payment_analytics_report_links (
  id                    SERIAL PRIMARY KEY,
  venue_id              INTEGER NOT NULL,
  report_snapshot_id    INTEGER REFERENCES pos360_report_snapshots(id),
  payment_record_id     INTEGER,
  order_id              INTEGER,
  date_range_start      DATE,
  date_range_end        DATE,
  link_payload          JSONB,
  idempotency_key       VARCHAR(255),
  created_by            INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_alert_rules (
  id                    SERIAL PRIMARY KEY,
  venue_id              INTEGER NOT NULL,
  alert_key             VARCHAR(120) NOT NULL,
  alert_name            VARCHAR(255) NOT NULL,
  alert_type            VARCHAR(40) NOT NULL CHECK (alert_type IN (
                          'inventory_low','refund_spike','void_spike','drawer_over_short',
                          'labor_overtime','minimum_spend_exposure','deposit_exposure',
                          'reservation_no_show','loyalty_risk','service_recovery','staff_risk','custom')),
  condition_payload     JSONB,
  severity              VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  manager_configured_by INTEGER,
  idempotency_key       VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_alert_events (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER NOT NULL,
  alert_rule_id       INTEGER REFERENCES pos360_alert_rules(id),
  alert_type          VARCHAR(40) NOT NULL,
  severity            VARCHAR(20) NOT NULL DEFAULT 'info',
  alert_status        VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (alert_status IN ('open','acknowledged','dismissed','resolved')),
  entity_type         VARCHAR(60),
  entity_id           INTEGER,
  event_payload       JSONB,
  acknowledged_by     INTEGER,
  acknowledged_at     TIMESTAMPTZ,
  resolved_by         INTEGER,
  resolved_at         TIMESTAMPTZ,
  exposes_private_data    BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data  BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key     VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_eat_decision_insights (
  id                            SERIAL PRIMARY KEY,
  venue_id                      INTEGER NOT NULL,
  insight_type                  VARCHAR(60) NOT NULL CHECK (insight_type IN (
                                  'operations_recommendation','revenue_recommendation',
                                  'labor_recommendation','inventory_recommendation',
                                  'guest_recommendation','event_recommendation',
                                  'risk_recommendation','custom')),
  insight_title                 VARCHAR(255) NOT NULL,
  insight_payload               JSONB,
  recommended_action_payload    JSONB,
  decision_status               VARCHAR(30) NOT NULL DEFAULT 'placeholder' CHECK (decision_status IN (
                                  'placeholder','pending_review','accepted','rejected','unavailable')),
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence                 NUMERIC(5,4),
  source                        VARCHAR(120),
  honest_state                  VARCHAR(60) NOT NULL DEFAULT 'placeholder',
  reviewed_by                   INTEGER,
  reviewed_at                   TIMESTAMPTZ,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key               VARCHAR(255),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_report_export_requests (
  id                    SERIAL PRIMARY KEY,
  venue_id              INTEGER NOT NULL,
  report_snapshot_id    INTEGER REFERENCES pos360_report_snapshots(id),
  export_type           VARCHAR(30) NOT NULL CHECK (export_type IN (
                          'pdf','csv','print_ready','email_ready','external_bi','custom')),
  export_status         VARCHAR(40) NOT NULL DEFAULT 'requested' CHECK (export_status IN (
                          'requested','generated_placeholder','ready_placeholder',
                          'sent_external','failed_external','unavailable')),
  export_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_email       VARCHAR(255),
  provider_reference    VARCHAR(255),
  requested_by          INTEGER,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key       VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_scheduled_report_contracts (
  id                    SERIAL PRIMARY KEY,
  venue_id              INTEGER NOT NULL,
  report_definition_id  INTEGER REFERENCES pos360_report_definitions(id),
  schedule_name         VARCHAR(255) NOT NULL,
  cadence               VARCHAR(20) NOT NULL CHECK (cadence IN ('daily','weekly','monthly','custom')),
  delivery_channel      VARCHAR(30) NOT NULL DEFAULT 'none' CHECK (delivery_channel IN (
                          'none','email_external','print_ready','external_bi','dashboard_only')),
  delivery_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  schedule_status       VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (schedule_status IN (
                          'draft','active_placeholder','paused','disabled','unavailable')),
  recipient_payload     JSONB,
  last_run_at           TIMESTAMPTZ,
  next_run_at           TIMESTAMPTZ,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key       VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_bi_provider_profiles (
  id                  SERIAL PRIMARY KEY,
  venue_id            INTEGER NOT NULL,
  provider_name       VARCHAR(40) NOT NULL CHECK (provider_name IN (
                        'looker','powerbi','tableau','metabase','google_sheets','manual_external','other')),
  provider_status     VARCHAR(30) NOT NULL DEFAULT 'not_connected' CHECK (provider_status IN (
                        'not_connected','configured_placeholder','connected_external','disabled','error')),
  provider_reference  VARCHAR(255),
  capability_payload  JSONB,
  bi_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos360_report_offline_queue (
  id              SERIAL PRIMARY KEY,
  venue_id        INTEGER NOT NULL,
  actor_user_id   INTEGER,
  action_type     VARCHAR(120) NOT NULL,
  payload         JSONB,
  sync_status     VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (sync_status IN (
                    'pending','synced','failed','skipped','cancelled')),
  idempotency_key VARCHAR(255),
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key, venue_id)
);

CREATE TABLE IF NOT EXISTS pos360_report_audit (
  id                            SERIAL PRIMARY KEY,
  venue_id                      INTEGER NOT NULL,
  actor_user_id                 INTEGER,
  action                        VARCHAR(120) NOT NULL,
  entity_type                   VARCHAR(60),
  entity_id                     INTEGER,
  before_snapshot               JSONB,
  after_snapshot                JSONB,
  reason                        TEXT,
  contains_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data          BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rpt_defs_venue ON pos360_report_definitions(venue_id);
CREATE INDEX IF NOT EXISTS idx_rpt_defs_type ON pos360_report_definitions(report_type);
CREATE INDEX IF NOT EXISTS idx_rpt_kpi_defs_venue ON pos360_report_kpi_definitions(venue_id);
CREATE INDEX IF NOT EXISTS idx_rpt_kpi_defs_group ON pos360_report_kpi_definitions(kpi_group);
CREATE INDEX IF NOT EXISTS idx_rpt_kpi_thresh_venue ON pos360_report_kpi_thresholds(venue_id);
CREATE INDEX IF NOT EXISTS idx_rpt_kpi_thresh_key ON pos360_report_kpi_thresholds(kpi_key);
CREATE INDEX IF NOT EXISTS idx_rpt_snapshots_venue ON pos360_report_snapshots(venue_id);
CREATE INDEX IF NOT EXISTS idx_rpt_snapshots_date ON pos360_report_snapshots(report_date);
CREATE INDEX IF NOT EXISTS idx_rpt_snapshots_range ON pos360_report_snapshots(date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_rpt_snapshots_type ON pos360_report_snapshots(report_type);
CREATE INDEX IF NOT EXISTS idx_rpt_snapshots_idem ON pos360_report_snapshots(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_dash_profiles_venue ON pos360_dashboard_profiles(venue_id);
CREATE INDEX IF NOT EXISTS idx_dash_profiles_type ON pos360_dashboard_profiles(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_dash_widgets_venue ON pos360_dashboard_widgets(venue_id);
CREATE INDEX IF NOT EXISTS idx_daily_ops_venue ON pos360_daily_operations_reports(venue_id);
CREATE INDEX IF NOT EXISTS idx_daily_ops_date ON pos360_daily_operations_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_ops_idem ON pos360_daily_operations_reports(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_alert_rules_venue ON pos360_alert_rules(venue_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON pos360_alert_rules(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_events_venue ON pos360_alert_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_status ON pos360_alert_events(alert_status);
CREATE INDEX IF NOT EXISTS idx_eat_insights_venue ON pos360_eat_decision_insights(venue_id);
CREATE INDEX IF NOT EXISTS idx_eat_insights_type ON pos360_eat_decision_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_eat_insights_status ON pos360_eat_decision_insights(decision_status);
CREATE INDEX IF NOT EXISTS idx_exports_venue ON pos360_report_export_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_sched_reports_venue ON pos360_scheduled_report_contracts(venue_id);
CREATE INDEX IF NOT EXISTS idx_bi_providers_venue ON pos360_bi_provider_profiles(venue_id);
CREATE INDEX IF NOT EXISTS idx_rpt_offline_venue ON pos360_report_offline_queue(venue_id);
CREATE INDEX IF NOT EXISTS idx_rpt_audit_venue ON pos360_report_audit(venue_id);
CREATE INDEX IF NOT EXISTS idx_rpt_audit_created ON pos360_report_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_perf_link_profile ON pos360_staff_performance_report_links(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_guest_intel_link_customer ON pos360_guest_intelligence_report_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_event_pkg_link_event ON pos360_event_package_report_links(private_event_id);
CREATE INDEX IF NOT EXISTS idx_pmt_analytics_link_pmt ON pos360_payment_analytics_report_links(payment_record_id);
