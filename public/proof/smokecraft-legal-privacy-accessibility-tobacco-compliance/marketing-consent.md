# Marketing Consent

Codebase check: no email/SMS/push marketing sending infrastructure exists in `server/` (no marketing-provider SDK, no campaign/broadcast tables). This is the honest current state — not built silently in this pass.

Framework for when marketing is added (documented, not implemented as live automation, per mandate instruction not to build unneeded new infrastructure):
- `consent_records.marketing` boolean already exists and defaults `false` — any future marketing send must check this per-subject before sending.
- `POST /api/compliance/consent` / `withdraw` already support marketing opt-in/opt-out as a real, working toggle today, even though nothing currently reads it for sending.
- Transactional notices (order confirmations, receipts) are separate from marketing by design — they are not gated by `consent_records.marketing` and must never be, per the framework note in `policy_versions` (`cookie_policy` draft).
- `data_rights_requests.request_type = 'marketing_opt_out'` is a supported request type in the real schema/workflow today.
