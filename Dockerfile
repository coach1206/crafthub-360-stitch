# SmokeCraft 360 — production container image.
# Multi-stage: build stage compiles the Vite frontend, deps stage installs
# production-only node_modules, runtime stage assembles the minimal image.
# Pinned Node major (matches server/config/envValidator.js supported set).

# ---- deps: install once, prod deps go to runtime, full deps go to build ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && cp -R node_modules /prod_node_modules
RUN npm ci --ignore-scripts

# ---- build: compile frontend + generate build manifest ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production

# Build identity: passed through as Docker build args when the platform
# provides them (Railway sets RAILWAY_GIT_COMMIT_SHA/RAILWAY_GIT_BRANCH),
# so the app embeds a real commit when available. Neither vite.config.js
# nor scripts/generateBuildManifest.mjs shells out to git — there is no
# .git directory in this build context and no git binary in this image —
# so an unset value here safely falls back to a disclosed "local" identity
# rather than failing the build.
ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH
ENV RAILWAY_GIT_COMMIT_SHA=${RAILWAY_GIT_COMMIT_SHA}
ENV RAILWAY_GIT_BRANCH=${RAILWAY_GIT_BRANCH}

RUN node scripts/generateBuildManifest.mjs || true
RUN npm run build

# R2 sync deployment fix — generate the authoritative asset registry here,
# in the build stage (full deps + the real approved image files present,
# thanks to the .dockerignore negations above), so the runtime image can
# COPY just the resulting registry.json below rather than needing all of
# public/proof/** (which stays excluded — no screenshots or other proof
# artifacts reach the runtime image because of this).
RUN node scripts/smokecraftAssetRegistry.mjs

# ---- runtime: minimal image, non-root user, prod deps + server + dist only ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Non-root runtime user.
RUN groupadd --system smokecraft && useradd --system --gid smokecraft --home /app smokecraft

COPY --from=deps  /prod_node_modules ./node_modules
COPY --from=build /app/dist          ./dist
COPY server ./server
COPY package.json ./package.json

# Shared server/frontend data and logic modules — many server/services/**
# files import plain data/logic (never .jsx/React) out of these seven src/
# subdirectories (real, audited via `npm run verify:server-runtime-imports`,
# which now checks for exactly this class of gap). Copying just these
# ~2.7MB of shared modules, not all of src/ (which also contains every React
# page/component, unrelated to the server), is the smallest correct runtime
# fix — cheaper and far lower-risk than rewriting 50+ import statements
# across 40+ server files to point at a new server-owned location.
COPY src/config ./src/config
COPY src/constants ./src/constants
COPY src/data ./src/data
COPY src/locales ./src/locales
COPY src/modules ./src/modules
COPY src/services ./src/services
COPY src/utils ./src/utils

# R2 sync deployment fix — `npm run smokecraft:assets:sync-r2` failed on
# Railway with `Cannot find module '/app/scripts/smokecraftAssetsSyncR2.mjs'`
# because this runtime stage never copied scripts/ at all. Copy only the
# two scripts the sync command actually needs (not the whole scripts/
# directory — that includes dozens of dev-only verify/capture/debug
# tools with no place in a production runtime image), plus the real
# approved source image trees those scripts hash and upload, plus the
# one registry.json the build stage just generated above (not all of
# public/proof/** — no browser-proof/QA screenshots ship here).
COPY scripts/smokecraftAssetsSyncR2.mjs  ./scripts/smokecraftAssetsSyncR2.mjs
COPY scripts/smokecraftAssetRegistry.mjs ./scripts/smokecraftAssetRegistry.mjs
COPY scripts/smokecraftR2Diagnose.mjs    ./scripts/smokecraftR2Diagnose.mjs
COPY public/assets/smokecraft            ./public/assets/smokecraft
COPY public/assets/smokecraft-reference  ./public/assets/smokecraft-reference
COPY public/smokecraft-visit-complete.png ./public/smokecraft-visit-complete.png
COPY --from=build /app/public/proof/smokecraft-asset-registry/registry.json ./public/proof/smokecraft-asset-registry/registry.json
COPY scripts/verifyProductionContainerAssetSyncTooling.mjs ./scripts/verifyProductionContainerAssetSyncTooling.mjs

# Build-blocking validator (Part 5 of this fix) — fails the Docker build
# itself if the sync command, its real import (the object-storage
# adapter), or the registry it reads are missing from this exact runtime
# image, so this class of deploy-time MODULE_NOT_FOUND can never reach
# Railway silently again.
RUN node scripts/verifyProductionContainerAssetSyncTooling.mjs

# No dev tools, no test/proof artifacts, no source maps of source code —
# only the built dist/ output, the server runtime, and its shared src/
# data/logic dependencies ship.
RUN mkdir -p /app/server/_local_media_storage && chown -R smokecraft:smokecraft /app

USER smokecraft

EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Graceful shutdown: server/index.js handles SIGTERM (verified in Package 3/4
# regression) — no extra init/tini wrapper needed for this single-process image.
CMD ["node", "server/index.js"]
