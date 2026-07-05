-- Safe migration: no destructive DDL, no truncation
-- Phase D.1 — Provider Activation Roadmap, Live Integration Order & No-Fake Activation Control
-- contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

CREATE TABLE IF NOT EXISTS phase_d_provider_activation_roadmaps (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID,
  roadmap_name                TEXT NOT NULL,
  roadmap_version             TEXT NOT NULL DEFAULT '1.0',
  current_phase               TEXT NOT NULL DEFAULT 'D.1',
  roadmap_status              TEXT NOT NULL DEFAULT 'active',
  provider_activation_locked  BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                    JSONB DEFAULT '{}',
  created_by                  TEXT,
  updated_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_categories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  provider_category TEXT NOT NULL CHECK (provider_category IN (
    'payments','billing','external_pos','inventory','menu_import',
    'bar_inventory','kitchen_inventory','humidor_inventory','kds_printer',
    'guest_notifications','staff_notifications','email','sms','sso','mfa',
    'device_trust','ip_allowlist','deployment','domain','white_label',
    'custom_domain','marketplace','smokecraft_sync','eat_automation',
    'reporting_analytics','tax_engine','payroll_accounting','manual_fallback','custom'
  )),
  category_label    TEXT NOT NULL,
  activation_order  INTEGER NOT NULL DEFAULT 0,
  readiness_status  TEXT NOT NULL DEFAULT 'not_ready' CHECK (readiness_status IN (
    'not_ready','foundation_ready','contract_ready','provider_required',
    'credentials_required','configuration_required','test_required',
    'verification_required','activation_required','ready_placeholder',
    'live_external','blocked','unavailable'
  )),
  provider_connected          BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                    JSONB DEFAULT '{}',
  created_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_candidates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID,
  venue_id              UUID,
  provider_key          TEXT NOT NULL,
  provider_category     TEXT NOT NULL CHECK (provider_category IN (
    'payments','billing','external_pos','inventory','menu_import',
    'bar_inventory','kitchen_inventory','humidor_inventory','kds_printer',
    'guest_notifications','staff_notifications','email','sms','sso','mfa',
    'device_trust','ip_allowlist','deployment','domain','white_label',
    'custom_domain','marketplace','smokecraft_sync','eat_automation',
    'reporting_analytics','tax_engine','payroll_accounting','manual_fallback','custom'
  )),
  provider_name         TEXT NOT NULL,
  activation_status     TEXT NOT NULL DEFAULT 'not_started' CHECK (activation_status IN (
    'not_started','placeholder','credentials_required','configuration_required',
    'provider_required','activation_required','ready_for_test_placeholder',
    'test_required','verification_required','active_external','blocked','failed','unavailable'
  )),
  readiness_status      TEXT NOT NULL DEFAULT 'not_ready' CHECK (readiness_status IN (
    'not_ready','foundation_ready','contract_ready','provider_required',
    'credentials_required','configuration_required','test_required',
    'verification_required','activation_required','ready_placeholder',
    'live_external','blocked','unavailable'
  )),
  demo_live_mode        TEXT NOT NULL DEFAULT 'demo' CHECK (demo_live_mode IN (
    'demo','local_preview','staging_placeholder','production_placeholder',
    'live_external','unavailable'
  )),
  provider_connected          BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_received        BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  activation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  test_completed              BOOLEAN NOT NULL DEFAULT FALSE,
  verification_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_ready              BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed           BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected           BOOLEAN NOT NULL DEFAULT FALSE,
  pos_sync_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_sync_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  notification_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_transaction_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  metadata                    JSONB DEFAULT '{}',
  created_by                  TEXT,
  updated_by                  TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_activation_order (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  provider_key      TEXT NOT NULL,
  provider_category TEXT NOT NULL,
  activation_order  INTEGER NOT NULL,
  phase_label       TEXT NOT NULL DEFAULT 'D.1',
  rationale         TEXT,
  activation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (activation_status IN (
    'not_started','placeholder','credentials_required','configuration_required',
    'provider_required','activation_required','ready_for_test_placeholder',
    'test_required','verification_required','active_external','blocked','failed','unavailable'
  )),
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_dependencies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID,
  provider_key            TEXT NOT NULL,
  dependency_provider_key TEXT NOT NULL,
  dependency_description  TEXT,
  blocking                BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets          BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id           TEXT,
  idempotency_key         TEXT UNIQUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_credentials_placeholders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID,
  venue_id                 UUID,
  provider_key             TEXT NOT NULL,
  provider_category        TEXT NOT NULL,
  credential_label         TEXT NOT NULL,
  credential_status        TEXT NOT NULL DEFAULT 'not_requested' CHECK (credential_status IN (
    'not_requested','requested_placeholder','received_placeholder',
    'verified_external','rejected','unavailable'
  )),
  credentials_received     BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets         BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets           BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data     BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data   BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id            TEXT,
  notes                    TEXT,
  idempotency_key          TEXT UNIQUE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_prerequisites (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID,
  provider_key          TEXT NOT NULL,
  provider_category     TEXT NOT NULL,
  prerequisite_label    TEXT NOT NULL,
  prerequisite_status   TEXT NOT NULL DEFAULT 'not_started' CHECK (prerequisite_status IN (
    'not_started','in_progress','complete','blocked','unavailable'
  )),
  required              BOOLEAN NOT NULL DEFAULT TRUE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id         TEXT,
  idempotency_key       TEXT UNIQUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_blockers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  venue_id          UUID,
  provider_key      TEXT NOT NULL,
  provider_category TEXT NOT NULL,
  blocker_label     TEXT NOT NULL,
  blocker_status    TEXT NOT NULL DEFAULT 'active' CHECK (blocker_status IN (
    'active','resolved','deferred','unavailable'
  )),
  severity          TEXT NOT NULL DEFAULT 'blocking' CHECK (severity IN (
    'blocking','warning','informational'
  )),
  resolution_notes  TEXT,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id     TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_legal_requirements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID,
  provider_key          TEXT NOT NULL,
  provider_category     TEXT NOT NULL,
  requirement_label     TEXT NOT NULL,
  requirement_status    TEXT NOT NULL DEFAULT 'not_started' CHECK (requirement_status IN (
    'not_started','in_review','signed','rejected','unavailable'
  )),
  contract_required     BOOLEAN NOT NULL DEFAULT TRUE,
  signed                BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets      BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets        BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data  BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id         TEXT,
  idempotency_key       TEXT UNIQUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_billing_requirements (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID,
  provider_key           TEXT NOT NULL,
  provider_category      TEXT NOT NULL,
  requirement_label      TEXT NOT NULL,
  requirement_status     TEXT NOT NULL DEFAULT 'not_started' CHECK (requirement_status IN (
    'not_started','in_review','approved','rejected','unavailable'
  )),
  billing_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed      BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets       BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets         BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data   BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id          TEXT,
  idempotency_key        TEXT UNIQUE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_security_requirements (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID,
  provider_key                TEXT NOT NULL,
  provider_category           TEXT NOT NULL,
  requirement_label           TEXT NOT NULL,
  requirement_status          TEXT NOT NULL DEFAULT 'not_started' CHECK (requirement_status IN (
    'not_started','in_review','approved','rejected','unavailable'
  )),
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_activation_statuses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  venue_id          UUID,
  provider_key      TEXT NOT NULL,
  provider_category TEXT NOT NULL,
  activation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (activation_status IN (
    'not_started','placeholder','credentials_required','configuration_required',
    'provider_required','activation_required','ready_for_test_placeholder',
    'test_required','verification_required','active_external','blocked','failed','unavailable'
  )),
  demo_live_mode    TEXT NOT NULL DEFAULT 'demo' CHECK (demo_live_mode IN (
    'demo','local_preview','staging_placeholder','production_placeholder',
    'live_external','unavailable'
  )),
  provider_connected          BOOLEAN NOT NULL DEFAULT FALSE,
  activation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed           BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected           BOOLEAN NOT NULL DEFAULT FALSE,
  pos_sync_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_sync_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  notification_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_transaction_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  reason                      TEXT,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_test_statuses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  venue_id          UUID,
  provider_key      TEXT NOT NULL,
  provider_category TEXT NOT NULL,
  test_status       TEXT NOT NULL DEFAULT 'not_started' CHECK (test_status IN (
    'not_started','test_plan_ready','test_required','passed_placeholder',
    'passed_external','failed','unavailable'
  )),
  test_completed              BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  reason                      TEXT,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_verification_statuses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID,
  venue_id            UUID,
  provider_key        TEXT NOT NULL,
  provider_category   TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'not_started' CHECK (verification_status IN (
    'not_started','verification_required','passed_placeholder',
    'passed_external','failed','unavailable'
  )),
  verification_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  reason                      TEXT,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_rollback_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  venue_id          UUID,
  provider_key      TEXT NOT NULL,
  provider_category TEXT NOT NULL,
  rollback_status   TEXT NOT NULL DEFAULT 'not_ready' CHECK (rollback_status IN (
    'not_ready','rollback_plan_required','rollback_ready_placeholder',
    'rollback_ready_external','rollback_triggered','unavailable'
  )),
  rollback_ready              BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  rollback_notes              TEXT,
  reason                      TEXT,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_failure_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  venue_id          UUID,
  provider_key      TEXT NOT NULL,
  provider_category TEXT NOT NULL,
  failure_label     TEXT NOT NULL,
  failure_reason    TEXT,
  resolved          BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id     TEXT,
  idempotency_key   TEXT UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_provider_readiness_matrix (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  venue_id          UUID,
  provider_key      TEXT NOT NULL,
  provider_category TEXT NOT NULL,
  readiness_status  TEXT NOT NULL DEFAULT 'not_ready' CHECK (readiness_status IN (
    'not_ready','foundation_ready','contract_ready','provider_required',
    'credentials_required','configuration_required','test_required',
    'verification_required','activation_required','ready_placeholder',
    'live_external','blocked','unavailable'
  )),
  demo_live_mode    TEXT NOT NULL DEFAULT 'demo' CHECK (demo_live_mode IN (
    'demo','local_preview','staging_placeholder','production_placeholder',
    'live_external','unavailable'
  )),
  provider_connected          BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_received        BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  activation_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  test_completed              BOOLEAN NOT NULL DEFAULT FALSE,
  verification_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_ready              BOOLEAN NOT NULL DEFAULT FALSE,
  live_mode_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  payment_processed           BOOLEAN NOT NULL DEFAULT FALSE,
  billing_connected           BOOLEAN NOT NULL DEFAULT FALSE,
  pos_sync_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_sync_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  notification_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  security_provider_connected BOOLEAN NOT NULL DEFAULT FALSE,
  deployment_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_transaction_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets            BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets              BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data        BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data      BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id               TEXT,
  idempotency_key             TEXT UNIQUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_safe_activation_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  claim_key       TEXT NOT NULL,
  claim_text      TEXT NOT NULL,
  claim_status    TEXT NOT NULL DEFAULT 'safe' CHECK (claim_status IN (
    'safe','conditional','not_safe','unavailable'
  )),
  phase_label     TEXT NOT NULL DEFAULT 'D.1',
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id   TEXT,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_unsafe_activation_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  claim_key       TEXT NOT NULL,
  claim_text      TEXT NOT NULL,
  claim_status    TEXT NOT NULL DEFAULT 'not_safe' CHECK (claim_status IN (
    'safe','conditional','not_safe','unavailable'
  )),
  reason_not_safe TEXT,
  phase_label     TEXT NOT NULL DEFAULT 'D.1',
  contains_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id   TEXT,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_activation_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  snapshot_label  TEXT NOT NULL DEFAULT 'phase_d_activation_snapshot',
  snapshot_data   JSONB NOT NULL DEFAULT '{}',
  phase_label     TEXT NOT NULL DEFAULT 'D.1',
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  actor_user_id   TEXT,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phase_d_activation_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  venue_id        UUID,
  actor_user_id   TEXT NOT NULL DEFAULT 'system',
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  before_snapshot JSONB DEFAULT '{}',
  after_snapshot  JSONB DEFAULT '{}',
  reason          TEXT,
  provider_key    TEXT,
  provider_category TEXT,
  live_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  contains_secrets  BOOLEAN NOT NULL DEFAULT FALSE,
  stores_secrets    BOOLEAN NOT NULL DEFAULT FALSE,
  exposes_private_data BOOLEAN NOT NULL DEFAULT TRUE,
  exposes_financial_data BOOLEAN NOT NULL DEFAULT TRUE,
  contains_ai_generated_content BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phase_d_roadmaps_org       ON phase_d_provider_activation_roadmaps(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_roadmaps_created   ON phase_d_provider_activation_roadmaps(created_at);
CREATE INDEX IF NOT EXISTS idx_phase_d_categories_org     ON phase_d_provider_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_categories_cat     ON phase_d_provider_categories(provider_category);
CREATE INDEX IF NOT EXISTS idx_phase_d_categories_order   ON phase_d_provider_categories(activation_order);
CREATE INDEX IF NOT EXISTS idx_phase_d_candidates_org     ON phase_d_provider_candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_candidates_venue   ON phase_d_provider_candidates(venue_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_candidates_key     ON phase_d_provider_candidates(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_candidates_cat     ON phase_d_provider_candidates(provider_category);
CREATE INDEX IF NOT EXISTS idx_phase_d_candidates_status  ON phase_d_provider_candidates(activation_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_order_org          ON phase_d_provider_activation_order(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_order_key          ON phase_d_provider_activation_order(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_order_n            ON phase_d_provider_activation_order(activation_order);
CREATE INDEX IF NOT EXISTS idx_phase_d_deps_org           ON phase_d_provider_dependencies(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_deps_key           ON phase_d_provider_dependencies(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_deps_dep           ON phase_d_provider_dependencies(dependency_provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_creds_org          ON phase_d_provider_credentials_placeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_creds_venue        ON phase_d_provider_credentials_placeholders(venue_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_creds_key          ON phase_d_provider_credentials_placeholders(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_creds_status       ON phase_d_provider_credentials_placeholders(credential_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_prereq_org         ON phase_d_provider_prerequisites(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_prereq_key         ON phase_d_provider_prerequisites(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_blockers_org       ON phase_d_provider_blockers(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_blockers_venue     ON phase_d_provider_blockers(venue_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_blockers_key       ON phase_d_provider_blockers(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_blockers_status    ON phase_d_provider_blockers(blocker_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_legal_org          ON phase_d_provider_legal_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_legal_key          ON phase_d_provider_legal_requirements(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_billing_req_org    ON phase_d_provider_billing_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_billing_req_key    ON phase_d_provider_billing_requirements(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_security_req_org   ON phase_d_provider_security_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_security_req_key   ON phase_d_provider_security_requirements(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_act_status_org     ON phase_d_provider_activation_statuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_act_status_venue   ON phase_d_provider_activation_statuses(venue_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_act_status_key     ON phase_d_provider_activation_statuses(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_act_status_cat     ON phase_d_provider_activation_statuses(provider_category);
CREATE INDEX IF NOT EXISTS idx_phase_d_act_status_val     ON phase_d_provider_activation_statuses(activation_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_act_status_mode    ON phase_d_provider_activation_statuses(demo_live_mode);
CREATE INDEX IF NOT EXISTS idx_phase_d_test_org           ON phase_d_provider_test_statuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_test_key           ON phase_d_provider_test_statuses(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_test_status        ON phase_d_provider_test_statuses(test_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_verif_org          ON phase_d_provider_verification_statuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_verif_key          ON phase_d_provider_verification_statuses(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_verif_status       ON phase_d_provider_verification_statuses(verification_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_rollback_org       ON phase_d_provider_rollback_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_rollback_key       ON phase_d_provider_rollback_records(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_rollback_status    ON phase_d_provider_rollback_records(rollback_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_failure_org        ON phase_d_provider_failure_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_failure_key        ON phase_d_provider_failure_records(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_matrix_org         ON phase_d_provider_readiness_matrix(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_matrix_key         ON phase_d_provider_readiness_matrix(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_matrix_cat         ON phase_d_provider_readiness_matrix(provider_category);
CREATE INDEX IF NOT EXISTS idx_phase_d_matrix_ready       ON phase_d_provider_readiness_matrix(readiness_status);
CREATE INDEX IF NOT EXISTS idx_phase_d_matrix_mode        ON phase_d_provider_readiness_matrix(demo_live_mode);
CREATE INDEX IF NOT EXISTS idx_phase_d_safe_claims_org    ON phase_d_safe_activation_claims(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_unsafe_claims_org  ON phase_d_unsafe_activation_claims(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_snapshots_org      ON phase_d_activation_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_snapshots_created  ON phase_d_activation_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_phase_d_audit_org          ON phase_d_activation_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_audit_actor        ON phase_d_activation_audit(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_phase_d_audit_key          ON phase_d_activation_audit(provider_key);
CREATE INDEX IF NOT EXISTS idx_phase_d_audit_created      ON phase_d_activation_audit(created_at);
