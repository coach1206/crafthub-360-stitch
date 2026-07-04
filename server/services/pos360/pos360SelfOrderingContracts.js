// POS360 Self-Ordering — contracts, constants, validators

export const QR_SESSION_STATUSES = ['active','expired','closed','invalid'];
export const CART_STATUSES = ['open','locked','submitted','abandoned','cancelled'];
export const CART_ITEM_STATUSES = ['pending','confirmed_placeholder','unavailable','removed','age_blocked'];
export const SUBMISSION_STATUSES = ['submitted_placeholder','acknowledged_placeholder','routed_placeholder','completed_placeholder','cancelled','failed'];
export const HANDHELD_SESSION_STATUSES = ['active','idle','closed','error'];
export const HANDHELD_ENTRY_STATUSES = ['draft','submitted','kds_sent_placeholder','kds_accepted_placeholder','cancelled'];
export const TABLE_SESSION_STATUSES = ['open','ordering','checkout','closed','abandoned'];
export const CHECKOUT_HANDOFF_STATUSES = ['pending','initiated_placeholder','payment_captured_placeholder','completed_placeholder','failed','cancelled'];
export const QR_CODE_STATUSES = ['active','disabled','expired','replaced'];
export const QR_TARGET_TYPES = ['table','section','menu','private_event','smokecraft','custom'];
export const MENU_SNAPSHOT_STATUSES = ['draft_placeholder','published_placeholder','stale','archived'];
export const AGE_VERIFICATION_METHODS = ['staff_visual_placeholder','id_scan_placeholder','honor_system_placeholder'];
export const AGE_VERIFICATION_STATUSES = ['pending','verified_placeholder','rejected','bypassed_manager_approval'];
export const ITEM_TYPES = ['food','drink','cigar','retail','service','package_item','custom'];
export const ORDER_SOURCES = ['guest_self_order','server_handheld','table_session','external_pos_placeholder','manual','private_event','smokecraft'];
export const AVAILABILITY_OVERRIDE_TYPES = ['86ed','limited_placeholder','sold_out_placeholder','seasonal_unavailable','custom'];
export const AVAILABILITY_OVERRIDE_STATUSES = ['active','resolved','expired'];
export const OFFLINE_QUEUE_STATUSES = ['pending','synced','failed'];
export const VISIBILITY_INSIGHT_TYPES = ['cart_abandonment','avg_order_value','popular_items','unavailable_hits','age_blocked_items','qr_scan_rate','checkout_drop_off','custom'];
export const SMOKECRAFT_HOOK_STATUSES = ['pending_placeholder','routed_placeholder','completed_placeholder','failed','unavailable'];
export const EAT_HANDOFF_STATUSES = ['pending_placeholder','sent_placeholder','acknowledged_placeholder','completed_placeholder','failed'];

export function isValidQrSessionStatus(v) { return QR_SESSION_STATUSES.includes(v); }
export function isValidCartStatus(v) { return CART_STATUSES.includes(v); }
export function isValidCartItemStatus(v) { return CART_ITEM_STATUSES.includes(v); }
export function isValidSubmissionStatus(v) { return SUBMISSION_STATUSES.includes(v); }
export function isValidHandheldSessionStatus(v) { return HANDHELD_SESSION_STATUSES.includes(v); }
export function isValidHandheldEntryStatus(v) { return HANDHELD_ENTRY_STATUSES.includes(v); }
export function isValidTableSessionStatus(v) { return TABLE_SESSION_STATUSES.includes(v); }
export function isValidCheckoutHandoffStatus(v) { return CHECKOUT_HANDOFF_STATUSES.includes(v); }
export function isValidQrCodeStatus(v) { return QR_CODE_STATUSES.includes(v); }
export function isValidQrTargetType(v) { return QR_TARGET_TYPES.includes(v); }
export function isValidMenuSnapshotStatus(v) { return MENU_SNAPSHOT_STATUSES.includes(v); }
export function isValidAgeVerificationMethod(v) { return AGE_VERIFICATION_METHODS.includes(v); }
export function isValidAgeVerificationStatus(v) { return AGE_VERIFICATION_STATUSES.includes(v); }
export function isValidItemType(v) { return ITEM_TYPES.includes(v); }
export function isValidOrderSource(v) { return ORDER_SOURCES.includes(v); }
export function isValidAvailabilityOverrideType(v) { return AVAILABILITY_OVERRIDE_TYPES.includes(v); }
export function isValidAvailabilityOverrideStatus(v) { return AVAILABILITY_OVERRIDE_STATUSES.includes(v); }
export function isValidOfflineQueueStatus(v) { return OFFLINE_QUEUE_STATUSES.includes(v); }
export function isValidVisibilityInsightType(v) { return VISIBILITY_INSIGHT_TYPES.includes(v); }
export function isValidSmokecraftHookStatus(v) { return SMOKECRAFT_HOOK_STATUSES.includes(v); }
export function isValidEatHandoffStatus(v) { return EAT_HANDOFF_STATUSES.includes(v); }
