// Phase E.7 — NOVEE OS Onboarding + Training Contracts

export const ALLOWED_PROGRAM_TYPES = [
  'platform_owner_onboarding', 'admin_onboarding', 'venue_owner_onboarding',
  'manager_onboarding', 'staff_onboarding', 'guest_onboarding',
  'remote_client_onboarding', 'module_activation_onboarding',
  'pilot_onboarding', 'go_live_onboarding',
]

export const ALLOWED_AUDIENCE_ROLES = [
  'founder', 'platform_owner', 'admin', 'venue_owner', 'manager',
  'staff', 'guest', 'client', 'reseller', 'support',
]

export const ALLOWED_MANUAL_TYPES = [
  'owner_manual', 'admin_guide', 'venue_owner_guide', 'manager_guide',
  'staff_guide', 'guest_guide', 'module_setup_guide', 'troubleshooting_guide',
  'sales_safe_claims_guide', 'remote_activation_guide', 'pilot_readiness_guide',
  'quick_start_guide',
]

export const ALLOWED_MANUAL_STATUSES = [
  'draft', 'in_progress', 'needs_review', 'published', 'preview_only',
  'blocked', 'evidence_required', 'archived',
]

export const ALLOWED_LESSON_CATEGORIES = [
  'platform_overview', 'admin_setup', 'security', 'deployment',
  'pilot_readiness', 'remote_distribution', 'module_activation',
  'staff_operations', 'guest_flow', 'payments', 'pos', 'inventory',
  'communication', 'reporting', 'troubleshooting', 'safe_claims',
]

export const ALLOWED_CHECKLIST_STATUSES = [
  'not_started', 'in_progress', 'needs_review', 'completed',
  'blocked', 'evidence_required',
]

export const ALLOWED_PROGRESS_STATUSES = [
  'not_started', 'in_progress', 'needs_review', 'completed',
  'blocked', 'evidence_required',
]

export const ALLOWED_EVIDENCE_STATUSES = [
  'pending', 'submitted', 'under_review', 'verified', 'rejected',
]

export const ALLOWED_ACCEPTANCE_STATUSES = [
  'pending', 'acknowledged', 'accepted', 'rejected', 'expired',
]

export const ALLOWED_ACCEPTANCE_TYPES = [
  'platform_owner_acknowledgment', 'admin_acknowledgment',
  'venue_owner_acknowledgment', 'manager_acknowledgment',
  'staff_acknowledgment', 'guest_acknowledgment',
  'remote_distribution_acknowledgment', 'safe_claims_acknowledgment',
  'pilot_limitations_acknowledgment', 'support_process_acknowledgment',
]

export const SAFE_ONBOARDING_CLAIMS = [
  'onboarding_program_record_exists',
  'training_manual_record_exists',
  'training_lesson_record_exists',
  'onboarding_checklist_item_exists',
  'training_progress_record_exists',
  'training_evidence_record_exists',
  'onboarding_acceptance_record_exists',
  'onboarding_training_center_active',
]

export const FORBIDDEN_FAKE_TRAINING_COMPLETION = [
  'training_complete', 'all_training_passed', 'training_certified',
  'training_approved', 'training_verified',
]

export const FORBIDDEN_FAKE_MANUAL_PUBLICATION = [
  'manual_published', 'manual_live', 'all_manuals_published',
  'documentation_complete',
]

export const FORBIDDEN_FAKE_CLIENT_ONBOARDING = [
  'client_onboarded', 'client_onboarding_complete', 'client_accepted',
  'venue_onboarded', 'tenant_onboarded',
]

export const FORBIDDEN_FAKE_STAFF_ACK = [
  'staff_training_complete', 'staff_certified', 'all_staff_trained',
]

export const FORBIDDEN_FAKE_MANAGER_ACK = [
  'manager_training_complete', 'manager_certified', 'all_managers_trained',
]

export const FORBIDDEN_FAKE_VENUE_ACCEPTANCE = [
  'venue_accepted', 'venue_acknowledgment_complete', 'all_venues_accepted',
]

