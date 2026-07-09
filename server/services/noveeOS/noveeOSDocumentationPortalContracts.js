// Phase E.9 — NOVEE OS Documentation Portal Contracts
// Seeded professional draft content for all required manuals

export const ALLOWED_DOC_TYPES = [
  'platform_manual','admin_guide','venue_owner_guide','manager_guide','staff_guide','guest_guide',
  'module_setup_guide','api_reference','troubleshooting_guide','safe_claims_guide','pilot_guide',
  'deployment_guide','remote_distribution_guide','release_notes','checklist','faq','glossary',
]

export const ALLOWED_DOC_CATEGORIES = [
  'platform','security','deployment','pilot_readiness','remote_distribution','onboarding','training',
  'craft_hub','smokecraft','passport','pos360','eat360','ambi','billing','licensing',
  'troubleshooting','safe_claims','compliance','operations',
]

export const ALLOWED_AUDIENCE_ROLES = [
  'founder','platform_owner','admin','venue_owner','manager','staff','guest','client','support','developer','sales',
]

export const ALLOWED_ARTICLE_TYPES = [
  'overview','setup','how_to','walkthrough','faq','troubleshooting','checklist','policy',
  'safe_claim','unsafe_claim','release_note','reference',
]

export const ALLOWED_BLOCK_TYPES = [
  'paragraph','step_list','checklist','warning','safe_claim','unsafe_claim','faq','troubleshooting',
  'table','glossary','release_note','manual_section','handoff_note','readiness_checklist','setup_instruction',
]

export const ALLOWED_REVIEW_STATUSES = [
  'not_reviewed','needs_review','changes_requested','approved_internal','approved_client',
  'approved_staff','approved_public','rejected','archived',
]

export const ALLOWED_EXPORT_TYPES = ['pdf','print','email','markdown','html','client_packet','staff_packet','pilot_packet']

export const ALLOWED_EXPORT_FORMATS = ['pdf','markdown','html','docx','txt']

export const ALLOWED_CLAIM_TYPES = [
  'safe_claim','unsafe_claim','certification_claim','provider_claim','production_claim','pilot_claim',
  'training_claim','remote_distribution_claim','payment_claim','pos_claim','inventory_claim',
  'communication_claim','ambi_claim','smokecraft_claim','passport_claim',
]

export const ALLOWED_CLAIM_STATUSES = ['draft','needs_review','approved','rejected','archived']

export const ALLOWED_SEEDED_CONTENT_DEPTH_STATUSES = [
  'title_only','outline_only','partial_draft','seeded_professional_draft','full_content_ready','human_reviewed','published',
]

export const FORBIDDEN_FAKE_MANUAL_COMPLETION_CLAIMS = [
  'manual_complete: true','documentation_complete','docs_finished','all_manuals_published',
]

export const FORBIDDEN_FAKE_PUBLICATION_CLAIMS = [
  'published: true','client_ready: true','staff_ready: true','approved_for_public: true',
]

export const FORBIDDEN_FAKE_CERTIFICATION_CLAIMS = [
  'soc2_certified','iso_certified','hipaa_certified','pci_certified','gdpr_certified',
  'compliance_certified','security_certified',
]

export const FORBIDDEN_FAKE_COMPLIANCE_CLAIMS = [
  'fully_compliant','audit_passed','certification_complete','regulatory_approval',
]

export const FORBIDDEN_FAKE_PRODUCTION_READINESS_CLAIMS = [
  'production_ready: true','go_live_approved','system_complete','platform_ready',
]

export const FORBIDDEN_FAKE_TRAINING_COMPLETION_CLAIMS = [
  'training_complete: true','staff_trained','onboarding_complete','all_staff_certified',
]

export const FORBIDDEN_FAKE_REMOTE_DISTRIBUTION_CLAIMS = [
  'remote_distribution_live','client_provisioning_active','invite_links_live','license_validation_live',
]

export const FORBIDDEN_FAKE_PROVIDER_CONNECTION_CLAIMS = [
  'provider_connected_live','hardware_provider_verified_live','ambi_provider_live',
]

export const FORBIDDEN_FAKE_PAYMENT_READINESS_CLAIMS = [
  'payments_live_for_all_clients','stripe_production_active','payment_processing_certified',
]

export const FORBIDDEN_FAKE_POS_READINESS_CLAIMS = [
  'pos_fully_operational','pos_certified','all_pos_terminals_live',
]

export const FORBIDDEN_FAKE_INVENTORY_SYNC_CLAIMS = [
  'inventory_sync_live','real_time_inventory_guaranteed','inventory_api_certified',
]

export const FORBIDDEN_FAKE_COMMUNICATION_DELIVERY_CLAIMS = [
  'all_messages_guaranteed_delivered','email_delivery_certified','sms_delivery_certified',
]

export const FORBIDDEN_FAKE_AMBI_HARDWARE_TELEMETRY_CLAIMS = [
  'ambi_hardware_ready','ambi_devices_connected','ambi_telemetry_live','ambi_detects_emotions',
]

export const FORBIDDEN_UNSAFE_SMOKECRAFT_PRODUCTION_CLAIMS = [
  'smokecraft_production_ready','smokecraft_go_live_approved','smokecraft_fully_deployed',
]

// Default documentation library records
export const DEFAULT_DOCUMENTATION_LIBRARY = [
  { doc_key: 'novee_os_platform_owner_manual', doc_title: 'NOVEE OS Platform Owner Manual', doc_type: 'platform_manual', doc_category: 'platform', audience_role: 'platform_owner', module_key: 'novee_os', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_admin_guide', doc_title: 'NOVEE OS Admin Guide', doc_type: 'admin_guide', doc_category: 'platform', audience_role: 'admin', module_key: 'novee_os', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_command_center_guide', doc_title: 'NOVEE OS Command Center Guide', doc_type: 'admin_guide', doc_category: 'platform', audience_role: 'admin', module_key: 'novee_os', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_safe_claims_guide', doc_title: 'NOVEE OS Safe Claims Guide', doc_type: 'safe_claims_guide', doc_category: 'safe_claims', audience_role: 'sales', module_key: 'novee_os', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_security_activation_guide', doc_title: 'NOVEE OS Security Activation Guide', doc_type: 'deployment_guide', doc_category: 'security', audience_role: 'admin', module_key: 'security', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_deployment_activation_guide', doc_title: 'NOVEE OS Deployment Activation Guide', doc_type: 'deployment_guide', doc_category: 'deployment', audience_role: 'admin', module_key: 'deployment', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_live_pilot_readiness_guide', doc_title: 'NOVEE OS Live Pilot Readiness Guide', doc_type: 'pilot_guide', doc_category: 'pilot_readiness', audience_role: 'admin', module_key: 'pilot', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_remote_module_distribution_guide', doc_title: 'NOVEE OS Remote Module Distribution Guide', doc_type: 'remote_distribution_guide', doc_category: 'remote_distribution', audience_role: 'admin', module_key: 'remote_distribution', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_onboarding_training_guide', doc_title: 'NOVEE OS Onboarding + Training Guide', doc_type: 'admin_guide', doc_category: 'onboarding', audience_role: 'admin', module_key: 'training', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'novee_os_ambi_foundation_guide', doc_title: 'NOVEE OS AMBI Foundation Guide', doc_type: 'module_setup_guide', doc_category: 'ambi', audience_role: 'admin', module_key: 'ambi', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'crafthub_360_setup_guide', doc_title: 'CraftHub 360 Setup Guide', doc_type: 'module_setup_guide', doc_category: 'craft_hub', audience_role: 'admin', module_key: 'crafthub', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'smokecraft_360_venue_guide', doc_title: 'SmokeCraft 360 Venue Guide', doc_type: 'venue_owner_guide', doc_category: 'smokecraft', audience_role: 'venue_owner', module_key: 'smokecraft', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'smokecraft_360_staff_guide', doc_title: 'SmokeCraft 360 Staff Guide', doc_type: 'staff_guide', doc_category: 'smokecraft', audience_role: 'staff', module_key: 'smokecraft', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'smokecraft_360_guest_flow_guide', doc_title: 'SmokeCraft 360 Guest Flow Guide', doc_type: 'guest_guide', doc_category: 'smokecraft', audience_role: 'guest', module_key: 'smokecraft', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'smokecraft_360_pilot_readiness_guide', doc_title: 'SmokeCraft 360 Pilot Readiness Guide', doc_type: 'pilot_guide', doc_category: 'smokecraft', audience_role: 'admin', module_key: 'smokecraft', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'passport_360_connection_guide', doc_title: 'Passport 360 Connection Guide', doc_type: 'module_setup_guide', doc_category: 'passport', audience_role: 'venue_owner', module_key: 'passport', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'pos360_staff_guide', doc_title: 'POS360 Staff Guide', doc_type: 'staff_guide', doc_category: 'pos360', audience_role: 'staff', module_key: 'pos360', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'eat360_manager_guide', doc_title: 'E.A.T. 360 Manager Guide', doc_type: 'manager_guide', doc_category: 'eat360', audience_role: 'manager', module_key: 'eat360', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'troubleshooting_guide', doc_title: 'Troubleshooting Guide', doc_type: 'troubleshooting_guide', doc_category: 'troubleshooting', audience_role: 'support', module_key: 'novee_os', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'safe_sales_claims_guide', doc_title: 'Safe Sales Claims Guide', doc_type: 'safe_claims_guide', doc_category: 'safe_claims', audience_role: 'sales', module_key: 'novee_os', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: true, review_required: true, safe_claim: 'documentation_record_exists' },
  { doc_key: 'release_notes_index', doc_title: 'Release Notes Index', doc_type: 'release_notes', doc_category: 'platform', audience_role: 'admin', module_key: 'novee_os', status: 'draft', published: false, client_ready: false, staff_ready: false, version_label: '0.1.0-draft', seeded_content_status: 'seeded_professional_draft', full_content_required: false, review_required: true, safe_claim: 'documentation_record_exists' },
]

