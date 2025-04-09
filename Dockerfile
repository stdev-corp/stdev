FROM node:22-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=secret,id=TOSS_SECRET_KEY,env=TOSS_SECRET_KEY \
  --mount=type=secret,id=NEXT_PUBLIC_TOSS_CLIENT_KEY,env=NEXT_PUBLIC_TOSS_CLIENT_KEY \
  --mount=type=secret,id=NEXT_PUBLIC_CHANNEL_PLUGIN_KEY,env=NEXT_PUBLIC_CHANNEL_PLUGIN_KEY \
  --mount=type=secret,id=NEXT_PUBLIC_GTM_ID,env=NEXT_PUBLIC_GTM_ID \
  --mount=type=secret,id=NEXT_PUBLIC_GA_ID,env=NEXT_PUBLIC_GA_ID \
  corepack enable pnpm && pnpm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=1000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
