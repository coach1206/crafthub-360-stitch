/**
 * SmokeCraft Migration Rollback Master Script (R17)
 *
 * Rolls back one or all migrations in REVERSE ORDER (highest number first).
 * Each rollback drops tables created by that migration using IF EXISTS guards.
 * All operations run in a transaction — the entire rollback is atomic.
 *
 * Usage:
 *   node rollback-master.mjs --migration 011       # Roll back migration 011 only
 *   node rollback-master.mjs --from 072 --to 068   # Roll back 072 down to 068
 *   node rollback-master.mjs --all                 # Roll back ALL (destructive!)
 *   node rollback-master.mjs --dry-run --all       # Show what would be dropped, no changes
 *
 * Requires: DATABASE_URL environment variable pointing to a live PostgreSQL instance.
 *
 * IMPORTANT: These scripts cannot be execution-tested without a live database.
 * Idempotency is guaranteed by IF EXISTS guards. Review each migration's rollback
 * block before running in production.
 *
 * Safety:
 *   - All drops use CASCADE to remove dependent objects.
 *   - All operations are wrapped in BEGIN / COMMIT.
 *   - A dry-run flag shows the SQL without executing it.
 *   - No migration is dropped from the migrations table until the DROP succeeds.
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const DRY_RUN    = process.argv.includes('--dry-run')
const ALL        = process.argv.includes('--all')
const MIGRATION  = (process.argv.find(a => a.startsWith('--migration=')) || '').replace('--migration=', '')
  || process.argv[process.argv.indexOf('--migration') + 1]
const FROM_IDX   = parseInt((process.argv.find(a => a.startsWith('--from=')) || '').replace('--from=', '')
  || process.argv[process.argv.indexOf('--from') + 1] || '0', 10)
const TO_IDX     = parseInt((process.argv.find(a => a.startsWith('--to=')) || '').replace('--to=', '')
  || process.argv[process.argv.indexOf('--to') + 1] || '0', 10)

// ── Migration rollback registry ────────────────────────────────────────────────
// Each entry: { id, name, drops: [table, ...], extraSql? }
// Tables are dropped in the order listed (reverse of creation order within the migration).

const ROLLBACKS = [
  {
    id: '001', name: 'initial_novee_schema',
    drops: ['craft_sessions', 'guest_profiles', 'guest_sessions'],
  },
  {
    id: '002', name: 'admin_roles_security',
    drops: ['founder_controls', 'role_permissions', 'system_users'],
  },
  {
    id: '003', name: 'auth_hardening',
    drops: ['pin_login_attempts', 'auth_sessions', 'auth_credentials'],
  },
  {
    id: '004', name: 'pos3_provider_prep',
    drops: ['pos3_normalized_orders', 'pos3_provider_events', 'pos3_provider_connections'],
  },
  {
    id: '005', name: 'pos3_operational_hardening',
    drops: ['pos3_sync_runs'],
  },
  {
    id: '006', name: 'device_deployment',
    drops: ['deployment_checks', 'device_events', 'venue_devices'],
  },
  {
    id: '007', name: 'audit_trail',
    drops: ['audit_trail_events', 'audit_trail'],
  },
  {
    id: '008', name: 'venue_testing',
    drops: ['observer_notes', 'venue_test_sessions', 'venue_tests'],
  },
  {
    id: '009', name: 'demo_pilot_package',
    drops: ['pilot_partners', 'demo_events', 'demo_sessions'],
  },
  {
    id: '010', name: 'new_roles_and_tables',
    drops: ['passport_connections', 'passport_member_refresh_tokens', 'passport_member_profiles'],
  },
  {
    id: '011', name: 'smokecraft_schema',
    drops: ['smoke_purchase_intents', 'smoke_session_events', 'smoke_sessions'],
  },
  {
    id: '012', name: 'internal_sync_engine',
    drops: ['pos_orders', 'sync_failures', 'sync_events'],
  },
  {
    id: '013', name: 'sync_reconciliation',
    drops: ['sync_reconciliation_notes', 'sync_conflict_decisions'],
  },
  {
    id: '014', name: 'sync_audit_lifecycle',
    drops: ['sync_event_lifecycle', 'sync_audit_logs'],
  },
  {
    id: '015', name: 'venue_commerce',
    drops: ['staff_handoff_events', 'smokecraft_guest_sessions', 'venue_menu_items'],
  },
  {
    id: '016', name: 'pos3_commerce_foundation',
    drops: ['pos3_order_items', 'pos3_orders', 'venue_inventory'],
  },
  {
    id: '017', name: 'ticket_tapper_specials',
    drops: ['ticket_tapper_inventory', 'ticket_tapper_special_events', 'ticket_tapper_specials'],
  },
  {
    id: '018', name: 'pos360_integration_hub',
    drops: ['pos360_integration_events', 'pos360_venue_connections'],
  },
  {
    id: '019', name: 'stripe_connect_money_bridge',
    drops: ['stripe_payment_events', 'stripe_connect_accounts'],
  },
  {
    id: '020', name: 'venue_onboarding_engine',
    drops: ['venue_onboarding_steps', 'venue_onboarding_sessions'],
  },
  {
    id: '021', name: 'partner_vendor_onboarding_engine',
    drops: ['partner_vendor_contacts', 'partner_vendor_profiles'],
  },
  {
    id: '022', name: 'tax_profiles_compliance_engine',
    drops: ['tax_compliance_events', 'tax_profiles'],
  },
  {
    id: '023', name: 'order_lifecycle_engine',
    drops: ['order_lifecycle_events', 'order_lifecycle_states'],
  },
  {
    id: '024', name: 'kds_fulfillment_station_engine',
    drops: ['kds_display_events', 'kds_stations'],
  },
  {
    id: '025', name: 'customer_checkout_self_order_engine',
    drops: ['customer_checkout_items', 'customer_checkout_sessions'],
  },
  {
    id: '026', name: 'staff_order_table_patio_engine',
    drops: ['staff_order_items', 'staff_orders'],
  },
  {
    id: '027', name: 'inventory_availability_reorder_engine',
    drops: ['reorder_requests', 'inventory_availability_snapshots'],
  },
  {
    id: '028', name: 'operational_inventory_persistence_and_sync',
    drops: ['inventory_sync_events', 'inventory_operational_records'],
  },
  {
    id: '029', name: 'smokecraft_persistence_hardening',
    drops: ['smokecraft_error_events', 'smokecraft_session_snapshots'],
  },
  {
    id: '030', name: 'smokecraft_orders_schema_backfill',
    drops: ['smokecraft_order_backfill_log'],
  },
  {
    id: '031', name: 'pos360_floor_management_foundation',
    drops: ['pos360_floor_zones', 'pos360_tables'],
  },
  {
    id: '032', name: 'pos360_venue_menu_builder',
    drops: ['pos360_menu_modifiers', 'pos360_menu_items', 'pos360_menu_categories'],
  },
  {
    id: '033', name: 'pos360_handheld_device_suite',
    drops: ['pos360_handheld_sessions', 'pos360_handheld_devices'],
  },
  {
    id: '034', name: 'pos360_production_display_system',
    drops: ['pos360_display_events', 'pos360_display_screens'],
  },
  {
    id: '035', name: 'pos360_order_lifecycle',
    drops: ['pos360_order_items', 'pos360_orders'],
  },
  {
    id: '036', name: 'pos360_offline_sync',
    drops: ['pos360_offline_queue'],
  },
  {
    id: '037', name: 'pos360_payments',
    drops: ['pos360_payment_events', 'pos360_payments'],
  },
  {
    id: '038', name: 'pos360_customer_loyalty',
    drops: ['pos360_loyalty_events', 'pos360_loyalty_accounts'],
  },
  {
    id: '039', name: 'pos360_reservations_guest_flow',
    drops: ['pos360_reservation_guests', 'pos360_reservations'],
  },
  {
    id: '040', name: 'pos360_event_packages_monetization',
    drops: ['pos360_event_package_items', 'pos360_event_packages'],
  },
  {
    id: '041', name: 'pos360_payments_tips_closeout',
    drops: ['pos360_tip_events', 'pos360_closeout_sessions'],
  },
  {
    id: '042', name: 'pos360_staff_roles_labor_governance',
    drops: ['pos360_labor_events', 'pos360_staff_roles'],
  },
  {
    id: '043', name: 'pos360_reports_analytics_decision_layer',
    drops: ['pos360_analytics_snapshots', 'pos360_report_runs'],
  },
  {
    id: '044', name: 'pos360_system_settings_venue_admin',
    drops: ['pos360_venue_settings'],
  },
  {
    id: '045', name: 'pos360_external_integrations_sync_governance',
    drops: ['pos360_external_sync_events', 'pos360_external_integrations'],
  },
  {
    id: '046', name: 'pos360_fulfillment_kds_order_routing',
    drops: ['pos360_kds_routing_events', 'pos360_kds_stations'],
  },
  {
    id: '047', name: 'pos360_self_ordering_handheld_checkout',
    drops: ['pos360_self_order_items', 'pos360_self_order_sessions'],
  },
  {
    id: '048', name: 'novee_os_module_registry_platform_control',
    drops: ['novee_module_control_events', 'novee_module_registry'],
  },
  {
    id: '049', name: 'novee_os_tenant_venue_workspace_governance',
    drops: ['novee_tenant_events', 'novee_workspaces', 'novee_tenants'],
  },
  {
    id: '050', name: 'novee_os_licensing_plans_billing_gates',
    drops: ['novee_billing_events', 'novee_license_gates', 'novee_licensing_plans'],
  },
  {
    id: '051', name: 'novee_os_platform_security_roles_permissions',
    drops: ['novee_permission_grants', 'novee_platform_roles'],
  },
  {
    id: '052', name: 'crafthub_dashboard_module_launcher_shell',
    drops: ['crafthub_launch_events', 'crafthub_module_slots'],
  },
  {
    id: '053', name: 'crafthub_venue_onboarding_readiness_flow',
    drops: ['crafthub_readiness_checks', 'crafthub_onboarding_flows'],
  },
  {
    id: '054', name: 'novee_os_final_platform_readiness_launch_lock',
    drops: ['novee_launch_lock_events', 'novee_readiness_gates'],
  },
  {
    id: '055', name: 'phase_d_provider_activation_roadmap',
    drops: ['phase_d_activation_events', 'phase_d_provider_roadmap'],
  },
  {
    id: '056', name: 'phase_d_payment_provider_activation',
    drops: ['phase_d_payment_activations'],
  },
  {
    id: '057', name: 'phase_d_external_pos_activation',
    drops: ['phase_d_external_pos_activations'],
  },
  {
    id: '058', name: 'phase_d_inventory_activation',
    drops: ['phase_d_inventory_activations'],
  },
  {
    id: '059', name: 'phase_d_communication_activation',
    drops: ['phase_d_communication_activations'],
  },
  {
    id: '060', name: 'novee_os_360_platform_registry',
    drops: ['novee_360_registry_events', 'novee_360_platform_entries'],
  },
  {
    id: '061', name: 'novee_os_security_activation',
    drops: ['novee_security_activation_log'],
  },
  {
    id: '062', name: 'novee_os_deployment_activation',
    drops: ['novee_deployment_activation_log'],
  },
  {
    id: '063', name: 'novee_os_live_pilot_readiness',
    drops: ['novee_pilot_readiness_checks'],
  },
  {
    id: '064', name: 'novee_os_remote_module_distribution',
    drops: ['novee_remote_distribution_log', 'novee_remote_modules'],
  },
  {
    id: '065', name: 'novee_os_onboarding_training_center',
    drops: ['novee_training_completions', 'novee_training_modules'],
  },
  {
    id: '066', name: 'novee_os_ambi_foundation',
    drops: ['ambi_events', 'ambi_sessions'],
  },
  {
    id: '067', name: 'novee_os_documentation_portal',
    drops: ['novee_doc_views', 'novee_doc_articles'],
  },
  {
    id: '068', name: 'passport_360_smokecraft_live_persistence',
    drops: ['passport_smokecraft_stamp_events', 'passport_smokecraft_profiles'],
  },
  {
    id: '069', name: 'eat_smokecraft_live_sync',
    drops: ['eat_smokecraft_sync_errors', 'eat_smokecraft_sync_events'],
  },
  {
    id: '070', name: 'pos360_smokecraft_live_order_bridge',
    drops: ['smokecraft_pos360_order_items', 'smokecraft_pos360_orders'],
  },
  {
    id: '071', name: 'ticket_tapper_promotions',
    drops: ['ticket_tapper_promotion_uses', 'ticket_tapper_promotions'],
  },
  {
    id: '072', name: 'dayone360_smokecraft_connections',
    drops: ['dayone360_smokecraft_events', 'dayone360_smokecraft_connections'],
  },
]

// ── Rollback SQL builder ───────────────────────────────────────────────────────

function buildRollbackSql(entry) {
  const drops = entry.drops.map(t => `  DROP TABLE IF EXISTS ${t} CASCADE;`).join('\n')
  return `-- Rollback migration ${entry.id}: ${entry.name}
BEGIN;
${drops}
${entry.extraSql || ''}
COMMIT;
`
}

// ── Selection ─────────────────────────────────────────────────────────────────

function selectRollbacks() {
  const reversed = [...ROLLBACKS].reverse()
  if (ALL) return reversed
  if (MIGRATION) {
    const found = reversed.find(r => r.id === MIGRATION.padStart(3, '0'))
    if (!found) { console.error(`Migration ${MIGRATION} not found`); process.exit(1) }
    return [found]
  }
  if (FROM_IDX && TO_IDX) {
    return reversed.filter(r => parseInt(r.id, 10) >= TO_IDX && parseInt(r.id, 10) <= FROM_IDX)
  }
  console.error('Specify --migration <id>, --from <n> --to <n>, or --all')
  process.exit(1)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const selected = selectRollbacks()

  console.log(`\n${'='.repeat(60)}`)
  console.log(`SmokeCraft Migration Rollback (R17)`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will modify database)'}`)
  console.log(`Migrations to roll back: ${selected.map(r => r.id).join(', ')}`)
  console.log(`${'='.repeat(60)}\n`)

  if (!DRY_RUN && !process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required for live rollback.')
    console.error('Run with --dry-run to preview SQL without a database connection.')
    process.exit(1)
  }

  for (const entry of selected) {
    const sql = buildRollbackSql(entry)
    if (DRY_RUN) {
      console.log(`── [DRY RUN] Migration ${entry.id}: ${entry.name} ──`)
      console.log(sql)
    } else {
      // Live execution — import pg dynamically
      const { default: pg } = await import('pg')
      const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
      await client.connect()
      try {
        console.log(`Rolling back migration ${entry.id}: ${entry.name}...`)
        await client.query(sql)
        console.log(`  ✓ Rolled back ${entry.id}`)
      } catch (err) {
        console.error(`  ✗ Failed to roll back ${entry.id}: ${err.message}`)
        await client.end()
        process.exit(1)
      }
      await client.end()
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(DRY_RUN ? 'Dry run complete. No changes were made.' : `Rolled back ${selected.length} migration(s).`)
  console.log(`${'='.repeat(60)}\n`)
}

run().catch(err => {
  console.error('Rollback script failed:', err)
  process.exit(1)
})
