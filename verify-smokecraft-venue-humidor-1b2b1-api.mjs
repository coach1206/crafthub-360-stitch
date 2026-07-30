#!/usr/bin/env node
/**
 * Venue Humidor 1B-2B-1 — staff inventory administration tests
 * against the real running server, zero mocking.
 */
import http from 'http'
import 'dotenv/config'
import { execSync } from 'child_process'

const HOST = 'localhost'
const PORT = 3001
let pass = 0, fail = 0
const results = []
function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function makeClient() {
  let cookies = {}
  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      const data = body ? JSON.stringify(body) : null
      const req = http.request({
        host: HOST, port: PORT, path, method,
        headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      }, res => {
        const setCookie = res.headers['set-cookie']
        if (setCookie) for (const c of setCookie) { const [pair] = c.split(';'); const [k, v] = pair.split('='); cookies[k] = v }
        let chunks = ''
        res.on('data', d => chunks += d)
        res.on('end', () => { let parsed = null; try { parsed = JSON.parse(chunks) } catch {}; resolve({ status: res.statusCode, body: parsed }) })
      })
      req.on('error', reject)
      if (data) req.write(data)
      req.end()
    })
  }
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b) }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const admin = makeClient()
  await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  const manager = makeClient()
  const managerLogin = await manager.post('/api/auth/admin-login', { email: 'manager@novee.dev', pin: '5678' })
  const managerId = managerLogin.body.data.userId
  const staff = makeClient()
  const staffLogin = await staff.post('/api/auth/staff-pin-login', { pin: '1234' })
  const staffId = staffLogin.body.data.userId

  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b1-test-venue-a-${Date.now()}', 'VH1B2B1 Test Venue A', 'cigar_lounge', 'active') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b1-test-venue-b-${Date.now()}', 'VH1B2B1 Test Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)

  // A "mentor" (tobacconist-tier) actor for RBAC testing: reuses the
  // already-authenticated manager session, but scoped to venueB where
  // that same real user's membership_type is 'mentor' — avoids
  // needing a second seeded login while still exercising a genuinely
  // different, real membership_type row.
  const mentor = manager
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueB}', 'mentor', 'active') ON CONFLICT DO NOTHING`)
  const mentorProductSku = `VH1B2B1-MENTOR-${Date.now()}`
  const mentorProduct = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products`, { sku: mentorProductSku, name: 'Mentor Test Cigar', priceCents: 1000, initialQuantity: 10 })
  const mentorProductId = mentorProduct.body.product?.product_id

  console.log('\n── 1. Authorized dashboard load / unauthorized denial / venue isolation ──')
  const authorizedList = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`)
  assert('An authorized manager can load the admin product dashboard', authorizedList.status === 200 && Array.isArray(authorizedList.body.products))

  const stranger = makeClient()
  await stranger.post('/api/auth/staff-pin-login', { pin: '1234' })
  const unauthorizedList = await stranger.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products`)
  assert('A user with no membership for venueB is denied the admin dashboard', unauthorizedList.status === 403)

  const crossVenueList = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products`)
  assert('A venue A staff member (with no venue B membership) cannot list venue B admin products (venue isolation)', crossVenueList.status === 403)

  console.log('\n── 2. Create product ──')
  const sku = `VH1B2B1-${Date.now()}`
  const createResult = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`, {
    sku, barcode: `BC-${Date.now()}`, name: 'Test Robusto', brand: 'Test Brand', vitola: 'Robusto',
    strength: 'medium', priceCents: 1500, costCents: 800, reorderThreshold: 10,
    humidorZone: 'Zone A', storageLocation: 'Shelf 3', supplierName: 'Test Supplier',
    initialQuantity: 40,
  })
  assert('Staff can create a real product with the full admin field set', createResult.status === 201 && createResult.body.product.sku === sku)
  const productId = createResult.body.product?.product_id

  console.log('\n── 3. Duplicate SKU / barcode rejection ──')
  const dupSku = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`, { sku, name: 'Dup', priceCents: 100 })
  assert('Duplicate SKU is honestly rejected (409)', dupSku.status === 409 && dupSku.body.error === 'duplicate_sku')
  const dupBarcode = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`, { sku: `${sku}-2`, barcode: createResult.body.product.barcode, name: 'Dup2', priceCents: 100 })
  assert('Duplicate barcode is honestly rejected (409)', dupBarcode.status === 409 && dupBarcode.body.error === 'duplicate_barcode')

  console.log('\n── 4. Field-level validation ──')
  const badCreate = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`, { name: 'No SKU or price' })
  assert('Creating a product with no SKU/price returns field-level errors, never a silent failure', badCreate.status === 422 && badCreate.body.fieldErrors?.sku && badCreate.body.fieldErrors?.priceCents)

  console.log('\n── 5. Edit product, persisted after reload ──')
  const editResult = await manager.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}`, { name: 'Test Robusto Updated', priceCents: 1600, staffNotes: 'Popular with regulars' })
  assert('Editing a product succeeds', editResult.status === 200 && editResult.body.product.name === 'Test Robusto Updated')
  const reGet = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}`)
  assert('Edited values persist and survive a fresh read (reload)', reGet.body.product.price_cents === 1600 && reGet.body.product.staff_notes === 'Popular with regulars')

  console.log('\n── 6. Inventory mutations — all through the canonical service ──')
  async function mutate(client, eventType, extra, idem) {
    return client.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}/inventory-mutations`, { eventType, idempotencyKey: idem || `vh1b2b1-${eventType}-${Date.now()}-${Math.random()}`, ...extra })
  }
  const receive = await mutate(staff, 'receiving', { quantity: 20, sealedBoxDelta: 2 })
  assert('Receive inventory increases real physical quantity', receive.status === 200 && receive.body.product.physical_quantity === 60)
  const openBox = await mutate(staff, 'box_opened', { quantity: 0, sealedBoxDelta: -1, openedBoxDelta: 1 })
  assert('Opening a sealed box succeeds (inventory-neutral, box counters update)', openBox.status === 200)
  const addLoose = await mutate(staff, 'stick_added', { quantity: 5 })
  assert('Adding loose sticks increases real physical quantity', addLoose.status === 200 && addLoose.body.product.physical_quantity === 65)
  const removeLoose = await mutate(staff, 'stick_removed', { quantity: 3 })
  assert('Removing loose sticks decreases real physical quantity', removeLoose.status === 200 && removeLoose.body.product.physical_quantity === 62)
  const damage = await mutate(staff, 'damage', { quantity: 2, reason: 'crushed in transit' })
  assert('Recording damage decreases real physical quantity and records a reason', damage.status === 200 && damage.body.product.physical_quantity === 60)
  const loss = await mutate(staff, 'loss', { quantity: 1 })
  assert('Recording loss decreases real physical quantity', loss.status === 200 && loss.body.product.physical_quantity === 59)
  const comp = await mutate(staff, 'complimentary', { quantity: 1 })
  assert('Recording a complimentary cigar decreases real physical quantity', comp.status === 200 && comp.body.product.physical_quantity === 58)
  const ret = await mutate(staff, 'return', { quantity: 1 })
  assert('Recording a return increases real physical quantity', ret.status === 200 && ret.body.product.physical_quantity === 59)
  const correction = await mutate(staff, 'count_correction', { correctedQuantity: 50 })
  assert('Count correction sets real physical quantity to the corrected total', correction.status === 200 && correction.body.product.physical_quantity === 50)

  console.log('\n── 7. Negative-inventory rejection ──')
  const overRemove = await mutate(staff, 'stick_removed', { quantity: 9999 })
  assert('Removing more sticks than exist is honestly rejected (409 insufficient_inventory)', overRemove.status === 409 && overRemove.body.error === 'insufficient_inventory')
  const afterOverRemove = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}`)
  assert('A rejected negative-inventory mutation never mutates real physical quantity', afterOverRemove.body.product.physical_quantity === 50)

  console.log('\n── 8. Rapid double-click / duplicate idempotency ──')
  const sharedIdem = `vh1b2b1-doubleclick-${Date.now()}`
  const [dc1, dc2] = await Promise.all([mutate(staff, 'stick_added', { quantity: 5 }, sharedIdem), mutate(staff, 'stick_added', { quantity: 5 }, sharedIdem)])
  assert('A rapid double-click (shared idempotency key) results in exactly one real quantity change', dc1.body.product.physical_quantity === dc2.body.product.physical_quantity && dc1.body.product.physical_quantity === 55)

  console.log('\n── 9. Two-tab mutation race (different keys, same intent) ──')
  const beforeRace = 55
  const [r1, r2] = await Promise.all([mutate(staff, 'stick_added', { quantity: 3 }), mutate(staff, 'stick_added', { quantity: 3 })])
  const afterRace = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}`)
  assert('Two genuinely distinct concurrent mutations both apply exactly once each (no lost update, no double-apply)', Number(afterRace.body.product.physical_quantity) === beforeRace + 6)

  console.log('\n── 10. Exactly one event per mutation ──')
  const eventsForProduct = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/inventory-events?productId=${productId}&limit=100`)
  const receivingEvents = eventsForProduct.body.events.filter(e => e.event_type === 'receiving')
  assert('The receiving mutation wrote exactly one inventory event', receivingEvents.length === 1)

  console.log('\n── 11. Archive / restore ──')
  const archive = await manager.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}/classification`, { isArchived: true })
  assert('Archiving a product succeeds', archive.status === 200 && archive.body.product.is_archived === true)
  const listAfterArchive = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`)
  assert('An archived product is excluded from the default admin dashboard list', !listAfterArchive.body.products.some(p => p.product_id === productId))
  const restore = await manager.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}/classification`, { isArchived: false })
  assert('Restoring a product succeeds', restore.status === 200 && restore.body.product.is_archived === false)

  console.log('\n── 12. Visibility, featured, staff-pick, limited-release ──')
  const visOff = await manager.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}/classification`, { isCustomerVisible: false })
  assert('Hiding a product from customers succeeds', visOff.status === 200 && visOff.body.product.is_customer_visible === false)
  const customerReadHidden = await stranger.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/catalog/${productId}`).catch(() => ({ status: 0 }))
  const featured = await manager.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}/classification`, { isCustomerVisible: true, isFeatured: true, isStaffPick: true, isLimitedRelease: true })
  assert('Marking featured/staff-pick/limited-release succeeds together', featured.status === 200 && featured.body.product.is_featured && featured.body.product.is_staff_pick && featured.body.product.is_limited_release)

  console.log('\n── 13. Customer-browser synchronization ──')
  const customerList = await stranger.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/catalog`)
  const customerVisible = customerList.body?.products?.some(p => p.product_id === productId)
  assert('A visible, featured product appears in the real customer browser after staff changes', customerVisible === true)
  await manager.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}/classification`, { isArchived: true })
  const customerListAfterArchive = await stranger.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/catalog`)
  assert('Archiving a product removes it from the real customer browser', !customerListAfterArchive.body.products.some(p => p.product_id === productId))
  await manager.patch(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}/classification`, { isArchived: false })
  const customerListAfterRestore = await stranger.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/catalog`)
  assert('Restoring a product returns it to the real customer browser', customerListAfterRestore.body.products.some(p => p.product_id === productId))

  console.log('\n── 14. Cross-device consistency ──')
  const readA = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}`)
  const readB = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products/${productId}`)
  assert('Two independent staff sessions read identical authoritative product state', readA.body.product.physical_quantity === readB.body.product.physical_quantity)

  console.log('\n── 15. RBAC — mentor (tobacconist tier) ──')
  const mentorRead = await mentor.get(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products`)
  assert('A mentor (tobacconist tier) can read the admin dashboard', mentorRead.status === 200)
  const mentorMutation = await mentor.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products/${mentorProductId}/inventory-mutations`, { eventType: 'stick_added', quantity: 1, idempotencyKey: `vh1b2b1-mentor-${Date.now()}` })
  assert('A mentor (tobacconist tier) cannot perform inventory mutations', mentorMutation.status === 403)
  const mentorNotesEdit = await mentor.patch(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products/${mentorProductId}`, { staffNotes: 'Mentor note' })
  assert('A mentor CAN edit the approved staffNotes field', mentorNotesEdit.status === 200)
  const mentorFullEdit = await mentor.patch(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products/${mentorProductId}`, { name: 'Mentor should not rename this' })
  assert('A mentor CANNOT edit other product fields (server-enforced, not just hidden in the UI)', mentorFullEdit.status === 403)

  console.log('\n── 16. RBAC — non-member denial ──')
  const venueC = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vh1b2b1-test-venue-c-${Date.now()}', 'VH1B2B1 Test Venue C', 'cigar_lounge', 'active') RETURNING venue_id`)
  const denied = await staff.get(`/api/smokecraft/venue-humidor/venues/${venueC}/admin/products`)
  assert('A user with no venue membership at all (for this venue) is denied the admin dashboard', denied.status === 403)

  console.log('\n── 17. Inventory event history and filters ──')
  const historyAll = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/inventory-events`)
  assert('Inventory event history loads real, append-only events', historyAll.status === 200 && historyAll.body.events.length > 0)
  const historyByType = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/inventory-events?eventType=damage`)
  assert('Filtering event history by event type returns only matching real events', historyByType.body.events.length > 0 && historyByType.body.events.every(e => e.event_type === 'damage'))
  const historyByProduct = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/inventory-events?productId=${productId}`)
  assert('Filtering event history by product returns only matching real events', historyByProduct.body.events.every(e => e.product_id === productId))
  const historyByActor = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/inventory-events?actorId=${staffId}`)
  assert('Filtering event history by actor returns only matching real events', historyByActor.body.events.every(e => e.actor_id === staffId))

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-venue-humidor-1b-2b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-venue-humidor-1b-2b-1/01-admin-inventory-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
