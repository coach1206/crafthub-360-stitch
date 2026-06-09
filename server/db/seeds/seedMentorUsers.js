/**
 * Seed — Prototype Human Mentor Users
 * Creates demonstration mentor accounts for development.
 * Only runs in non-production environments.
 *
 * Mentors are created by Admin only in production.
 * This seed is for prototype/dev mode only.
 */

import { isDbAvailable, query } from '../connection.js'
import { hashPin }              from '../../services/authService.js'

const PROTOTYPE_MENTORS = [
  {
    user_id:            'mentor-001',
    email:              'marcus.mentor@novee.dev',
    display_name:       'Marcus Cole',
    staff_id:           null,
    mentor_specialties: ['SmokeCraft', 'PourCraft', 'pairing'],
    pin:                '3001',
  },
  {
    user_id:            'mentor-002',
    email:              'diana.mentor@novee.dev',
    display_name:       'Diana Reeves',
    staff_id:           null,
    mentor_specialties: ['SmokeCraft', 'BeerCraft'],
    pin:                '3002',
  },
]

export async function seedMentorUsers() {
  if (process.env.NODE_ENV === 'production') return
  if (!isDbAvailable()) return

  for (const mentor of PROTOTYPE_MENTORS) {
    try {
      // Upsert system_users record
      await query(
        `INSERT INTO system_users
           (user_id, email, display_name, role, status, mentor_specialties)
         VALUES ($1,$2,$3,'human_mentor','active',$4)
         ON CONFLICT (user_id) DO UPDATE
           SET email             = EXCLUDED.email,
               display_name      = EXCLUDED.display_name,
               mentor_specialties = EXCLUDED.mentor_specialties,
               updated_at        = NOW()`,
        [
          mentor.user_id,
          mentor.email,
          mentor.display_name,
          JSON.stringify(mentor.mentor_specialties),
        ]
      )

      // Upsert auth_credentials
      const pinHash = await hashPin(mentor.pin)
      await query(
        `INSERT INTO auth_credentials
           (user_id, credential_type, pin_hash)
         VALUES ($1,'pin',$2)
         ON CONFLICT (user_id) DO UPDATE
           SET pin_hash   = EXCLUDED.pin_hash,
               updated_at = NOW()`,
        [mentor.user_id, pinHash]
      )

      console.log(`  ✓ Mentor seeded: ${mentor.display_name} (${mentor.email})`)
    } catch (err) {
      console.warn(`  ✗ Failed to seed mentor ${mentor.user_id}:`, err.message)
    }
  }
}
