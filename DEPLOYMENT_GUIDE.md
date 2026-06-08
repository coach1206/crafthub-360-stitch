# NOVEE OS — Deployment Guide

## Overview

NOVEE OS is a React + Vite frontend with an Express backend, supporting PWA installation, kiosk mode, and real-time hospitality operations.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `JWT_SECRET` | Production | Strong random secret (min 32 chars) |
| `FOUNDER_CHALLENGE_SECRET` | Production | Separate secret for founder auth |
| `CORS_ORIGIN` | Production | Allowed origin (e.g. `https://yourvenue.com`) |
| `AUTH_COOKIE_NAME` | Optional | Cookie name (default: `novee_auth`) |
| `AUTH_COOKIE_SECURE` | Production | Set to `"true"` for HTTPS |
| `AUTH_COOKIE_SAMESITE` | Optional | `lax` or `strict` (default: `lax`) |
| `ELEVENLABS_API_KEY` | Optional | Enables high-fidelity mentor voice |
| `NODE_ENV` | Always | `development` or `production` |
| `PORT` | Optional | Backend port (default: `3001`) |

---

## Dev Startup Commands

```bash
# Install dependencies
npm install

# Start backend API (port 3001)
npm run server

# Start frontend (port 5000)
npm run dev

# Build production bundle
npm run build
```

---

## Production Warnings

- **Never use the default `JWT_SECRET`** — it will be rejected on startup in production.
- **Set `FOUNDER_CHALLENGE_SECRET`** — founder login will be disabled without it.
- **Restrict `CORS_ORIGIN`** — wildcard origins are rejected in production.
- **Enable `AUTH_COOKIE_SECURE=true`** — required for HTTPS deployments.
- **Do not commit `.env` files** — use your hosting platform's secret manager.

---

## Backend / Frontend Ports

| Service | Default Port | Notes |
|---|---|---|
| Frontend (Vite dev) | `5000` | Proxies `/api/*` to backend |
| Backend (Express) | `3001` | All API routes under `/api/` |
| Production | Single origin | Frontend static + backend on same host |

---

## Database Notes

- PostgreSQL required in production.
- Migrations in `server/db/migrations/` — run in order (001 → 006).
- Prototype mode works without a database (in-memory prototype data).
- Run migrations manually or via `psql`:
  ```bash
  psql $DATABASE_URL -f server/db/migrations/001_initial_novee_schema.sql
  # ... repeat for 002 through 006
  ```

---

## Auth Notes

- Staff login: PIN-based (`/staff-login`)
- Manager/Admin login: Password-based (`/admin-login`)
- Founder login: Password + challenge secret (`/founder-login`)
- Sessions: HttpOnly cookie (`novee_auth` by default)
- Lockout: 5 failed attempts → 15 min lockout (configurable)

---

## PWA Notes

- Manifest at `/manifest.webmanifest`
- Service worker at `/sw.js`
- Icons at `/icons/novee-192.svg` and `/icons/novee-512.svg`
- Service worker registers automatically in production (`PROD=true`)
- To test SW in development: set `VITE_SW=true` in `.env`
- Cached: app shell, static assets, offline fallback page
- Never cached: `/api/auth/*`, `/api/admin/*`, `/api/founder/*`, `/api/pos3/*`, `/api/eat/*`, `/api/audit/*`
- Offline fallback: `/offline.html` (static) + `/offline` (React page)

---

## Deployment Checklist API

```
GET  /api/deployment/checklist   (manager+)
POST /api/deployment/run-checks  (admin+)
```

Returns JSON with pass/warn/fail status for all critical checks.

---

## Device Management

```
GET  /api/device/config?deviceId=xxx   (public)
POST /api/device/register              (manager+)
PUT  /api/device/:deviceId             (manager+)
POST /api/device/:deviceId/heartbeat   (public)
```

---

*NOVEE OS v4.2.0 — Phase 11 Kiosk/Tablet Deployment*
