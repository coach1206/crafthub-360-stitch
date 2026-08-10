/**
 * SmokeCraft Database Schema Contract
 * Documents the database schema for SmokeCraft persistence areas.
 */

export const SMOKECRAFT_TABLES = [
  { table: 'smokecraft_orders',                area: 'orders',                    migration: '029' },
  { table: 'smokecraft_order_audit',           area: 'order_audit',               migration: '029' },
  { table: 'smokecraft_staff_queue',           area: 'staff_queue',               migration: '029' },
  { table: 'smokecraft_venue_menu',            area: 'venue_menu',                migration: '029' },
  { table: 'smokecraft_pairing_profiles',      area: 'pairing_profiles',          migration: '029' },
  { table: 'smokecraft_pairing_recommendations', area: 'pairing_recommendations', migration: '029' },
  { table: 'smokecraft_pairing_audit',         area: 'pairing_audit',             migration: '029' },
  { table: 'smokecraft_flavor_memory',         area: 'flavor_memory',             migration: '029' },
  { table: 'smokecraft_rewards',               area: 'rewards',                   migration: '029' },
  { table: 'smokecraft_reward_audit',          area: 'reward_audit',              migration: '029' },
  { table: 'smokecraft_loyalty_records',       area: 'loyalty',                   migration: '029' },
  { table: 'smokecraft_passport_rewards',      area: 'passport_rewards',          migration: '029' },
  { table: 'smokecraft_venue_admin',           area: 'venue_admin',               migration: '029' },
  { table: 'smokecraft_analytics_snapshots',   area: 'analytics_snapshots',       migration: '029' },
  { table: 'smokecraft_sync_events',           area: 'integration_sync_events',   migration: '029' },
  { table: 'smokecraft_connector_audit',       area: 'connector_audit',           migration: '029' },
  { table: 'smokecraft_governance_audit',      area: 'enterprise_governance_audit', migration: '029' },
  { table: 'smokecraft_persistence_audit',     area: 'persistence_audit',         migration: '029' },
]

export const SCHEMA_CONTRACT_VERSION = '1.0.0-phase-a'
export const MIGRATION_FILE          = '029_smokecraft_persistence_hardening.sql'
export const MIGRATION_COMMAND       = 'npm run db:migrate'
export const SCHEMA_SAFE_TO_RERUN   = true
export const DROPS_DATA             = false
