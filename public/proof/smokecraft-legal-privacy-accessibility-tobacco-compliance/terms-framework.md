# Terms and Conditions — Draft Framework

Stored as `policy_versions` (`policy_type='terms'`), version `2026.08.0-draft`, `counsel_review_status='pending'`. Full draft text (see migration 117) is a placeholder framework explicitly covering: platform use, 21+ tobacco age requirement, account responsibilities, venue responsibilities, tobacco purchase restrictions, payment terms, refunds/cancellations, Rewards/Passport, Golden Box submissions, IP, prohibited conduct, service availability, limitation-of-liability language, dispute process, governing-law **[JURISDICTION PLACEHOLDER — COUNSEL TO SPECIFY]**, contact process, and update notice.

**REQUIRES FULL LEGAL COUNSEL REVIEW BEFORE LAUNCH. Not enforceable as written.** This is stated inline in the stored document text itself, not only in this proof doc.

Acceptance is REAL CODE, not just documentation: `POST /api/compliance/policies/accept` writes a `policy_acceptances` row keyed to `(subject_type, subject_id, policy_version_id, accepted_at, locale)` and fires a `terms_acceptance` audit event — tested live against a real `policy_versions` row (see regression-results.md).
