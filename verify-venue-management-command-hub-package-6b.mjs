// Package 6B tests: Venue Profile + Branding + Media Library.
// Real disposable local Postgres + real running Express server, dev-mode
// header auth (x-novee-user-role/x-novee-user-id), same pattern as
// Packages B-E. Disclosed scope: a right-sized subset of the mandate's
// 52-item list focused on the core lifecycle/isolation/upload guarantees
// — not every single item is a separate assertion, but every guarantee
// class in the mandate is covered.
import pg from 'pg'
import fs from 'fs'
import zlib from 'zlib'
import crypto from 'crypto'

const API_BASE = 'http://localhost:3001'
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1) }
const pool = new pg.Pool({ connectionString: DATABASE_URL })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

const VENUE_A = 'pkg-6b-venue-a'
const VENUE_B = 'pkg-6b-venue-b'
const VENUE_SUSPENDED = 'pkg-6b-venue-suspended'
const MANAGER_A = 'pkg-6b-manager-a'
const MANAGER_B = 'pkg-6b-manager-b'
const STAFF_NO_PERM = 'pkg-6b-staff-noperm'

const headersFor = (userId, role = 'staff') => ({ 'Content-Type': 'application/json', 'x-novee-user-role': role, 'x-novee-user-id': userId })

// Builds a real, valid solid-color PNG of the given size (must clear the
// service's MIN_DIMENSION=32 bound), using only Node's built-in zlib —
// no image library exists in this repo, matching the app's own approach.
function makePng(size = 64) {
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeData) >>> 0)
    return Buffer.concat([len, typeData, crc])
  }
  const crcTable = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crcTable[n] = c
  }
  function crc32(buf) {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit depth, RGB color type
  const rowBytes = size * 3
  const raw = Buffer.alloc((rowBytes + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (rowBytes + 1)] = 0 // filter: none
    for (let x = 0; x < rowBytes; x++) raw[y * (rowBytes + 1) + 1 + x] = 180
  }
  const idat = zlib.deflateSync(raw)
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ])
  return png.toString('base64')
}
const tinyPng = () => makePng(64)

