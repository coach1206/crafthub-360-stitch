/**
 * SmokeCraft Route Contract
 * Defines route ownership for the SmokeCraft Experience Module.
 * These routes already exist in the app — this contract registers them
 * in the NOVEE OS module system without duplicating or modifying them.
 */

export const SMOKECRAFT_ROUTES = [
  { routeId: 'smokecraft-entry',           path: '/smokecraft',                  label: 'Entry Gate',               guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-identity',        path: '/smokecraft/identity',          label: 'SmokeCraft Identity',      guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-golden-box',      path: '/smokecraft/golden-box',        label: 'Golden Box Rules',         guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-mentor',          path: '/smokecraft/mentor-selection',  label: 'Mentor Selection',         guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-seed-soil',       path: '/smokecraft/seed-soil',         label: 'Seed & Soil',              guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-humidor-match',   path: '/smokecraft/humidor-match',     label: 'Humidor Match',            guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-request',         path: '/smokecraft/request-purchase',  label: 'Request / Purchase',       guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-cut',             path: '/smokecraft/cut-toast-light',   label: 'Cut / Toast / Light',      guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-first-third',     path: '/smokecraft/first-third',       label: 'First Third',              guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-second-third',    path: '/smokecraft/second-third',      label: 'Second Third',             guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-flavor-memory',   path: '/smokecraft/flavor-memory',     label: 'Flavor Memory',            guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-final-third',     path: '/smokecraft/final-third',       label: 'Final Third',              guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-scorecard',       path: '/smokecraft/scorecard',         label: 'Scorecard / Ranking',      guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-passport-stamp',  path: '/smokecraft/passport-stamp',    label: 'Passport Stamp',           guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-connections',     path: '/smokecraft/connections',       label: 'Passport Connections',     guarded: true,  existingRoute: true },
  { routeId: 'smokecraft-management-sync', path: '/smokecraft/management-sync',   label: 'Management Sync',          guarded: false, existingRoute: true },
  { routeId: 'smokecraft-session-complete',path: '/smokecraft/session-complete',  label: 'Session Complete',         guarded: true,  existingRoute: true },
]

/**
 * Returns the route contract entry for a given path.
 */
export function getRouteContract(path) {
  return SMOKECRAFT_ROUTES.find(r => r.path === path) ?? null
}

/**
 * Builds a route registry report for the NOVEE OS module system.
 */
export function buildSmokeCraftRouteRegistryReport() {
  return {
    moduleId: 'smokecraft-experience',
    totalRoutes: SMOKECRAFT_ROUTES.length,
    routes: SMOKECRAFT_ROUTES,
    registrationStatus: 'registered_preview',
    note: 'Routes already exist in the app. Registration is preview-only and does not remount or replace existing routes.',
    preview_only: true,
  }
}

export const ROUTE_CONTRACT_VERSION = '0.1.0'
