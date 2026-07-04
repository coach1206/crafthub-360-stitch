/**
 * pos360ReservationFeatureFlags.js — Phase B.9
 * Feature flags for Reservations, Waitlist, Tables & Guest Flow
 */

export const DEFAULT_POS360_RESERVATION_FLAGS = {
  reservationsEnabled:                    true,
  waitlistEnabled:                        true,
  tableLayoutEnabled:                     true,
  patioSectionsEnabled:                   true,
  privateEventsEnabled:                   true,
  depositTrackingEnabled:                 true,
  loyaltyLinkedReservationsEnabled:       false,
  smokeCraftLinkedReservationsEnabled:    false,
  eatGuestFlowInsightsEnabled:            false,
  offlineReservationQueueEnabled:         true,
  managerApprovalForOverbookingEnabled:   true,
  managerApprovalForPriorityWaitlistEnabled: true,
  managerApprovalForDepositReversalEnabled: true,
  tableMergeEnabled:                      true,
  tableSplitEnabled:                      false,
  serverAssignmentEnabled:                true,
  sectionCapacityRulesEnabled:            true,
  guestConsentRequiredForMarketingEnabled: true,
  externalReservationApiContractsEnabled: false,
  guestFacingBookingWidgetContractsEnabled: false,
  multilingualGuestFlowEnabled:           true,
  honestEmptyStatesEnabled:               true,
}

export function getReservationFlags(venueOverrides = {}) {
  return { ...DEFAULT_POS360_RESERVATION_FLAGS, ...venueOverrides }
}
