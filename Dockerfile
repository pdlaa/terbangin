# ============================================
# STAGE 1: Install ALL dependencies (dev + prod)
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# STAGE 2: Build application
# ============================================
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
# Placeholder — akan di-override via environment variable saat runtime
ENV DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder"

RUN npx prisma generate
RUN npm run build

# ============================================
# STAGE 3: Production runner
# ============================================
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat bash curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Buat user non-root
RUN addgroup --system --gid 1001 nodejs || true
RUN adduser --system --uid 1001 nextjs 2>/dev/null || adduser -D -u 1001 nextjs

# Copy standalone output (sudah termasuk semua yang dibutuhkan)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy static files (diluar standalone, untuk serving)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema & migrations untuk db push runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy hanya package.json & entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Instal dependencies yang diperlukan saat runtime:
# - @prisma/client dan prisma CLI untuk db push
# - bcryptjs untuk seed
# - ts-node untuk menjalankan seed
RUN npm install --omit=dev --ignore-scripts 2>&1 && \
    npm install prisma ts-node --no-save --ignore-scripts 2>&1 && \
    npx prisma generate 2>&1

RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]