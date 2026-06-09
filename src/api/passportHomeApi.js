/**
 * Passport Home API — fetches dashboard data.
 * Replace delay() bodies with fetch() calls when the backend is ready.
 */

import { PASSPORT_PROFILE } from '../data/passportProfile.js'
import { STAMPS } from '../data/stamps.js'
import { BENEFITS } from '../data/benefits.js'
import { RECENT_ACTIVITY } from '../data/recentActivity.js'

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

export async function getPassportProfile() {
  await delay(80)
  return { ...PASSPORT_PROFILE }
}

export async function getDigitalStamps() {
  await delay(100)
  return STAMPS
}

export async function getBenefits() {
  await delay(100)
  return BENEFITS
}

export async function getRecentActivity() {
  await delay(80)
  return RECENT_ACTIVITY
}

export async function getUpcomingEvents() {
  await delay(100)
  return [
    {
      id: 'event-cigar-cognac',
      name: 'Cigar & Cognac Collectors Night',
      venue: 'Grand Lounge',
      city: 'NY',
      date: 'Jun 14',
      time: '7:00 PM',
      attendeeCount: 48,
      capacity: 60,
      fillPct: 80,
      stampId: 'stamp-collector-night',
      rsvpd: true,
    },
    {
      id: 'event-capital-culture',
      name: 'Capital & Culture Private Dinner',
      venue: 'The Bottle House',
      city: 'ATL',
      date: 'Jun 22',
      time: '6:30 PM',
      attendeeCount: 32,
      capacity: 40,
      fillPct: 82,
      stampId: 'stamp-vip-dinner',
      rsvpd: false,
    },
  ]
}

export async function rsvpToEvent(eventId) {
  await delay(800)
  return { success: true, eventId, rsvpdAt: new Date().toISOString() }
}

export async function getDashboardSummary() {
  await delay(150)
  return {
    profile: PASSPORT_PROFILE,
    stamps: STAMPS,
    activity: RECENT_ACTIVITY,
  }
}
