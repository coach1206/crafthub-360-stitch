/**
 * SmokeCraft White-Label Contract
 * Module Build 8 — white-label override definitions and protections.
 */

export const WHITE_LABEL_STATUSES = {
  PREVIEW:              'white_label_preview',
  READY_FOR_REVIEW:     'ready_for_review',
  BLOCKED:              'blocked',
  LICENSE_REQUIRED:     'license_required',
}

export const PROTECTED_BRAND_ELEMENTS = [
  'novee_os_powered_by_metadata',
  'smokecraft_journey_logic',
  'passport_stamp_rules',
  'connections_lock_rules',
  'visit_progression',
  'legal_safety_disclaimers',
]

export const ALLOWED_THEME_TOKENS = [
  'brand_primary_color',
  'brand_secondary_color',
  'brand_font_family',
  'brand_logo_url',
  'brand_display_name',
  'venue_name',
  'support_contact',
  'legal_footer_text',
]

export const BLOCKED_THEME_TOKENS = [
  'journey_step_order',
  'visit_count',
  'session_count',
  'passport_unlock_threshold',
  'connections_unlock_threshold',
  'flavor_memory_required',
]

export function createWhiteLabelRecord(overrides = {}) {
  return {
    whiteLabelId:                   null,
    moduleId:                       'smokecraft',
    brandNameOverride:              null,
    logoOverrideAllowed:            true,
    colorThemeOverrideAllowed:      true,
    copyOverrideAllowed:            true,
    venueNamingOverrideAllowed:     true,
    moduleDisplayNameOverrideAllowed: true,
    legalFooterOverrideAllowed:     false,
    supportContactOverrideAllowed:  true,
    featureVisibilityOverrides:     {},
    allowedThemeTokens:             ALLOWED_THEME_TOKENS,
    blockedThemeTokens:             BLOCKED_THEME_TOKENS,
    protectedBrandElements:         PROTECTED_BRAND_ELEMENTS,
    defaultBrandOwner:              'NOVEE OS',
    whiteLabelStatus:               WHITE_LABEL_STATUSES.PREVIEW,
    poweredByNoveeOSRequired:       true,
    canBypassJourneyLogic:          false,
    canBypassProtectedProgression:  false,
    ...overrides,
  }
}
