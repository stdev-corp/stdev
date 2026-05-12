FROM node:24-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Install libc6-compat for sharp on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=secret,id=NEXT_PUBLIC_CHANNEL_PLUGIN_KEY,env=NEXT_PUBLIC_CHANNEL_PLUGIN_KEY \
  --mount=type=secret,id=NEXT_PUBLIC_GTM_ID,env=NEXT_PUBLIC_GTM_ID \
  --mount=type=secret,id=NEXT_PUBLIC_GA_ID,env=NEXT_PUBLIC_GA_ID \
  --mount=type=secret,id=DATABASE_URL,env=DATABASE_URL \
  --mount=type=secret,id=S3_BUCKET,env=S3_BUCKET \
  --mount=type=secret,id=AWS_REGION,env=AWS_REGION \
  --mount=type=secret,id=BETTER_AUTH_SECRET,env=BETTER_AUTH_SECRET \
  --mount=type=secret,id=BETTER_AUTH_URL,env=BETTER_AUTH_URL \
  --mount=type=secret,id=GOOGLE_CLIENT_ID,env=GOOGLE_CLIENT_ID \
  --mount=type=secret,id=GOOGLE_CLIENT_SECRET,env=GOOGLE_CLIENT_SECRET \
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
