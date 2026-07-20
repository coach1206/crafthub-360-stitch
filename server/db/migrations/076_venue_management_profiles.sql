-- Package 6B: Venue Profile data model.
-- venues (System 1) stays the authoritative identity/status row untouched;
-- this table holds the richer, versioned, lifecycle-managed profile content
-- the Command Hub edits. One current profile row per venue (partial unique
-- index below enforces that no venue has two "current" rows).

CREATE TABLE IF NOT EXISTS venue_management_profiles (
  id BIGSERIAL PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  display_name TEXT,
  description TEXT,
  reservation_url TEXT,
  timezone TEXT,
  operating_hours JSONB NOT NULL DEFAULT '{}',
  amenities JSONB NOT NULL DEFAULT '[]',
  accessibility_info JSONB NOT NULL DEFAULT '{}',
  age_restriction TEXT,
  dress_code TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  logo_media_id BIGINT REFERENCES venue_management_media(id) ON DELETE SET NULL,
  hero_media_id BIGINT REFERENCES venue_management_media(id) ON DELETE SET NULL,
  gallery_media_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'REJECTED', 'ARCHIVED'
  )),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  published_by TEXT,
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one "current" profile row per venue.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vmp_one_current_per_venue
  ON venue_management_profiles (venue_id) WHERE is_current;

CREATE INDEX IF NOT EXISTS idx_vmp_venue ON venue_management_profiles (venue_id);
