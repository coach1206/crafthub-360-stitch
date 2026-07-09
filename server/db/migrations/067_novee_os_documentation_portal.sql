-- Phase E.9: NOVEE OS Documentation Portal
-- BUILD ONLY — publication, export, and client-ready flags all disabled by default

CREATE TABLE IF NOT EXISTS novee_os_documentation_library_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  doc_key TEXT NOT NULL UNIQUE,
  doc_title TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'platform_manual',
  doc_category TEXT NOT NULL DEFAULT 'platform',
  audience_role TEXT NOT NULL DEFAULT 'admin',
  module_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  client_ready BOOLEAN NOT NULL DEFAULT FALSE,
  staff_ready BOOLEAN NOT NULL DEFAULT FALSE,
  technical_only BOOLEAN NOT NULL DEFAULT FALSE,
  version_label TEXT NOT NULL DEFAULT '0.1.0-draft',
  safe_claim TEXT NOT NULL DEFAULT 'documentation_record_exists',
  seeded_content_status TEXT NOT NULL DEFAULT 'seeded_professional_draft',
  full_content_required BOOLEAN NOT NULL DEFAULT TRUE,
  review_required BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_article_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  doc_id UUID REFERENCES novee_os_documentation_library_registry(id),
  article_key TEXT NOT NULL UNIQUE,
  article_title TEXT NOT NULL,
  article_type TEXT NOT NULL DEFAULT 'overview',
  article_category TEXT NOT NULL DEFAULT 'platform',
  audience_role TEXT NOT NULL DEFAULT 'admin',
  module_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  content_summary TEXT,
  full_content_required BOOLEAN NOT NULL DEFAULT TRUE,
  safe_claim TEXT NOT NULL DEFAULT 'documentation_article_exists',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_content_block_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  doc_id UUID REFERENCES novee_os_documentation_library_registry(id),
  article_id UUID REFERENCES novee_os_documentation_article_registry(id),
  block_key TEXT NOT NULL UNIQUE,
  block_title TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'paragraph',
  block_status TEXT NOT NULL DEFAULT 'draft',
  content_summary TEXT,
  content_body TEXT,
  contains_sensitive_data BOOLEAN NOT NULL DEFAULT FALSE,
  contains_unsafe_claim BOOLEAN NOT NULL DEFAULT FALSE,
  needs_review BOOLEAN NOT NULL DEFAULT TRUE,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'content_block_exists',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  doc_id UUID REFERENCES novee_os_documentation_library_registry(id),
  article_id UUID REFERENCES novee_os_documentation_article_registry(id),
  content_block_id UUID REFERENCES novee_os_documentation_content_block_registry(id),
  searchable_title TEXT NOT NULL,
  searchable_summary TEXT,
  searchable_tags_json JSONB NOT NULL DEFAULT '[]',
  module_key TEXT,
  audience_role TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  indexed_at TIMESTAMPTZ,
  safe_claim TEXT NOT NULL DEFAULT 'search_index_record_exists',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_review_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  doc_id UUID REFERENCES novee_os_documentation_library_registry(id),
  article_id UUID REFERENCES novee_os_documentation_article_registry(id),
  review_status TEXT NOT NULL DEFAULT 'not_reviewed',
  reviewer_role TEXT NOT NULL DEFAULT 'admin',
  review_notes TEXT,
  unsafe_claims_found BOOLEAN NOT NULL DEFAULT FALSE,
  sensitive_data_found BOOLEAN NOT NULL DEFAULT FALSE,
  missing_content_found BOOLEAN NOT NULL DEFAULT TRUE,
  approved_for_client BOOLEAN NOT NULL DEFAULT FALSE,
  approved_for_staff BOOLEAN NOT NULL DEFAULT FALSE,
  approved_for_public BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  safe_claim TEXT NOT NULL DEFAULT 'documentation_review_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_export_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  doc_id UUID REFERENCES novee_os_documentation_library_registry(id),
  export_type TEXT NOT NULL DEFAULT 'pdf',
  export_status TEXT NOT NULL DEFAULT 'not_started',
  export_format TEXT NOT NULL DEFAULT 'pdf',
  requested_by_reference_only TEXT,
  generated_file_reference_only TEXT,
  contains_sensitive_data BOOLEAN NOT NULL DEFAULT FALSE,
  approved_for_export BOOLEAN NOT NULL DEFAULT FALSE,
  exported_at TIMESTAMPTZ,
  safe_claim TEXT NOT NULL DEFAULT 'documentation_export_record_exists',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_safe_claims_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  claim_key TEXT NOT NULL UNIQUE,
  claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'safe_claim',
  module_key TEXT,
  claim_status TEXT NOT NULL DEFAULT 'draft',
  evidence_required BOOLEAN NOT NULL DEFAULT TRUE,
  evidence_present BOOLEAN NOT NULL DEFAULT FALSE,
  approved_for_sales BOOLEAN NOT NULL DEFAULT FALSE,
  approved_for_client BOOLEAN NOT NULL DEFAULT FALSE,
  blocker_reason TEXT,
  safe_claim TEXT NOT NULL DEFAULT 'documentation_safe_claim_exists',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_seeded_manual_content_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  doc_id UUID REFERENCES novee_os_documentation_library_registry(id),
  manual_key TEXT NOT NULL,
  manual_title TEXT NOT NULL,
  section_key TEXT NOT NULL UNIQUE,
  section_title TEXT NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 0,
  audience_role TEXT NOT NULL DEFAULT 'admin',
  module_key TEXT,
  content_body TEXT NOT NULL,
  content_depth_status TEXT NOT NULL DEFAULT 'seeded_professional_draft',
  investor_ready_draft BOOLEAN NOT NULL DEFAULT FALSE,
  needs_human_review BOOLEAN NOT NULL DEFAULT TRUE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  safe_claim TEXT NOT NULL DEFAULT 'seeded_manual_content_exists',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS novee_os_documentation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  actor_id TEXT NOT NULL DEFAULT 'system',
  actor_role TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'info',
  summary TEXT NOT NULL,
  metadata_json JSONB,
  ip_address TEXT,
  user_agent TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
