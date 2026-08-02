-- Production Package 6 — Legal, Privacy, Accessibility, and Tobacco Compliance
--
-- Server-authoritative compliance core: jurisdiction configuration, age
-- verification records, policy versions + acceptances, consent records,
-- data-rights requests (access/correction/deletion/export), retention
-- configuration, tobacco warning versions, staff acknowledgements, media
-- rights review, and an append-only compliance audit trail.
--
-- All legal text stored here (terms/privacy/warnings) is DRAFT text pending
-- counsel review — see policy_versions.counsel_review_status. No row in
-- this schema should ever be read by the application as legally final.

-- ── Jurisdictions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_jurisdictions (
  id                   SERIAL PRIMARY KEY,
  code                 TEXT UNIQUE NOT NULL,       -- e.g. 'US-FL', 'US-DEFAULT', 'DR' (Dominican Republic, future)
  label                TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'draft', -- draft | active | disabled
  min_purchase_age     INTEGER NOT NULL DEFAULT 21,
  tobacco_sales_allowed BOOLEAN NOT NULL DEFAULT false,
  shipping_allowed     BOOLEAN NOT NULL DEFAULT false,   -- shipping disabled by default; must be explicitly enabled per jurisdiction
  venue_pickup_allowed  BOOLEAN NOT NULL DEFAULT true,
  in_venue_allowed      BOOLEAN NOT NULL DEFAULT true,
  local_delivery_allowed BOOLEAN NOT NULL DEFAULT false,
  quantity_limit_per_order INTEGER,                 -- NULL = no configured limit
  reverification_days   INTEGER NOT NULL DEFAULT 365,
  notes                TEXT,
  counsel_review_status TEXT NOT NULL DEFAULT 'pending', -- pending | in_review | approved
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Age verification (self-attestation + staff + provider-adapter shape) ──
CREATE TABLE IF NOT EXISTS age_verification_records (
  id                 SERIAL PRIMARY KEY,
  subject_type       TEXT NOT NULL,       -- 'account' | 'guest'
  subject_id         TEXT NOT NULL,
  jurisdiction_code  TEXT NOT NULL REFERENCES compliance_jurisdictions(code),
  method             TEXT NOT NULL,       -- self_attestation | staff_verified | provider_adapter | in_person_fulfillment
  result             TEXT NOT NULL,       -- approved | denied
  declared_birthdate DATE,                -- optional, self-attestation only; never a full ID scan
  provider_ref       TEXT,                -- opaque reference from a future third-party age-verification provider
  staff_actor_id     TEXT,                -- staff user id when method = staff_verified / in_person_fulfillment
  verified_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at         TIMESTAMPTZ,         -- reverification deadline (jurisdiction.reverification_days from verified_at)
  ip_hash            TEXT,                -- salted hash only, never raw IP
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_age_verif_subject ON age_verification_records(subject_type, subject_id);

-- ── Policy documents (Terms / Privacy / Tobacco Warning), versioned ───────
CREATE TABLE IF NOT EXISTS policy_versions (
  id                    SERIAL PRIMARY KEY,
  policy_type           TEXT NOT NULL,     -- terms | privacy | tobacco_warning | cookie_policy
  version               TEXT NOT NULL,     -- semantic-ish e.g. '2026.08.0-draft'
  locale                TEXT NOT NULL DEFAULT 'en',
  jurisdiction_code     TEXT REFERENCES compliance_jurisdictions(code),
  body_markdown         TEXT NOT NULL,
  effective_date        DATE NOT NULL,
  counsel_review_status TEXT NOT NULL DEFAULT 'pending', -- pending | in_review | approved
  is_current            BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(policy_type, version, locale)
);
CREATE INDEX IF NOT EXISTS idx_policy_versions_current ON policy_versions(policy_type, locale, is_current);

-- ── Policy acceptance (append-only) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_acceptances (
  id               SERIAL PRIMARY KEY,
  subject_type     TEXT NOT NULL,      -- 'account' | 'guest'
  subject_id       TEXT NOT NULL,
  policy_version_id INTEGER NOT NULL REFERENCES policy_versions(id),
  accepted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  locale           TEXT NOT NULL DEFAULT 'en',
  ip_hash          TEXT
);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_subject ON policy_acceptances(subject_type, subject_id);

-- ── Consent records (cookies/localStorage categories, versioned, revocable) ─
CREATE TABLE IF NOT EXISTS consent_records (
  id               SERIAL PRIMARY KEY,
  subject_type     TEXT NOT NULL,     -- 'account' | 'guest'
  subject_id       TEXT NOT NULL,
  consent_version  TEXT NOT NULL,
  strictly_necessary BOOLEAN NOT NULL DEFAULT true,  -- always true, cannot be withdrawn (session/auth)
  preferences      BOOLEAN NOT NULL DEFAULT false,
  analytics        BOOLEAN NOT NULL DEFAULT false,
  marketing        BOOLEAN NOT NULL DEFAULT false,
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at     TIMESTAMPTZ,
  source           TEXT NOT NULL DEFAULT 'consent_center' -- consent_center | signup | staff_override(never used to grant nonessential)
);
CREATE INDEX IF NOT EXISTS idx_consent_subject ON consent_records(subject_type, subject_id, recorded_at DESC);

-- ── Data-rights requests (access / correction / deletion / export / restriction) ─
CREATE TABLE IF NOT EXISTS data_rights_requests (
  id                  SERIAL PRIMARY KEY,
  request_number      TEXT UNIQUE NOT NULL,
  subject_type        TEXT NOT NULL,       -- 'account' | 'guest'
  subject_id          TEXT NOT NULL,
  request_type        TEXT NOT NULL,       -- access | correction | deletion | export | consent_withdrawal | marketing_opt_out | restriction
  status               TEXT NOT NULL DEFAULT 'received', -- received | identity_verified | in_progress | completed | denied | cancelled
  identity_verified_at TIMESTAMPTZ,
  deadline_at          TIMESTAMPTZ NOT NULL,  -- operational default: 30 days from received
  retention_exceptions  JSONB,                -- e.g. {"payment_records":"kept, anonymized customer ref, tax retention"}
  preview_payload       JSONB,                -- deletion/export preview shown to requester before commit
  result_payload         JSONB,               -- final export bundle reference / deletion summary
  handled_by            TEXT,                 -- staff actor for manual steps
  completed_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_rights_subject ON data_rights_requests(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_data_rights_status ON data_rights_requests(status);

-- ── Retention configuration (operational defaults, pending counsel approval) ─
CREATE TABLE IF NOT EXISTS retention_policies (
  id                  SERIAL PRIMARY KEY,
  data_category       TEXT UNIQUE NOT NULL,  -- accounts | guest_identities | gameplay_state | xp_rewards | passport | orders | payments | refunds | disputes | inventory_audit | media_rights | support_cases | incident_logs | security_logs | backups | deleted_account_tombstones
  jurisdiction_code   TEXT REFERENCES compliance_jurisdictions(code),
  retention_days      INTEGER NOT NULL,
  legal_basis_note    TEXT,
  status              TEXT NOT NULL DEFAULT 'operational_default_pending_counsel',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Staff acknowledgements (training/version-tracking, reuses audit pattern) ─
CREATE TABLE IF NOT EXISTS staff_acknowledgements (
  id             SERIAL PRIMARY KEY,
  staff_id       TEXT NOT NULL,
  policy_version_id INTEGER NOT NULL REFERENCES policy_versions(id),
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role_at_ack    TEXT
);
CREATE INDEX IF NOT EXISTS idx_staff_ack_staff ON staff_acknowledgements(staff_id);

-- ── Compliance audit trail (append-only; no UPDATE/DELETE from app code) ──
CREATE TABLE IF NOT EXISTS compliance_audit_events (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL,   -- age_verification | terms_acceptance | privacy_acknowledgement | consent_change | policy_version_change | jurisdiction_rule_change | data_export | data_deletion | data_correction | retention_override | staff_acknowledgement | warning_acknowledgement | media_rights_action | accessibility_issue_resolution | tobacco_purchase_denied | tobacco_purchase_approved | shipping_denied
  subject_type  TEXT,
  subject_id    TEXT,
  actor_id      TEXT,            -- staff/admin actor if applicable
  jurisdiction_code TEXT,
  detail        JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_type ON compliance_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_subject ON compliance_audit_events(subject_type, subject_id);

-- ── Media rights review (extends Package 1 media rights with expiry/takedown) ─
CREATE TABLE IF NOT EXISTS media_rights_review (
  id              SERIAL PRIMARY KEY,
  media_id        TEXT NOT NULL,
  rights_status   TEXT NOT NULL DEFAULT 'active', -- active | expiring_soon | expired | takedown_requested | retired
  rights_expiration DATE,
  review_due_date   DATE,
  takedown_requested_at TIMESTAMPTZ,
  takedown_requested_by TEXT,
  takedown_reason        TEXT,
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_rights_status ON media_rights_review(rights_status);

-- ── Accessibility issue tracking (compliance admin center) ────────────────
CREATE TABLE IF NOT EXISTS accessibility_issues (
  id            SERIAL PRIMARY KEY,
  screen        TEXT NOT NULL,
  wcag_criterion TEXT,
  severity      TEXT NOT NULL DEFAULT 'minor', -- blocker | major | minor
  description   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open',   -- open | in_progress | resolved | wontfix
  resolved_at   TIMESTAMPTZ,
  resolved_note TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Seed: default jurisdictions (draft, pending counsel approval) ─────────
INSERT INTO compliance_jurisdictions
  (code, label, status, min_purchase_age, tobacco_sales_allowed, shipping_allowed, venue_pickup_allowed, in_venue_allowed, local_delivery_allowed, quantity_limit_per_order, reverification_days, notes, counsel_review_status)
VALUES
  ('US-DEFAULT', 'United States — default (no state override configured)', 'active', 21, true, false, true, true, false, NULL, 365,
   'Operational default only. Federal minimum is 21 (Tobacco 21, 2019). State/local rules vary and must be configured per state before launch in that state. Shipping stays disabled until counsel confirms PACT Act / state shipment-ban compliance per destination.', 'pending'),
  ('US-FL', 'United States — Florida (example state config)', 'draft', 21, true, false, true, true, false, NULL, 365,
   'Example state-level override placeholder. Not verified against current Florida statute by counsel.', 'pending'),
  ('DR', 'Dominican Republic / Caribbean expansion (future)', 'disabled', 18, false, false, false, false, false, NULL, 365,
   'Not launch-targeted. Tobacco sales, age minimum, and shipping remain disabled until a jurisdiction-specific legal review is completed for Caribbean expansion.', 'pending')
ON CONFLICT (code) DO NOTHING;

-- ── Seed: retention policy operational defaults ────────────────────────────
INSERT INTO retention_policies (data_category, jurisdiction_code, retention_days, legal_basis_note, status) VALUES
  ('accounts',                  'US-DEFAULT', 2555, 'Operational default (~7yr); pending counsel approval.', 'operational_default_pending_counsel'),
  ('guest_identities',          'US-DEFAULT', 180,  'Guest sessions with no account conversion; operational default.', 'operational_default_pending_counsel'),
  ('gameplay_state',            'US-DEFAULT', 2555, 'Tied to account retention.', 'operational_default_pending_counsel'),
  ('xp_rewards',                'US-DEFAULT', 2555, 'Tied to account retention.', 'operational_default_pending_counsel'),
  ('passport',                  'US-DEFAULT', 2555, 'Tied to account retention.', 'operational_default_pending_counsel'),
  ('orders',                    'US-DEFAULT', 2555, 'Operational default (~7yr) aligned to typical tax/audit retention; pending counsel approval per state.', 'operational_default_pending_counsel'),
  ('payments',                  'US-DEFAULT', 2555, 'Payment/tax records retained even after account deletion (legal retention exception).', 'operational_default_pending_counsel'),
  ('refunds',                   'US-DEFAULT', 2555, 'Tied to payment retention.', 'operational_default_pending_counsel'),
  ('disputes',                  'US-DEFAULT', 2555, 'Tied to payment retention.', 'operational_default_pending_counsel'),
  ('inventory_audit',           'US-DEFAULT', 1095, 'Operational default (~3yr).', 'operational_default_pending_counsel'),
  ('media_rights',              'US-DEFAULT', 2555, 'Retained per media rights agreement term.', 'operational_default_pending_counsel'),
  ('support_cases',             'US-DEFAULT', 1095, 'Operational default (~3yr).', 'operational_default_pending_counsel'),
  ('incident_logs',             'US-DEFAULT', 1095, 'Operational default (~3yr).', 'operational_default_pending_counsel'),
  ('security_logs',             'US-DEFAULT', 400,  'Operational default (~13mo), matches Package 5 monitoring window.', 'operational_default_pending_counsel'),
  ('backups',                   'US-DEFAULT', 90,   'Matches Package 5 backup rotation policy.', 'operational_default_pending_counsel'),
  ('deleted_account_tombstones','US-DEFAULT', 2555, 'Anonymized tombstone kept for fraud/audit continuity; no PII retained beyond anonymized reference.', 'operational_default_pending_counsel')
ON CONFLICT (data_category) DO NOTHING;

-- ── Seed: draft policy versions (COUNSEL REVIEW DRAFT text) ───────────────
INSERT INTO policy_versions (policy_type, version, locale, jurisdiction_code, body_markdown, effective_date, counsel_review_status, is_current) VALUES
('tobacco_warning', '2026.08.0-draft', 'en', 'US-DEFAULT',
 '[COUNSEL REVIEW DRAFT] WARNING: Tobacco products are for adults 21 and older. Tobacco use is addictive and carries serious health risks including cancer, heart disease, and lung disease. Not for sale to minors. This placeholder warning text has not been reviewed or approved by legal counsel and must not be treated as final compliant warning language for any jurisdiction.',
 '2026-08-02', 'pending', true),
('tobacco_warning', '2026.08.0-draft', 'es', 'US-DEFAULT',
 '[BORRADOR PARA REVISION LEGAL] ADVERTENCIA: Los productos de tabaco son solo para adultos de 21 anos o mas. El uso de tabaco es adictivo y conlleva riesgos graves para la salud. No se vende a menores. Este texto es un borrador de marcador de posicion, no ha sido revisado por un abogado y no debe considerarse lenguaje legal final para ninguna jurisdiccion.',
 '2026-08-02', 'pending', true),
('terms', '2026.08.0-draft', 'en', NULL,
 '[COUNSEL REVIEW DRAFT] SmokeCraft 360 Terms and Conditions (Draft Framework) — placeholder framework covering platform use, 21+ age requirement for tobacco purchase, account responsibilities, venue responsibilities, tobacco purchase restrictions, payment terms, refunds/cancellations, Rewards/Passport program, Golden Box submissions, intellectual property, prohibited conduct, service availability, limitation of liability, dispute resolution, governing law: [JURISDICTION PLACEHOLDER — COUNSEL TO SPECIFY], contact process, and policy update notice. THIS DOCUMENT REQUIRES FULL LEGAL COUNSEL REVIEW BEFORE LAUNCH AND IS NOT ENFORCEABLE AS WRITTEN.',
 '2026-08-02', 'pending', true),
('privacy', '2026.08.0-draft', 'en', NULL,
 '[COUNSEL REVIEW DRAFT] SmokeCraft 360 Privacy Policy (Draft Framework) — placeholder framework covering categories of data collected (account, guest identity, order history, gameplay/progression, Passport/Rewards, media uploads, support cases, monitoring logs, cookies/localStorage), purpose of collection, service providers (Stripe for payment processing — SmokeCraft 360 does not store full card numbers), retention, deletion and correction rights, security practices, minors, and policy update process. THIS DOCUMENT REQUIRES FULL LEGAL COUNSEL REVIEW BEFORE LAUNCH.',
 '2026-08-02', 'pending', true),
('cookie_policy', '2026.08.0-draft', 'en', NULL,
 '[COUNSEL REVIEW DRAFT] Cookie and Local Storage Policy (Draft Framework) — strictly necessary storage (auth/session) is always active; preferences, analytics, and marketing storage require affirmative opt-in via the Consent Center and can be withdrawn at any time. THIS DOCUMENT REQUIRES FULL LEGAL COUNSEL REVIEW BEFORE LAUNCH.',
 '2026-08-02', 'pending', true)
ON CONFLICT (policy_type, version, locale) DO NOTHING;
