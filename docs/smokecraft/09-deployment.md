# SmokeCraft Deployment Guide

**Version:** MVP2 · **Audience:** Platform engineers and DevOps

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js / Express, ES modules |
| Database | PostgreSQL (via pg / Drizzle ORM) |
| Hosting | Vercel (frontend) + Railway or Render (backend) |
| CDN | Vercel Edge Network |

## Pre-Deployment Checklist

- [ ] All 552+ automated checks pass: `node e2e-smokecraft-final-live-mvp2-closeout.mjs`
- [ ] Image audit passes with no images over 2 MB (or optimized copies in place): `node scripts/smokecraft-image-audit.mjs`
- [ ] Visual regression baseline exists: `node e2e-smokecraft-visual-regression.mjs --update-baseline`
- [ ] Production build succeeds: `npm run build`
- [ ] Environment variables set (see Integration Config doc 06)
- [ ] `NODE_ENV=production` on the server (enables rate limiting)
- [ ] Database migrations applied: `npm run db:migrate`
- [ ] Demo mode is OFF
- [ ] Founder approval obtained

## Build

```bash
npm run build
```

Output in `dist/`. Vite fingerprints all static assets. SmokeCraft images in `public/` are copied verbatim — confirm sizes are within target before build.

## Server Start

```bash
NODE_ENV=production PORT=3001 node server/index.js
```

## Rate Limiting

Rate limiting is production-only. In development (`NODE_ENV=development`), all limits are skipped. In production:
- General routes: 300 requests per 15 minutes per IP
- Auth routes (`/api/auth`): 20 requests per 15 minutes per IP

## Vercel Configuration

`vercel.json` should include:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This enables client-side routing for all SmokeCraft session paths.

## Health Check

After deployment:
1. `GET /api/health` → `{ status: "ok" }`
2. Navigate to `/smokecraft` → home screen loads with background image
3. Navigate to `/smokecraft/enroll` → page renders (may be session-locked if not in demo)
4. Check error log at `/smokecraft/error-log` (admin login required) for any startup errors

## Rollback

See Rollback & Recovery Guide (doc 11).

## Release Tagging

After a successful deployment and founder sign-off:
```bash
git tag smokecraft-v2.0.0-mvp2
git push origin smokecraft-v2.0.0-mvp2
```

**Do not create or push the release tag until founder approval is confirmed.**
