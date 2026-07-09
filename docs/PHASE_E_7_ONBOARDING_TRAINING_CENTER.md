# Phase E.7 — NOVEE OS Onboarding + Training Center

## What Was Built

Phase E.7 creates the Onboarding + Training Center for NOVEE OS. This layer provides structured program registries, training manual tracking, lesson management, onboarding checklists, training progress records, training evidence tracking, and onboarding acceptance records for all roles in the NOVEE OS ecosystem.

**Files created:**
- `server/db/migrations/065_novee_os_onboarding_training_center.sql` — 8-table migration
- `server/services/noveeOS/noveeOSOnboardingTrainingContracts.js` — allowed types, defaults, assertion helpers, validators
- `server/config/noveeOSOnboardingTrainingFeatureFlags.js` — 12 feature flags
- `server/services/noveeOS/noveeOSOnboardingTrainingService.js` — 31 async service methods
- `server/controllers/noveeOSOnboardingTrainingController.js` — controller with safe wrap pattern
- `server/routes/noveeOSOnboardingTrainingRoutes.js` — 35 routes at /api/novee-os/onboarding-training
- `src/pages/noveeOS/OnboardingTrainingCenter.jsx` — 12-panel frontend at /novee-os/onboarding-training

---

## What Is Still NOT Live

- Manual publication is disabled by default (`NOVEE_ONBOARDING_MANUAL_PUBLICATION_ENABLED=false`)
- Client completion is disabled by default
- Staff completion is disabled by default
- Manager completion is disabled by default
- Guest completion is disabled by default
- Remote distribution unlock is disabled by default
- No live remote delivery
- No active client provisioning
- No live invite links
- No license validation
- No rollback execution

---

## What Cannot Be Claimed

- Manuals are NOT fully published
- Staff training is NOT complete
- Manager training is NOT complete
- Client onboarding is NOT complete
- Guest training is NOT complete
- Remote distribution is NOT unlocked
- SmokeCraft venue training is NOT complete
- POS360 staff training is NOT complete
- E.A.T. manager training is NOT complete

---

## How Onboarding Programs Work

Each onboarding program targets a specific audience role (admin, venue_owner, manager, staff, guest, client, reseller, founder, platform_owner, support). Programs track:
- What modules are in scope
- Current status (draft / in_progress / needs_review / completed / blocked)
- Whether publication is approved
- Whether required for pilot, remote distribution, or go-live
- A safe_claim label for audit reference

Programs are built and tracked in `novee_os_onboarding_program_registry`. They are not live-activated in this phase.

---

## How Training Manuals Work

Training manuals are tracked in `novee_os_training_manual_registry`. Each manual has:
- A manual_key (unique identifier)
- A manual_type (admin_guide, staff_guide, venue_owner_guide, etc.)
- A version_label (default: 0.1.0-draft)
- A published flag (DEFAULT FALSE)
- A full_content_required flag (DEFAULT TRUE)

19 manuals are seeded as default records. Full content must be authored before any manual can be published. Publication requires an explicit flag override.

---

## How Lessons Work

Training lessons are tracked in `novee_os_training_lesson_registry`. Each lesson:
- Belongs to a manual and/or program
- Has a lesson_category (platform_overview, admin_setup, security, payments, pos, etc.)
- Has a sort_order for sequencing
- Has an estimated_minutes field
- Has a required flag (DEFAULT TRUE)
- Has a status (draft, in_progress, etc.)

Lessons are not marked complete until training progress records with evidence exist.

---

## How Checklists Work

Onboarding checklists are tracked in `novee_os_onboarding_checklist_registry`. Each item:
- Is linked to a program
- Has an owner_role (who is responsible)
- Has evidence_required and evidence_present flags
- Has a blocker_reason if something is blocking completion
- Uses idempotency_key to prevent duplicate entries

---

## How Training Progress Works

Training progress is tracked in `novee_os_training_progress_registry`. Records:
- Use `trainee_reference_only` — a non-PII reference (not email, not full name, not phone)
- Track `progress_status` and `completion_status` separately
- Track whether evidence is required and present
- Are never updated to completed unless evidence is present (when required)

