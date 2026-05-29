# ─── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# ─── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next build reads env vars at build time for static optimisation.
# Pass non-secret vars here; secrets are injected at runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure public/ exists — COPY below fails if the source is absent.
RUN mkdir -p public

# Provide example environment variables at build time so Next.js
# static optimisation can read required values. This copies the
# non-secret example into `.env.local` inside the build context.
COPY .env.example .env.local

RUN npm run build

# ─── Stage 3: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# wget is used by HEALTHCHECK (lighter than curl on alpine).
RUN apk add --no-cache wget

# Run as non-root user for security.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public                   ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# AWS App Runner / ECS health check — uses the /api/health endpoint which
# verifies DB reachability. start-period gives the app time to connect.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
