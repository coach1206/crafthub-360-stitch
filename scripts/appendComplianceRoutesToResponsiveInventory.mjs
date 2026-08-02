#!/usr/bin/env node
// Production Package 6 Correction — extends the existing Holistic Fix 3
// responsive inventory (public/proof/smokecraft-holistic-fix-3/01-responsive-inventory.json)
// with the 6 new compliance routes this package adds, using the SAME
// measurement logic as verify-smokecraft-hf3-responsive-inventory.mjs, at
// all 5 of that inventory's viewports (kept identical so the existing
// repo-wide validateSmokecraftResponsive.mjs gate — which checks
// inventory-covers-all-live-routes parity — stays accurate; the mandate's
// "2-3 representative viewports" pragmatic-scoping note governs the
// PROSE accessibility results doc, not this pre-existing structural gate).
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.SC_UI || 'http://localhost:3001'
const INVENTORY_PATH = 'public/proof/smokecraft-holistic-fix-3/01-responsive-inventory.json'
const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf8'))

const NEW_ROUTES = [
  'compliance/age-gate',
  'compliance/policies',
  'compliance/consent',
  'compliance/data-rights',
  'staff/compliance/age-verification',
  'admin/compliance',
]

const VIEWPORTS = [
  { name: 'handheld-portrait', width: 390, height: 844 },
  { name: 'tablet-10in-landscape', width: 1280, height: 800 },
  { name: 'tablet-12in-landscape', width: 1366, height: 1024 },
  { name: '15in-display', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext()
const page = await ctx.newPage()

let idx = inventory.length
const appended = []
for (const r of NEW_ROUTES) {
  idx++
  const url = `/smokecraft/${r}`
  const routeResult = { idx, path: `/smokecraft/${r}`, testedUrl: url, isDynamicSegment: false, isRedirect: false, viewports: {} }
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 12000 })
      await page.waitForTimeout(700)
      const measured = await page.evaluate(() => {
        const doc = document.documentElement
        const body = document.body
        const scrollableHeight = Math.max(doc.scrollHeight, body.scrollHeight)
        const viewportH = window.innerHeight
        const viewportW = window.innerWidth
        const horizontalOverflow = Math.max(doc.scrollWidth, body.scrollWidth) > viewportW + 2
        const scrollableEls = [...document.querySelectorAll('*')].filter(el => {
          const cs = getComputedStyle(el)
          return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4
        })
        const beforeScrollY = window.scrollY
        window.scrollTo(0, 100)
        const nativeScrollWorks = window.scrollY > beforeScrollY
        window.scrollTo(0, beforeScrollY)
        const canScrollIfNeeded = scrollableHeight <= viewportH + 4 || scrollableEls.length > 0 || nativeScrollWorks
        const fixedBottomEls = [...document.querySelectorAll('[role="navigation"]')].filter(el => {
          const cs = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          return cs.position === 'fixed' && r.bottom >= viewportH - 4 && r.height > 20 && r.height < 140
        })
        let bottomNavHeight = 0
        for (const el of fixedBottomEls) { const r = el.getBoundingClientRect(); bottomNavHeight = Math.max(bottomNavHeight, r.height) }
        function hasScrollableAncestor(el) {
          let node = el.parentElement
          while (node) {
            const cs = getComputedStyle(node)
            if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 4) return true
            node = node.parentElement
          }
          return false
        }
        let obscuredControls = 0
        if (bottomNavHeight > 0) {
          const controls = [...document.querySelectorAll('button, a[href], input, [role="button"]')]
            .filter(el => !fixedBottomEls.some(nav => nav.contains(el)))
            .filter(el => !hasScrollableAncestor(el))
          for (const el of controls) {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && r.height > 0 && r.bottom > viewportH - bottomNavHeight && r.top < viewportH - bottomNavHeight) obscuredControls++
          }
        }
        const heroThreshold = Math.min(viewportW, viewportH) * 0.4
        const imgs = [...document.querySelectorAll('img')].filter(i => {
          if (i.naturalWidth <= 0) return false
          const r = i.getBoundingClientRect()
          return Math.max(r.width, r.height) >= heroThreshold
        })
        let heroImage = null
        if (imgs.length) {
          const largest = imgs.reduce((a, b) => (a.naturalWidth * a.naturalHeight > b.naturalWidth * b.naturalHeight ? a : b))
          const r = largest.getBoundingClientRect()
          heroImage = {
            naturalW: largest.naturalWidth, naturalH: largest.naturalHeight,
            orientation: largest.naturalWidth >= largest.naturalHeight ? 'landscape' : 'portrait',
            renderedW: r.width, renderedH: r.height, objectFit: getComputedStyle(largest).objectFit, src: largest.currentSrc || largest.src,
          }
        }
        const bodyText = body.innerText || ''
        const bodyEmpty = bodyText.trim().length < 10
        const allEls = [...document.querySelectorAll('button, a[href], input, select, textarea')]
        let minTouchTarget = 999
        for (const el of allEls) {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) minTouchTarget = Math.min(minTouchTarget, Math.min(r.width, r.height))
        }
        if (minTouchTarget === 999) minTouchTarget = null
        const textEls = [...document.querySelectorAll('p, span, div, label, button, a, h1, h2, h3')]
        let minFontSize = 999
        for (const el of textEls) {
          if (!el.innerText || !el.innerText.trim()) continue
          const fs = parseFloat(getComputedStyle(el).fontSize)
          if (fs > 0) minFontSize = Math.min(minFontSize, fs)
        }
        if (minFontSize === 999) minFontSize = null
        const deadSpaceRatio = null
        return { viewportW, viewportH, scrollableHeight, horizontalOverflow, canScrollIfNeeded, bottomNavHeight, obscuredControls, heroImage, deadSpaceRatio, minTouchTarget, minFontSize, bodyEmpty }
      })
      routeResult.viewports[vp.name] = measured
    } catch (err) {
      routeResult.viewports[vp.name] = { error: String(err.message || err) }
    }
  }
  appended.push(routeResult)
  console.log(`  measured ${url} across ${VIEWPORTS.length} viewports`)
}

await browser.close()

const combined = [...inventory, ...appended]
writeFileSync(INVENTORY_PATH, JSON.stringify(combined, null, 2))
console.log(`Wrote ${combined.length} total inventory entries (${inventory.length} existing + ${appended.length} new compliance routes) to ${INVENTORY_PATH}`)
