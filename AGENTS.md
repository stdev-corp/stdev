# PROJECT KNOWLEDGE BASE

## OVERVIEW

STDev Corp. (사단법인 에스티데브) Korean nonprofit homepage. Next.js 16 App Router + React 19 + Prisma/Postgres DIY CMS + better-auth + Chakra UI v3, shipped as a standalone Docker image.

## STRUCTURE

```
stdev/
├── prisma/schema.prisma            # CMS/auth data model
├── prisma.config.ts                # Prisma config; reads DATABASE_URL
├── pnpm-workspace.yaml             # pnpm overrides + allowBuilds (must COPY into Dockerfile deps)
├── vitest.config.ts                # Unit / component / mocked-integration (jsdom)
├── vitest.config.integration.ts    # Real-DB integration suite (src/tests/db/**)
├── playwright.config.ts            # E2E (real Postgres + MinIO via docker-compose.test.yml)
├── docker-compose.test.yml         # Postgres + MinIO for E2E and DB integration
├── Dockerfile                      # Multi-stage standalone Next build
├── src/
│   ├── app/                        # (stdev) public site, (cms) admin, api/auth
│   ├── components/                 # UI building blocks
│   ├── tests/                      # Vitest suites (actions, mocks, pages, utils, db)
│   ├── e2e/                        # Playwright specs + fixtures
│   └── utils/                      # cms.ts, prisma.ts, auth.ts, menus/links/date helpers
├── public/images/                  # intro/, business/, gov/ static assets
└── .github/workflows/              # ci.yml (build+lint+test+e2e), cd.yml (ghcr.io image)
```

## WHERE TO LOOK

| Task                    | Location                                                                               | Notes                                                     |
| ----------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Change CMS schema       | `prisma/schema.prisma`                                                                 | Then run `pnpm db:generate` and create/apply a migration  |
| Public CMS query        | `src/utils/cms.ts`                                                                     | Server-only helpers used by async pages                   |
| Prisma client           | `src/utils/prisma.ts`                                                                  | Reuses one client during dev hot reload                   |
| Auth config             | `src/utils/auth.ts` + `src/utils/admin-auth.ts` + `src/app/api/auth/[...all]/route.ts` | Google-only better-auth with Prisma adapter               |
| Admin UI                | `src/app/(cms)/admin/**`                                                               | DIY CMS forms protected by better-auth                    |
| Add a public page/route | `src/app/(stdev)/<path>/page.tsx`                                                      | Also update `src/utils/menus.ts` and `src/utils/links.ts` |
| Shared layout chrome    | `src/components/layout/`                                                               | `basic-layout`, `left-menu-layout`, `navbar`, `footer`    |
| Markdown rendering      | `src/components/markdown/markdown-view.tsx`                                            | Chakra-mapped react-markdown + remark-gfm                 |
| Add/adjust unit test    | Colocated `*.test.{ts,tsx}` next to source, or under `src/tests/{actions,pages,utils,mocks}/` | Picked up by `vitest.config.ts`                           |
| Add E2E spec            | `src/e2e/**.spec.ts` (+ fixtures in `src/e2e/fixtures/`)                               | Runs against Postgres+MinIO from `docker-compose.test.yml` |
| Docker image change     | `Dockerfile`                                                                           | If editing `deps` stage, also re-check the `COPY` list — workspace yaml must be present for `--frozen-lockfile` |

## CONVENTIONS

- **Package manager**: pnpm@11.5.0 only (pinned in `packageManager`). Never commit a non-pnpm lockfile. pnpm 11 enforces a 7-day `minimumReleaseAge` gate by default; do not bump deps to a release younger than that without a real reason, otherwise pnpm will rewrite `pnpm-workspace.yaml` with a `minimumReleaseAgeExclude` block.
- **Prettier**: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`.
- **Import alias**: `@/*` → `./src/*`.
- **Server vs client**: Pages are async server components by default. Client components declare `'use client'`.
- **Rendering**: `(stdev)/layout.tsx` sets `export const dynamic = 'force-dynamic'` for request-time CMS reads.
- **Locale**: `<html lang="ko">` + Korean UI strings; dates format as `YYYY년 M월 D일`.
- **Styling**: Public site uses Chakra v3 primitives. Admin currently uses simple React/HTML forms.
- **Env enforcement**: Required public envs are thrown on missing in layout/providers.

## ANTI-PATTERNS

- Do not edit generated Prisma client output in `node_modules`; change `prisma/schema.prisma` and regenerate.
- Do not add semicolons.
- Do not statically render `(stdev)`.
- Do not add new image remote hosts without updating `next.config.ts` `images.remotePatterns`.
- Do not touch `pnpm-workspace.yaml` (`overrides`, `allowBuilds`, `minimumReleaseAgeExclude`) without also COPYing it in the `deps` stage of `Dockerfile`. `pnpm i --frozen-lockfile` validates the lockfile against the workspace config and fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` if absent.
- Do not bypass the kysely pin (`overrides.kysely`); `@better-auth/kysely-adapter` is pulled in transitively even though the project uses `prismaAdapter`, and it breaks against kysely ≥0.29 until better-auth ships a fix.

## COMMANDS

```bash
pnpm dev                    # Next.js dev server on :3000
pnpm build                  # Prisma generate + Next build
pnpm start                  # Run production build
pnpm lint                   # ESLint + prettier integration
pnpm prettier:write         # Format all
pnpm prettier:check         # CI-style check
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Local schema migration
pnpm db:migrate:deploy      # Production migration deploy
pnpm test                   # Vitest run (unit + component + mocked integration, jsdom)
pnpm test:watch             # Vitest watch
pnpm test:coverage          # V8 coverage; threshold 95% lines/functions/statements, 90% branches
pnpm test:ci                # Same as coverage + JUnit reporter
pnpm test:e2e               # Playwright E2E; spins up docker-compose.test.yml (Postgres+MinIO)
pnpm test:e2e:install       # First-time Chromium install for Playwright
```

## NOTES

- Test stack: Vitest 4 (unit / component / mocked integration in jsdom) + Vitest separate integration suite against real Postgres + Playwright E2E. CI runs all of these on every PR.
- Vitest 4 specifics: `coverage.all` and `test.poolOptions` were removed; this repo uses top-level `pool: 'forks'` + `maxWorkers: 1` (per-file module isolation preserved via default `isolate: true`).
- Docker prod port is 1000.
- Existing S3 object URLs are preserved as CMS asset URLs; remote host is `stdev-kr.s3.ap-northeast-2.amazonaws.com`.
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `DATABASE_URL` are required for the CMS/auth stack.