export const FORBIDDEN_FAKE_REMOTE_DIST_READINESS = [
  'remote_distribution_unlocked', 'remote_distribution_training_complete',
  'distribution_training_verified',
]

export const FORBIDDEN_SENSITIVE_FIELDS = [
  'email', 'phone', 'ssn', 'password', 'token', 'invite_token',
  'license_key', 'api_key', 'webhook_secret', 'private_key',
]

// ── Default records ────────────────────────────────────────────────────────────

export const DEFAULT_ONBOARDING_PROGRAMS = [
  { program_key: 'platform_owner_onboarding', program_name: 'Platform Owner Onboarding', program_type: 'platform_owner_onboarding', audience_role: 'platform_owner', required_for_go_live: true },
  { program_key: 'admin_onboarding', program_name: 'Admin Onboarding', program_type: 'admin_onboarding', audience_role: 'admin', required_for_pilot: true },
  { program_key: 'venue_owner_onboarding', program_name: 'Venue Owner Onboarding', program_type: 'venue_owner_onboarding', audience_role: 'venue_owner', required_for_pilot: true },
  { program_key: 'manager_onboarding', program_name: 'Manager Onboarding', program_type: 'manager_onboarding', audience_role: 'manager', required_for_pilot: true },
  { program_key: 'staff_onboarding', program_name: 'Staff Onboarding', program_type: 'staff_onboarding', audience_role: 'staff', required_for_pilot: true },
  { program_key: 'guest_onboarding', program_name: 'Guest/User Onboarding', program_type: 'guest_onboarding', audience_role: 'guest' },
  { program_key: 'remote_client_onboarding', program_name: 'Remote Client Onboarding', program_type: 'remote_client_onboarding', audience_role: 'client', required_for_remote_distribution: true },
  { program_key: 'module_activation_onboarding', program_name: 'Module Activation Onboarding', program_type: 'module_activation_onboarding', audience_role: 'admin', required_for_remote_distribution: true },
  { program_key: 'pilot_onboarding', program_name: 'Pilot Onboarding', program_type: 'pilot_onboarding', audience_role: 'venue_owner', required_for_pilot: true, required_for_remote_distribution: true },
  { program_key: 'go_live_onboarding', program_name: 'Go-Live Onboarding', program_type: 'go_live_onboarding', audience_role: 'platform_owner', required_for_go_live: true },
]

