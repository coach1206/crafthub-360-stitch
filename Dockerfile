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

# No dev tools, no test/proof artifacts, no source maps of source code —
# only the built dist/ output and the server runtime ship.
RUN mkdir -p /app/server/_local_media_storage && chown -R smokecraft:smokecraft /app

USER smokecraft

EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Graceful shutdown: server/index.js handles SIGTERM (verified in Package 3/4
# regression) — no extra init/tini wrapper needed for this single-process image.
CMD ["node", "server/index.js"]
