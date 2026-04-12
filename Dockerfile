FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_IMAGE_CDN_URL
ARG NEXT_PUBLIC_STOREFRONT_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_IMAGE_CDN_URL=${NEXT_PUBLIC_IMAGE_CDN_URL}
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}

# Set NODE_ENV to production so Next.js loads .env.production during build
ENV NODE_ENV=production

RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Pre-create cache directories at build time (belt).
RUN mkdir -p .next/cache/images .next/cache/fetch-cache && chown -R nextjs:nodejs .next/cache

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

# Create cache dirs at startup too (suspenders) — if Runix/K8s mounts
# an emptyDir over /app/.next for writability, the build-time dirs are
# shadowed. This ensures they exist before server.js tries to use them.
CMD ["sh", "-c", "mkdir -p /app/.next/cache/images /app/.next/cache/fetch-cache && exec node server.js"]
