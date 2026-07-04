// POS360 Fulfillment KDS — contracts, constants, validators

export const STATION_TYPES = ['kitchen','bar','humidor','expo','patio','pickup','delivery_placeholder','server_station','custom'];
export const STATION_STATUSES = ['draft','active_placeholder','connected_external','disabled','unavailable'];
export const CAPABILITY_GROUPS = ['food','beverage','cigar','humidor','expo','pickup','patio','private_event','smokecraft','custom'];
export const SUPPORTED_STATUSES = ['unknown','not_supported','supported_placeholder','supported_external'];
export const ROUTING_RULE_TYPES = ['category','item_tag','modifier','course','prep_area','service_area','table_section','private_event','order_type','fulfillment_priority','custom'];
export const ORDER_SOURCES = ['server','guest_self_order','external_pos_placeholder','manual','private_event','smokecraft','unavailable'];
export const TICKET_STATUSES = ['received_placeholder','routed','partially_preparing','preparing','partially_ready','ready','partially_served','served','cancelled','failed','unavailable'];
export const ITEM_TYPES = ['food','drink','cigar','retail','service','package_item','custom'];
export const ITEM_STATUSES = ['new','routed','acknowledged','preparing','ready','held','fired','served','cancelled','voided_external','unavailable'];
export const QUEUE_TYPES = ['kitchen','bar','humidor','expo','patio','pickup','delivery_placeholder','custom'];
export const QUEUE_STATUSES = ['queued','acknowledged','preparing','ready','held','fired','served','cancelled','failed','unavailable'];
export const QUEUE_PRIORITIES = ['normal','rush','delayed','hold','refire'];
export const FIRE_STATUSES = ['hold','fired','delayed','refire','rush','completed','cancelled'];
export const HANDOFF_TYPES = ['kitchen_to_expo','bar_to_server','humidor_to_server','expo_to_server','server_to_guest','pickup_ready','private_event_service','custom'];
export const HANDOFF_STATUSES = ['pending','acknowledged_placeholder','completed_placeholder','failed','unavailable'];
export const UNAVAILABLE_STATUSES = ['reported','manager_review','confirmed_placeholder','resolved','cancelled'];
export const OVERRIDE_TYPES = ['cancel_item','void_item_external','refire_item','rush_item','delay_item','reroute_item','item_unavailable','station_reassignment','comp_item_external','custom'];
export const OVERRIDE_STATUSES = ['pending_manager_approval','approved','rejected','cancelled'];
export const FULFILLMENT_STATUSES = ['queued','picked_placeholder','presented_placeholder','served_placeholder','preparing','ready','unavailable','cancelled'];
export const EXTERNAL_PROVIDER_STATUSES = ['not_connected','configured_placeholder','connected_external','disabled','error'];
export const VISIBILITY_INSIGHT_TYPES = ['station_bottleneck','long_prep_time','item_unavailable','high_refire_rate','late_order','service_handoff_issue','humidor_delay','bar_delay','kitchen_delay','custom'];

export function isValidStationType(v) { return STATION_TYPES.includes(v); }
export function isValidStationStatus(v) { return STATION_STATUSES.includes(v); }
export function isValidCapabilityGroup(v) { return CAPABILITY_GROUPS.includes(v); }
export function isValidSupportedStatus(v) { return SUPPORTED_STATUSES.includes(v); }
export function isValidRoutingRuleType(v) { return ROUTING_RULE_TYPES.includes(v); }
export function isValidOrderSource(v) { return ORDER_SOURCES.includes(v); }
export function isValidTicketStatus(v) { return TICKET_STATUSES.includes(v); }
export function isValidItemType(v) { return ITEM_TYPES.includes(v); }
export function isValidItemStatus(v) { return ITEM_STATUSES.includes(v); }
export function isValidQueueType(v) { return QUEUE_TYPES.includes(v); }
export function isValidQueueStatus(v) { return QUEUE_STATUSES.includes(v); }
export function isValidQueuePriority(v) { return QUEUE_PRIORITIES.includes(v); }
export function isValidFireStatus(v) { return FIRE_STATUSES.includes(v); }
export function isValidHandoffType(v) { return HANDOFF_TYPES.includes(v); }
export function isValidHandoffStatus(v) { return HANDOFF_STATUSES.includes(v); }
export function isValidUnavailableStatus(v) { return UNAVAILABLE_STATUSES.includes(v); }
export function isValidOverrideType(v) { return OVERRIDE_TYPES.includes(v); }
export function isValidOverrideStatus(v) { return OVERRIDE_STATUSES.includes(v); }
export function isValidFulfillmentStatus(v) { return FULFILLMENT_STATUSES.includes(v); }
export function isValidExternalProviderStatus(v) { return EXTERNAL_PROVIDER_STATUSES.includes(v); }
export function isValidVisibilityInsightType(v) { return VISIBILITY_INSIGHT_TYPES.includes(v); }
