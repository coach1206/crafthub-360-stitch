// CraftHub Dashboard Routes — Phase C.5
// platformAdminGuardRequired = true on write/admin routes

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/craftHubDashboardController.js';

const router = Router();

// Dashboard overview
router.get('/overview',                                          ctrl.getDashboard);
router.get('/stats/:tenantId',                                   ctrl.getDashboardStats);

// Sessions
router.get('/sessions/:tenantId',                                ctrl.getDashboardSessions);
router.post('/sessions/:tenantId',                               ctrl.createDashboardSession);

// Module launcher
router.get('/modules/:tenantId',                                 ctrl.getModuleLauncher);
router.post('/modules/:tenantId/install',      canAccessPOS3,   ctrl.installModule);
router.post('/modules/:tenantId/activate',     canAccessPOS3,   ctrl.activateModule);

// Navigation shell
router.get('/shell/:tenantId',                                   ctrl.getNavShellConfig);
router.put('/shell/:tenantId',                 canAccessPOS3,   ctrl.updateNavShellConfig);

// Premium experience hub
router.get('/premium/:tenantId',                                 ctrl.getPremiumHub);

// Widgets
router.get('/widgets/:tenantId/:userId',                         ctrl.getWidgets);
router.post('/widgets/:tenantId/:userId',                        ctrl.addWidget);
router.delete('/widgets/:tenantId/:userId/:widgetId',            ctrl.removeWidget);

// Roadmap
router.get('/roadmap',                                           ctrl.getRoadmap);

// Marketplace
router.get('/marketplace',                                       ctrl.getMarketplace);
router.post('/marketplace/:tenantId/purchase', canAccessPOS3,   ctrl.initiatePurchase);
router.get('/marketplace/:tenantId/purchases',                   ctrl.getPurchases);

// Quick actions
router.get('/quick-actions/:tenantId',                           ctrl.getQuickActions);
router.post('/quick-actions/:tenantId/trigger',                  ctrl.triggerQuickAction);

// Activity feed
router.get('/activity/:tenantId',                                ctrl.getActivityFeed);

// Notifications
router.get('/notifications/:tenantId/:userId',                   ctrl.getNotifications);
router.patch('/notifications/:tenantId/:userId/:notifId/dismiss', ctrl.dismissNotification);

// Onboarding
router.get('/onboarding/:tenantId/:userId',                      ctrl.getOnboarding);
router.post('/onboarding/:tenantId/:userId/step',                ctrl.completeOnboardingStep);

// Announcements
router.get('/announcements',                                     ctrl.getAnnouncements);

// Health checks
router.get('/health-checks/:tenantId',                           ctrl.getHealthChecks);

// Feature flag overrides
router.get('/feature-flags/:tenantId',                           ctrl.getFeatureFlagOverrides);
router.post('/feature-flags/:tenantId',        canAccessPOS3,   ctrl.setFeatureFlagOverride);

// User preferences
router.get('/preferences/:userId',                               ctrl.getUserPreferences);
router.put('/preferences/:userId',                               ctrl.updateUserPreferences);

// Entitlements
router.get('/entitlements/:tenantId',                            ctrl.getEntitlements);
router.post('/entitlements/:tenantId',         canAccessPOS3,   ctrl.grantEntitlement);

// Audit log
router.get('/audit/:tenantId',                 canAccessPOS3,   ctrl.getAuditLog);

// API keys
router.get('/api-keys/:tenantId',                                ctrl.getApiKeys);
router.post('/api-keys/:tenantId',             canAccessPOS3,   ctrl.createApiKey);
router.delete('/api-keys/:tenantId/:keyId',    canAccessPOS3,   ctrl.revokeApiKey);

// Integration connectors
router.get('/connectors/:tenantId',                              ctrl.getConnectors);
router.post('/connectors/:tenantId/connect',   canAccessPOS3,   ctrl.connectIntegration);
router.post('/connectors/:tenantId/disconnect', canAccessPOS3,  ctrl.disconnectIntegration);

// Platform health
router.get('/platform-health',                                   ctrl.getPlatformHealth);

// Search
router.get('/search/:tenantId',                                  ctrl.getSearchResults);

export default router;
