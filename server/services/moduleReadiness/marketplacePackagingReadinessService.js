const PRICING_MODELS = {
  INCLUDED: 'included',
  PREMIUM_ADDON: 'premium_addon',
  ENTERPRISE_ADDON: 'enterprise_addon',
  PER_VENUE: 'per_venue',
  PER_LOCATION: 'per_location',
  PER_MODULE: 'per_module',
  RESELLER_LICENSE: 'reseller_license',
  WHITE_LABEL_LICENSE: 'white_label_license',
}

const MARKETPLACE_DRAFTS = [
  {
    listingId: 'listing-smokecraft-experience',
    moduleId: 'smokecraft-experience',
    moduleName: 'SmokeCraft Experience Module',
    category: 'Guest Experience',
    shortDescription: 'Guided cigar journey with passport progression, hotspot exploration, and session tracking.',
    longDescription: 'The SmokeCraft Experience Module delivers an immersive 8-visit, 24-session guided journey. Guests explore humidor hotspots, earn passport stamps, and build connections. Sealed visual shell, protected journey rules.',
    pricingModel: PRICING_MODELS.PER_VENUE,
    coreOrAddon: 'core',
    targetBuyer: 'Cigar lounge owner or multi-venue hospitality operator',
    dependencies: ['venue-onboarding'],
    screenshotsRequired: ['humidor_view', 'passport_panel', 'connection_panel'],
    demoRoute: '/smokecraft',
    installRequirements: ['venue_onboarding_complete', 'journey_constants_present'],
    licenseRequirements: ['venue_license'],
    supportDocs: ['docs/SMOKECRAFT_JOURNEY.md'],
    whiteLabelEligible: false,
    marketplaceStatus: 'marketplace_ready_draft',
  },
  {
    listingId: 'listing-pos360',
    moduleId: 'pos360',
    moduleName: 'POS360 Module',
    category: 'Point of Sale',
    shortDescription: 'Full-featured POS terminal with inventory, staff orders, KDS integration, and availability protection.',
    longDescription: 'POS360 is the core POS module powering table orders, staff routing, KDS sync, and inventory availability protection. Integrates with ISPAE, LOCC, and E.A.T.',
    pricingModel: PRICING_MODELS.PER_VENUE,
    coreOrAddon: 'core',
    targetBuyer: 'Hospitality venue operator',
    dependencies: ['venue-onboarding', 'inventory-ispae'],
    screenshotsRequired: ['pos_terminal', 'order_panel', 'inventory_status'],
    demoRoute: '/pos360',
    installRequirements: ['venue_onboarding_complete', 'inventory_module_active'],
    licenseRequirements: ['venue_license'],
    supportDocs: ['docs/POS360_ENGINE.md'],
    whiteLabelEligible: true,
    marketplaceStatus: 'marketplace_ready_draft',
  },
  {
    listingId: 'listing-eat-command-hub',
    moduleId: 'eat-command-hub',
    moduleName: 'E.A.T. Command Hub Module',
    category: 'Operations Intelligence',
    shortDescription: 'Event-driven action telemetry hub for real-time operational intelligence across all venue systems.',
    longDescription: 'E.A.T. (Event Action Telemetry) connects all venue modules through a unified hook contract. Enables real-time readiness signals, cross-system auditing, and operational event routing.',
    pricingModel: PRICING_MODELS.ENTERPRISE_ADDON,
    coreOrAddon: 'core',
    targetBuyer: 'Multi-venue operator or enterprise hospitality group',
    dependencies: ['pos360', 'inventory-ispae'],
    screenshotsRequired: ['eat_dashboard', 'hook_status_panel'],
    demoRoute: '/eat',
    installRequirements: ['pos360_active', 'inventory_module_active'],
    licenseRequirements: ['enterprise_license'],
    supportDocs: ['docs/EAT_COMMAND_HUB.md'],
    whiteLabelEligible: true,
    marketplaceStatus: 'marketplace_ready_draft',
  },
  {
    listingId: 'listing-reorder-dmrc',
    moduleId: 'reorder-dmrc',
    moduleName: 'Reorder Connector Add-On (DMRC)',
    category: 'Inventory Operations',
    shortDescription: 'Distributor and manufacturer reorder connector with approval gate and vendor submission readiness.',
    longDescription: 'DMRC connects inventory reorder workflows to vendor/distributor/manufacturer connectors. All orders require manager/owner/admin approval. No auto-purchasing. Preview-only until vendor credentials configured.',
    pricingModel: PRICING_MODELS.PREMIUM_ADDON,
    coreOrAddon: 'addon',
    targetBuyer: 'Venue manager or owner managing inventory procurement',
    dependencies: ['inventory-ispae', 'vendor-partner', 'eocg'],
    screenshotsRequired: ['reorder_panel', 'approval_queue', 'vendor_status'],
    demoRoute: '/reorder',
    installRequirements: ['inventory_module_active', 'vendor_credentials_configured'],
    licenseRequirements: ['premium_license', 'vendor_credentials'],
    supportDocs: ['docs/REORDER_CONNECTORS.md'],
    whiteLabelEligible: false,
    marketplaceStatus: 'marketplace_ready_draft',
  },
  {
    listingId: 'listing-locc',
    moduleId: 'locc',
    moduleName: 'Live Operations Command Center (LOCC)',
    category: 'Operations Management',
    shortDescription: 'Real-time operations command center with sync control, pending approvals, and EOCG bridge.',
    longDescription: 'LOCC gives owners and managers a centralized view of all live operations, pending purchase order approvals, sync readiness, and failed sync retry controls.',
    pricingModel: PRICING_MODELS.ENTERPRISE_ADDON,
    coreOrAddon: 'core',
    targetBuyer: 'Multi-venue operator or operations manager',
    dependencies: ['inventory-ispae', 'reorder-dmrc'],
    screenshotsRequired: ['locc_dashboard', 'approval_panel', 'sync_status'],
    demoRoute: '/locc',
    installRequirements: ['inventory_module_active', 'role_safety_configured'],
    licenseRequirements: ['enterprise_license'],
    supportDocs: ['docs/LIVE_OPERATIONS_COMMAND_CENTER.md'],
    whiteLabelEligible: true,
    marketplaceStatus: 'marketplace_ready_draft',
  },
  {
    listingId: 'listing-eocg',
    moduleId: 'eocg',
    moduleName: 'External Operations Connector Gateway (EOCG)',
    category: 'External Integrations',
    shortDescription: 'Provider-neutral gateway for external POS sync, vendor ordering, and operational event routing.',
    longDescription: 'EOCG connects the platform to Square, Toast, Clover, Lightspeed, Shopify POS, Stripe Terminal, and Custom POS providers. Also routes vendor/distributor/manufacturer orders and operational sync events.',
    pricingModel: PRICING_MODELS.ENTERPRISE_ADDON,
    coreOrAddon: 'addon',
    targetBuyer: 'Enterprise operator or venue with external POS integration needs',
    dependencies: ['locc', 'inventory-ispae'],
    screenshotsRequired: ['eocg_readiness_panel', 'pos_provider_panel', 'vendor_gateway_panel'],
    demoRoute: '/external-operations',
    installRequirements: ['locc_active', 'external_credentials_configured'],
    licenseRequirements: ['enterprise_license', 'external_credentials'],
    supportDocs: ['docs/EXTERNAL_POS_VENDOR_GATEWAY_AND_LIVE_OPERATIONS.md'],
    whiteLabelEligible: false,
    marketplaceStatus: 'marketplace_ready_draft',
  },
  {
    listingId: 'listing-white-label',
    moduleId: 'white-label-licensing',
    moduleName: 'White-Label Licensing Module',
    category: 'Licensing & Reseller',
    shortDescription: 'White-label branding, reseller licensing, and venue-tier activation for NOVEE OS deployments.',
    longDescription: 'Enables resellers and brokers to deploy branded NOVEE OS instances. Manages module activation, license tiers, venue limits, and support handoff.',
    pricingModel: PRICING_MODELS.WHITE_LABEL_LICENSE,
    coreOrAddon: 'addon',
    targetBuyer: 'Reseller, broker, or white-label hospitality operator',
    dependencies: ['venue-onboarding'],
    screenshotsRequired: ['license_tier_panel', 'reseller_dashboard'],
    demoRoute: '/licensing',
    installRequirements: ['white_label_agreement_signed', 'license_gate_configured'],
    licenseRequirements: ['white_label_license'],
    supportDocs: ['docs/FINAL_PRODUCTION_LOCKDOWN_AND_MODULE_READINESS.md'],
    whiteLabelEligible: true,
    marketplaceStatus: 'future_listing',
  },
]

