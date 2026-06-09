-- ============================================================
-- Migration 010 — New Roles, Foundation Tables, Security
-- Applied: Phase 10 (Auth v2 + RBAC)
--
-- Adds:
--   • Widened role CHECK (human_mentor, passport_member, developer)
--   • staff_id + mentor_specialties columns on system_users
--   • passport_member_profiles, passport_member_refresh_tokens
--   • passport_connections
--   • mentor_sessions, mentor_tasting_notes
--   • dev_access_grants
--   • access_requests, admin_inbox
--   • founder_recovery_codes, founder_security_events
--   • venues, venue_memberships, venue_permissions
--   • inventory_items, inventory_movements, inventory_alerts
--   • ticker_items, ticker_schedules, ticker_history
--   • system_settings, feature_flags, environment_settings
--   • audit_logs columns: actor_role, ip_address, result, action_category
--   • Append-only trigger on audit_logs
-- ============================================================

BEGIN;

-- ── 1. Widen system_users.role CHECK constraint ───────────────
ALTER TABLE system_users
  DROP CONSTRAINT IF EXISTS system_users_role_check;

ALTER TABLE system_users
  ADD CONSTRAINT system_users_role_check
  CHECK (role IN (
    'founder_level_0',
    'admin',
    'manager',
    'staff',
    'human_mentor',
    'passport_member',
    'developer',
    'guest'
  ));

-- ── 2. New columns on system_users ───────────────────────────
ALTER TABLE system_users
  ADD COLUMN IF NOT EXISTS staff_id           TEXT   UNIQUE,
  ADD COLUMN IF NOT EXISTS mentor_specialties JSONB  NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS dev_grant_id       TEXT;

CREATE INDEX IF NOT EXISTS idx_system_users_staff_id ON system_users(staff_id);

