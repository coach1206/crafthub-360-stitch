import { getAllConnections, findConnection } from '../data/connectionsData.js'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getConnections() {
  await delay(120)
  return getAllConnections()
}

export async function getConnectionById(id) {
  await delay(80)
  return findConnection(id)
}

export async function verifyConnection(id) {
  await delay(1400)
  const person = findConnection(id)
  if (!person) throw new Error('Connection not found')
  return {
    success: true,
    status: 'verified',
    stamp: 'Verified Introduction',
    passportUpdated: true,
    person,
    verifiedAt: new Date().toISOString(),
  }
}

export async function scanConnection(qrPayload) {
  await delay(900)
  const all = getAllConnections()
  const person = all[Math.floor(Math.random() * all.length)]
  return {
    success: true,
    matchFound: true,
    person,
    scanId: `scan-${Date.now()}`,
  }
}

export async function getPassport(id) {
  await delay(100)
  const person = findConnection(id)
  return {
    owner: person,
    passportId: `360-PP-${id?.toUpperCase().replace(/-/g, '')}`,
    tier: 'Aficionado',
    stamps: [
      { label: 'Verified Introduction', date: 'Jun 8, 2026', event: 'Grand Opening Night' },
      { label: 'Connection Stamp',      date: 'Jun 14, 2026', event: 'Cigar & Cognac Night' },
    ],
    relationshipValue: 'High',
    status: 'Active',
  }
}

export async function updatePassportStamp(id, stamp) {
  await delay(600)
  return { success: true, stampAdded: stamp, passportId: `360-PP-${id}` }
}