export const DEFAULT_TRAINING_MANUALS = [
  { manual_key: 'platform_owner_manual', manual_title: 'NOVEE OS Platform Owner Manual', manual_type: 'owner_manual', audience_role: 'platform_owner', module_key: 'novee_os' },
  { manual_key: 'admin_guide', manual_title: 'NOVEE OS Admin Guide', manual_type: 'admin_guide', audience_role: 'admin', module_key: 'novee_os' },
  { manual_key: 'venue_owner_guide', manual_title: 'Venue Owner Onboarding Guide', manual_type: 'venue_owner_guide', audience_role: 'venue_owner', module_key: 'novee_os' },
  { manual_key: 'manager_guide', manual_title: 'Manager Training Guide', manual_type: 'manager_guide', audience_role: 'manager', module_key: 'novee_os' },
  { manual_key: 'staff_guide', manual_title: 'Staff Training Guide', manual_type: 'staff_guide', audience_role: 'staff', module_key: 'novee_os' },
  { manual_key: 'guest_guide', manual_title: 'Guest/User Guide', manual_type: 'guest_guide', audience_role: 'guest', module_key: 'novee_os' },
  { manual_key: 'remote_distribution_guide', manual_title: 'Remote Module Distribution Guide', manual_type: 'remote_activation_guide', audience_role: 'admin', module_key: 'novee_os' },
  { manual_key: 'tenant_provisioning_guide', manual_title: 'Tenant/Venue Provisioning Guide', manual_type: 'admin_guide', audience_role: 'admin', module_key: 'novee_os' },
  { manual_key: 'licensing_guide', manual_title: 'Licensing + Entitlements Guide', manual_type: 'admin_guide', audience_role: 'admin', module_key: 'novee_os' },
  { manual_key: 'pilot_readiness_guide', manual_title: 'Pilot Readiness Guide', manual_type: 'pilot_readiness_guide', audience_role: 'admin', module_key: 'novee_os' },
  { manual_key: 'deployment_readiness_guide', manual_title: 'Deployment Readiness Guide', manual_type: 'admin_guide', audience_role: 'admin', module_key: 'novee_os' },
  { manual_key: 'troubleshooting_guide', manual_title: 'Troubleshooting Guide', manual_type: 'troubleshooting_guide', audience_role: 'support', module_key: 'novee_os' },
  { manual_key: 'crafthub_setup_guide', manual_title: 'CraftHub 360 Setup Guide', manual_type: 'module_setup_guide', audience_role: 'admin', module_key: 'crafthub' },
  { manual_key: 'smokecraft_venue_guide', manual_title: 'SmokeCraft 360 Venue Guide', manual_type: 'venue_owner_guide', audience_role: 'venue_owner', module_key: 'smokecraft' },
  { manual_key: 'smokecraft_staff_guide', manual_title: 'SmokeCraft 360 Staff Guide', manual_type: 'staff_guide', audience_role: 'staff', module_key: 'smokecraft' },
  { manual_key: 'pos360_staff_guide', manual_title: 'POS360 Staff Guide', manual_type: 'staff_guide', audience_role: 'staff', module_key: 'pos360' },
  { manual_key: 'eat_manager_guide', manual_title: 'E.A.T. 360 Manager Guide', manual_type: 'manager_guide', audience_role: 'manager', module_key: 'eat' },
  { manual_key: 'passport_guide', manual_title: 'Passport 360 Guide', manual_type: 'module_setup_guide', audience_role: 'staff', module_key: 'passport' },
  { manual_key: 'safe_sales_claims_guide', manual_title: 'Safe Sales Claims Guide', manual_type: 'sales_safe_claims_guide', audience_role: 'admin', module_key: 'novee_os' },
]

export const DEFAULT_TRAINING_LESSONS = [
  { lesson_key: 'platform_overview_intro', lesson_title: 'NOVEE OS Platform Introduction', lesson_category: 'platform_overview', audience_role: 'admin', estimated_minutes: 20 },
  { lesson_key: 'admin_setup_basics', lesson_title: 'Admin Setup Basics', lesson_category: 'admin_setup', audience_role: 'admin', estimated_minutes: 30 },
  { lesson_key: 'security_overview', lesson_title: 'Security Activation Overview', lesson_category: 'security', audience_role: 'admin', estimated_minutes: 25 },
  { lesson_key: 'deployment_checklist', lesson_title: 'Deployment Readiness Checklist', lesson_category: 'deployment', audience_role: 'admin', estimated_minutes: 20 },
  { lesson_key: 'pilot_readiness_intro', lesson_title: 'Pilot Readiness Introduction', lesson_category: 'pilot_readiness', audience_role: 'venue_owner', estimated_minutes: 15 },
  { lesson_key: 'remote_distribution_overview', lesson_title: 'Remote Module Distribution Overview', lesson_category: 'remote_distribution', audience_role: 'admin', estimated_minutes: 30 },
  { lesson_key: 'module_activation_walkthrough', lesson_title: 'Module Activation Walkthrough', lesson_category: 'module_activation', audience_role: 'admin', estimated_minutes: 25 },
  { lesson_key: 'staff_pos_operations', lesson_title: 'Staff POS Operations', lesson_category: 'staff_operations', audience_role: 'staff', estimated_minutes: 45 },
  { lesson_key: 'guest_flow_overview', lesson_title: 'Guest Flow Overview', lesson_category: 'guest_flow', audience_role: 'staff', estimated_minutes: 15 },
  { lesson_key: 'payments_overview', lesson_title: 'Payments Overview', lesson_category: 'payments', audience_role: 'manager', estimated_minutes: 30 },
  { lesson_key: 'pos_operations', lesson_title: 'POS Operations Training', lesson_category: 'pos', audience_role: 'staff', estimated_minutes: 60 },
  { lesson_key: 'inventory_basics', lesson_title: 'Inventory Management Basics', lesson_category: 'inventory', audience_role: 'manager', estimated_minutes: 30 },
  { lesson_key: 'communication_setup', lesson_title: 'Communication Setup', lesson_category: 'communication', audience_role: 'admin', estimated_minutes: 20 },
  { lesson_key: 'reporting_dashboard', lesson_title: 'Reporting Dashboard Overview', lesson_category: 'reporting', audience_role: 'manager', estimated_minutes: 20 },
  { lesson_key: 'troubleshooting_basics', lesson_title: 'Troubleshooting Basics', lesson_category: 'troubleshooting', audience_role: 'support', estimated_minutes: 30 },
  { lesson_key: 'safe_claims_training', lesson_title: 'Safe Sales Claims Training', lesson_category: 'safe_claims', audience_role: 'admin', estimated_minutes: 20 },
]

