import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const pages_to_check = [
  { url: '/smokecraft', id: 'landing' },
  { url: '/smokecraft/final-third', id: 'final-third' },
  { url: '/smokecraft/scorecard', id: 'scorecard' },
  { url: '/smokecraft/connections', id: 'connections' },
]

const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })

for (const { url, id } of pages_to_check) {
  const page = await ctx.newPage()
  await page.addInitScript(() => { sessionStorage.setItem('novee_demo_mode', '1') })
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a[href]'))
      .filter(el => {
        const s = window.getComputedStyle(el)
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'
      })
      .map(el => {
        const r = el.getBoundingClientRect()
        return { text: el.textContent?.trim().slice(0, 25), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
      })
      .filter(b => b.w > 0 && b.h > 0)
    return btns
  })

  console.log(`\n=== ${id} ===`)
  info.forEach(b => console.log(`  y=${b.y}-${b.y+b.h} x=${b.x}-${b.x+b.w} "${b.text}"`))
  await page.close()
}

await browser.close()
