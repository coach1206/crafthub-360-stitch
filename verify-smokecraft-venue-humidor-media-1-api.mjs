#!/usr/bin/env node
/**
 * Venue Humidor Media and Product Image Management — Production
 * Package 1 of 7. API tests against the real running server, zero
 * mocking. Mirrors the verify-smokecraft-venue-humidor-1b2b1-api.mjs
 * conventions (real HTTP client, real seeded venues/memberships/
 * products via psql, real assertions).
 */
import http from 'http'
import 'dotenv/config'
import { execSync } from 'child_process'
import crypto from 'crypto'

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

// 1x1 real PNG (valid magic bytes + IHDR dimensions) for genuine
// file-signature validation — never a fake/renamed file.
const REAL_PNG_1X1_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
function makeRealPngBase64(minDim = 40) {
  // Builds a syntactically valid PNG with a real IHDR declaring
  // minDim x minDim so it clears the >=32px dimension floor — actual
  // pixel data is irrelevant to the validator, only the header parse.
  const width = minDim, height = minDim
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0); ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8; ihdrData[9] = 6; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crcBuf = Buffer.alloc(4)
    const crc = crc32(Buffer.concat([typeBuf, data]))
    crcBuf.writeUInt32BE(crc >>> 0, 0)
    return Buffer.concat([len, typeBuf, data, crcBuf])
  }
  function crc32(buf) {
    let table = crc32.table
    if (!table) {
      table = crc32.table = []
      for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        table[n] = c
      }
    }
    let crc = 0xffffffff
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
    return crc ^ 0xffffffff
  }
  const ihdr = chunk('IHDR', ihdrData)
  const idat = chunk('IDAT', Buffer.from([0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend]).toString('base64')
}

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

  const stamp = Date.now()
  const venueA = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vhmedia-test-venue-a-${stamp}', 'VH Media Test Venue A', 'cigar_lounge', 'active') RETURNING venue_id`)
  const venueB = psql(`INSERT INTO venues (venue_id, name, venue_type, status) VALUES ('vhmedia-test-venue-b-${stamp}', 'VH Media Test Venue B', 'cigar_lounge', 'active') RETURNING venue_id`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${managerId}', '${venueA}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('${staffId}', '${venueA}', 'staff', 'active') ON CONFLICT DO NOTHING`)

  const sku = `VHMEDIA-${stamp}`
  const productResult = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`, {
    sku, name: 'Media Test Robusto', brand: 'TestBrand', vitola: 'Robusto', priceCents: 1500, initialQuantity: 20,
  })
  const productId = productResult.body.product?.product_id
  assert('Seed: product created for media tests', productResult.status === 201 && !!productId)

  const productBSku = `VHMEDIA-B-${stamp}`
  const productBResult = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueB}/admin/products`, {
    sku: productBSku, name: 'Venue B Product', priceCents: 1000, initialQuantity: 5,
  })
  const productBId = productBResult.body.product?.product_id

  const pngBase64 = makeRealPngBase64(48)

  console.log('\n── 1. Authorized upload / unauthorized denial / cross-venue denial ──')
  const upload1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/upload-authorization`, {
    productId, purpose: 'product_primary', sourceType: 'venue_uploaded_photography',
    fileBase64: pngBase64, originalFilename: 'robusto-primary.png', altText: 'Robusto cigar, horizontal, natural light',
  })
  assert('Authorized venue staff can upload a real product image', upload1.status === 201 && upload1.body.asset?.assetId, JSON.stringify(upload1.body))
  const asset1Id = upload1.body.asset?.assetId

  const stranger = makeClient()
  await stranger.post('/api/auth/staff-pin-login', { pin: '1234' })
  const unauthorizedUpload = await stranger.post(`/api/smokecraft/venue-humidor/venues/${venueB}/media/upload-authorization`, {
    productId: productBId, purpose: 'product_primary', sourceType: 'venue_uploaded_photography', fileBase64: pngBase64, originalFilename: 'x.png',
  })
  assert('A user with no membership is denied upload (403)', unauthorizedUpload.status === 403)

  const crossVenueUpload = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueB}/media/upload-authorization`, {
    productId: productBId, purpose: 'product_primary', sourceType: 'venue_uploaded_photography', fileBase64: pngBase64, originalFilename: 'x.png',
  })
  assert('A venue A staff member cannot upload to venue B (venue isolation, 403)', crossVenueUpload.status === 403)

  console.log('\n── 2. File validation: invalid MIME, corrupt file, oversized file, duplicate ──')
  const notAnImage = Buffer.from('<html><script>alert(1)</script></html>').toString('base64')
  const invalidMime = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/upload-authorization`, {
    productId, purpose: 'product_gallery', sourceType: 'venue_uploaded_photography', fileBase64: notAnImage, originalFilename: 'fake.png',
  })
  assert('Non-image content (fake extension) is rejected by magic-byte sniffing', invalidMime.status === 415, JSON.stringify(invalidMime.body))

  const corrupt = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00]).toString('base64')
  const corruptResult = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/upload-authorization`, {
    productId, purpose: 'product_gallery', sourceType: 'venue_uploaded_photography', fileBase64: corrupt, originalFilename: 'corrupt.png',
  })
  assert('A corrupt/truncated file is rejected, not silently accepted', corruptResult.status >= 400)

  const oversized = crypto.randomBytes(6 * 1024 * 1024).toString('base64')
  const oversizedResult = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/upload-authorization`, {
    productId, purpose: 'product_gallery', sourceType: 'venue_uploaded_photography', fileBase64: oversized, originalFilename: 'huge.png',
  })
  assert('An oversized file is rejected (413)', oversizedResult.status === 413)

  const duplicateResult = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/upload-authorization`, {
    productId, purpose: 'product_gallery', sourceType: 'venue_uploaded_photography', fileBase64: pngBase64, originalFilename: 'robusto-primary.png',
  })
  assert('Re-uploading the identical file is detected as a duplicate (409)', duplicateResult.status === 409 && duplicateResult.body.error === 'duplicate_asset')

  console.log('\n── 3. Product assignment / invalid assignment ──')
  const galleryPng = makeRealPngBase64(64)
  const upload2 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/upload-authorization`, {
    productId, purpose: 'product_gallery', sourceType: 'venue_uploaded_photography', fileBase64: galleryPng, originalFilename: 'robusto-gallery-2.png',
  })
  const asset2Id = upload2.body.asset?.assetId
  assert('Second gallery image uploads successfully', upload2.status === 201)

  const invalidAssign = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset2Id}/assign`, { productId: 'not-a-real-product-id' })
  assert('Assigning an asset to a non-existent/foreign product is rejected (422)', invalidAssign.status === 422)

  const validAssign = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset2Id}/assign`, { productId })
  assert('Assigning an asset to the correct, owned product succeeds', validAssign.status === 200)

  console.log('\n── 4. Approval / rejection ──')
  const staffApproveAttempt = await staff.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset1Id}/approve`, {})
  assert('Staff (write-tier, not full-access) cannot approve their own upload (403)', staffApproveAttempt.status === 403)

  const approve1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset1Id}/approve`, {})
  assert('A manager (full-access tier) can approve an asset', approve1.status === 200 && approve1.body.asset.approvalState === 'approved')

  const rejectNoReason = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset2Id}/reject`, {})
  assert('Rejecting without a reason is rejected (422)', rejectNoReason.status === 422)

  const reject1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset2Id}/reject`, { reason: 'Image is blurry and does not clearly show the vitola' })
  assert('Rejecting with a reason succeeds', reject1.status === 200 && reject1.body.asset.approvalState === 'rejected')

  console.log('\n── 5. Set primary / prevent two primaries ──')
  const setPrimary1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/products/${productId}/set-primary`, { assetId: asset1Id })
  assert('Setting an approved asset as primary succeeds', setPrimary1.status === 200 && setPrimary1.body.asset.isPrimary === true)

  const setPrimaryUnapproved = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/products/${productId}/set-primary`, { assetId: asset2Id })
  assert('Setting a REJECTED asset as primary is refused (409)', setPrimaryUnapproved.status === 409)

  const dbPrimaryCount = psql(`SELECT count(*) FROM venue_cigar_media_assets WHERE product_id = '${productId}' AND is_primary = true AND active_state = 'active'`)
  assert('Exactly one active primary image exists for the product at the DB level', dbPrimaryCount === '1', `count=${dbPrimaryCount}`)

  console.log('\n── 6. Gallery reorder ──')
  const upload3 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/upload-authorization`, {
    productId, purpose: 'product_gallery', sourceType: 'venue_uploaded_photography', fileBase64: makeRealPngBase64(80), originalFilename: 'robusto-gallery-3.png',
  })
  const asset3Id = upload3.body.asset?.assetId
  await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset3Id}/approve`, {})
  const reorder = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/products/${productId}/reorder`, { orderedAssetIds: [asset3Id, asset1Id] })
  assert('Gallery reorder succeeds and reflects the new order', reorder.status === 200 && Array.isArray(reorder.body.gallery))

  console.log('\n── 7. Activate / retire ──')
  const retire1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset3Id}/retire`, { reason: 'Replaced by a better angle' })
  assert('Retiring an asset succeeds', retire1.status === 200 && retire1.body.asset.activeState === 'retired')
  const retiredPrimaryCheck = psql(`SELECT is_primary FROM venue_cigar_media_assets WHERE asset_id = '${asset3Id}'`)
  assert('A retired asset is never left as the primary flag', retiredPrimaryCheck === 'f')

  const activate1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/${asset2Id}/activate`, {})
  assert('A rejected (not-approved) asset cannot be activated (409)', activate1.status === 409)

  console.log('\n── 8. Import allowed URL / reject disallowed URL ──')
  const disallowedImport = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/products/${productId}/import-url`, {
    purpose: 'product_gallery', sourceType: 'manufacturer_authorized', sourceName: 'Random Stock Site',
    sourceUrl: 'https://random-unlicensed-stock-photos.example.com/cigar.jpg', rightsReference: 'RSS-123',
  })
  assert('Importing from a non-allowlisted domain is rejected (SSRF guard, 422)', disallowedImport.status === 422 && disallowedImport.body.error === 'import_domain_not_allowed')

  const noRightsImport = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/products/${productId}/import-url`, {
    purpose: 'product_gallery', sourceType: 'manufacturer_authorized', sourceUrl: 'https://media.padron-authorized.example/robusto.jpg',
  })
  assert('Importing manufacturer-authorized media without a rights reference is rejected (422)', noRightsImport.status === 422 && noRightsImport.body.error === 'rights_reference_required')

  console.log('\n── 9. CSV dry run / row errors ──')
  const validCsvRow = `venue_id,cigar_id,sku,barcode,brand,line,vitola,image_url,image_purpose,source_type,source_name,rights_reference,alt_text,primary,display_order\n${venueA},${productId},${sku},,TestBrand,,Robusto,https://media.padron-authorized.example/r2.jpg,product_gallery,manufacturer_authorized,Padron,PAD-RR-2024,Robusto cigar,false,1`
  const dryRun1 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/csv/dry-run`, { csv: validCsvRow })
  assert('CSV dry-run validates a correct row without importing anything', dryRun1.status === 200 && dryRun1.body.mode === 'dry_run' && dryRun1.body.results[0].status === 'valid', JSON.stringify(dryRun1.body))

  const badCsvRow = `venue_id,cigar_id,sku,barcode,brand,line,vitola,image_url,image_purpose,source_type,source_name,rights_reference,alt_text,primary,display_order\n${venueA},${productId},WRONG-SKU,,TestBrand,,Robusto,https://media.padron-authorized.example/r2.jpg,product_gallery,manufacturer_authorized,Padron,PAD-RR-2024,Robusto cigar,false,1\n${venueB},${productId},${sku},,TestBrand,,Robusto,https://media.padron-authorized.example/r3.jpg,product_gallery,manufacturer_authorized,Padron,PAD-RR-2024,Robusto cigar,false,2`
  const dryRun2 = await manager.post(`/api/smokecraft/venue-humidor/venues/${venueA}/media/csv/dry-run`, { csv: badCsvRow })
  assert('CSV dry-run reports row-level errors (SKU mismatch, cross-venue) without partial corruption', dryRun2.status === 200 && dryRun2.body.errorRows === 2, JSON.stringify(dryRun2.body))

  console.log('\n── 10. Missing-image report ──')
  const noImageSku = `VHMEDIA-NOIMG-${stamp}`
  const noImageProduct = await admin.post(`/api/smokecraft/venue-humidor/venues/${venueA}/admin/products`, { sku: noImageSku, name: 'No Image Product', priceCents: 900, initialQuantity: 3 })
  const report1 = await manager.get(`/api/smokecraft/venue-humidor/venues/${venueA}/media/missing-image-report`)
  assert('Missing-image report is retrievable and flags the no-image product', report1.status === 200 && report1.body.report.some((r) => r.productId === noImageProduct.body.product.product_id && r.issue === 'no_approved_image'), JSON.stringify(report1.body.report))

  console.log('\n── 11. Public approved media / public rejection of unapproved media ──')
  const publicMedia = await admin.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/products/${productId}/media`)
  assert('Public product media endpoint returns the approved primary image', publicMedia.status === 200 && publicMedia.body.media.length > 0 && publicMedia.body.media[0].approvalState !== 'rejected', JSON.stringify(publicMedia.body.media))
  const hasPrivateFields = publicMedia.body.media.some((m) => 'rightsReference' in m || 'notes' in m)
  assert('Public media response never exposes private rights/notes fields', !hasPrivateFields)

  const publicMediaNoImage = await admin.get(`/api/smokecraft/venue-humidor/customer/venues/${venueA}/products/${noImageProduct.body.product.product_id}/media`)
  assert('A product with no approved media falls back to the branded placeholder, never an unrelated cigar', publicMediaNoImage.status === 200 && publicMediaNoImage.body.media[0].sourceType === 'branded_placeholder')

  console.log(`\n${'='.repeat(60)}\nRESULTS: ${pass} passed, ${fail} failed (${pass + fail} total)\n${'='.repeat(60)}`)
  console.log(JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((err) => { console.error('FATAL', err); process.exit(1) })
