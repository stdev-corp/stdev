# PROJECT KNOWLEDGE BASE

## OVERVIEW

STDev Corp. (사단법인 에스티데브) Korean nonprofit homepage. Next.js 16 App Router + React 19 + Prisma/Postgres DIY CMS + better-auth, shipped as a standalone Docker image.

Event pages (해커톤&아이디어톤, 컨퍼런스&프로그램) used to live on Notion published through Oopy at `event.stdev.kr`. They were migrated into the CMS: every event, sub-page, organisation link and image is a DB row editable under `/admin`, rendered in a Notion-like layout inside the KRDS shell.

Two separate design systems, split by route group:

- **Public site `(stdev)`** — KRDS (Korea Design System, <https://www.krds.go.kr>). The official HTML component kit is vendored under `src/styles/krds/` (CSS) and `public/krds/` (icons, fonts); no CSS framework is bundled. **No Chakra.**
- **Admin `(cms)`** — Chakra UI v3, unchanged.

## STRUCTURE

```
stdev/
├── prisma/schema.prisma            # CMS/auth data model
├── prisma.config.ts                # Prisma config; reads DATABASE_URL
├── pnpm-workspace.yaml             # workspace packages + allowBuilds (must COPY into Dockerfile deps)
├── vitest.config.ts                # Unit / component / mocked-integration (jsdom)
├── playwright.config.ts            # E2E (real Postgres + S3 sidecar via docker-compose.test.yml)
├── docker-compose.test.yml         # Postgres + Silo (MinIO-fork S3 sidecar) for E2E
├── tools/migrate/package.json      # Prisma CLI manifest; `pnpm deploy` feeds the Dockerfile migrator stage
├── Dockerfile                      # Multi-stage standalone Next build + in-container migration toolchain
├── src/
│   ├── app/                        # (stdev) public site, (cms) admin, api/auth
│   ├── components/                 # UI building blocks (krds/ = public chrome, admin/ = CMS, notion/ = Notion renderer, events/ = event views)
│   ├── styles/krds/                # Vendored KRDS CSS + site layer + stdev-notion.css (see its README)
│   ├── scripts/notion-import/      # One-off Notion → CMS migration (fetch, convert, import) + committed content bundle
│   ├── tests/                      # Vitest suites (actions, mocks, pages, utils)
│   ├── e2e/                        # Playwright specs + fixtures
│   └── utils/                      # cms.ts, prisma.ts, auth.ts, menus/links/date helpers
├── public/images/                  # intro/, business/, gov/ static assets
├── public/krds/                    # Vendored KRDS icons + Pretendard GOV fonts (absolute /krds/... URLs)
└── .github/workflows/              # ci.yml (build+lint+test+e2e), cd.yml (ghcr.io image)
```

## WHERE TO LOOK

| Task                    | Location                                                                                      | Notes                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Change CMS schema       | `prisma/schema.prisma`                                                                        | Then run `pnpm db:generate` and create/apply a migration                                                                                                 |
| Public CMS query        | `src/utils/cms.ts`                                                                            | Server-only helpers used by async pages                                                                                                                  |
| Prisma client           | `src/utils/prisma.ts`                                                                         | Reuses one client during dev hot reload                                                                                                                  |
| Auth config             | `src/utils/auth.ts` + `src/utils/admin-auth.ts` + `src/app/api/auth/[...all]/route.ts`        | Google-only better-auth with Prisma adapter                                                                                                              |
| Admin UI                | `src/app/(cms)/admin/**`                                                                      | DIY CMS forms protected by better-auth                                                                                                                   |
| Add a public page/route | `src/app/(stdev)/<path>/page.tsx`                                                             | Also update `src/utils/menus.ts` and `src/utils/links.ts`                                                                                                |
| Shared layout chrome    | `src/components/krds/`                                                                        | `site-layout`, `main-layout`, `header`, `footer`, `breadcrumb`, `side-navigation`, `page-title`, `skip-link`                                             |
| Markdown rendering      | `src/components/markdown/markdown-view.tsx`                                                   | react-markdown + remark-gfm inside `.markdown-body`; styled by `src/styles/krds/stdev-krds.css`                                                          |
| Event pages             | `src/app/(stdev)/{hackathon,conference}/**`, `src/components/events/`, `src/utils/events.ts`  | `/hackathon/[slug]/[...path]`; section from `Business.category`; queries in `src/utils/cms.ts`                                                           |
| Notion-style content    | `src/utils/notion-markdown.ts` + `src/components/notion/`                                     | GFM + remark-directive (`:::callout`, `:::toggle`, `::page`, …); syntax table at the top of `notion-markdown.ts`; admin preview uses the same renderer   |
| Notion migration        | `src/scripts/notion-import/` (`pnpm notion:fetch` / `notion:convert` / `notion:import`)       | `mapping.ts` maps Notion pages to slugs/paths; `content/` is the reviewed bundle; import is idempotent and never overwrites edited rows unless `--force` |
| Add/adjust unit test    | Colocated `*.test.{ts,tsx}` next to source, or under `src/tests/{actions,pages,utils,mocks}/` | Picked up by `vitest.config.ts`                                                                                                                          |
| Add E2E spec            | `src/e2e/**.spec.ts` (+ fixtures in `src/e2e/fixtures/`)                                      | Runs against Postgres + the Silo S3 sidecar from `docker-compose.test.yml`                                                                               |
| Docker image change     | `Dockerfile`                                                                                  | If editing `deps` stage, also re-check the `COPY` list — workspace yaml and `tools/migrate/package.json` must be present for `--frozen-lockfile`         |
| Prisma CLI in the image | `Dockerfile` migrator stage + `tools/migrate/package.json`                                    | Bump the CLI here and in the root `package.json` together, then regenerate the lockfile                                                                  |

## CONVENTIONS

- **Package manager**: pnpm@11.25.0 only (pinned in `packageManager`). Never commit a non-pnpm lockfile. pnpm ≥11 enforces a 1-day (1440 min) `minimumReleaseAge` gate by default; do not bump deps to a release younger than that without a real reason, otherwise pnpm will rewrite `pnpm-workspace.yaml` with a `minimumReleaseAgeExclude` block.
- **Prettier**: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`.
- **Import alias**: `@/*` → `./src/*`.
- **Server vs client**: Pages are async server components by default. Client components declare `'use client'`.
- **Rendering**: `(stdev)/layout.tsx` sets `export const dynamic = 'force-dynamic'` for request-time CMS reads.
- **Locale**: `<html lang="ko">` + Korean UI strings; dates format as `YYYY년 M월 D일`.
- **Styling (public)**: KRDS class names on plain HTML (`krds-btn`, `krds-table-wrap`, `krds-side-navigation`, …). Page-level layout that the kit does not ship lives in `src/styles/krds/stdev-krds.css`. Use a KRDS design token (`var(--krds-*)`) wherever one exists — spacing/sizes map to `--krds-number-*` (0 → 9.6rem) and `--krds-size-height-*`, borders to `--krds-light-border-width-static-*`, colors to `--krds-light-color-*`. Hard-code a dimension only when the token scale does not cover it (component sizes above 9.6rem, viewport or `em` units) and leave a comment saying why. The KRDS breakpoint is 1024px.
- **Styling (admin)**: Chakra v3 in `(cms)`; leave it alone.
- **KRDS assets**: `(stdev)/layout.tsx` imports `src/styles/krds/{krds-fonts,krds.min,stdev-krds,stdev-notion}.css` in that order; import order is cascade order, so the site layer always wins.
- **Event pages**: the article body follows Notion (cover, icon, `h1.notion-title`, Notion blocks and palette, scoped to `.notion-page` in `stdev-notion.css`); everything around it (header, LNB, breadcrumb, footer, the 행사 개요 box, the event list) is KRDS. Date/time, place and 주최·주관·후원·협력 are `Business` fields / `BusinessInstitution` rows, not body text. Event lists sort by `startDate` desc. Slugs `news` and `blog` are reserved (they are fixed sub-pages of each section). Icons and fonts stay in `public/krds/` because the CSS references them by absolute `/krds/...` URL.
- **Env enforcement**: Required public envs are thrown on missing in layout/providers.

## ANTI-PATTERNS

- Do not edit generated Prisma client output in `node_modules`; change `prisma/schema.prisma` and regenerate.
- Do not add semicolons.
- Do not render raw HTML from CMS content (no `rehype-raw`). Notion content gets extra blocks only through the whitelisted directives in `src/utils/notion-markdown.ts`; every URL attribute goes through `safeUrl`/`safeEmbedUrl`. When you add a directive, update the syntax table there, the admin help in `src/components/admin/notion-content-field.tsx`, and `escapeText` in `src/scripts/notion-import/to-markdown.ts` if it is a text directive.
- Do not drop the original-archive link from external links. `Webpage.archiveId` points at a PDF snapshot (`FileAsset`) of the article or blog post, shown only in `/admin`, because outside sites disappear (two review blogs already have). The FK is `onDelete: Restrict` and `deleteFileAsset` refuses while a webpage uses the file.
- Do not hard-delete an `ImageAsset` that content still links by URL. Event bodies reference images by URL, so `deleteImageAsset` refuses while any `Business`/`BusinessPage`/`Markdown` text contains it.
- Do not statically render `(stdev)`.
- Do not add new image remote hosts without updating `next.config.ts` `images.remotePatterns`.
- Do not import `@chakra-ui/*` or `@emotion/*` from `(stdev)` or from any shared component the public site uses. Those packages exist only for `(cms)`.
- Do not hand-edit `src/styles/krds/krds.min.css`, `public/krds/img/**` or `public/krds/fonts/**` — they are vendored verbatim from <https://github.com/KRDS-uiux/krds-uiux> (the one applied change is rewriting the icon `url()`s from `krds.go.kr` absolute URLs to `/krds/img/`). Put site-specific CSS in `src/styles/krds/stdev-krds.css`; see `src/styles/krds/README.md` for the update procedure.
- Do not add the KRDS government identity components (`#krds-masthead`, `.krds-identifier`, 정부상징) — STDev is a private nonprofit and those would misrepresent it as a government body.
- Do not remove the 공공누리 제1유형 attribution in the footer; it is a condition of the KRDS licence.
- Do not reuse KRDS's `.active` on `.gnb-main-trigger` to mean "current section" — it also rotates the chevron 180°, which contradicts `aria-expanded="false"` on a closed panel. `.active` is for the expanded state; the current section uses `.is-current`.
- Do not put a `.sr-only` element inside `.krds-table-wrap`. `.sr-only` is `position:absolute` and its containing block is `<html>`, so it escapes the wrapper's `overflow-x:auto` and widens the document on mobile. Use `aria-label` instead.
- Do not touch `pnpm-workspace.yaml` (`packages`, `overrides`, `allowBuilds`, `minimumReleaseAgeExclude`) without also COPYing it in the `deps` stage of `Dockerfile`. `pnpm i --frozen-lockfile` validates the lockfile against the workspace config and fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` if absent.
- Do not add imports to `prisma.config.ts` (or to `src/utils/database-url.ts`) without adding the package to `tools/migrate/package.json` and exposing it in the runner stage. The config is loaded from `/app` inside the container, where only `prisma` and `dotenv` resolve; anything else fails at migration time with a bare `Cannot find module`.
- Do not add a workspace package under `tools/` without also COPYing its install into the `builder` stage (`COPY --from=deps /app/tools ./tools`). pnpm checks every workspace project's `node_modules` before running a script, so `pnpm run build` would otherwise do a full network install first. This hides on a developer machine — keep `.dockerignore` at `**/node_modules` (not `node_modules`, which only matches the root one) so a git-ignored `tools/*/node_modules` cannot leak into the build context and mask it.
- Do not drop `pnpm_config_verify_deps_before_run=false` from the runner stage. `/app` holds the full `package.json` but only Next's traced dependencies, so pnpm's pre-run check would try to install the whole dev tree and move traced packages into `node_modules/.ignored`, breaking the running server.
- Do not add a `--mount=type=secret` to the Dockerfile builder stage without also adding the key to `.env.test` and to both build steps in `.github/workflows/cd.yml` (the `.env.test` loader regex plus `secret-envs` for PRs, `secrets` for main). PR builds never see Actions secrets — Dependabot and fork runs cannot read them — so they build from the dummy values in `.env.test`. Do not replace that split with a `secrets.X || 'dummy'` fallback: a deleted production secret would then silently ship a dummy value from main.

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
pnpm db:migrate:deploy      # Production migration deploy (also runs inside the deployed image)
pnpm test                   # Vitest run (unit + component + mocked integration, jsdom)
pnpm test:watch             # Vitest watch
pnpm test:coverage          # V8 coverage; threshold 95% lines/functions/statements, 90% branches
pnpm test:ci                # Same as coverage + JUnit reporter
pnpm test:e2e               # Playwright E2E; builds with .env.test, spins up docker-compose.test.yml (Postgres + Silo)
pnpm test:e2e:install       # First-time Chromium install for Playwright
```

## NOTES

- Test stack: Vitest 5 (unit / component / mocked integration in jsdom) + Playwright E2E against real Postgres and the S3 sidecar. CI runs both on every PR. There is no real-DB Vitest suite.
- Vitest 5 specifics: `coverage.all` and `test.poolOptions` no longer exist; this repo uses top-level `pool: 'forks'` + `maxWorkers: 1` (per-file module isolation preserved via default `isolate: true`). `vite` is a peer of Vitest, not a dependency; pnpm auto-installs it (Vite 8). The `@/*` alias in `vitest.config.ts` is the only path mapping, so no tsconfig-paths plugin is needed. `coverage.exclude` entries are picomatch globs matched against the root-relative path, so `src/app/(stdev)/sitemap.ts` is really excluded now (under Vitest 4 the `(stdev)` group never matched and the file stayed in the report).
- jsdom stays on 30.x. jsdom 31's CSS engine applies Chakra's `@layer` styles at a fixed 1024×768 viewport that tests cannot change: the admin shell's mobile hamburger becomes `display: none`, and closing drawers and dialogs wait for an `animationend` jsdom never fires.
- Docker prod port is 1000.
- The production image can migrate itself: `docker compose run --rm stdev pnpm db:migrate:deploy` (or `exec` on a running container). The `migrator` stage `pnpm deploy`s `tools/migrate` into `/app/.migrate/node_modules`, whose only top-level entries are `prisma` and `dotenv`, so it cannot shadow Next's traced output; `/app/node_modules` gets three symlinks because Prisma resolves `prisma.config.ts` and its imports from the working directory. The schema engine is a musl binary fetched by `@prisma/engines`' postinstall, so that stage must build on the same platform as the runner. Cost: +278 MB on the image (263 MB -> 541 MB uncompressed).
- Existing S3 object URLs are preserved as CMS asset URLs; remote host is `stdev-kr.s3.ap-northeast-2.amazonaws.com`.
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `DATABASE_URL` are required for the CMS/auth stack.
- Database TLS is set on the connection string, not on the `PrismaPg` options: `src/utils/database-url.ts` appends `sslmode=require&uselibpqcompat=true` (encrypted, certificate not verified) to every non-local `DATABASE_URL`, for both the app and `prisma migrate`. Locality follows the host pg actually connects to (`?host=` wins over the authority, which wins over `PGHOST`; a credentialed empty authority such as `u:p@/db` is parsed the way pg-connection-string retries it; Unix sockets, IPv6 zones, IPv4-mapped addresses and other loopback spellings count as local). A non-RDS connection that already chooses TLS — any TLS parameter in the URL (`sslmode`, `ssl`, `sslrootcert`, `sslcert`, `sslkey`) or a `PGSSLMODE` value pg recognises, which pg reads only when the URL has no `ssl` key at all — is left as it is, so `sslmode=verify-full`, `PGSSLMODE=verify-full`, a provider's `sslmode=require` or `ssl=0` keep their meaning; RDS URLs keep the old rules (require unless `sslmode` is set, plus `uselibpqcompat`), because Node does not trust the RDS CA. Repeated parameters are read by their last value and empty values count as unset, as pg does; note that `ssl=false` does not disable TLS in pg (it arrives as the truthy string `"false"`). pg lets connection-string parameters override the config object, so an `ssl` option next to `connectionString` is ignored whenever the URL carries `sslmode`. `prisma migrate`'s schema engine (Prisma 7.10) reads the same URL differently: it ignores `PGSSLMODE` and refuses a non-TLS server only for `sslmode=require`; every other mode, `ssl` and `sslrootcert` fall back to plaintext when the server declines TLS.
- KRDS is published under 공공누리 제1유형 (KOGL Type 1): free commercial use and modification, attribution required. The attribution sits in `src/components/krds/footer.tsx`.
- Notion migration runbook: `pnpm notion:fetch` (public Notion API → `.notion-cache/`, git-ignored), `pnpm notion:convert` (→ `src/scripts/notion-import/content/`, committed for review), then `pnpm notion:import --env-file .env --dry-run` and without `--dry-run` against production before deleting Notion/Oopy. It uploads assets to S3 under deterministic `images|files/notion-<hash>-…` keys, so re-runs reuse them. Assets go first: a source that answers 403/404/410 is dropped from the body with a warning, but any other failure (S3 credentials, upload, DB, network, Notion API) aborts before an institution or event is written, because a populated event is skipped on the next run and would never get the media back. Each event is saved together with its sub-pages in one transaction for the same reason. `notion:convert` follows the same rule for the external images and bookmark pictures it checks (`src/scripts/notion-import/link-check.ts`): only 403/404/410 or a vanished domain drops one; timeouts, network errors, 429 and 5xx are retried and then stop the conversion, and `content/` is rewritten only after every page has been built. Institutions are matched by `nameKo`, then through `INSTITUTION_ALIASES` in `mapping.ts` (Notion name → the `nameKo` production already uses for the same organisation, e.g. `KAIST` → `카이스트`); only unmatched ones are created, with `showOnHome` off. Event slugs shaped like a Notion ID (32 hex digits) are rejected by `isValidSlug`, since that URL shape is rewritten to the legacy handler. Personal data (참가자 명단) is replaced with a notice via `REDACTED_BLOCKS` in `mapping.ts`. File and PDF attachments are archived to S3 as `FileAsset` rows without a link in any body: those in page bodies, and those in the bodies of database rows that have no page of their own (the SSH24 보도자료 article PDFs and HWP). `registerArchivedFiles` appends the row attachments after every page has been rendered, so the `a0001…` asset keys the bodies reference stay stable; the importer sets the S3 content type from the extension (`pdf`, `hwp`, `hwpx`). The press articles and participant blog reviews linked from event sub-pages are listed in `src/scripts/notion-import/webpages.ts` (hand-checked against each live page: outlet or author, first-published date in KST, https URL) and imported as `Webpage` rows linked to their event, so they show under `/hackathon/news` and `/hackathon/blog`, and to the PDF snapshot Notion kept for each link (`archive`, a bundle file key → `Webpage.archiveId`). An existing row with the same URL is skipped unless `--force`, except that an empty archive link is filled in. Links that are dead or have no working https URL are left out, because the public lists only render https URLs. Point `event.stdev.kr` DNS at this server afterwards; `next.config.ts` redirects that host to `/hackathon/<same path>`, and rewrites `/hackathon|conference/<notion-id>` to `src/app/api/legacy-notion/[id]/route.ts`, which 308s old Oopy UUID links through `notionId`.
- KRDS ships no JavaScript we use — the kit's `ui-script.js` drives static HTML. The GNB, mobile drawer and dropdowns are reimplemented in React in `src/components/krds/header.tsx`, toggling the same state classes the KRDS CSS expects (`is-open`, `is-backdrop`, `active`, and `is-gnb-web` / `is-gnb-mobile` on `<body>`).
- `next dev` in this repo currently serves pages that never hydrate (client components stay inert) for both `(stdev)` and `(cms)`; `pnpm build && pnpm start` hydrates correctly. Verify interactive behaviour against a production build.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
