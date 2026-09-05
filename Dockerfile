FROM node:24-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Install libc6-compat for sharp on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Workspace member; without it `--frozen-lockfile` would skip validating the
# tools/migrate importer that the migrator stage installs from.
COPY tools/migrate/package.json ./tools/migrate/
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
# The repo is a pnpm workspace, so pnpm checks every project's node_modules
# before running a script. Without the workspace member's install, `pnpm run
# build` would silently install it from the registry first.
COPY --from=deps /app/tools ./tools
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

# Stage 2b: Prisma CLI for the runner
# `pnpm deploy` resolves tools/migrate against the repo lockfile and writes a
# self-contained tree whose only top-level entries are `prisma` and `dotenv`,
# so it cannot shadow anything Next traced. @prisma/engines' postinstall runs
# here, which is what fetches the musl schema engine for this image's platform
# — it can never be copied in from a developer machine.
FROM base AS migrator
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tools/migrate/package.json ./tools/migrate/
RUN corepack enable pnpm && pnpm --filter @stdev/migrate \
  --config.inject-workspace-packages=true deploy --prod /prisma-cli

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# `pnpm db:migrate:deploy` inside the container. The deps stage already
# downloaded and sha512-verified pnpm@11.25.0 into the corepack cache, so reuse
# that artifact rather than letting the production image hit the registry.
# Activating it globally, from the same `packageManager` pin, keeps `pnpm`
# working from any working directory instead of only from one holding a
# package.json — corepack resolves the version from the process cwd.
COPY --from=deps /root/.cache/node/corepack /root/.cache/node/corepack
RUN corepack enable pnpm \
  && corepack install --global "$(node -p "require('./package.json').packageManager")"

# Migration inputs. Next only traces what the server imports, so none of this
# is part of the standalone output.
COPY --from=migrator /prisma-cli/node_modules ./.migrate/node_modules
COPY prisma ./prisma
COPY prisma.config.ts ./
# prisma.config.ts imports this helper by relative path; keep the path it expects.
COPY src/utils/database-url.ts ./src/utils/

# Prisma resolves the config file from the working directory and the config's
# own imports from /app, so `prisma` and `dotenv` have to be reachable there.
# Expose exactly those two names plus the CLI bin and leave the rest of the
# traced node_modules exactly as `next build` produced it.
RUN mkdir -p node_modules/.bin \
  && ln -s ../.migrate/node_modules/prisma node_modules/prisma \
  && ln -s ../.migrate/node_modules/dotenv node_modules/dotenv \
  && ln -s ../../.migrate/node_modules/.bin/prisma node_modules/.bin/prisma

# corepack must never reach the registry from here. With the cache above this
# changes nothing; without it you get an instant error instead of a DNS hang.
ENV COREPACK_ENABLE_NETWORK=0
# /app carries the full package.json but only Next's traced dependencies, so
# pnpm's pre-run check would try to install the whole dev tree and move traced
# packages into node_modules/.ignored, breaking the running server.
ENV pnpm_config_verify_deps_before_run=false

ENV PORT=1000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
