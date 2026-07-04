// POS360 Fulfillment KDS Routes — mounted at /api/pos360/fulfillment

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as c from '../controllers/pos360FulfillmentKdsController.js';

const router = Router();

// Stations
router.post('/stations', canAccessPOS3, c.createStationProfile);
router.get('/stations', c.listStationProfiles);
router.get('/stations/:stationId', c.getStationProfile);
router.patch('/stations/:stationId/status', canAccessPOS3, c.updateStationStatus);
router.post('/stations/:stationId/capabilities', canAccessPOS3, c.createStationCapability);
router.get('/station-capabilities', c.listStationCapabilities);

// Routing rules
router.post('/routing-rules', canAccessPOS3, c.createItemRoutingRule);
router.get('/routing-rules', c.listItemRoutingRules);
router.patch('/routing-rules/:routingRuleId', canAccessPOS3, c.updateItemRoutingRule);

// Production tickets
router.post('/tickets', canAccessPOS3, c.createProductionTicketPlaceholder);
router.get('/tickets', c.listProductionTickets);
router.get('/tickets/:ticketId', c.getProductionTicket);
router.patch('/tickets/:ticketId/status', canAccessPOS3, c.updateProductionTicketStatus);
router.post('/tickets/:ticketId/items', canAccessPOS3, c.createProductionTicketItem);
router.get('/tickets/:ticketId/items', c.listProductionTicketItems);
router.patch('/ticket-items/:ticketItemId/status', canAccessPOS3, c.updateProductionTicketItemStatus);

// KDS queue
router.post('/kds-queue', canAccessPOS3, c.createKdsQueueRecord);
router.get('/kds-queue', c.listKdsQueueRecords);
router.patch('/kds-queue/:queueRecordId/status', canAccessPOS3, c.updateKdsQueueStatus);
router.patch('/kds-queue/:queueRecordId/priority', canAccessPOS3, c.updateKdsQueuePriority);

// Course fire
router.post('/course-fire/:ticketId', canAccessPOS3, c.createCourseFireControl);
router.get('/course-fire', c.listCourseFireControls);
router.patch('/course-fire/:fireControlId/status', canAccessPOS3, c.updateCourseFireStatus);

// Station assignments
router.post('/station-assignments', canAccessPOS3, c.createStationStaffAssignment);
router.get('/station-assignments', c.listStationStaffAssignments);

// Handoffs
router.post('/handoffs', canAccessPOS3, c.createProductionHandoff);
router.get('/handoffs', c.listProductionHandoffs);
router.patch('/handoffs/:handoffId/status', canAccessPOS3, c.updateProductionHandoffStatus);

// Item unavailable
router.post('/item-unavailable', canAccessPOS3, c.createItemUnavailableRecord);
router.get('/item-unavailable', c.listItemUnavailableRecords);

// Manager overrides
router.post('/manager-overrides', canAccessPOS3, c.createProductionManagerOverride);
router.post('/manager-overrides/:overrideId/decision', canAccessPOS3, c.decideProductionManagerOverride);

// Refires
router.post('/refires', canAccessPOS3, c.createProductionRefire);
router.get('/refires', c.listProductionRefires);

// Rush / delay
router.post('/rush-delay', canAccessPOS3, c.createProductionRushDelay);
router.get('/rush-delay', c.listProductionRushDelayRecords);

// Guest self-order handoffs
router.post('/guest-self-order-handoffs', canAccessPOS3, c.createGuestSelfOrderHandoffPlaceholder);
router.get('/guest-self-order-handoffs', c.listGuestSelfOrderHandoffs);

// Server order handoffs
router.post('/server-order-handoffs', canAccessPOS3, c.createServerOrderHandoffPlaceholder);
router.get('/server-order-handoffs', c.listServerOrderHandoffs);

// Humidor fulfillment
router.post('/humidor', canAccessPOS3, c.createHumidorFulfillmentRecord);
router.get('/humidor', c.listHumidorFulfillmentRecords);
router.patch('/humidor/:humidorFulfillmentId/status', canAccessPOS3, c.updateHumidorFulfillmentStatus);

// Bar fulfillment
router.post('/bar', canAccessPOS3, c.createBarFulfillmentRecord);
router.get('/bar', c.listBarFulfillmentRecords);
router.patch('/bar/:barFulfillmentId/status', canAccessPOS3, c.updateBarFulfillmentStatus);

// Kitchen fulfillment
router.post('/kitchen', canAccessPOS3, c.createKitchenFulfillmentRecord);
router.get('/kitchen', c.listKitchenFulfillmentRecords);
router.patch('/kitchen/:kitchenFulfillmentId/status', canAccessPOS3, c.updateKitchenFulfillmentStatus);

// External KDS providers
router.post('/external-kds-providers', canAccessPOS3, c.createExternalKdsProviderProfile);
router.get('/external-kds-providers', c.listExternalKdsProviderProfiles);
router.patch('/external-kds-providers/:providerProfileId/status', canAccessPOS3, c.updateExternalKdsProviderStatus);

// Visibility / operations summary
router.post('/visibility-insights', canAccessPOS3, c.createProductionVisibilityInsightPlaceholder);
router.get('/visibility-insights', c.listProductionVisibilityInsights);
router.get('/operations-summary', c.getProductionOperationsSummary);

// Offline queue
router.post('/offline-queue', c.queueOfflineProductionAction);
router.get('/offline-queue', c.listOfflineProductionQueue);
router.post('/offline-queue/:offlineActionId/synced', canAccessPOS3, c.markOfflineProductionActionSynced);

export default router;
