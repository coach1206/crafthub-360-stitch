-- Production Package 6 — extends audit_logs.action_category to allow
-- 'COMPLIANCE' so RBAC-audited compliance-center actions (jurisdiction
-- updates, data-rights export/deletion, media-rights takedown) are tagged
-- distinctly from generic ADMIN actions. Postgres has no ALTER CHECK, so
-- drop and recreate as prior packages have done (see 077_golden_box_foundation.sql).
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_category_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_category_check
  CHECK (action_category IN (
    'AUTH','ROLE','ADMIN','POS','EAT','INVENTORY','TICKER','PAYMENT',
    'DEVELOPER','FOUNDER','MENTOR','PASSPORT_CONNECTION','VENUE',
    'SYSTEM_SETTINGS','FEATURE_FLAGS','GOLDEN_BOX','COMPLIANCE'
  ));