export function buildMarketplaceReadinessReport() {
  return {
    total_listings: MARKETPLACE_DRAFTS.length,
    draft_listings: MARKETPLACE_DRAFTS.filter(l => l.marketplaceStatus === 'marketplace_ready_draft').length,
    future_listings: MARKETPLACE_DRAFTS.filter(l => l.marketplaceStatus === 'future_listing').length,
    live_marketplace: false,
    marketplace_not_live: true,
    listing_drafts_only: true,
    note: 'Marketplace listings are drafts only. No live marketplace exists yet.',
    listings: MARKETPLACE_DRAFTS,
  }
}

export function buildMarketplaceListingDrafts() {
  return MARKETPLACE_DRAFTS
}

export function getMarketplacePackagingBlockers() {
  return [
    { blocker: 'module_manifests_not_created', severity: 'critical', applies_to: 'all_modules' },
    { blocker: 'module_install_hooks_not_built', severity: 'critical', applies_to: 'all_modules' },
    { blocker: 'license_gate_not_built', severity: 'critical', applies_to: 'premium_and_enterprise_modules' },
    { blocker: 'marketplace_registry_not_built', severity: 'critical', applies_to: 'all_listings' },
    { blocker: 'screenshots_not_captured', severity: 'high', applies_to: 'all_listings' },
  ]
}