// Seeded manual content — professional draft sections for all required manuals
export const DEFAULT_SEEDED_MANUAL_CONTENT = [

  // ── SmokeCraft 360 Venue Guide ──────────────────────────────────────────────
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_title_page',
    section_title: 'Title Page & Metadata',
    section_order: 0,
    audience_role: 'venue_owner',
    module_key: 'smokecraft',
    block_type: 'manual_section',
    content_body: 'SmokeCraft 360 Venue Guide | Version 0.1.0-draft | Status: Draft — Not Published | Audience: Venue Owner | Module: SmokeCraft 360 | Last Updated: Phase E.9 Build | Owner Role: Platform Owner / Admin | Review Status: Needs Human Review before client distribution.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_executive_overview',
    section_title: 'Executive Overview',
    section_order: 1,
    audience_role: 'venue_owner',
    module_key: 'smokecraft',
    block_type: 'paragraph',
    content_body: 'SmokeCraft 360 is the premium cigar lounge and specialty tobacco venue management system built on the NOVEE OS platform. It is purpose-built for venues where the guest experience is central — cigar clubs, hookah lounges, upscale tobacco retail destinations, and private membership venues. SmokeCraft 360 gives venue owners a real-time view of session activity, guest visit history, product inventory, staff operations, and membership management from a single command center. The system is designed around the concept of tracked multi-session guest experiences, where guests build a visit history over time and unlock new experience tiers as they return. Venue owners gain visibility into who is visiting, how often they visit, which products they prefer, and how to serve them at a higher standard with each return visit.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_purpose',
    section_title: 'Purpose of This Guide',
    section_order: 2,
    audience_role: 'venue_owner',
    module_key: 'smokecraft',
    block_type: 'paragraph',
    content_body: 'This guide is designed for venue owners and operators who are preparing to deploy SmokeCraft 360 in their venue. It covers the full lifecycle of venue setup, staff onboarding, guest experience design, POS integration, session management, inventory tracking, and daily operations. After reading this guide, a venue owner should understand how to configure SmokeCraft 360 for their specific venue type, how to train their staff to use it effectively, what the guest experience looks like from entry to exit, and how to use the reporting and visibility tools to make better operational decisions.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_setup_instruction',
    section_title: 'Setup Requirements & Instructions',
    section_order: 3,
    audience_role: 'venue_owner',
    module_key: 'smokecraft',
    block_type: 'setup_instruction',
    content_body: 'SETUP REQUIREMENTS: 1) Active NOVEE OS admin account with SmokeCraft 360 module enabled. 2) Venue profile created in CraftHub 360 with correct venue type, capacity, and operating hours. 3) Staff accounts created and assigned to SmokeCraft 360 roles (Venue Owner, Manager, Staff). 4) Product catalog configured with tobacco products, beverages, and accessories. 5) POS360 integration confirmed and payment provider configured. STEP-BY-STEP SETUP: Step 1 — Log into NOVEE OS Command Center and navigate to CraftHub 360. Step 2 — Complete venue profile: enter venue name, address, operating hours, seating capacity, and specialty categories (cigar, hookah, pipe, etc.). Step 3 — Add staff accounts and assign role permissions. Step 4 — Import or manually enter your product catalog. Step 5 — Configure the 8-visit session lock structure (Visit 1: Platform Intro; Visit 2: Cigar Selection Guide; Visit 3: Pairing Session; Visit 4: Reserved Seating; Visit 5: Membership Invitation; Visit 6: Member Pricing; Visit 7: VIP Access; Visit 8+: Personalized Experience). Step 6 — Test the guest check-in flow using a test guest profile. Step 7 — Confirm POS360 is processing transactions. Step 8 — Run a staff walkthrough using the SmokeCraft 360 Staff Guide before opening to real guests.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_daily_workflow',
    section_title: 'Daily Operations Workflow',
    section_order: 4,
    audience_role: 'venue_owner',
    module_key: 'smokecraft',
    block_type: 'paragraph',
    content_body: 'Daily venue operations with SmokeCraft 360 follow a structured workflow. At opening, the manager reviews the session board for expected guests and active reservations. As guests arrive, staff check them in using the SmokeCraft 360 guest check-in flow, which pulls their visit history and shows their current experience tier. Staff can see which products the guest has previously enjoyed, any notes from prior visits, and the next experience milestone they are approaching. Throughout the session, staff log product sales, service interactions, and any session notes. At the end of a session, the system records the visit, updates the guest visit count, and — if applicable — sends a session summary to the guest. At closing, the manager reviews the daily report showing total sessions, product sales, top guests by visit frequency, and any operational flags.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_safe_claim',
    section_title: 'Safe Sales Language',
    section_order: 5,
    audience_role: 'sales',
    module_key: 'smokecraft',
    block_type: 'safe_claim',
    content_body: 'APPROVED SAFE CLAIMS FOR SMOKECRAFT 360: "SmokeCraft 360 is a purpose-built venue management system for premium tobacco and cigar venues." | "SmokeCraft 360 tracks guest visit history, session activity, product preferences, and membership milestones." | "SmokeCraft 360 supports an 8-visit progressive guest experience structure that rewards returning guests with tiered access and personalized service." | "SmokeCraft 360 integrates with POS360 for point-of-sale processing at your venue." | "SmokeCraft 360 is in active development and pilot readiness phase."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_unsafe_claim',
    section_title: 'Unsafe Sales Language — Do Not Use',
    section_order: 6,
    audience_role: 'sales',
    module_key: 'smokecraft',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT USE THESE CLAIMS: "SmokeCraft 360 is production-ready and deployed at multiple venues." | "SmokeCraft 360 payment processing is live and fully certified." | "SmokeCraft 360 has completed compliance certification." | "SmokeCraft 360 is fully launched and operational." | "Guest data is synchronized across all venues in real time." | "SmokeCraft 360 guarantees uninterrupted service." These claims are false and must not be used in sales, investor, or client communications.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_readiness_checklist',
    section_title: 'Venue Readiness Checklist',
    section_order: 7,
    audience_role: 'venue_owner',
    module_key: 'smokecraft',
    block_type: 'readiness_checklist',
    content_body: 'SMOKECRAFT 360 VENUE READINESS CHECKLIST: [ ] Venue profile is complete in CraftHub 360 | [ ] All staff accounts are created and have completed role training | [ ] Product catalog is imported and verified | [ ] POS360 is configured and a test transaction has been processed | [ ] Guest check-in flow has been tested with a test guest profile | [ ] 8-visit session lock structure is configured and tested | [ ] Membership tiers are defined and confirmed with venue owner | [ ] Guest communication preferences are configured (if applicable) | [ ] Inventory minimum thresholds are set | [ ] Manager has reviewed daily operations report at least once | [ ] Pilot readiness review has been completed with NOVEE OS admin | [ ] Venue accepts that the system is in pilot phase and subject to change',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_venue_guide',
    manual_title: 'SmokeCraft 360 Venue Guide',
    section_key: 'sc_venue_troubleshooting',
    section_title: 'Troubleshooting',
    section_order: 8,
    audience_role: 'support',
    module_key: 'smokecraft',
    block_type: 'troubleshooting',
    content_body: 'ISSUE: Guest check-in not showing visit history. CAUSE: Guest profile may not be linked correctly, or the database is not returning visit records. FIX: Verify the guest was checked in using the same guest key on previous visits. Re-link the guest profile if needed. | ISSUE: POS360 transaction not completing. CAUSE: Payment provider may not be configured, or network connectivity issue. FIX: Check POS360 configuration and verify payment provider credentials are set. | ISSUE: Session lock not advancing after a visit. CAUSE: Visit may not have been marked as completed in the system. FIX: Manually confirm the session in the SmokeCraft 360 session board. | ISSUE: Product not appearing in checkout. CAUSE: Product may not be assigned to the correct venue or may have zero quantity. FIX: Review product catalog and ensure inventory count is set correctly. | ISSUE: Staff cannot access SmokeCraft 360. CAUSE: Role permission may not include SmokeCraft 360. FIX: Verify staff role in NOVEE OS admin and ensure SmokeCraft 360 access is granted.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── SmokeCraft 360 Staff Guide ──────────────────────────────────────────────
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_title_page',
    section_title: 'Title Page & Metadata',
    section_order: 0,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'manual_section',
    content_body: 'SmokeCraft 360 Staff Guide | Version 0.1.0-draft | Status: Draft — Not Published | Audience: Staff | Module: SmokeCraft 360 | Review Status: Needs Human Review.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_overview',
    section_title: 'Executive Overview',
    section_order: 1,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'paragraph',
    content_body: 'As a SmokeCraft 360 staff member, you are the primary point of contact between the guest and the platform. SmokeCraft 360 gives you the tools to deliver a consistent, high-quality experience for every guest at every visit. You will use SmokeCraft 360 to check guests in, view their visit history, log session activity, process orders through POS360, and ensure every guest feels recognized and well-served. Your role is not just to process orders — it is to use the guest data available to you to make each visit feel personal and attentive.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_setup_instruction',
    section_title: 'Staff Setup & Login Instructions',
    section_order: 2,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'setup_instruction',
    content_body: 'STAFF SETUP STEPS: Step 1 — Your manager will provide your login credentials for NOVEE OS. Step 2 — Log in and confirm you can access the SmokeCraft 360 staff interface. Step 3 — Review the guest check-in flow with your manager before your first shift. Step 4 — Confirm you can view the session board and product catalog. Step 5 — Complete a test check-in using a test guest profile. Step 6 — Verify your POS360 access and process a test transaction. Step 7 — Review the 8-visit lock structure so you understand what experience tier each guest is at. Step 8 — Acknowledge the staff code of conduct regarding guest data privacy.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_workflow',
    section_title: 'Staff Shift Workflow',
    section_order: 3,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'paragraph',
    content_body: 'OPENING DUTIES: Review the session board for expected guests. Check inventory levels for your shift. Confirm POS360 is operational. DURING SHIFT: When a guest arrives, pull up their profile using their name or member ID. Review their visit count and experience tier. Greet them by name and acknowledge their visit milestone if applicable. Log the session start. Take orders through POS360 — recommend products based on their history. Log any session notes (product preferences, special requests, complaints). CLOSING DUTIES: Mark all sessions as completed. Review your shift summary. Report any inventory discrepancies to the manager. Log out of SmokeCraft 360.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_safe_claim',
    section_title: 'Safe Claims — What Staff Can Say to Guests',
    section_order: 4,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'safe_claim',
    content_body: 'WHAT STAFF CAN SAY: "We track your visit history so we can give you a better experience every time you come in." | "You are on visit [X] — here is what unlocks for you on your next visit." | "Our system keeps a record of the products you have enjoyed so we can recommend new ones." | "Your membership tier was updated based on your visit history." WHAT STAFF MUST NOT SAY: "Your data is 100% private and will never be shared." (Privacy policy must be confirmed with legal before this claim is made.) | "The system is fully live and approved." (Pilot status must be disclosed honestly.)',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_unsafe_claim',
    section_title: 'Unsafe Claims — What Staff Must Not Say',
    section_order: 5,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'unsafe_claim',
    content_body: 'STAFF MUST NOT MAKE THESE CLAIMS: "This system is fully certified and production-ready." | "Your data is guaranteed secure under [any specific regulation]." | "You will definitely receive [X reward] on your next visit." | "The app is fully launched everywhere." | "NOVEE OS guarantees 100% uptime." These claims are not approved and may expose the venue to legal or reputational risk.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_readiness_checklist',
    section_title: 'Staff Readiness Checklist',
    section_order: 6,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'readiness_checklist',
    content_body: 'STAFF READINESS CHECKLIST: [ ] Login credentials received and tested | [ ] SmokeCraft 360 staff interface accessible | [ ] Guest check-in flow reviewed with manager | [ ] Session board visible and readable | [ ] POS360 access confirmed | [ ] Test transaction processed | [ ] 8-visit session structure understood | [ ] Guest data privacy training completed | [ ] Shift workflow reviewed | [ ] Emergency contact and escalation path known | [ ] Manager sign-off on staff readiness received',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_staff_guide',
    manual_title: 'SmokeCraft 360 Staff Guide',
    section_key: 'sc_staff_troubleshooting',
    section_title: 'Troubleshooting for Staff',
    section_order: 7,
    audience_role: 'staff',
    module_key: 'smokecraft',
    block_type: 'troubleshooting',
    content_body: 'ISSUE: Cannot log into SmokeCraft 360. FIX: Contact your manager to verify your account is active and has SmokeCraft 360 access. | ISSUE: Guest profile is not found. FIX: Search by full name or member ID. If not found, check with your manager if the guest needs a new profile created. | ISSUE: POS360 is not processing a payment. FIX: Do not retry the transaction repeatedly. Note the transaction reference, ask the guest to use an alternate payment method, and report to your manager. | ISSUE: Session lock is not advancing for a repeat guest. FIX: Do not manually change the visit count. Report to your manager who will verify the session records.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── SmokeCraft 360 Guest Flow Guide ────────────────────────────────────────
  {
    manual_key: 'smokecraft_360_guest_flow_guide',
    manual_title: 'SmokeCraft 360 Guest Flow Guide',
    section_key: 'sc_guest_overview',
    section_title: 'Guest Experience Overview',
    section_order: 0,
    audience_role: 'guest',
    module_key: 'smokecraft',
    block_type: 'paragraph',
    content_body: 'SmokeCraft 360 creates a progressive guest experience designed to reward loyalty and build a personalized relationship between the guest and the venue. Each visit is recorded, and the guest experience evolves over their first 8 visits and beyond. Guests do not interact with the software directly — the experience is delivered through attentive staff, personalized product recommendations, and milestone acknowledgments. The 8-visit structure defines what each guest is eligible for at each stage of their journey: from a warm welcome on visit 1, to full membership recognition and VIP access by visit 7 and beyond.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_guest_flow_guide',
    manual_title: 'SmokeCraft 360 Guest Flow Guide',
    section_key: 'sc_guest_visit_structure',
    section_title: '8-Visit Session Lock Structure',
    section_order: 1,
    audience_role: 'guest',
    module_key: 'smokecraft',
    block_type: 'step_list',
    content_body: 'Visit 1 — Platform Introduction: Guest is welcomed, profile is created, and the experience journey is introduced by staff. | Visit 2 — Cigar Selection Guide: Staff guides the guest through the product catalog and records preferences. | Visit 3 — Pairing Session: Guest receives a curated pairing recommendation (cigar + beverage or tobacco + occasion). | Visit 4 — Reserved Seating: Guest becomes eligible for reserved seating if available. | Visit 5 — Membership Invitation: Staff formally invites the guest to join the venue membership program. | Visit 6 — Member Pricing: Guest receives member pricing on eligible products. | Visit 7 — VIP Access: Guest gains access to VIP areas or exclusive products if applicable. | Visit 8+ — Personalized Experience: Each visit is treated as a fully personalized session based on the accumulated history.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_guest_flow_guide',
    manual_title: 'SmokeCraft 360 Guest Flow Guide',
    section_key: 'sc_guest_safe_claim',
    section_title: 'Safe Claims About Guest Experience',
    section_order: 2,
    audience_role: 'sales',
    module_key: 'smokecraft',
    block_type: 'safe_claim',
    content_body: 'APPROVED SAFE CLAIMS: "SmokeCraft 360 creates a progressive multi-visit guest experience that rewards loyalty." | "Each visit is recorded and the experience evolves over the guest journey." | "Staff are equipped with guest visit history to deliver personalized service." | "SmokeCraft 360 is designed for specialty tobacco and cigar venues where the guest relationship is central."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_guest_flow_guide',
    manual_title: 'SmokeCraft 360 Guest Flow Guide',
    section_key: 'sc_guest_unsafe_claim',
    section_title: 'Unsafe Claims About Guest Experience',
    section_order: 3,
    audience_role: 'sales',
    module_key: 'smokecraft',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT CLAIM: "Guest profiles are 100% private and GDPR/CCPA compliant." (Requires legal review.) | "Guests automatically receive digital membership cards or app notifications." (Not yet implemented.) | "SmokeCraft 360 is used by multiple deployed venues today." (Not yet in production at external venues.)',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_guest_flow_guide',
    manual_title: 'SmokeCraft 360 Guest Flow Guide',
    section_key: 'sc_guest_readiness_checklist',
    section_title: 'Guest Flow Readiness Checklist',
    section_order: 4,
    audience_role: 'admin',
    module_key: 'smokecraft',
    block_type: 'readiness_checklist',
    content_body: 'GUEST FLOW READINESS CHECKLIST: [ ] Guest check-in flow tested with test guest profile | [ ] 8-visit lock structure confirmed and tested | [ ] Staff trained on guest visit history view | [ ] Product recommendation workflow reviewed | [ ] Membership invitation flow confirmed | [ ] Guest privacy disclosure reviewed by legal before going live | [ ] Test session with real staff member completed | [ ] Guest experience walkthrough reviewed by venue owner',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── SmokeCraft 360 Pilot Readiness Guide ──────────────────────────────────
  {
    manual_key: 'smokecraft_360_pilot_readiness_guide',
    manual_title: 'SmokeCraft 360 Pilot Readiness Guide',
    section_key: 'sc_pilot_overview',
    section_title: 'Pilot Readiness Overview',
    section_order: 0,
    audience_role: 'admin',
    module_key: 'smokecraft',
    block_type: 'paragraph',
    content_body: 'The SmokeCraft 360 Pilot Readiness Guide defines the gates, checks, evidence requirements, and administrative approvals needed before SmokeCraft 360 can be deployed in a real pilot venue. A pilot deployment means at least one real venue is using the system with real guests, real staff, and real transactions. Pilot readiness is not the same as production readiness — it is a controlled, monitored deployment with active oversight from the NOVEE OS team. This guide defines what must be true before a pilot begins, what must be monitored during the pilot, and what must be resolved before the pilot expands.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_pilot_readiness_guide',
    manual_title: 'SmokeCraft 360 Pilot Readiness Guide',
    section_key: 'sc_pilot_setup_instruction',
    section_title: 'Pilot Pre-Launch Checklist',
    section_order: 1,
    audience_role: 'admin',
    module_key: 'smokecraft',
    block_type: 'setup_instruction',
    content_body: 'PRE-PILOT GATES: [ ] Security Activation Center gates passed (Phase E.3) | [ ] Deployment Activation Center gates passed (Phase E.4) | [ ] Live Pilot Readiness Center score above threshold (Phase E.5) | [ ] Venue profile complete in CraftHub 360 | [ ] All staff trained and signed off | [ ] POS360 connected and test transactions passed | [ ] Guest check-in flow tested end-to-end | [ ] Product catalog verified | [ ] Inventory minimum thresholds set | [ ] Manager has reviewed and approved venue readiness | [ ] NOVEE OS admin sign-off received | [ ] Pilot monitoring plan in place',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_pilot_readiness_guide',
    manual_title: 'SmokeCraft 360 Pilot Readiness Guide',
    section_key: 'sc_pilot_safe_claim',
    section_title: 'Safe Claims About Pilot Status',
    section_order: 2,
    audience_role: 'sales',
    module_key: 'smokecraft',
    block_type: 'safe_claim',
    content_body: 'APPROVED SAFE CLAIMS: "SmokeCraft 360 is in active pilot preparation and approaching venue deployment." | "Pilot readiness gates include security, deployment, and operational readiness checks." | "SmokeCraft 360 will launch in a controlled pilot environment before expanding." | "The pilot program is designed to validate the guest experience, staff workflow, and POS integration in a real venue setting."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_pilot_readiness_guide',
    manual_title: 'SmokeCraft 360 Pilot Readiness Guide',
    section_key: 'sc_pilot_unsafe_claim',
    section_title: 'Unsafe Claims About Pilot Status',
    section_order: 3,
    audience_role: 'sales',
    module_key: 'smokecraft',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT CLAIM: "SmokeCraft 360 is production-ready and fully deployed." | "The pilot is already running at multiple venues." | "All pilot gates have passed." | "SmokeCraft 360 is ready for widespread commercial deployment today." These claims are not accurate in the current phase.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'smokecraft_360_pilot_readiness_guide',
    manual_title: 'SmokeCraft 360 Pilot Readiness Guide',
    section_key: 'sc_pilot_readiness_checklist',
    section_title: 'Pilot Readiness Final Checklist',
    section_order: 4,
    audience_role: 'admin',
    module_key: 'smokecraft',
    block_type: 'readiness_checklist',
    content_body: 'FINAL PILOT READINESS CHECKLIST: [ ] Phase E.3 Security gates passed | [ ] Phase E.4 Deployment gates passed | [ ] Phase E.5 Pilot readiness score meets threshold | [ ] Venue onboarding complete | [ ] Staff trained and signed off | [ ] POS360 live test transaction passed | [ ] Guest journey tested end-to-end | [ ] Incident response plan confirmed | [ ] Data backup and recovery plan confirmed | [ ] NOVEE OS pilot approval granted in writing',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── Passport 360 Connection Guide ──────────────────────────────────────────
  {
    manual_key: 'passport_360_connection_guide',
    manual_title: 'Passport 360 Connection Guide',
    section_key: 'passport_overview',
    section_title: 'Executive Overview',
    section_order: 0,
    audience_role: 'venue_owner',
    module_key: 'passport',
    block_type: 'paragraph',
    content_body: "Passport 360 is the cross-venue guest identity and experience continuity layer built on NOVEE OS. It allows guests who have an established experience record at one NOVEE OS venue to carry meaningful context — not raw personal data — to other participating venues. Passport 360 is not a universal loyalty points program. It is an experience continuity bridge. A guest who is a verified returning visitor at a SmokeCraft 360 venue, for example, may be recognized at a partner venue through their Passport 360 reference, allowing staff at that venue to understand the guest's experience tier and deliver an appropriately attentive welcome. Passport 360 requires explicit guest consent and venue participation agreements before it is active.",
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'passport_360_connection_guide',
    manual_title: 'Passport 360 Connection Guide',
    section_key: 'passport_setup_instruction',
    section_title: 'Connection Setup Instructions',
    section_order: 1,
    audience_role: 'venue_owner',
    module_key: 'passport',
    block_type: 'setup_instruction',
    content_body: 'PASSPORT 360 SETUP REQUIREMENTS: 1) The venue must be active on NOVEE OS with at least one live module (e.g., SmokeCraft 360). 2) The venue owner must sign the Passport 360 participation agreement. 3) Guest consent for cross-venue experience sharing must be configured in the guest flow. 4) The connecting partner venue must also be an active NOVEE OS participant. SETUP STEPS: Step 1 — Contact the NOVEE OS admin team to initiate Passport 360 connection. Step 2 — Complete the participation agreement. Step 3 — Configure guest consent settings in CraftHub 360. Step 4 — Test the cross-venue recognition flow with a test guest profile. Step 5 — Review the Passport 360 privacy disclosure with your legal team before going live.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'passport_360_connection_guide',
    manual_title: 'Passport 360 Connection Guide',
    section_key: 'passport_safe_claim',
    section_title: 'Safe Claims for Passport 360',
    section_order: 2,
    audience_role: 'sales',
    module_key: 'passport',
    block_type: 'safe_claim',
    content_body: 'APPROVED SAFE CLAIMS: "Passport 360 is a cross-venue experience continuity layer built on NOVEE OS." | "Passport 360 allows participating venues to recognize shared guests with their consent." | "Passport 360 is in development and pilot readiness phase — not yet live at partner venues." | "Passport 360 requires guest consent and venue participation agreements before activation."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'passport_360_connection_guide',
    manual_title: 'Passport 360 Connection Guide',
    section_key: 'passport_unsafe_claim',
    section_title: 'Unsafe Claims for Passport 360',
    section_order: 3,
    audience_role: 'sales',
    module_key: 'passport',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT CLAIM: "Passport 360 is live across all NOVEE OS venues today." | "Guest profiles are automatically shared between venues without consent." | "Passport 360 is a universal loyalty program." | "Passport 360 is production-ready and deployed at partner venues."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'passport_360_connection_guide',
    manual_title: 'Passport 360 Connection Guide',
    section_key: 'passport_readiness_checklist',
    section_title: 'Passport 360 Pilot Connection Readiness Checklist',
    section_order: 4,
    audience_role: 'admin',
    module_key: 'passport',
    block_type: 'readiness_checklist',
    content_body: 'PASSPORT 360 READINESS CHECKLIST: [ ] Venue is active on NOVEE OS with at least one live module | [ ] Participation agreement signed | [ ] Guest consent configuration reviewed | [ ] Partner venue confirmed as NOVEE OS participant | [ ] Cross-venue recognition flow tested with test guest profile | [ ] Privacy disclosure reviewed by legal | [ ] NOVEE OS admin sign-off received for Passport 360 activation',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── POS360 Staff Guide ─────────────────────────────────────────────────────
  {
    manual_key: 'pos360_staff_guide',
    manual_title: 'POS360 Staff Guide',
    section_key: 'pos360_overview',
    section_title: 'POS360 Overview for Staff',
    section_order: 0,
    audience_role: 'staff',
    module_key: 'pos360',
    block_type: 'paragraph',
    content_body: 'POS360 is the point-of-sale system integrated into NOVEE OS. It allows staff to process guest transactions, manage tabs, apply member discounts, and record sales data that feeds into the broader NOVEE OS reporting layer. POS360 is not a standalone POS terminal — it operates as part of the NOVEE OS module ecosystem and connects directly with the guest session tracking in SmokeCraft 360 and other venue modules. Staff use POS360 to add products to a guest tab, apply any earned discounts, process payment, and close the tab at the end of a session.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'pos360_staff_guide',
    manual_title: 'POS360 Staff Guide',
    section_key: 'pos360_setup_instruction',
    section_title: 'POS360 Staff Setup Instructions',
    section_order: 1,
    audience_role: 'staff',
    module_key: 'pos360',
    block_type: 'setup_instruction',
    content_body: 'POS360 STAFF SETUP: Step 1 — Log into NOVEE OS with your staff credentials. Step 2 — Navigate to POS360 from the main menu. Step 3 — Confirm your access level — staff can open tabs, add products, apply discounts, and process payments. Step 4 — Review the product catalog to confirm all products are visible and correctly priced. Step 5 — Process a test transaction using a test guest profile and a test product. Step 6 — Confirm the test transaction appears in the session report. Step 7 — Void the test transaction and confirm the void is recorded.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'pos360_staff_guide',
    manual_title: 'POS360 Staff Guide',
    section_key: 'pos360_safe_claim',
    section_title: 'POS360 Safe Claims',
    section_order: 2,
    audience_role: 'sales',
    module_key: 'pos360',
    block_type: 'safe_claim',
    content_body: 'APPROVED SAFE CLAIMS: "POS360 is the integrated point-of-sale layer within NOVEE OS." | "POS360 connects directly with SmokeCraft 360 session tracking for seamless guest tab management." | "POS360 supports product catalog management, member discounts, and transaction reporting." | "POS360 is in active development and testing phase."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'pos360_staff_guide',
    manual_title: 'POS360 Staff Guide',
    section_key: 'pos360_unsafe_claim',
    section_title: 'POS360 Unsafe Claims',
    section_order: 3,
    audience_role: 'sales',
    module_key: 'pos360',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT CLAIM: "POS360 is fully EMV/PCI certified." | "POS360 guarantees payment processing uptime." | "POS360 supports all major payment processors without configuration." | "POS360 is production-certified and ready for high-volume commercial use."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'pos360_staff_guide',
    manual_title: 'POS360 Staff Guide',
    section_key: 'pos360_readiness_checklist',
    section_title: 'POS360 Staff Readiness Checklist',
    section_order: 4,
    audience_role: 'staff',
    module_key: 'pos360',
    block_type: 'readiness_checklist',
    content_body: 'POS360 STAFF READINESS CHECKLIST: [ ] POS360 access confirmed in NOVEE OS | [ ] Product catalog visible and correctly priced | [ ] Test transaction processed and confirmed | [ ] Test void processed and confirmed | [ ] Member discount flow tested | [ ] Session report reviewed after test transaction | [ ] Staff trained on payment error handling | [ ] Manager sign-off received',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'pos360_staff_guide',
    manual_title: 'POS360 Staff Guide',
    section_key: 'pos360_troubleshooting',
    section_title: 'POS360 Troubleshooting for Staff',
    section_order: 5,
    audience_role: 'support',
    module_key: 'pos360',
    block_type: 'troubleshooting',
    content_body: 'ISSUE: Transaction declined. CAUSE: Payment provider issue or incorrect card. FIX: Ask guest for alternate payment. Do not retry more than twice. Report to manager. | ISSUE: Product not appearing in POS360. CAUSE: Product may be out of stock or not assigned to this venue. FIX: Check inventory. Contact manager if product should be available. | ISSUE: Member discount not applying. CAUSE: Guest may not be at the correct visit tier, or discount configuration may need review. FIX: Apply manual override if authorized by manager. Report to manager after the session.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── E.A.T. 360 Manager Guide ───────────────────────────────────────────────
  {
    manual_key: 'eat360_manager_guide',
    manual_title: 'E.A.T. 360 Manager Guide',
    section_key: 'eat_manager_overview',
    section_title: 'E.A.T. 360 Overview for Managers',
    section_order: 0,
    audience_role: 'manager',
    module_key: 'eat360',
    block_type: 'paragraph',
    content_body: 'E.A.T. 360 (Elevated Atmosphere + Table) is the food, beverage, and dining service management layer within NOVEE OS. It is designed for venues where curated food and beverage service is part of the guest experience — cigar lounges with beverage programs, private dining rooms, members clubs, and specialty hospitality venues. As a manager, you will use E.A.T. 360 to configure your food and beverage catalog, manage table assignments, track service flow, review order history, and generate reports. E.A.T. 360 connects with POS360 for transaction processing and with SmokeCraft 360 for session context when applicable.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'eat360_manager_guide',
    manual_title: 'E.A.T. 360 Manager Guide',
    section_key: 'eat_manager_setup_instruction',
    section_title: 'Manager Setup Instructions for E.A.T. 360',
    section_order: 1,
    audience_role: 'manager',
    module_key: 'eat360',
    block_type: 'setup_instruction',
    content_body: 'SETUP STEPS FOR MANAGERS: Step 1 — Confirm E.A.T. 360 is enabled for your venue in NOVEE OS. Step 2 — Build the food and beverage catalog: add items, descriptions, prices, and categories. Step 3 — Configure table layout: add tables, sections, and capacity. Step 4 — Assign staff to E.A.T. 360 roles. Step 5 — Configure service flow settings (order routing, kitchen notes, beverage-only vs. full menu). Step 6 — Test the full order flow: open a table, add items, send to kitchen/bar, process payment through POS360, close the table. Step 7 — Run a pre-shift briefing with staff to review the menu and service standards.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'eat360_manager_guide',
    manual_title: 'E.A.T. 360 Manager Guide',
    section_key: 'eat_manager_safe_claim',
    section_title: 'E.A.T. 360 Safe Claims',
    section_order: 2,
    audience_role: 'sales',
    module_key: 'eat360',
    block_type: 'safe_claim',
    content_body: 'APPROVED SAFE CLAIMS: "E.A.T. 360 is the food, beverage, and dining service layer within NOVEE OS." | "E.A.T. 360 supports catalog management, table assignment, service flow, and reporting." | "E.A.T. 360 integrates with POS360 for transaction processing." | "E.A.T. 360 is in active development and pilot readiness phase."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'eat360_manager_guide',
    manual_title: 'E.A.T. 360 Manager Guide',
    section_key: 'eat_manager_unsafe_claim',
    section_title: 'E.A.T. 360 Unsafe Claims',
    section_order: 3,
    audience_role: 'sales',
    module_key: 'eat360',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT CLAIM: "E.A.T. 360 is production-certified for commercial dining operations." | "E.A.T. 360 guarantees zero order errors." | "E.A.T. 360 is deployed at operational venues today." | "E.A.T. 360 is fully integrated with all third-party food delivery platforms."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'eat360_manager_guide',
    manual_title: 'E.A.T. 360 Manager Guide',
    section_key: 'eat_manager_readiness_checklist',
    section_title: 'E.A.T. 360 Manager Readiness Checklist',
    section_order: 4,
    audience_role: 'manager',
    module_key: 'eat360',
    block_type: 'readiness_checklist',
    content_body: 'E.A.T. 360 MANAGER READINESS CHECKLIST: [ ] Food and beverage catalog built and verified | [ ] Table layout configured | [ ] Staff assigned to E.A.T. 360 roles | [ ] Service flow tested end-to-end | [ ] POS360 integration confirmed | [ ] Test order processed and transaction confirmed | [ ] Pre-shift briefing completed with staff | [ ] Menu accuracy verified | [ ] Manager daily report reviewed',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── Remote Module Distribution Guide ──────────────────────────────────────
  {
    manual_key: 'novee_os_remote_module_distribution_guide',
    manual_title: 'NOVEE OS Remote Module Distribution Guide',
    section_key: 'remote_dist_overview',
    section_title: 'Remote Module Distribution Overview',
    section_order: 0,
    audience_role: 'admin',
    module_key: 'remote_distribution',
    block_type: 'paragraph',
    content_body: 'The NOVEE OS Remote Module Distribution System is the infrastructure layer that enables authorized NOVEE OS modules to be deployed to client venues remotely and in a controlled, gate-locked manner. Remote distribution is not live delivery. It is not automatic provisioning. It is the backend architecture that will allow — when all required security, deployment, pilot, and training gates are passed — a client venue to receive module access, licensing, and provisioning through a verified remote channel. In Phase E.6, this system was built as a software foundation. All live delivery, client provisioning, invite link generation, license validation, and rollback execution are disabled by default and require explicit admin approval before activation.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_remote_module_distribution_guide',
    manual_title: 'NOVEE OS Remote Module Distribution Guide',
    section_key: 'remote_dist_setup_instruction',
    section_title: 'Remote Distribution Gate Requirements',
    section_order: 1,
    audience_role: 'admin',
    module_key: 'remote_distribution',
    block_type: 'setup_instruction',
    content_body: 'GATES REQUIRED BEFORE REMOTE DISTRIBUTION IS ACTIVATED: Gate 1 — Security Activation: Phase E.3 security gates must pass. Gate 2 — Deployment Activation: Phase E.4 deployment gates must pass. Gate 3 — Pilot Readiness: Phase E.5 pilot readiness must be approved. Gate 4 — Onboarding + Training: Phase E.7 training readiness must pass for the target module. Gate 5 — Manual Review: A NOVEE OS admin must manually enable live delivery for the specific client and module. Gate 6 — License Key Generation: A license key must be generated and verified for the client. Gate 7 — Client Provisioning: The client provisioning record must be completed and accepted.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_remote_module_distribution_guide',
    manual_title: 'NOVEE OS Remote Module Distribution Guide',
    section_key: 'remote_dist_safe_claim',
    section_title: 'Remote Distribution Safe Claims',
    section_order: 2,
    audience_role: 'sales',
    module_key: 'remote_distribution',
    block_type: 'safe_claim',
    content_body: 'APPROVED SAFE CLAIMS: "NOVEE OS includes a Remote Module Distribution architecture that enables controlled, gate-locked module deployment to client venues." | "Remote distribution requires multiple security, deployment, pilot, and training gates before any live delivery is enabled." | "Remote module distribution is in software foundation phase — no live delivery is currently active." | "The remote distribution system supports deployment packages, client provisioning records, invite session tracking, license key management, module activations, version control, and rollback architecture."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_remote_module_distribution_guide',
    manual_title: 'NOVEE OS Remote Module Distribution Guide',
    section_key: 'remote_dist_unsafe_claim',
    section_title: 'Remote Distribution Unsafe Claims',
    section_order: 3,
    audience_role: 'sales',
    module_key: 'remote_distribution',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT CLAIM: "Remote module distribution is live and actively delivering modules to clients." | "Clients can self-provision through invite links today." | "License keys are being generated and validated for active clients." | "Remote deployment is production-ready and available for commercial use." | "Rollback execution is available in the event of a failed deployment."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_remote_module_distribution_guide',
    manual_title: 'NOVEE OS Remote Module Distribution Guide',
    section_key: 'remote_dist_readiness_checklist',
    section_title: 'Remote Distribution Readiness Checklist',
    section_order: 4,
    audience_role: 'admin',
    module_key: 'remote_distribution',
    block_type: 'readiness_checklist',
    content_body: 'REMOTE DISTRIBUTION READINESS CHECKLIST: [ ] Phase E.3 Security gates passed | [ ] Phase E.4 Deployment gates passed | [ ] Phase E.5 Pilot readiness approved | [ ] Phase E.7 Training readiness confirmed for target module | [ ] Deployment package created and verified | [ ] Client provisioning record complete | [ ] License key generated and validated | [ ] NOVEE_REMOTE_MODULE_LIVE_DELIVERY_ENABLED confirmed by admin | [ ] Rollback plan confirmed | [ ] Post-delivery monitoring plan in place',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── Safe Sales Claims Guide ────────────────────────────────────────────────
  {
    manual_key: 'safe_sales_claims_guide',
    manual_title: 'Safe Sales Claims Guide',
    section_key: 'safe_claims_overview',
    section_title: 'Safe Sales Claims Overview',
    section_order: 0,
    audience_role: 'sales',
    module_key: 'novee_os',
    block_type: 'paragraph',
    content_body: 'The NOVEE OS Safe Sales Claims Guide defines what can and cannot be said about the NOVEE OS platform and its modules in sales conversations, investor presentations, client proposals, marketing materials, and press communications. NOVEE OS is an enterprise venue management operating system in active development and pilot preparation. It is not a fully launched, production-certified, or compliance-approved platform. Every claim made about NOVEE OS must be accurate, evidence-backed, and honest about the current state of the system. This guide provides pre-approved language for each module and a clear list of claims that must never be made.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'safe_sales_claims_guide',
    manual_title: 'Safe Sales Claims Guide',
    section_key: 'safe_claims_platform',
    section_title: 'NOVEE OS Platform — Safe and Unsafe Claims',
    section_order: 1,
    audience_role: 'sales',
    module_key: 'novee_os',
    block_type: 'safe_claim',
    content_body: 'SAFE: "NOVEE OS is an enterprise venue management operating system built for specialty hospitality businesses." | "NOVEE OS includes modules for session management, point-of-sale, food and beverage service, ambient environment coordination, onboarding and training, remote module distribution, and guest experience tracking." | "NOVEE OS is in active development and pilot preparation, approaching its first venue deployment." | "NOVEE OS has a built-in security activation center, deployment activation center, and live pilot readiness center that define gates before any live deployment occurs." | UNSAFE: "NOVEE OS is live and deployed at multiple venues." | "NOVEE OS is production-certified." | "NOVEE OS has completed security, compliance, or regulatory review." | "NOVEE OS is ready for immediate commercial use."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'safe_sales_claims_guide',
    manual_title: 'Safe Sales Claims Guide',
    section_key: 'safe_claims_smokecraft',
    section_title: 'SmokeCraft 360 — Safe and Unsafe Claims',
    section_order: 2,
    audience_role: 'sales',
    module_key: 'smokecraft',
    block_type: 'safe_claim',
    content_body: 'SAFE: "SmokeCraft 360 is a premium venue management system for cigar lounges and specialty tobacco venues." | "SmokeCraft 360 tracks guest visit history, session activity, and product preferences through an 8-visit progressive experience structure." | "SmokeCraft 360 integrates with POS360 for point-of-sale processing." | "SmokeCraft 360 is in pilot readiness phase." | UNSAFE: "SmokeCraft 360 is production-ready and live at active venues." | "SmokeCraft 360 payment processing is certified." | "SmokeCraft 360 guarantees guest data security and compliance."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'safe_sales_claims_guide',
    manual_title: 'Safe Sales Claims Guide',
    section_key: 'safe_claims_ambi',
    section_title: 'AMBI Foundation — Safe and Unsafe Claims',
    section_order: 3,
    audience_role: 'sales',
    module_key: 'ambi',
    block_type: 'safe_claim',
    content_body: 'SAFE: "AMBI is the ambient intelligence platform layer within NOVEE OS — a software foundation for environment coordination." | "AMBI aura states are software experience presets for venue atmosphere, not emotional or medical detection." | "AMBI is in software foundation phase — no hardware is connected." | UNSAFE: "AMBI detects guest emotions, health state, stress, or intoxication." | "AMBI hardware is connected and live." | "AMBI performs biometric or medical monitoring." | "AMBI performs safety or emergency monitoring."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'safe_sales_claims_guide',
    manual_title: 'Safe Sales Claims Guide',
    section_key: 'safe_claims_readiness_checklist',
    section_title: 'Safe Claims Governance Checklist',
    section_order: 4,
    audience_role: 'admin',
    module_key: 'novee_os',
    block_type: 'readiness_checklist',
    content_body: 'SAFE CLAIMS GOVERNANCE CHECKLIST: [ ] All sales team members have read and acknowledged the Safe Sales Claims Guide | [ ] All investor presentation materials have been reviewed against this guide | [ ] All client proposal language has been approved by admin | [ ] All press or media statements have been reviewed for unsafe claims | [ ] Safe Claims Guide version is current and matches current phase status | [ ] Unsafe claims are flagged and removed from all active materials | [ ] Legal team has reviewed the Safe Sales Claims Guide | [ ] Guide is updated after each new phase completion',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'safe_sales_claims_guide',
    manual_title: 'Safe Sales Claims Guide',
    section_key: 'safe_claims_unsafe_claim',
    section_title: 'Master Unsafe Claims Reference',
    section_order: 5,
    audience_role: 'sales',
    module_key: 'novee_os',
    block_type: 'unsafe_claim',
    content_body: 'MASTER LIST OF CLAIMS THAT MUST NEVER BE MADE: "NOVEE OS is production-certified." | "NOVEE OS has completed compliance, regulatory, or legal review." | "SmokeCraft 360 is live at multiple venues." | "Payments are fully certified." | "Staff training is complete." | "Remote distribution is live." | "AMBI detects emotions or health." | "Passport 360 is live across partner venues." | "E.10 final go-live gate has passed." | "The system is ready for immediate wide-scale commercial deployment." | "The platform has been certified by any third party, regulatory body, or certification authority."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── Troubleshooting Guide ──────────────────────────────────────────────────
  {
    manual_key: 'troubleshooting_guide',
    manual_title: 'Troubleshooting Guide',
    section_key: 'trouble_overview',
    section_title: 'Troubleshooting Overview',
    section_order: 0,
    audience_role: 'support',
    module_key: 'novee_os',
    block_type: 'paragraph',
    content_body: 'This troubleshooting guide covers common issues encountered across NOVEE OS modules and provides structured resolution paths. Issues are organized by module: NOVEE OS Core, SmokeCraft 360, POS360, E.A.T. 360, AMBI Foundation, and Remote Distribution. For each issue, the guide provides the likely cause, immediate steps, escalation path, and a note on whether the issue is known and tracked or newly discovered. Support staff should log every troubleshooting engagement in the NOVEE OS audit log.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'troubleshooting_guide',
    manual_title: 'Troubleshooting Guide',
    section_key: 'trouble_setup_instruction',
    section_title: 'Troubleshooting Steps and Escalation Path',
    section_order: 1,
    audience_role: 'support',
    module_key: 'novee_os',
    block_type: 'setup_instruction',
    content_body: 'STANDARD TROUBLESHOOTING STEPS: Step 1 — Identify the affected module and the specific symptom. Step 2 — Check the NOVEE OS audit log for recent events that may explain the issue. Step 3 — Verify that all required feature flags are enabled for the affected module. Step 4 — Check that the database is available and returning expected data. Step 5 — Review the relevant verification script output. Step 6 — If the issue is not resolved, escalate to the NOVEE OS admin with a written summary including: affected module, symptom description, audit log reference, steps already taken, and impact on operations.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'troubleshooting_guide',
    manual_title: 'Troubleshooting Guide',
    section_key: 'trouble_safe_claim',
    section_title: 'Troubleshooting Safe Claims',
    section_order: 2,
    audience_role: 'support',
    module_key: 'novee_os',
    block_type: 'safe_claim',
    content_body: 'SAFE: "NOVEE OS includes a structured troubleshooting guide for support staff." | "All issues are logged in the NOVEE OS audit log." | "Support staff have a defined escalation path for unresolved issues." | "Troubleshooting records are tracked and can be reviewed by the admin team."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'troubleshooting_guide',
    manual_title: 'Troubleshooting Guide',
    section_key: 'trouble_unsafe_claim',
    section_title: 'Troubleshooting Unsafe Claims',
    section_order: 3,
    audience_role: 'support',
    module_key: 'novee_os',
    block_type: 'unsafe_claim',
    content_body: 'DO NOT CLAIM: "NOVEE OS has zero known issues." | "All issues are resolved within a guaranteed SLA." | "NOVEE OS has 100% uptime." | "The troubleshooting guide covers all possible failure modes." These claims are not accurate and must not be made to clients, venues, or investors.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'troubleshooting_guide',
    manual_title: 'Troubleshooting Guide',
    section_key: 'trouble_readiness_checklist',
    section_title: 'Support Readiness Checklist',
    section_order: 4,
    audience_role: 'support',
    module_key: 'novee_os',
    block_type: 'readiness_checklist',
    content_body: 'SUPPORT READINESS CHECKLIST: [ ] Support team has read the full Troubleshooting Guide | [ ] Access to NOVEE OS audit log confirmed | [ ] Escalation contact list is current | [ ] All module verification scripts have been run successfully | [ ] Known issues list is current | [ ] Issue logging process is confirmed | [ ] Response time expectations communicated to venue team',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },

  // ── NOVEE OS Safe Claims Guide ─────────────────────────────────────────────
  {
    manual_key: 'novee_os_safe_claims_guide',
    manual_title: 'NOVEE OS Safe Claims Guide',
    section_key: 'novee_safe_claims_overview',
    section_title: 'Safe Claims Overview',
    section_order: 0,
    audience_role: 'admin',
    module_key: 'novee_os',
    block_type: 'paragraph',
    content_body: 'The NOVEE OS Safe Claims Guide is the internal governance document that defines approved and forbidden language for describing the NOVEE OS platform and its modules. It is distinct from the Safe Sales Claims Guide in that it applies to all communications — not just sales — and covers technical documentation, onboarding materials, investor updates, press, and client-facing content. Every NOVEE OS team member, partner, and vendor who creates content about the platform must refer to this guide before publishing or distributing any claims.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_safe_claims_guide',
    manual_title: 'NOVEE OS Safe Claims Guide',
    section_key: 'novee_safe_claims_setup',
    section_title: 'How to Use This Guide',
    section_order: 1,
    audience_role: 'admin',
    module_key: 'novee_os',
    block_type: 'setup_instruction',
    content_body: 'HOW TO USE THIS GUIDE: Step 1 — Before writing or approving any content about NOVEE OS, identify the module and the claim type. Step 2 — Look up the module in this guide and confirm the claim is in the approved list. Step 3 — If the claim is not in the approved list, do not use it. Step 4 — If you believe a new claim should be approved, submit it for review with supporting evidence. Step 5 — After review and approval, the claim is added to the approved list. Step 6 — If a claim is found in published materials that is not approved, report it immediately for correction.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_safe_claims_guide',
    manual_title: 'NOVEE OS Safe Claims Guide',
    section_key: 'novee_safe_claims_safe_claim',
    section_title: 'Core Safe Claims for NOVEE OS',
    section_order: 2,
    audience_role: 'admin',
    module_key: 'novee_os',
    block_type: 'safe_claim',
    content_body: 'CORE APPROVED CLAIMS: "NOVEE OS is a modular enterprise venue management operating system." | "NOVEE OS includes purpose-built modules for specialty hospitality, tobacco venues, dining, ambient environment coordination, and cross-venue guest experience." | "NOVEE OS has built-in gate-locking architecture that prevents live deployment until security, deployment, pilot, and training readiness is verified." | "NOVEE OS is in Phase E.9 of E.10 development phases, approaching final pre-go-live documentation and pilot preparation."',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_safe_claims_guide',
    manual_title: 'NOVEE OS Safe Claims Guide',
    section_key: 'novee_safe_claims_unsafe_claim',
    section_title: 'Core Unsafe Claims — Forbidden',
    section_order: 3,
    audience_role: 'admin',
    module_key: 'novee_os',
    block_type: 'unsafe_claim',
    content_body: 'FORBIDDEN CLAIMS UNDER ANY CIRCUMSTANCES: Any claim of production-readiness, certification, compliance approval, or regulatory clearance. | Any claim that AMBI detects emotions, health state, or biometric information. | Any claim that SmokeCraft 360 is live at commercial venues. | Any claim that remote module distribution is active. | Any claim that training or onboarding is complete for clients or staff. | Any claim that E.10 Final Go-Live Gate has passed. | Any claim that the platform is ready for immediate wide-scale commercial launch.',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
  {
    manual_key: 'novee_os_safe_claims_guide',
    manual_title: 'NOVEE OS Safe Claims Guide',
    section_key: 'novee_safe_claims_readiness_checklist',
    section_title: 'Safe Claims Readiness Checklist',
    section_order: 4,
    audience_role: 'admin',
    module_key: 'novee_os',
    block_type: 'readiness_checklist',
    content_body: 'SAFE CLAIMS GOVERNANCE READINESS: [ ] All team members have read and acknowledged this guide | [ ] All current marketing materials have been audited | [ ] Forbidden claim patterns are removed from all materials | [ ] Approval process for new claims is confirmed | [ ] Legal team has reviewed the guide | [ ] Guide version matches current platform phase | [ ] Claims registry is populated and reviewed',
    content_depth_status: 'seeded_professional_draft',
    needs_human_review: true,
    published: false,
  },
]

// Default safe claim records
export const DEFAULT_SAFE_CLAIMS = [
  { claim_key: 'novee_os_foundation_exists', claim_text: 'NOVEE OS exists as a modular enterprise venue management operating system.', claim_type: 'safe_claim', module_key: 'novee_os', claim_status: 'draft', evidence_required: false, evidence_present: true, approved_for_sales: false, approved_for_client: false, safe_claim: 'documentation_safe_claim_exists' },
  { claim_key: 'smokecraft_pilot_approaching', claim_text: 'SmokeCraft 360 is in pilot readiness phase.', claim_type: 'pilot_claim', module_key: 'smokecraft', claim_status: 'draft', evidence_required: true, evidence_present: false, approved_for_sales: false, approved_for_client: false, safe_claim: 'documentation_safe_claim_exists' },
  { claim_key: 'ambi_software_foundation_only', claim_text: 'AMBI is a software foundation — no hardware connected, no live telemetry.', claim_type: 'ambi_claim', module_key: 'ambi', claim_status: 'draft', evidence_required: false, evidence_present: true, approved_for_sales: false, approved_for_client: false, safe_claim: 'documentation_safe_claim_exists' },
  { claim_key: 'remote_dist_build_only', claim_text: 'Remote module distribution is in software foundation phase — no live delivery.', claim_type: 'remote_distribution_claim', module_key: 'remote_distribution', claim_status: 'draft', evidence_required: false, evidence_present: true, approved_for_sales: false, approved_for_client: false, safe_claim: 'documentation_safe_claim_exists' },
  { claim_key: 'smokecraft_production_not_ready', claim_text: 'SmokeCraft 360 is NOT production-ready. Do not make this claim.', claim_type: 'unsafe_claim', module_key: 'smokecraft', claim_status: 'draft', evidence_required: false, evidence_present: false, approved_for_sales: false, approved_for_client: false, blocker_reason: 'Pilot gates not passed. E.10 not complete.', safe_claim: 'documentation_safe_claim_exists' },
  { claim_key: 'ambi_no_emotion_detection', claim_text: 'AMBI does NOT detect emotions, health, biometrics, or perform safety monitoring.', claim_type: 'unsafe_claim', module_key: 'ambi', claim_status: 'draft', evidence_required: false, evidence_present: false, approved_for_sales: false, approved_for_client: false, blocker_reason: 'Forbidden claim — hardcoded block at contract layer.', safe_claim: 'documentation_safe_claim_exists' },
]

// Assertion helpers
export function assertNoFakeManualCompletionClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_MANUAL_COMPLETION_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`Fake manual completion claim blocked: ${f}`)
  }
}

export function assertNoFakeDocumentationPublicationClaims(payload) {
  if (payload.published === true) throw new Error('Documentation publication is disabled by default in this phase')
  if (payload.client_ready === true) throw new Error('Client-ready publication is disabled by default in this phase')
  if (payload.staff_ready === true) throw new Error('Staff-ready publication is disabled by default in this phase')
}

export function assertNoFakeCertificationDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_CERTIFICATION_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake certification claim blocked: ${f}`)
  }
}

export function assertNoFakeComplianceDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_COMPLIANCE_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake compliance claim blocked: ${f}`)
  }
}

export function assertNoFakeProductionReadinessDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_PRODUCTION_READINESS_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake production readiness claim blocked: ${f}`)
  }
}

export function assertNoFakeTrainingCompletionDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_TRAINING_COMPLETION_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake training completion claim blocked: ${f}`)
  }
}

export function assertNoFakeRemoteDistributionDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_REMOTE_DISTRIBUTION_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake remote distribution claim blocked: ${f}`)
  }
}

export function assertNoFakeProviderConnectionDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_PROVIDER_CONNECTION_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake provider connection claim blocked: ${f}`)
  }
}

export function assertNoFakePaymentReadinessDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_PAYMENT_READINESS_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake payment readiness claim blocked: ${f}`)
  }
}

export function assertNoFakePOSReadinessDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_POS_READINESS_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake POS readiness claim blocked: ${f}`)
  }
}

export function assertNoFakeInventorySyncDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_INVENTORY_SYNC_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake inventory sync claim blocked: ${f}`)
  }
}

export function assertNoFakeCommunicationDeliveryDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_COMMUNICATION_DELIVERY_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake communication delivery claim blocked: ${f}`)
  }
}

export function assertNoFakeAMBIHardwareTelemetryDocumentationClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_AMBI_HARDWARE_TELEMETRY_CLAIMS) {
    if (str.includes(f)) throw new Error(`Fake AMBI hardware/telemetry claim blocked: ${f}`)
  }
}

export function assertNoUnsafeSmokeCraftProductionReadyClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_UNSAFE_SMOKECRAFT_PRODUCTION_CLAIMS) {
    if (str.includes(f)) throw new Error(`Unsafe SmokeCraft production-ready claim blocked: ${f}`)
  }
}

