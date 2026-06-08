/**
 * Seed Prototype Users — Development Only
 *
 * Creates demo system users + auth credentials for testing all role levels.
 * NEVER runs in production.
 * NEVER prints PINs or founder challenge to logs after initial seed.
 *
 * Dev credentials (printed once on first seed):
 *   staff    — PIN: 1234
 *   manager  — PIN: 5678
 *   admin    — admin@novee.dev / PIN: 9999
 *   founder  — founder@novee.dev / PIN: 0000 / challenge: FOUNDER_CHALLENGE_SECRET env var
 */

import bcrypt from 'bcrypt'
import { isDbAvailable, query } from '../connection.js'

const SALT_ROUNDS = 10

const DEMO_USERS = [
  {
    user_id:      'staff-demo-001',
    display_name: 'Demo Staff',
    role:         'staff',
    status:       'active',
    email:        'staff@novee.dev',
    pin:          '1234',
    type:         'pin',
  },
  {
    user_id:      'manager-demo-001',
    display_name: 'Demo Manager',
    role:         'manager',
    status:       'active',
    email:        'manager@novee.dev',
    pin:          '5678',
    type:         'email_pin',
  },
  {
    user_id:      'admin-demo-001',
    display_name: 'Demo Admin',
    role:         'admin',
    status:       'active',
    email:        'admin@novee.dev',
    pin:          '9999',
    type:         'email_pin',
  },
  {
    user_id:      'founder-demo-001',
    display_name: 'Demo Founder',
    role:         'founder_level_0',
    status:       'active',
    email:        'founder@novee.dev',
    pin:          '0000',
    type:         'founder_challenge',
  },
]

export async function seedPrototypeUsers() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[seed] Skipping prototype user seed in production.')
    return
  }

  if (!isDbAvailable()) {
    console.warn('[seed] Database not available — skipping prototype user seed.')
    return
  }

  // Check if already seeded
  try {
    const check = await query(
      `SELECT COUNT(*) AS cnt FROM system_users WHERE user_id = ANY($1)`,
      [DEMO_USERS.map(u => u.user_id)]
    )
    if (parseInt(check.rows[0]?.cnt, 10) >= DEMO_USERS.length) {
      return  // Already seeded — no output
    }
  } catch { return }

  console.log('\n[seed] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('[seed]  Prototype auth users seeded for development only.')
  console.log('[seed]  These credentials DO NOT exist in production.')
  console.log('[seed] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const founderChallenge = process.env.FOUNDER_CHALLENGE_SECRET
  if (!founderChallenge) {
    console.warn('[seed] ⚠  FOUNDER_CHALLENGE_SECRET not set — founder demo login will fail.')
    console.warn('[seed]    Add FOUNDER_CHALLENGE_SECRET=<any-string> to your .env file.')
  }

  for (const u of DEMO_USERS) {
    try {
      // Upsert system_user
      await query(
        `INSERT INTO system_users (user_id, email, display_name, role, status)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id) DO NOTHING`,
        [u.user_id, u.email, u.display_name, u.role, u.status]
      )

      // Hash PIN
      const pinHash = await bcrypt.hash(String(u.pin), SALT_ROUNDS)

      // Hash founder secret if applicable
      let founderHash = null
      if (u.type === 'founder_challenge' && founderChallenge) {
        founderHash = await bcrypt.hash(founderChallenge.trim(), SALT_ROUNDS)
      }

      // Upsert credentials
      await query(
        `INSERT INTO auth_credentials
           (user_id, credential_type, pin_hash, founder_secret_hash)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id) DO NOTHING`,
        [u.user_id, u.type, pinHash, founderHash]
      )

      if (u.role !== 'founder_level_0') {
        console.log(`[seed]  ${u.role.padEnd(16)} ${u.display_name.padEnd(16)} email: ${u.email}  PIN: ${u.pin}`)
      } else {
        console.log(`[seed]  founder_level_0  ${u.display_name}  email: ${u.email}  PIN: ${u.pin}  challenge: [set FOUNDER_CHALLENGE_SECRET env var]`)
      }
    } catch (err) {
      console.warn(`[seed] Failed to seed ${u.user_id}:`, err.message)
    }
  }

  console.log('[seed] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}