export function getPricingModelRecommendations() {
  return {
    core_modules: PRICING_MODELS.PER_VENUE,
    premium_addons: PRICING_MODELS.PREMIUM_ADDON,
    enterprise_modules: PRICING_MODELS.ENTERPRISE_ADDON,
    white_label: PRICING_MODELS.WHITE_LABEL_LICENSE,
    reseller: PRICING_MODELS.RESELLER_LICENSE,
  }
}

export function getDemoRouteRequirements() {
  return MARKETPLACE_DRAFTS.map(l => ({ listingId: l.listingId, demoRoute: l.demoRoute, screenshots_required: l.screenshotsRequired }))
}

export function getScreenshotRequirements() {
  return MARKETPLACE_DRAFTS.flatMap(l => l.screenshotsRequired.map(s => ({ listingId: l.listingId, screenshot: s })))
}

export function buildMarketplaceLaunchChecklist() {
  return {
    status: 'marketplace_not_ready',
    blockers: getMarketplacePackagingBlockers(),
    checklist: [
      { item: 'Module manifests created', done: false, required: true },
      { item: 'Module install/uninstall hooks built', done: false, required: true },
      { item: 'License gate engine built', done: false, required: true },
      { item: 'Marketplace registry built', done: false, required: true },
      { item: 'Screenshots captured', done: false, required: true },
      { item: 'Listing descriptions approved', done: false, required: false },
      { item: 'Pricing tiers finalized', done: false, required: false },
    ],
    next_step: 'Module Build 1 — NOVEE OS Module Packaging Foundation',
  }
}