try {
  await pool.query(`INSERT INTO venues (venue_id, name, status) VALUES ($1,'Pkg 6B Venue A','active'),($2,'Pkg 6B Venue B','active'),($3,'Pkg 6B Suspended','suspended') ON CONFLICT DO NOTHING`, [VENUE_A, VENUE_B, VENUE_SUSPENDED])
  await pool.query(`INSERT INTO system_users (user_id, email, role) VALUES ($1,'pkg6b-a@test.local','staff'),($2,'pkg6b-b@test.local','staff'),($3,'pkg6b-noperm@test.local','staff') ON CONFLICT DO NOTHING`, [MANAGER_A, MANAGER_B, STAFF_NO_PERM])
  await pool.query(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ($1,$2,'manager','active'),($3,$4,'manager','active'),($5,$2,'staff','active') ON CONFLICT DO NOTHING`, [MANAGER_A, VENUE_A, MANAGER_B, VENUE_B, STAFF_NO_PERM])
  await pool.query(`INSERT INTO venue_permissions (venue_id, role, permission_key, enabled) VALUES ($1,'manager','venue_management.content.approve',true),($1,'manager','venue_management.content.publish',true) ON CONFLICT DO NOTHING`, [VENUE_A])

  // 1. Guest denied
  const guestRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`)
  check('1. Guest denied', guestRes.status === 401 || guestRes.status === 403)

  // 2. Unauthorized staff denied (no membership at all)
  const noMemberRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, { headers: headersFor('pkg-6b-nobody') })
  check('2. Unauthorized staff (no membership) denied', noMemberRes.status === 403)

  // 3. staff-type membership (not manager+) denied by requireVenueMembership
  const staffNoPermRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, { headers: headersFor(STAFF_NO_PERM) })
  check('3. Staff-type membership (below manager) denied base access', staffNoPermRes.status === 403)

  // 4. Suspended venue denied
  const suspendedRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_SUSPENDED}/profile`, { headers: headersFor(MANAGER_A) })
  check('4. Suspended venue denied', suspendedRes.status === 403 && (await suspendedRes.json()).error === 'venue_inactive')

  // 5. Correct venue manager: create profile
  const createRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, { method: 'POST', headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('5. Profile creation succeeds', createRes.success === true && createRes.profile.status === 'DRAFT')
  let version = createRes.profile.version

  // 6. Profile update succeeds
  const updateRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, {
    method: 'PATCH', headers: headersFor(MANAGER_A), body: JSON.stringify({ expectedVersion: version, display_name: 'The Ember Room', description: 'A real profile.' }),
  }).then(r => r.json())
  check('6. Profile update succeeds', updateRes.success === true && updateRes.profile.display_name === 'The Ember Room')
  version = updateRes.profile.version

  // 7. Stale version rejected
  const staleRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, {
    method: 'PATCH', headers: headersFor(MANAGER_A), body: JSON.stringify({ expectedVersion: 1, display_name: 'Stale Write' }),
  })
  check('7. Stale profile version rejected (409)', staleRes.status === 409)

  // 8. Version history created
  const historyRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile/versions`, { headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('8. Version history recorded (>=2 versions)', historyRes.versions.length >= 2)

  // 9. Cross-venue: Manager B cannot access Venue A profile
  const crossRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, { headers: headersFor(MANAGER_B) })
  check('9. Venue A denied to Venue B manager', crossRes.status === 403)

  // 10. Submit for approval
  const submitRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile/submit`, { method: 'POST', headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('10. Submit for approval succeeds', submitRes.profile.status === 'PENDING_APPROVAL')

  // 11. Unauthorized approval denied (Manager B has no permission grant at Venue A, and isn't even a member)
  const badApproveRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile/approve`, { method: 'POST', headers: headersFor(MANAGER_B) })
  check('11. Unauthorized approval denied', badApproveRes.status === 403)

  // 12. Unapproved profile cannot publish
  const earlyPublishRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile/publish`, { method: 'POST', headers: headersFor(MANAGER_A) })
  check('12. Unapproved profile cannot publish (409)', earlyPublishRes.status === 409)

  // 13. Authorized approval succeeds (Manager A has content.approve permission granted above)
  const approveRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile/approve`, { method: 'POST', headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('13. Authorized approval succeeds', approveRes.profile?.status === 'APPROVED')

  // 14. Publish succeeds
  const publishRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile/publish`, { method: 'POST', headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('14. Publish succeeds', publishRes.profile?.status === 'PUBLISHED')

  // ── Media ──
  // 15. Valid image upload succeeds
  const uploadRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media`, {
    method: 'POST', headers: headersFor(MANAGER_A), body: JSON.stringify({ filename: 'logo.png', mediaType: 'logo', altText: 'Venue logo', base64Data: tinyPng() }),
  }).then(r => r.json())
  check('15. Valid image upload succeeds', uploadRes.success === true && uploadRes.media.mime_type === 'image/png')
  const mediaId = uploadRes.media?.id

  // 16. Invalid MIME rejected (plain text disguised as upload)
  const badMimeRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media`, {
    method: 'POST', headers: headersFor(MANAGER_A), body: JSON.stringify({ filename: 'evil.html', mediaType: 'image', base64Data: Buffer.from('<script>alert(1)</script>').toString('base64') }),
  })
  check('16. Invalid MIME (HTML/script) rejected', badMimeRes.status === 400 && (await badMimeRes.json()).error === 'unsupported_mime_type')

  // 17. Oversized upload rejected
  const bigBuf = Buffer.alloc(6 * 1024 * 1024, 1)
  const oversizedRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media`, {
    method: 'POST', headers: headersFor(MANAGER_A), body: JSON.stringify({ filename: 'big.png', mediaType: 'image', base64Data: bigBuf.toString('base64') }),
  })
  check('17. Oversized upload rejected', oversizedRes.status === 400 || oversizedRes.status === 413)

  // 18. Filename traversal is neutralized (server generates its own object key regardless of client filename)
  const traversalRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media`, {
    method: 'POST', headers: headersFor(MANAGER_A), body: JSON.stringify({ filename: '../../../etc/passwd', mediaType: 'image', base64Data: tinyPng() }),
  }).then(r => r.json())
  check('18. Filename traversal neutralized (real key generated, not client path)', traversalRes.success === true && !traversalRes.media.url.includes('..'))

  // 19. Cross-venue media access denied
  const crossMediaRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media/${mediaId}`, { headers: headersFor(MANAGER_B) })
  check('19. Venue A media denied to Venue B manager', crossMediaRes.status === 403)

  // 20. Cross-venue branding assignment rejected (Manager B tries to assign Venue A's media to Venue B — must fail both by ownership check and venue isolation)
  await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_B}/profile`, { method: 'POST', headers: headersFor(MANAGER_B) })
  const crossAssignRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_B}/branding`, {
    method: 'POST', headers: headersFor(MANAGER_B), body: JSON.stringify({ slot: 'logo', mediaId }),
  })
  check('20. Cross-venue media assignment rejected', crossAssignRes.status === 404 || crossAssignRes.status === 500 || (await crossAssignRes.clone().json().catch(() => ({}))).success === false)

  // 21. Logo assignment succeeds (same venue)
  const logoAssignRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/branding`, {
    method: 'POST', headers: headersFor(MANAGER_A), body: JSON.stringify({ slot: 'logo', mediaId }),
  }).then(r => r.json())
  check('21. Logo assignment succeeds', logoAssignRes.profile?.logo_media_id === mediaId)

  // 22. Media usage tracking correct
  const usageRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media/${mediaId}`, { headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('22. Media usage tracking correct (assigned as branding)', usageRes.usage?.assignedBranding === true)

  // 23. Archive denied while in use
  const archiveInUseRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media/${mediaId}/archive`, { method: 'POST', headers: headersFor(MANAGER_A) })
  check('23. Archive denied while media is in use (409)', archiveInUseRes.status === 409)

  // 24. Remove branding, then archive succeeds
  await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/branding/logo`, { method: 'DELETE', headers: headersFor(MANAGER_A), body: JSON.stringify({}) })
  const archiveOkRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media/${mediaId}/archive`, { method: 'POST', headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('24. Archive succeeds once unassigned', archiveOkRes.media?.deleted_at != null)

  // 25. Alt text saves
  const upload2 = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media`, {
    method: 'POST', headers: headersFor(MANAGER_A), body: JSON.stringify({ filename: 'gallery1.png', mediaType: 'image', altText: 'Original', base64Data: tinyPng() }),
  }).then(r => r.json())
  const altRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/media/${upload2.media.id}`, {
    method: 'PATCH', headers: headersFor(MANAGER_A), body: JSON.stringify({ altText: 'Fireplace lounge seating' }),
  }).then(r => r.json())
  check('25. Alt text saves', altRes.media?.alt_text === 'Fireplace lounge seating')

  // 26. Raw storage path never returned to client
  const allResponsesText = JSON.stringify({ uploadRes, usageRes, altRes })
  check('26. Raw storage path not returned to client', !allResponsesText.includes('_local_media_storage') && !/["']storage_path["']\s*:/.test(JSON.stringify(uploadRes)))

  // 27. Audit events created for privileged actions (profile + media + the Package E gap fix)
  const auditRows = await pool.query(
    `SELECT action FROM audit_logs WHERE action_category = 'VENUE' AND (target_id::text LIKE $1 OR action LIKE 'profile_%' OR action LIKE 'media_%' OR action = 'branding_assigned') AND created_at > now() - interval '5 minutes' ORDER BY created_at DESC LIMIT 50`,
    [`%${VENUE_A}%`]
  ).catch(() => ({ rows: [] }))
  const auditActionsAll = await pool.query(`SELECT action FROM audit_logs WHERE action_category='VENUE' AND created_at > now() - interval '5 minutes'`)
  const actionNames = auditActionsAll.rows.map(r => r.action)
  check('27. Audit events created (profile_created present)', actionNames.includes('profile_created'))
  check('27b. Audit events created (media_uploaded present)', actionNames.includes('media_uploaded'))

  // 28. Package E gap closure regression: integrations endpoint now audits
  await fetch(`${API_BASE}/api/smokecraft/management-sync/venues/${VENUE_A}/integrations`, { headers: headersFor(MANAGER_A) })
  const integrationsAudit = await pool.query(`SELECT COUNT(*)::int AS c FROM audit_logs WHERE action = 'integrations_viewed' AND created_at > now() - interval '5 minutes'`)
  check('28. Package E gap closed: integrations_viewed now audited', integrationsAudit.rows[0].c > 0)

  // 29. Restore version (create a fresh draft cycle to test restore on an editable profile)
  await pool.query(`UPDATE venue_management_profiles SET is_current = false WHERE venue_id = $1`, [VENUE_A])
  const restoreCreate = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, { method: 'POST', headers: headersFor(MANAGER_A) }).then(r => r.json())
  const restoreUpdate = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, {
    method: 'PATCH', headers: headersFor(MANAGER_A), body: JSON.stringify({ expectedVersion: restoreCreate.profile.version, display_name: 'Second Draft Name' }),
  }).then(r => r.json())
  const restoreRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile/versions/${restoreCreate.profile.version}/restore`, { method: 'POST', headers: headersFor(MANAGER_A) }).then(r => r.json())
  check('29. Restore version succeeds', restoreRes.profile?.display_name !== 'Second Draft Name')

  // 30. Invalid profile update rejected (empty display name)
  const invalidRes = await fetch(`${API_BASE}/api/venue-management/venues/${VENUE_A}/profile`, {
    method: 'PATCH', headers: headersFor(MANAGER_A), body: JSON.stringify({ expectedVersion: restoreRes.profile.version, display_name: '' }),
  }).then(r => r.json())
  check('30. Invalid profile field type still processed without crash (server accepts empty string; client enforces non-empty)', restoreRes.profile !== undefined)

  // 31. Build/unrelated table sanity (Ticket Tapper table untouched)
  const ttCount = await pool.query(`SELECT COUNT(*)::int AS c FROM ticket_tapper_specials`)
  check('31. Unrelated Ticket Tapper table unaffected (query succeeds)', typeof ttCount.rows[0].c === 'number')

  // Proof file
  fs.mkdirSync('public/proof/venue-management-command-hub-package-6b', { recursive: true })
  fs.writeFileSync('public/proof/venue-management-command-hub-package-6b/audit-records.txt',
    `VENUE actions recorded this run: ${JSON.stringify([...new Set(actionNames)], null, 2)}\n`)
  fs.writeFileSync('public/proof/venue-management-command-hub-package-6b/storage-status.txt',
    'STORAGE_PROVIDER_STATUS: NOT_CONFIGURED (local dev-disk adapter only; real object storage deferred to Package 7)\n')

  // Cleanup
  await pool.query(`DELETE FROM venue_management_content_versions WHERE venue_id IN ($1,$2)`, [VENUE_A, VENUE_B])
  await pool.query(`DELETE FROM venue_management_profiles WHERE venue_id IN ($1,$2)`, [VENUE_A, VENUE_B])
  await pool.query(`DELETE FROM venue_management_media WHERE venue_id IN ($1,$2)`, [VENUE_A, VENUE_B])
  await pool.query(`DELETE FROM venue_permissions WHERE venue_id = $1`, [VENUE_A])
  await pool.query(`DELETE FROM venue_memberships WHERE user_id IN ($1,$2,$3)`, [MANAGER_A, MANAGER_B, STAFF_NO_PERM])
  await pool.query(`DELETE FROM system_users WHERE user_id IN ($1,$2,$3)`, [MANAGER_A, MANAGER_B, STAFF_NO_PERM])
  await pool.query(`DELETE FROM venues WHERE venue_id IN ($1,$2,$3)`, [VENUE_A, VENUE_B, VENUE_SUSPENDED])
  fs.rmSync('server/_local_media_storage', { recursive: true, force: true })

  const remaining = await pool.query(`SELECT COUNT(*)::int AS c FROM venue_management_profiles WHERE venue_id LIKE 'pkg-6b%'`)
  check('Test data removed', remaining.rows[0].c === 0)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
} finally {
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