export function assertNoSensitiveDocumentationData(payload) {
  const forbidden = ['password:','api_key:','secret_key:','private_key:','database_url:','connection_string:']
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of forbidden) {
    if (str.includes(f)) throw new Error(`Sensitive documentation data blocked: ${f}`)
  }
}

export function assertNoEmptyManualRecords(payload) {
  if (!payload.doc_title && !payload.manual_title) throw new Error('Empty manual record blocked — doc_title or manual_title is required')
  if (!payload.content_body && !payload.content_summary && payload.seeded_content_status === 'title_only') {
    throw new Error('Title-only documentation record blocked — content is required')
  }
}

export function assertRequiredManualsHaveSeededContent(manualKey) {
  const required = [
    'smokecraft_360_venue_guide','smokecraft_360_staff_guide','smokecraft_360_guest_flow_guide',
    'smokecraft_360_pilot_readiness_guide','passport_360_connection_guide','pos360_staff_guide',
    'eat360_manager_guide','novee_os_remote_module_distribution_guide','safe_sales_claims_guide',
    'troubleshooting_guide',
  ]
  const seeded = DEFAULT_SEEDED_MANUAL_CONTENT.map(s => s.manual_key)
  const missing = required.filter(r => !seeded.includes(r))
  if (missing.length > 0) throw new Error(`Required manuals missing seeded content: ${missing.join(', ')}`)
  return true
}

