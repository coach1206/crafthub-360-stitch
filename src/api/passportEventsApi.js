import { PASSPORT_EVENTS } from '../data/passportEvents.js'

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

let _events = PASSPORT_EVENTS.map(e => ({ ...e }))

export async function getPassportEvents() {
  await delay(80)
  return _events.map(e => ({ ...e }))
}

export async function getPassportEventById(id) {
  await delay(60)
  return _events.find(e => e.id === id) || null
}

export async function filterPassportEvents(filter) {
  await delay(60)
  if (!filter || filter === 'all') return _events.map(e => ({ ...e }))
  return _events.filter(e => {
    if (filter === 'featured')   return e.types.includes('featured')
    if (filter === 'vip')        return e.types.includes('vip')
    if (filter === 'craft')      return e.types.includes('craft')
    if (filter === 'networking') return e.types.includes('networking')
    if (filter === 'attending')  return e.rsvpStatus === 'attending'
    return true
  })
}

export async function attendEvent(id) {
  await delay(700)
  const e = _events.find(ev => ev.id === id)
  if (!e) throw new Error('Event not found')
  if (e.rsvpStatus === 'soldout') throw new Error('Event is sold out')
  const was = e.rsvpStatus
  e.rsvpStatus = was === 'attending' ? 'none' : 'attending'
  if (e.rsvpStatus === 'attending' && e.attendees < e.capacity) {
    e.attendees += 1
    e.fillPct = Math.round((e.attendees / e.capacity) * 100)
  }
  return { success: true, status: e.rsvpStatus, event: { ...e } }
}

export async function requestVipAccess(id, reason) {
  await delay(900)
  if (!reason || reason.trim().length < 10) throw new Error('Please provide a reason (at least 10 characters).')
  return { success: true, message: 'VIP access request submitted. You will be notified within 24 hours.', requestId: `vip-${id}-${Date.now()}` }
}

export async function scanEventQr(qrPayload) {
  await delay(1000)
  const event = _events[Math.floor(Math.random() * _events.length)]
  return { success: true, eventFound: true, event: { ...event }, checkedIn: true }
}

export async function unlockEventStamp(id) {
  await delay(600)
  const e = _events.find(ev => ev.id === id)
  return { success: true, stamp: `+${e?.stamps || 1} Passport Stamps`, eventId: id }
}

export async function getCraftInfo(eventId) {
  await delay(80)
  const e = _events.find(ev => ev.id === eventId)
  return { eventId, craftHighlights: ['Expert-guided experience', 'Collector stamp awarded', 'Verified attendees only'], event: e }
}

export async function getNetworkingInfo(eventId) {
  await delay(80)
  const e = _events.find(ev => ev.id === eventId)
  return { eventId, networkingHighlights: ['Passport scan check-in', 'Curated introductions', 'Post-event connections unlocked'], event: e }
}

export async function getVipAccessInfo(eventId) {
  await delay(80)
  const e = _events.find(ev => ev.id === eventId)
  return { eventId, vipBenefits: ['Priority seating', 'Exclusive stamp', 'Host introduction'], requiresInvite: true, event: e }
}
