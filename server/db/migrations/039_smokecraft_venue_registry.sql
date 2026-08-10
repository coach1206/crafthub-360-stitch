-- Block 8 integration candidate: SmokeCraft Management Sync's real-venue
-- guard (requireValidVenue, venueValidationService.js) and journey ownership
-- checks require a canonical `venues` table with a text venue_id — main's
-- existing venue_* tables (venue_devices/venue_feature_settings/
-- venue_tax_config/venue_test_*) do not provide this. Extracted from the
-- verified recovery source's own venue-registry definition (its migration
-- 010) — this is the exact table Blocks 1-7's Management Sync tests ran
-- against, not a new invention. venue_memberships/venue_permissions
-- included because they FK-reference venues and are used by the same
-- venue-authorization layer.
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