export function validateDocumentationLibraryPayload(payload) {
  if (!payload.doc_key) throw new Error('doc_key required')
  if (!payload.doc_title) throw new Error('doc_title required')
  if (payload.doc_type && !ALLOWED_DOC_TYPES.includes(payload.doc_type)) throw new Error(`Invalid doc_type: ${payload.doc_type}`)
  assertNoFakeDocumentationPublicationClaims(payload)
  assertNoFakeCertificationDocumentationClaims(payload)
  assertNoUnsafeSmokeCraftProductionReadyClaims(payload)
  assertNoSensitiveDocumentationData(payload)
  return true
}

export function validateDocumentationArticlePayload(payload) {
  if (!payload.article_key) throw new Error('article_key required')
  if (!payload.article_title) throw new Error('article_title required')
  if (payload.article_type && !ALLOWED_ARTICLE_TYPES.includes(payload.article_type)) throw new Error(`Invalid article_type`)
  return true
}

export function validateDocumentationContentBlockPayload(payload) {
  if (!payload.block_key) throw new Error('block_key required')
  if (!payload.block_title) throw new Error('block_title required')
  if (payload.block_type && !ALLOWED_BLOCK_TYPES.includes(payload.block_type)) throw new Error(`Invalid block_type`)
  if (payload.published === true) throw new Error('Content blocks cannot be published by default in this phase')
  assertNoSensitiveDocumentationData(payload)
  assertNoFakeAMBIHardwareTelemetryDocumentationClaims(payload)
  return true
}