export const DEFAULT_CHECKLIST_ITEMS = [
  { checklist_key: 'admin_account_created', checklist_title: 'Admin account created and verified', checklist_category: 'admin_setup', owner_role: 'admin', required: true },
  { checklist_key: 'venue_profile_configured', checklist_title: 'Venue profile configured', checklist_category: 'admin_setup', owner_role: 'venue_owner', required: true },
  { checklist_key: 'security_review_passed', checklist_title: 'Security review passed (E.3)', checklist_category: 'security', owner_role: 'admin', required: true, evidence_required: true },
  { checklist_key: 'deployment_gates_passed', checklist_title: 'Deployment gates passed (E.4)', checklist_category: 'deployment', owner_role: 'admin', required: true, evidence_required: true },
  { checklist_key: 'pilot_readiness_confirmed', checklist_title: 'Pilot readiness confirmed (E.5)', checklist_category: 'pilot_readiness', owner_role: 'admin', required: true, evidence_required: true },
  { checklist_key: 'staff_training_assigned', checklist_title: 'Staff training programs assigned', checklist_category: 'staff_operations', owner_role: 'manager', required: true },
  { checklist_key: 'manager_training_assigned', checklist_title: 'Manager training programs assigned', checklist_category: 'staff_operations', owner_role: 'venue_owner', required: true },
  { checklist_key: 'safe_claims_acknowledged', checklist_title: 'Safe claims training acknowledged', checklist_category: 'safe_claims', owner_role: 'admin', required: true, evidence_required: true },
]

export const DEFAULT_ACCEPTANCE_RECORDS = [
  { acceptance_type: 'platform_owner_acknowledgment', accepted_by_role: 'platform_owner', acceptance_status: 'pending' },
  { acceptance_type: 'admin_acknowledgment', accepted_by_role: 'admin', acceptance_status: 'pending' },
  { acceptance_type: 'safe_claims_acknowledgment', accepted_by_role: 'admin', acceptance_status: 'pending' },
  { acceptance_type: 'pilot_limitations_acknowledgment', accepted_by_role: 'venue_owner', acceptance_status: 'pending' },
]

// ── Assertions ─────────────────────────────────────────────────────────────────

export function assertNoFakeTrainingCompletionClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_TRAINING_COMPLETION) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake training completion claim "${claim}" is not allowed.`)
  }
  if (payload.completion_status === 'completed' && !payload.evidence_present) {
    throw new Error('BLOCKED: Cannot set completion_status=completed without evidence_present.')
  }
}

export function assertNoFakeManualPublicationClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_MANUAL_PUBLICATION) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake manual publication claim "${claim}" is not allowed.`)
  }
  if (payload.published === true) throw new Error('BLOCKED: Cannot set published=true in Phase E.7 preview layer.')
}

export function assertNoFakeClientOnboardingClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_CLIENT_ONBOARDING) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake client onboarding claim "${claim}" is not allowed.`)
  }
  if (payload.acceptance_status === 'accepted' && !payload.evidence_reference) {
    throw new Error('BLOCKED: Cannot set acceptance_status=accepted without evidence_reference.')
  }
}

export function assertNoFakeStaffAcknowledgmentClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_STAFF_ACK) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake staff acknowledgment claim "${claim}" is not allowed.`)
  }
}

export function assertNoFakeManagerAcknowledgmentClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_MANAGER_ACK) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake manager acknowledgment claim "${claim}" is not allowed.`)
  }
}

export function assertNoFakeVenueAcceptanceClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_VENUE_ACCEPTANCE) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake venue acceptance claim "${claim}" is not allowed.`)
  }
}

export function assertNoFakeRemoteDistributionReadinessClaims(payload = {}) {
  for (const claim of FORBIDDEN_FAKE_REMOTE_DIST_READINESS) {
    if (payload[claim] === true) throw new Error(`BLOCKED: Fake remote distribution readiness claim "${claim}" is not allowed.`)
  }
}

export function assertNoRawSensitiveTrainingData(payload = {}) {
  for (const field of FORBIDDEN_SENSITIVE_FIELDS) {
    if (field in payload && payload[field] && typeof payload[field] === 'string' && payload[field].length > 20) {
      throw new Error(`BLOCKED: Field "${field}" appears to contain sensitive data. Use reference-only fields.`)
    }
  }
}

// ── Validators ────────────────────────────────────────────────────────────────

export function validateOnboardingProgramPayload(payload = {}) {
  if (!payload.program_key) throw new Error('program_key is required.')
  if (!payload.program_name) throw new Error('program_name is required.')
  if (payload.program_type && !ALLOWED_PROGRAM_TYPES.includes(payload.program_type)) throw new Error(`Invalid program_type: ${payload.program_type}`)
  assertNoFakeClientOnboardingClaims(payload)
  assertNoRawSensitiveTrainingData(payload)
}

export function validateTrainingManualPayload(payload = {}) {
  if (!payload.manual_key) throw new Error('manual_key is required.')
  if (!payload.manual_title) throw new Error('manual_title is required.')
  if (payload.manual_type && !ALLOWED_MANUAL_TYPES.includes(payload.manual_type)) throw new Error(`Invalid manual_type: ${payload.manual_type}`)
  assertNoFakeManualPublicationClaims(payload)
}

export function validateTrainingLessonPayload(payload = {}) {
  if (!payload.lesson_key) throw new Error('lesson_key is required.')
  if (!payload.lesson_title) throw new Error('lesson_title is required.')
  if (payload.lesson_category && !ALLOWED_LESSON_CATEGORIES.includes(payload.lesson_category)) throw new Error(`Invalid lesson_category: ${payload.lesson_category}`)
  assertNoFakeTrainingCompletionClaims(payload)
}

export function validateOnboardingChecklistPayload(payload = {}) {
  if (!payload.checklist_key) throw new Error('checklist_key is required.')
  if (!payload.checklist_title) throw new Error('checklist_title is required.')
  assertNoFakeClientOnboardingClaims(payload)
}

export function validateTrainingProgressPayload(payload = {}) {
  if (!payload.trainee_role) throw new Error('trainee_role is required.')
  assertNoFakeTrainingCompletionClaims(payload)
  assertNoFakeStaffAcknowledgmentClaims(payload)
  assertNoFakeManagerAcknowledgmentClaims(payload)
  assertNoRawSensitiveTrainingData(payload)
}

export function validateTrainingEvidencePayload(payload = {}) {
  if (!payload.evidence_title) throw new Error('evidence_title is required.')
  if (!payload.evidence_type) throw new Error('evidence_type is required.')
  assertNoRawSensitiveTrainingData(payload)
}

export function validateOnboardingAcceptancePayload(payload = {}) {
  if (!payload.acceptance_type) throw new Error('acceptance_type is required.')
  if (payload.acceptance_type && !ALLOWED_ACCEPTANCE_TYPES.includes(payload.acceptance_type)) throw new Error(`Invalid acceptance_type: ${payload.acceptance_type}`)
  assertNoFakeClientOnboardingClaims(payload)
  assertNoFakeVenueAcceptanceClaims(payload)
  assertNoRawSensitiveTrainingData(payload)
}