Personal sensitive details are never stored or displayed.

---

## How Evidence Works

Training evidence is tracked in `novee_os_training_evidence_registry`. Evidence records:
- Link to a program and/or lesson
- Track evidence_type (manual, screenshot, supervisor_sign_off, etc.)
- Track evidence_status (pending, submitted, verified, rejected)
- Reference a verified_by field (non-PII reference)
- Never expose secrets, PII, or credentials

---

## How Acceptance Records Work

Onboarding acceptance is tracked in `novee_os_onboarding_acceptance_registry`. Records:
- Track acceptance_type (platform_owner_acknowledgment, admin_acknowledgment, staff_acknowledgment, etc.)
- Use `accepted_by_reference_only` — not a raw email or full name
- Track accepted_by_role
- Use idempotency_key to prevent duplicate acceptance entries

---

## Why Manual Publication Remains Disabled

Manual publication is disabled because:
1. No manual content has been fully authored
2. No editorial review has occurred
3. No legal or compliance sign-off has occurred
4. Publication enables downstream flows (e.g., remote distribution training gates) which are not ready

To enable: set `NOVEE_ONBOARDING_MANUAL_PUBLICATION_ENABLED=true` after content is complete and reviewed.

---

## Why Remote Distribution Remains Blocked

Remote distribution remains blocked because:
1. Training and onboarding readiness is not verified
2. Manual publication is disabled
3. Staff, manager, client, and venue acceptance records are not complete
4. The Remote Distribution Training Gate returns `passed: false`

---

## Safe Sales Language

- "NOVEE OS includes an Onboarding + Training Center with structured programs, manuals, lessons, checklists, and acceptance tracking."
- "NOVEE OS tracks training readiness and onboarding acceptance before remote distribution is unlocked."
- "NOVEE OS provides training program infrastructure for admin, venue owner, manager, staff, guest, and client roles."

---

## Unsafe Sales Language

- DO NOT say: "Staff training is complete."
- DO NOT say: "Clients are fully onboarded."
- DO NOT say: "Manuals are published and available."
- DO NOT say: "Remote distribution is unlocked."
- DO NOT say: "SmokeCraft venue training is done."
- DO NOT say: "E.A.T. manager training is complete."

---

## Admin Usage Guide

1. View `/novee-os/onboarding-training` to see the full training center state.
2. Panel A shows readiness score and summary.
3. Panel B shows all onboarding programs and their statuses.
4. Panel C lists all 19 training manuals with publication status.
5. Panel D shows lessons grouped by category.
6. Panel E shows the onboarding checklist.
7. Panel F shows training progress (no personal data shown).
8. Panel G shows evidence records.
9. Panel H shows acceptance records.
10. Panel I shows current blockers.
11. Panel J shows safe vs. unsafe claims.
12. Panel K shows the audit log.
13. Panel L shows feature flag states.

All writes go through POST/PATCH endpoints at `/api/novee-os/onboarding-training/*` and require `canAccessPOS3` role.

---

## Troubleshooting Notes

- If summary returns `localPreview: true`, the database is not connected. The UI falls back to default data.
- If readiness score is 0, check blockers panel for reasons.
- If a manual shows `published: false`, it is expected — this is the default.
- If acceptance records are empty, no formal onboarding acceptance has been recorded yet.

---

## Onboarding Readiness Checklist (Admin Reference)

- [ ] All onboarding programs are in `in_progress` or better status
- [ ] All 19 required manuals have content_summary filled
- [ ] All required lessons are in `in_progress` or better status
- [ ] All required checklist items are completed with evidence
- [ ] Staff, manager, and admin acceptance records exist
- [ ] Feature flag `NOVEE_ONBOARDING_MANUAL_PUBLICATION_ENABLED` is enabled after editorial review
- [ ] Remote Distribution Training Gate passes
- [ ] Readiness score reaches 100%