-- ── 3. passport_member_profiles ──────────────────────────────
CREATE TABLE IF NOT EXISTS passport_member_profiles (
  id                  BIGSERIAL    PRIMARY KEY,
  profile_id          TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  user_id             TEXT         REFERENCES system_users(user_id) ON DELETE SET NULL,
  passport_id         TEXT         REFERENCES passport_records(passport_id) ON DELETE SET NULL,
  email               TEXT         UNIQUE,
  phone               TEXT         UNIQUE,
  display_name        TEXT,
  resume_token_hash   TEXT,
  xp                  INTEGER      NOT NULL DEFAULT 0,
  legacy_score        INTEGER      NOT NULL DEFAULT 0,
  tier                TEXT         NOT NULL DEFAULT 'guest'
                        CHECK (tier IN ('guest','explorer','connoisseur','aficionado','legend')),
  rewards             JSONB        NOT NULL DEFAULT '[]',
  travel_history      JSONB        NOT NULL DEFAULT '[]',
  event_history       JSONB        NOT NULL DEFAULT '[]',
  mentor_history      JSONB        NOT NULL DEFAULT '[]',
  is_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  verified_method     TEXT
                        CHECK (verified_method IN ('phone','email','qr',NULL)),
  local_session_data  JSONB,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_member_email    ON passport_member_profiles(email);
CREATE INDEX IF NOT EXISTS idx_passport_member_phone    ON passport_member_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_passport_member_passport ON passport_member_profiles(passport_id);

-- ── 4. passport_member_refresh_tokens (rotation) ─────────────
CREATE TABLE IF NOT EXISTS passport_member_refresh_tokens (
  id              BIGSERIAL    PRIMARY KEY,
  token_id        TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  profile_id      TEXT         NOT NULL REFERENCES passport_member_profiles(profile_id) ON DELETE CASCADE,
  token_hash      TEXT         NOT NULL,
  device_label    TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  issued_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ  NOT NULL,
  last_used_at    TIMESTAMPTZ,
  rotated_at      TIMESTAMPTZ,
  revoked         BOOLEAN      NOT NULL DEFAULT FALSE,
  revoked_at      TIMESTAMPTZ,
  revoke_reason   TEXT
);

CREATE INDEX IF NOT EXISTS idx_pm_refresh_profile  ON passport_member_refresh_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_pm_refresh_token_id ON passport_member_refresh_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_pm_refresh_expires   ON passport_member_refresh_tokens(expires_at);

-- ── 5. passport_connections ───────────────────────────────────
CREATE TABLE IF NOT EXISTS passport_connections (
  id              BIGSERIAL    PRIMARY KEY,
  connection_id   TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  requester_id    TEXT         NOT NULL,
  recipient_id    TEXT         NOT NULL,
  status          TEXT         NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','declined','blocked')),
  connected_at    TIMESTAMPTZ,
  venue_id        TEXT,
  event_context   TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON passport_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON passport_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status    ON passport_connections(status);

-- ── 6. mentor_sessions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id                BIGSERIAL    PRIMARY KEY,
  session_id        TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  mentor_user_id    TEXT         NOT NULL REFERENCES system_users(user_id) ON DELETE RESTRICT,
  guest_session_id  TEXT,
  passport_id       TEXT,
  craft             TEXT         NOT NULL DEFAULT 'SmokeCraft',
  status            TEXT         NOT NULL DEFAULT 'assigned'
                      CHECK (status IN ('assigned','active','completed','cancelled')),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  learner_progress  JSONB        NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor  ON mentor_sessions(mentor_user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_guest   ON mentor_sessions(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_status  ON mentor_sessions(status);

-- ── 7. mentor_tasting_notes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_tasting_notes (
  id              BIGSERIAL    PRIMARY KEY,
  note_id         TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  session_id      TEXT         NOT NULL REFERENCES mentor_sessions(session_id) ON DELETE CASCADE,
  mentor_user_id  TEXT         NOT NULL,
  note_type       TEXT         NOT NULL DEFAULT 'general'
                    CHECK (note_type IN ('general','flavor','pairing','guidance','recommendation')),
  content         TEXT         NOT NULL,
  metadata        JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_notes_session ON mentor_tasting_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_mentor  ON mentor_tasting_notes(mentor_user_id);

-- ── 8. dev_access_grants ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS dev_access_grants (
  id              BIGSERIAL    PRIMARY KEY,
  grant_id        TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  user_id         TEXT         NOT NULL REFERENCES system_users(user_id) ON DELETE CASCADE,
  granted_by      TEXT         NOT NULL,
  environment     TEXT         NOT NULL DEFAULT 'development'
                    CHECK (environment IN ('development','staging')),
  reason          TEXT,
  granted_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ  NOT NULL,
  revoked         BOOLEAN      NOT NULL DEFAULT FALSE,
  revoked_at      TIMESTAMPTZ,
  revoked_by      TEXT
);

CREATE INDEX IF NOT EXISTS idx_dev_grants_user    ON dev_access_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_grants_expires ON dev_access_grants(expires_at);
CREATE INDEX IF NOT EXISTS idx_dev_grants_active  ON dev_access_grants(user_id) WHERE revoked = FALSE;

-- ── 9. access_requests ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_requests (
  id                BIGSERIAL    PRIMARY KEY,
  request_id        TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  requester_id      TEXT,
  requester_email   TEXT,
  requester_name    TEXT,
  current_role      TEXT         NOT NULL DEFAULT 'guest',
  requested_role    TEXT         NOT NULL,
  requested_route   TEXT,
  reason            TEXT,
  status            TEXT         NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','denied','escalated')),
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  review_notes      TEXT,
  escalated_to      TEXT
                      CHECK (escalated_to IN ('admin','founder',NULL)),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status    ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester ON access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_role      ON access_requests(requested_role);

-- ── 10. admin_inbox ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_inbox (
  id            BIGSERIAL    PRIMARY KEY,
  inbox_id      TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  item_type     TEXT         NOT NULL
                  CHECK (item_type IN (
                    'access_request','mentor_request','dev_request',
                    'role_change','security_alert','system_alert',
                    'founder_alert'
                  )),
  reference_id  TEXT,
  title         TEXT         NOT NULL,
  summary       TEXT,
  priority      TEXT         NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','critical')),
  status        TEXT         NOT NULL DEFAULT 'unread'
                  CHECK (status IN ('unread','read','actioned','dismissed')),
  assigned_to   TEXT
                  CHECK (assigned_to IN ('admin','founder',NULL)),
  actioned_by   TEXT,
  actioned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_status   ON admin_inbox(status);
CREATE INDEX IF NOT EXISTS idx_inbox_assigned ON admin_inbox(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inbox_priority ON admin_inbox(priority);
CREATE INDEX IF NOT EXISTS idx_inbox_type     ON admin_inbox(item_type);

-- ── 11. founder_recovery_codes ────────────────────────────────
CREATE TABLE IF NOT EXISTS founder_recovery_codes (
  id              BIGSERIAL    PRIMARY KEY,
  code_id         TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  founder_user_id TEXT         NOT NULL REFERENCES system_users(user_id) ON DELETE CASCADE,
  code_hash       TEXT         NOT NULL,
  used            BOOLEAN      NOT NULL DEFAULT FALSE,
  used_at         TIMESTAMPTZ,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '1 year')
);

CREATE INDEX IF NOT EXISTS idx_recovery_founder ON founder_recovery_codes(founder_user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_used    ON founder_recovery_codes(used);

-- ── 12. founder_security_events ───────────────────────────────
CREATE TABLE IF NOT EXISTS founder_security_events (
  id              BIGSERIAL    PRIMARY KEY,
  event_id        TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  founder_user_id TEXT         NOT NULL,
  event_type      TEXT         NOT NULL,
  severity        TEXT         NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info','warning','critical')),
  metadata        JSONB        NOT NULL DEFAULT '{}',
  ip_address      TEXT,
  user_agent      TEXT,
  resolved        BOOLEAN      NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_sec_events_user     ON founder_security_events(founder_user_id);
CREATE INDEX IF NOT EXISTS idx_founder_sec_events_type     ON founder_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_founder_sec_events_severity ON founder_security_events(severity);

-- ── 13. venues ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id            BIGSERIAL    PRIMARY KEY,
  venue_id      TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  name          TEXT         NOT NULL,
  venue_type    TEXT         NOT NULL DEFAULT 'cigar_lounge'
                  CHECK (venue_type IN (
                    'cigar_lounge','bar','restaurant','hotel','resort',
                    'private_club','event_venue','mixed'
                  )),
  city          TEXT,
  state         TEXT,
  country       TEXT         NOT NULL DEFAULT 'US',
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  capacity      INTEGER,
  status        TEXT         NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','pending','suspended')),
  settings      JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_type   ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);

-- ── 14. venue_memberships ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_memberships (
  id              BIGSERIAL    PRIMARY KEY,
  membership_id   TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  user_id         TEXT         REFERENCES system_users(user_id) ON DELETE CASCADE,
  passport_id     TEXT         REFERENCES passport_records(passport_id) ON DELETE CASCADE,
  venue_id        TEXT         NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  membership_type TEXT         NOT NULL DEFAULT 'member'
                    CHECK (membership_type IN ('member','staff','mentor','manager','admin','owner')),
  status          TEXT         NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','pending','suspended')),
  joined_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_memberships_user  ON venue_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_memberships_venue ON venue_memberships(venue_id);

-- ── 15. venue_permissions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_permissions (
  id              BIGSERIAL    PRIMARY KEY,
  venue_id        TEXT         NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  role            TEXT         NOT NULL,
  permission_key  TEXT         NOT NULL,
  enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, role, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_venue_perms_venue ON venue_permissions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_perms_role  ON venue_permissions(role);

-- ── 16. inventory_items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id              BIGSERIAL    PRIMARY KEY,
  item_id         TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id        TEXT         REFERENCES venues(venue_id) ON DELETE SET NULL,
  name            TEXT         NOT NULL,
  category        TEXT         NOT NULL DEFAULT 'humidor'
                    CHECK (category IN ('humidor','bar','kitchen','retail','supplies','other')),
  sku             TEXT,
  brand           TEXT,
  origin          TEXT,
  description     TEXT,
  unit            TEXT         NOT NULL DEFAULT 'each',
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 0,
  reorder_point   NUMERIC(10,2) NOT NULL DEFAULT 5,
  reorder_qty     NUMERIC(10,2) NOT NULL DEFAULT 10,
  unit_cost       NUMERIC(10,2),
  unit_price      NUMERIC(10,2),
  status          TEXT         NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','discontinued','pending')),
  metadata        JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_venue    ON inventory_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku      ON inventory_items(sku);

-- ── 17. inventory_movements ───────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_movements (
  id              BIGSERIAL    PRIMARY KEY,
  movement_id     TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  item_id         TEXT         NOT NULL REFERENCES inventory_items(item_id) ON DELETE RESTRICT,
  venue_id        TEXT         REFERENCES venues(venue_id) ON DELETE SET NULL,
  movement_type   TEXT         NOT NULL
                    CHECK (movement_type IN (
                      'addition','removal','correction','transfer_in',
                      'transfer_out','usage','adjustment'
                    )),
  quantity        NUMERIC(10,2) NOT NULL,
  quantity_before NUMERIC(10,2),
  quantity_after  NUMERIC(10,2),
  reference_id    TEXT,
  reference_type  TEXT,
  notes           TEXT,
  performed_by    TEXT,
  performed_role  TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_movements_item    ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_type    ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inv_movements_created ON inventory_movements(created_at DESC);

-- ── 18. inventory_alerts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id              BIGSERIAL    PRIMARY KEY,
  alert_id        TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  item_id         TEXT         NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
  venue_id        TEXT         REFERENCES venues(venue_id) ON DELETE SET NULL,
  alert_type      TEXT         NOT NULL
                    CHECK (alert_type IN ('low_stock','out_of_stock','reorder','overstock','expiring')),
  severity        TEXT         NOT NULL DEFAULT 'warning'
                    CHECK (severity IN ('info','warning','critical')),
  message         TEXT,
  resolved        BOOLEAN      NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_alerts_item     ON inventory_alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_inv_alerts_resolved ON inventory_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_inv_alerts_type     ON inventory_alerts(alert_type);

-- ── 19. ticker_items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticker_items (
  id              BIGSERIAL    PRIMARY KEY,
  item_id         TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id        TEXT         REFERENCES venues(venue_id) ON DELETE SET NULL,
  source          TEXT         NOT NULL DEFAULT 'system',
  category        TEXT         NOT NULL DEFAULT 'general',
  content         TEXT         NOT NULL,
  priority        INTEGER      NOT NULL DEFAULT 5
                    CHECK (priority BETWEEN 1 AND 10),
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  display_count   INTEGER      NOT NULL DEFAULT 0,
  created_by      TEXT,
  created_role    TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticker_items_active  ON ticker_items(active);
CREATE INDEX IF NOT EXISTS idx_ticker_items_source  ON ticker_items(source);
CREATE INDEX IF NOT EXISTS idx_ticker_items_venue   ON ticker_items(venue_id);

-- ── 20. ticker_schedules ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticker_schedules (
  id              BIGSERIAL    PRIMARY KEY,
  schedule_id     TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  venue_id        TEXT         REFERENCES venues(venue_id) ON DELETE SET NULL,
  item_id         TEXT         REFERENCES ticker_items(item_id) ON DELETE CASCADE,
  day_of_week     INTEGER      CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME,
  end_time        TIME,
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticker_schedules_item  ON ticker_schedules(item_id);
CREATE INDEX IF NOT EXISTS idx_ticker_schedules_venue ON ticker_schedules(venue_id);
CREATE INDEX IF NOT EXISTS idx_ticker_schedules_day   ON ticker_schedules(day_of_week);

-- ── 21. ticker_history ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticker_history (
  id              BIGSERIAL    PRIMARY KEY,
  item_id         TEXT         NOT NULL REFERENCES ticker_items(item_id) ON DELETE CASCADE,
  venue_id        TEXT         REFERENCES venues(venue_id) ON DELETE SET NULL,
  displayed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  session_id      TEXT,
  device_id       TEXT
);

CREATE INDEX IF NOT EXISTS idx_ticker_history_item    ON ticker_history(item_id);
CREATE INDEX IF NOT EXISTS idx_ticker_history_display ON ticker_history(displayed_at DESC);

-- ── 22. system_settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  id            BIGSERIAL    PRIMARY KEY,
  setting_key   TEXT         NOT NULL UNIQUE,
  setting_value JSONB        NOT NULL DEFAULT '{}',
  description   TEXT,
  locked        BOOLEAN      NOT NULL DEFAULT FALSE,
  updated_by    TEXT,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (setting_key, setting_value, description, locked) VALUES
  ('platform_name',      '"NOVEE OS"',                          'Platform display name',               FALSE),
  ('default_venue',      '"novee-grand-lounge"',                'Default venue identifier',            FALSE),
  ('guest_xp_enabled',   'true',                                'Allow guests to earn XP',             FALSE),
  ('leaderboard_public', 'true',                                'Show leaderboard publicly',           FALSE),
  ('ticker_enabled',     'true',                                'Enable TicketTicker globally',        FALSE),
  ('maintenance_mode',   'false',                               'Put system in maintenance mode',      FALSE),
  ('revenue_tier',       '"prototype"',                         'Current revenue/billing tier',        TRUE),
  ('license_status',     '"prototype"',                         'Platform license status',             TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ── 23. feature_flags ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id            BIGSERIAL    PRIMARY KEY,
  flag_key      TEXT         NOT NULL UNIQUE,
  enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
  description   TEXT,
  roles_allowed JSONB        NOT NULL DEFAULT '["all"]',
  updated_by    TEXT,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags (flag_key, enabled, description) VALUES
  ('smokecraft_360',       TRUE,  'SmokeCraft 360 craft module'),
  ('pourcraft_360',        TRUE,  'PourCraft 360 craft module'),
  ('beercraft_360',        TRUE,  'BeerCraft 360 craft module'),
  ('winecraft_360',        TRUE,  'WineCraft 360 craft module'),
  ('passport_connection',  TRUE,  '360 Passport Connection'),
  ('dayone_travel',        TRUE,  'DayOne360 Travel module'),
  ('eat_command',          TRUE,  'E.A.T. Command module'),
  ('pos3',                 TRUE,  'POS 3 module'),
  ('ticket_ticker',        TRUE,  'TicketTicker live feed'),
  ('leaderboard',          TRUE,  'Grand Lounge Leaderboard'),
  ('human_mentor',         TRUE,  'Human Mentor role and console'),
  ('developer_access',     FALSE, 'Developer Diagnostics access'),
  ('passport_member_jwt',  TRUE,  'Passport Member JWT (14-day + refresh rotation)')
ON CONFLICT (flag_key) DO NOTHING;

-- ── 24. environment_settings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS environment_settings (
  id            BIGSERIAL    PRIMARY KEY,
  env_key       TEXT         NOT NULL UNIQUE,
  env_value     TEXT,
  is_secret     BOOLEAN      NOT NULL DEFAULT FALSE,
  description   TEXT,
  updated_by    TEXT,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO environment_settings (env_key, is_secret, description) VALUES
  ('NODE_ENV',                  FALSE, 'Runtime environment'),
  ('JWT_SECRET',                TRUE,  'JWT signing secret — set in env only'),
  ('FOUNDER_CHALLENGE_SECRET',  TRUE,  'Founder 3rd-factor secret — set in env only'),
  ('DATABASE_URL',              TRUE,  'PostgreSQL connection string'),
  ('CORS_ORIGIN',               FALSE, 'Allowed CORS origin(s)'),
  ('AUTH_COOKIE_SECURE',        FALSE, 'Cookie Secure flag'),
  ('VENUE_ID',                  FALSE, 'Active venue identifier'),
  ('DEVICE_ID',                 FALSE, 'Device identifier for kiosk mode')
ON CONFLICT (env_key) DO NOTHING;

-- ── 25. Expand audit_logs schema ────────────────────────────
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_role       TEXT,
  ADD COLUMN IF NOT EXISTS action_category  TEXT
                             CHECK (action_category IN (
                               'AUTH','ROLE','ADMIN','POS','EAT',
                               'INVENTORY','TICKER','PAYMENT','DEVELOPER',
                               'FOUNDER','MENTOR','PASSPORT_CONNECTION',
                               'VENUE','SYSTEM_SETTINGS','FEATURE_FLAGS'
                             )),
  ADD COLUMN IF NOT EXISTS ip_address       TEXT,
  ADD COLUMN IF NOT EXISTS result           TEXT
                             CHECK (result IN ('success','failure','blocked',NULL)),
  ADD COLUMN IF NOT EXISTS route_path       TEXT,
  ADD COLUMN IF NOT EXISTS session_id       TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_category   ON audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_role ON audit_logs(actor_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result     ON audit_logs(result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created    ON audit_logs(created_at DESC);

-- ── 26. Append-only protection on audit_logs ─────────────────
-- Prevents DELETE and UPDATE on audit_logs from any role.
-- Only Founder Level 0 may call an ARCHIVE function (separate, logged).
CREATE OR REPLACE FUNCTION audit_logs_no_delete_or_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only — DELETE and UPDATE are prohibited. '
    'Contact Founder Level 0 to archive or export logs.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_no_delete ON audit_logs;
CREATE TRIGGER trg_audit_logs_no_delete
  BEFORE DELETE OR UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_no_delete_or_update();

-- ── 27. Append-only protection on security_events ────────────
CREATE OR REPLACE FUNCTION security_events_no_delete_or_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'security_events is append-only — DELETE and UPDATE are prohibited.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_security_events_no_delete ON security_events;
CREATE TRIGGER trg_security_events_no_delete
  BEFORE DELETE OR UPDATE ON security_events
  FOR EACH ROW EXECUTE FUNCTION security_events_no_delete_or_update();

-- ── 28. auth_credentials: add staff_id lookup column ─────────
ALTER TABLE auth_credentials
  ADD COLUMN IF NOT EXISTS staff_id TEXT;

CREATE INDEX IF NOT EXISTS idx_auth_creds_staff_id ON auth_credentials(staff_id);

COMMIT;
