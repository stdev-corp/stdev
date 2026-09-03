# PROJECT KNOWLEDGE BASE

## OVERVIEW

STDev Corp. (사단법인 에스티데브) Korean nonprofit homepage. Next.js 16 App Router + React 19 + Prisma/Postgres DIY CMS + better-auth, shipped as a standalone Docker image.

Two separate design systems, split by route group:

- **Public site `(stdev)`** — KRDS (Korea Design System, <https://www.krds.go.kr>). The official HTML component kit is vendored under `src/styles/krds/` (CSS) and `public/krds/` (icons, fonts); no CSS framework is bundled. **No Chakra.**
- **Admin `(cms)`** — Chakra UI v3, unchanged.

## STRUCTURE

```
stdev/
├── prisma/schema.prisma            # CMS/auth data model
├── prisma.config.ts                # Prisma config; reads DATABASE_URL
├── pnpm-workspace.yaml             # pnpm allowBuilds (must COPY into Dockerfile deps)
├── vitest.config.ts                # Unit / component / mocked-integration (jsdom)
├── vitest.config.integration.ts    # Real-DB integration suite (src/tests/db/**)
├── playwright.config.ts            # E2E (real Postgres + MinIO via docker-compose.test.yml)
├── docker-compose.test.yml         # Postgres + MinIO for E2E and DB integration
├── Dockerfile                      # Multi-stage standalone Next build
├── src/
│   ├── app/                        # (stdev) public site, (cms) admin, api/auth
│   ├── components/                 # UI building blocks (krds/ = public chrome, admin/ = CMS)
│   ├── styles/krds/                # Vendored KRDS CSS + site layer (see its README)
│   ├── tests/                      # Vitest suites (actions, mocks, pages, utils, db)
│   ├── e2e/                        # Playwright specs + fixtures
│   └── utils/                      # cms.ts, prisma.ts, auth.ts, menus/links/date helpers
├── public/images/                  # intro/, business/, gov/ static assets
├── public/krds/                    # Vendored KRDS icons + Pretendard GOV fonts (absolute /krds/... URLs)
└── .github/workflows/              # ci.yml (build+lint+test+e2e), cd.yml (ghcr.io image)
```

## WHERE TO LOOK

| Task                    | Location                                                                                      | Notes                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Change CMS schema       | `prisma/schema.prisma`                                                                        | Then run `pnpm db:generate` and create/apply a migration                                                        |
| Public CMS query        | `src/utils/cms.ts`                                                                            | Server-only helpers used by async pages                                                                         |
| Prisma client           | `src/utils/prisma.ts`                                                                         | Reuses one client during dev hot reload                                                                         |
| Auth config             | `src/utils/auth.ts` + `src/utils/admin-auth.ts` + `src/app/api/auth/[...all]/route.ts`        | Google-only better-auth with Prisma adapter                                                                     |
| Admin UI                | `src/app/(cms)/admin/**`                                                                      | DIY CMS forms protected by better-auth                                                                          |
| Add a public page/route | `src/app/(stdev)/<path>/page.tsx`                                                             | Also update `src/utils/menus.ts` and `src/utils/links.ts`                                                       |
| Shared layout chrome    | `src/components/krds/`                                                                        | `site-layout`, `main-layout`, `header`, `footer`, `breadcrumb`, `side-navigation`, `page-title`, `skip-link`    |
| Markdown rendering      | `src/components/markdown/markdown-view.tsx`                                                   | react-markdown + remark-gfm inside `.markdown-body`; styled by `src/styles/krds/stdev-krds.css`                 |
| Add/adjust unit test    | Colocated `*.test.{ts,tsx}` next to source, or under `src/tests/{actions,pages,utils,mocks}/` | Picked up by `vitest.config.ts`                                                                                 |
| Add E2E spec            | `src/e2e/**.spec.ts` (+ fixtures in `src/e2e/fixtures/`)                                      | Runs against Postgres+MinIO from `docker-compose.test.yml`                                                      |
| Docker image change     | `Dockerfile`                                                                                  | If editing `deps` stage, also re-check the `COPY` list — workspace yaml must be present for `--frozen-lockfile` |

## CONVENTIONS

- **Package manager**: pnpm@11.25.0 only (pinned in `packageManager`). Never commit a non-pnpm lockfile. pnpm ≥11 enforces a 1-day (1440 min) `minimumReleaseAge` gate by default; do not bump deps to a release younger than that without a real reason, otherwise pnpm will rewrite `pnpm-workspace.yaml` with a `minimumReleaseAgeExclude` block.
- **Prettier**: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`.
- **Import alias**: `@/*` → `./src/*`.
- **Server vs client**: Pages are async server components by default. Client components declare `'use client'`.
- **Rendering**: `(stdev)/layout.tsx` sets `export const dynamic = 'force-dynamic'` for request-time CMS reads.
- **Locale**: `<html lang="ko">` + Korean UI strings; dates format as `YYYY년 M월 D일`.
- **Styling (public)**: KRDS class names on plain HTML (`krds-btn`, `krds-table-wrap`, `krds-side-navigation`, …). Page-level layout that the kit does not ship lives in `src/styles/krds/stdev-krds.css` and must be written with KRDS design tokens (`var(--krds-*)`), never hard-coded values. The KRDS breakpoint is 1024px.
- **Styling (admin)**: Chakra v3 in `(cms)`; leave it alone.
- **KRDS assets**: `(stdev)/layout.tsx` imports `src/styles/krds/{krds-fonts,krds.min,stdev-krds}.css` in that order; import order is cascade order, so the site layer always wins. Icons and fonts stay in `public/krds/` because the CSS references them by absolute `/krds/...` URL.
- **Env enforcement**: Required public envs are thrown on missing in layout/providers.

## ANTI-PATTERNS

- Do not edit generated Prisma client output in `node_modules`; change `prisma/schema.prisma` and regenerate.
- Do not add semicolons.
- Do not statically render `(stdev)`.
- Do not add new image remote hosts without updating `next.config.ts` `images.remotePatterns`.
- Do not import `@chakra-ui/*` or `@emotion/*` from `(stdev)` or from any shared component the public site uses. Those packages exist only for `(cms)`.
- Do not hand-edit `src/styles/krds/krds.min.css`, `public/krds/img/**` or `public/krds/fonts/**` — they are vendored verbatim from <https://github.com/KRDS-uiux/krds-uiux> (the one applied change is rewriting the icon `url()`s from `krds.go.kr` absolute URLs to `/krds/img/`). Put site-specific CSS in `src/styles/krds/stdev-krds.css`; see `src/styles/krds/README.md` for the update procedure.
- Do not add the KRDS government identity components (`#krds-masthead`, `.krds-identifier`, 정부상징) — STDev is a private nonprofit and those would misrepresent it as a government body.
- Do not remove the 공공누리 제1유형 attribution in the footer; it is a condition of the KRDS licence.
- Do not put a `.sr-only` element inside `.krds-table-wrap`. `.sr-only` is `position:absolute` and its containing block is `<html>`, so it escapes the wrapper's `overflow-x:auto` and widens the document on mobile. Use `aria-label` instead.
- Do not touch `pnpm-workspace.yaml` (`overrides`, `allowBuilds`, `minimumReleaseAgeExclude`) without also COPYing it in the `deps` stage of `Dockerfile`. `pnpm i --frozen-lockfile` validates the lockfile against the workspace config and fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` if absent.

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
- KRDS is published under 공공누리 제1유형 (KOGL Type 1): free commercial use and modification, attribution required. The attribution sits in `src/components/krds/footer.tsx`.
- KRDS ships no JavaScript we use — the kit's `ui-script.js` drives static HTML. The GNB, mobile drawer and dropdowns are reimplemented in React in `src/components/krds/header.tsx`, toggling the same state classes the KRDS CSS expects (`is-open`, `is-backdrop`, `active`, and `is-gnb-web` / `is-gnb-mobile` on `<body>`).
- `next dev` in this repo currently serves pages that never hydrate (client components stay inert) for both `(stdev)` and `(cms)`; `pnpm build && pnpm start` hydrates correctly. Verify interactive behaviour against a production build.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