export function validateDocumentationReviewPayload(payload) {
  if (payload.review_status && !ALLOWED_REVIEW_STATUSES.includes(payload.review_status)) throw new Error(`Invalid review_status`)
  if (payload.approved_for_public === true) throw new Error('Public approval is not available in this phase')
  return true
}

export function validateDocumentationExportPayload(payload) {
  if (payload.export_type && !ALLOWED_EXPORT_TYPES.includes(payload.export_type)) throw new Error(`Invalid export_type`)
  if (payload.export_format && !ALLOWED_EXPORT_FORMATS.includes(payload.export_format)) throw new Error(`Invalid export_format`)
  if (payload.approved_for_export === true) throw new Error('Export approval requires manual review — cannot be set via API in this phase')
  return true
}

export function validateDocumentationSafeClaimPayload(payload) {
  if (!payload.claim_key) throw new Error('claim_key required')
  if (!payload.claim_text) throw new Error('claim_text required')
  if (payload.claim_type && !ALLOWED_CLAIM_TYPES.includes(payload.claim_type)) throw new Error(`Invalid claim_type`)
  if (payload.approved_for_sales === true) throw new Error('Sales approval requires manual review in this phase')
  return true
}

export function validateSeededManualContentPayload(payload) {
  if (!payload.manual_key) throw new Error('manual_key required')
  if (!payload.manual_title) throw new Error('manual_title required')
  if (!payload.section_key) throw new Error('section_key required')
  if (!payload.section_title) throw new Error('section_title required')
  if (!payload.content_body || payload.content_body.trim().length < 50) throw new Error('content_body must contain substantial content (minimum 50 characters)')
  if (payload.published === true) throw new Error('Seeded content cannot be published by default in this phase')
  assertNoSensitiveDocumentationData(payload)
  return true
}
